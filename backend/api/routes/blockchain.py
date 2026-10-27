"""VYRA Blockchain API Router.

Provides inspection endpoints for the cryptographic audit trail, chain integrity verification,
and block retrieval.
"""

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from blockchain.audit import blockchain

logger = logging.getLogger("vyra.api.blockchain")
router = APIRouter()


class BlockModel(BaseModel):
    """Schema representing an individual block in the chain."""
    index: int
    timestamp: float
    url_hash: str
    prediction: str
    confidence: float
    feature_hash: str
    prev_hash: str
    block_hash: str
    nonce: int


class ChainResponse(BaseModel):
    """Response schema for the complete blockchain ledger."""
    length: int
    chain: List[BlockModel]


class VerifyResponse(BaseModel):
    """Response schema for blockchain cryptographic verification."""
    valid: bool
    length: int
    blocks_checked: int


class BlockchainStats(BaseModel):
    """Schema for blockchain telemetry and metadata."""
    total_blocks: int
    chain_valid: bool
    last_block_hash: str
    genesis_timestamp: float


@router.get(
    "",
    summary="Get Blockchain Blocks",
    description="Retrieve list of blocks or chain object.",
)
@router.get(
    "/chain",
    summary="Get Full Blockchain",
    description="Retrieve the complete list of blocks comprising the audit trail.",
)
async def get_full_chain() -> Any:
    """Retrieve complete audit blockchain."""
    chain = blockchain.get_chain()
    blocks = [block.to_dict() for block in chain]
    return blocks


@router.get(
    "/verify",
    response_model=VerifyResponse,
    summary="Verify Blockchain Cryptographic Integrity",
    description="Runs cryptographic SHA-256 link validation and proof-of-work difficulty verification across all blocks.",
)
async def verify_blockchain() -> Dict[str, Any]:
    """Verify cryptographic integrity of the blockchain."""
    is_valid = blockchain.verify_chain()
    chain_len = len(blockchain.chain)
    return {
        "valid": is_valid,
        "length": chain_len,
        "blocks_checked": chain_len,
    }


@router.get(
    "/stats",
    response_model=BlockchainStats,
    summary="Get Blockchain Statistics",
    description="Returns high-level metadata and proof-of-work stats.",
)
async def get_blockchain_stats() -> Dict[str, Any]:
    """Get blockchain telemetry stats."""
    chain = blockchain.get_chain()
    is_valid = blockchain.verify_chain()
    last_hash = chain[-1].block_hash if chain else ""
    genesis_ts = chain[0].timestamp if chain else 0.0
    return {
        "total_blocks": len(chain),
        "chain_valid": is_valid,
        "last_block_hash": last_hash,
        "genesis_timestamp": genesis_ts,
    }


@router.get(
    "/block/{index}",
    response_model=BlockModel,
    summary="Get Block by Index",
    description="Retrieve a specific block in the audit blockchain by its block index.",
)
async def get_block_by_index(index: int) -> Dict[str, Any]:
    """Retrieve block by index."""
    block = blockchain.get_block(index)
    if block is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block with index {index} not found in audit chain.",
        )
    return block.to_dict()

