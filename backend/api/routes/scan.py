"""VYRA Scan API Router.

Implements URL submission, feature extraction, ML/heuristic scoring, SHAP explainability,
threat intelligence aggregation, database persistence, and blockchain notarization.
"""

from datetime import datetime, timezone
import hashlib
import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from blockchain.audit import blockchain
from db.database import get_db
from db.models import ScanResult
from ml.explainer import explainer
from ml.features import FEATURE_NAMES, extract_features, features_to_array
from ml.model import detector
from ml.threat_intel import threat_intel

logger = logging.getLogger("vyra.api.scan")
router = APIRouter()


class ScanRequest(BaseModel):
    """Schema for URL scanning request."""
    url: str = Field(
        ...,
        min_length=1,
        max_length=2048,
        description="The full URL or web address to inspect for phishing indicators.",
        examples=["https://secure-login-verify-account.xyz/auth/update.php"],
    )


class ThreatFeedItem(BaseModel):
    detected: bool
    details: str


class ThreatFeedsResult(BaseModel):
    known_domains: ThreatFeedItem
    openphish: ThreatFeedItem
    phishtank: ThreatFeedItem
    google_safe_browsing: ThreatFeedItem
    phishing_kit_signatures: ThreatFeedItem


class ThreatIntelResponse(BaseModel):
    is_known_phishing: bool
    is_trusted_authority: Optional[bool] = False
    sources_checked: List[str]
    threat_feeds_result: ThreatFeedsResult
    threat_score: int
    threat_level: str


class ShapFeatureItem(BaseModel):
    feature: str
    value: float
    shap_value: float
    impact: str


class BlockchainBlockInfo(BaseModel):
    index: int
    timestamp: float
    url_hash: str
    prediction: str
    confidence: float
    feature_hash: str
    prev_hash: str
    block_hash: str
    nonce: int


class ScanResponse(BaseModel):
    """Full detailed response schema for an executed URL scan."""
    id: int
    url: str
    url_hash: str
    prediction: str
    confidence: float
    risk_score: float
    features: Dict[str, Any]
    shap_explanations: List[ShapFeatureItem]
    threat_intel: ThreatIntelResponse
    blockchain_block: BlockchainBlockInfo
    timestamp: str
    ip_address: Optional[str] = None


class HistoryResponse(BaseModel):
    """Paginated scan history response."""
    total: int
    limit: int
    offset: int
    items: List[Dict[str, Any]]


class StatsResponse(BaseModel):
    """System-wide aggregate scan metrics."""
    total_scans: int
    phishing_detected: int
    legitimate_detected: int
    avg_confidence: float
    detection_rate: float


@router.post(
    "/scan",
    response_model=ScanResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Scan URL for Phishing Threats",
    description="Executes end-to-end pipeline: lexical extraction -> ML scoring -> SHAP analysis -> threat intelligence -> DB logging -> PoW blockchain notarization.",
)
async def scan_url(
    payload: ScanRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Execute end-to-end scan pipeline on requested URL."""
    raw_url = payload.url.strip()
    if not raw_url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="URL cannot be empty or blank.",
        )

    client_ip = (
        request.headers.get("x-forwarded-for")
        or (request.client.host if request.client else "127.0.0.1")
    )
    if client_ip and "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()

    # Step 1: Deterministic URL SHA-256 fingerprint
    url_hash = hashlib.sha256(raw_url.encode("utf-8")).hexdigest()

    # Step 2: Feature Extraction (35 distinct features)
    features = extract_features(raw_url)
    features_arr = features_to_array(features)

    # Step 3: ML / Rule-based Classification
    ml_result = detector.predict(features)
    prediction = ml_result["prediction"]
    confidence = ml_result["confidence"]
    risk_score = ml_result["risk_score"]

    # Step 4: Multi-source Threat Intelligence Feeds Check
    threat_intel_res = await threat_intel.check_url(raw_url)
    if threat_intel_res.get("is_known_phishing", False):
        prediction = "phishing"
        confidence = max(confidence, 0.97)
        risk_score = max(risk_score, 96.0)
    elif threat_intel_res.get("is_trusted_authority", False):
        prediction = "legitimate"
        confidence = max(confidence, 0.98)
        risk_score = min(risk_score, 2.0)

    # Step 5: SHAP Explainability Decomposition
    shap_explanations = explainer.explain(detector.model, features_arr, FEATURE_NAMES)

    # Step 6: Immutable Blockchain Commit (Proof-of-Work notarization)
    scan_meta = {
        "url_hash": url_hash,
        "prediction": prediction,
        "confidence": confidence,
        "features": features,
    }
    mined_block = blockchain.add_block(scan_meta)

    # Step 7: Persist Scan Record to Database
    scan_record = ScanResult(
        url=raw_url,
        url_hash=url_hash,
        prediction=prediction,
        confidence=confidence,
        risk_score=risk_score,
        features_json=json.dumps(features),
        shap_json=json.dumps(shap_explanations),
        threat_intel_json=json.dumps(threat_intel_res),
        blockchain_block_index=mined_block.index,
        timestamp=datetime.now(timezone.utc),
        ip_address=client_ip,
    )
    db.add(scan_record)
    await db.commit()
    await db.refresh(scan_record)

    return {
        "id": scan_record.id,
        "url": scan_record.url,
        "url_hash": scan_record.url_hash,
        "prediction": scan_record.prediction,
        "confidence": scan_record.confidence,
        "risk_score": scan_record.risk_score,
        "features": features,
        "shap_explanations": shap_explanations,
        "threat_intel": threat_intel_res,
        "blockchain_block": mined_block.to_dict(),
        "timestamp": scan_record.timestamp.isoformat(),
        "ip_address": scan_record.ip_address,
    }


@router.get(
    "/scan/{scan_id}",
    summary="Get Specific Scan Details",
    description="Retrieve details of a prior scan by its unique ID, including cryptographic block index.",
)
async def get_scan(
    scan_id: int,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve scan result by ID."""
    stmt = select(ScanResult).where(ScanResult.id == scan_id)
    res = await db.execute(stmt)
    scan = res.scalar_one_or_none()
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan result with ID {scan_id} was not found.",
        )

    scan_dict = scan.to_dict()
    if scan.blockchain_block_index is not None:
        block = blockchain.get_block(scan.blockchain_block_index)
        scan_dict["blockchain_block"] = block.to_dict() if block else None
    else:
        scan_dict["blockchain_block"] = None

    return scan_dict


@router.get(
    "/history",
    response_model=HistoryResponse,
    summary="Get Scan History",
    description="Retrieve paginated list of recent scan results sorted chronologically descending.",
)
async def get_scan_history(
    limit: int = Query(10, ge=1, le=100, description="Number of results per page"),
    offset: int = Query(0, ge=0, description="Offset starting index"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve paginated scan history."""
    count_stmt = select(func.count(ScanResult.id))
    count_res = await db.execute(count_stmt)
    total = count_res.scalar() or 0

    items_stmt = (
        select(ScanResult)
        .order_by(ScanResult.id.desc())
        .offset(offset)
        .limit(limit)
    )
    items_res = await db.execute(items_stmt)
    records = items_res.scalars().all()

    items = []
    for record in records:
        rec_dict = record.to_dict()
        if record.blockchain_block_index is not None:
            blk = blockchain.get_block(record.blockchain_block_index)
            rec_dict["blockchain_block"] = blk.to_dict() if blk else None
        items.append(rec_dict)

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": items,
    }


@router.get(
    "/stats",
    response_model=StatsResponse,
    summary="Get Global Scan Statistics",
    description="Provides real-time statistics on total scans, threats identified, and average confidence.",
)
async def get_stats(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Compute and return aggregate scan statistics."""
    total_stmt = select(func.count(ScanResult.id))
    phishing_stmt = select(func.count(ScanResult.id)).where(ScanResult.prediction == "phishing")
    legit_stmt = select(func.count(ScanResult.id)).where(ScanResult.prediction == "legitimate")
    avg_conf_stmt = select(func.avg(ScanResult.confidence))

    total = (await db.execute(total_stmt)).scalar() or 0
    phishing_count = (await db.execute(phishing_stmt)).scalar() or 0
    legit_count = (await db.execute(legit_stmt)).scalar() or 0
    avg_conf = (await db.execute(avg_conf_stmt)).scalar()

    avg_confidence = round(float(avg_conf), 4) if avg_conf is not None else 0.0
    detection_rate = round(float(phishing_count / total), 4) if total > 0 else 0.0

    return {
        "total_scans": total,
        "phishing_detected": phishing_count,
        "legitimate_detected": legit_count,
        "avg_confidence": avg_confidence,
        "detection_rate": detection_rate,
    }
