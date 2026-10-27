"""SQLAlchemy ORM models for scans and blockchain audit blocks."""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
import json

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base


class ScanResult(Base):
    """Database model for storing URL scan results and threat analysis."""

    __tablename__ = "scan_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    url_hash: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    prediction: Mapped[str] = mapped_column(String(32), nullable=False)  # 'phishing' or 'legitimate'
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0.0 - 100.0
    features_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    shap_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    threat_intel_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    blockchain_block_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        """Convert model attributes to dictionary format."""
        return {
            "id": self.id,
            "url": self.url,
            "url_hash": self.url_hash,
            "prediction": self.prediction,
            "confidence": self.confidence,
            "risk_score": self.risk_score,
            "features": json.loads(self.features_json) if self.features_json else {},
            "shap_explanations": json.loads(self.shap_json) if self.shap_json else [],
            "threat_intel": json.loads(self.threat_intel_json) if self.threat_intel_json else {},
            "blockchain_block_index": self.blockchain_block_index,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "ip_address": self.ip_address,
        }


class BlockchainBlock(Base):
    """Database model for persisting mined audit blockchain blocks."""

    __tablename__ = "blockchain_blocks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    index: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    timestamp: Mapped[float] = mapped_column(Float, nullable=False)
    data_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    prev_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    block_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    nonce: Mapped[int] = mapped_column(Integer, nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        """Convert block model attributes to dictionary format."""
        return {
            "id": self.id,
            "index": self.index,
            "timestamp": self.timestamp,
            "data_hash": self.data_hash,
            "prev_hash": self.prev_hash,
            "block_hash": self.block_hash,
            "nonce": self.nonce,
        }
