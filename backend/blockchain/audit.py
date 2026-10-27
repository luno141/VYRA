"""VYRA Cryptographic Audit Blockchain.

Maintains an immutable proof-of-work audit trail of all scan determinations,
URL hashes, and feature fingerprints to ensure verifiable integrity.
"""

from dataclasses import asdict, dataclass
import hashlib
import json
import logging
import os
import threading
import time
from typing import Any, Dict, List, Optional, Tuple

from core.config import settings

logger = logging.getLogger("vyra.blockchain")


@dataclass
class Block:
    """Represents a single block in the VYRA audit blockchain."""

    index: int
    timestamp: float
    url_hash: str
    prediction: str
    confidence: float
    feature_hash: str
    prev_hash: str
    block_hash: str
    nonce: int

    def to_dict(self) -> Dict[str, Any]:
        """Convert block instance to dictionary."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Block":
        """Instantiate block from dictionary representation."""
        return cls(
            index=int(data["index"]),
            timestamp=float(data["timestamp"]),
            url_hash=str(data["url_hash"]),
            prediction=str(data["prediction"]),
            confidence=float(data["confidence"]),
            feature_hash=str(data["feature_hash"]),
            prev_hash=str(data["prev_hash"]),
            block_hash=str(data["block_hash"]),
            nonce=int(data["nonce"]),
        )


def calculate_hash(
    index: int,
    timestamp: float,
    url_hash: str,
    prediction: str,
    confidence: float,
    feature_hash: str,
    prev_hash: str,
    nonce: int,
) -> str:
    """Calculate deterministic SHA-256 hash for block headers."""
    header = (
        f"{index}:"
        f"{timestamp:.6f}:"
        f"{url_hash}:"
        f"{prediction}:"
        f"{confidence:.4f}:"
        f"{feature_hash}:"
        f"{prev_hash}:"
        f"{nonce}"
    )
    return hashlib.sha256(header.encode("utf-8")).hexdigest()


class VYRABlockchain:
    """Decentralized audit ledger implementing SHA-256 proof-of-work validation."""

    def __init__(
        self,
        file_path: Optional[str] = None,
        difficulty: int = 2,
    ) -> None:
        self.file_path = file_path or settings.BLOCKCHAIN_FILE_PATH
        self.difficulty = difficulty
        self.chain: List[Block] = []
        self._lock = threading.Lock()
        self.load_chain()

    def _mine_block(
        self,
        index: int,
        timestamp: float,
        url_hash: str,
        prediction: str,
        confidence: float,
        feature_hash: str,
        prev_hash: str,
    ) -> Tuple[str, int]:
        """Mine block nonce meeting proof-of-work difficulty requirement."""
        target_prefix = "0" * self.difficulty
        nonce = 0
        while True:
            candidate_hash = calculate_hash(
                index=index,
                timestamp=timestamp,
                url_hash=url_hash,
                prediction=prediction,
                confidence=confidence,
                feature_hash=feature_hash,
                prev_hash=prev_hash,
                nonce=nonce,
            )
            if candidate_hash.startswith(target_prefix):
                return candidate_hash, nonce
            nonce += 1

    def create_genesis_block(self) -> Block:
        """Generate and mine the initial root genesis block."""
        index = 0
        timestamp = 1704067200.0  # 2024-01-01 00:00:00 UTC
        url_hash = "0" * 64
        prediction = "genesis"
        confidence = 1.0
        feature_hash = hashlib.sha256(b"VYRA_AUDIT_GENESIS_SEED").hexdigest()
        prev_hash = "0" * 64

        block_hash, nonce = self._mine_block(
            index=index,
            timestamp=timestamp,
            url_hash=url_hash,
            prediction=prediction,
            confidence=confidence,
            feature_hash=feature_hash,
            prev_hash=prev_hash,
        )

        return Block(
            index=index,
            timestamp=timestamp,
            url_hash=url_hash,
            prediction=prediction,
            confidence=confidence,
            feature_hash=feature_hash,
            prev_hash=prev_hash,
            block_hash=block_hash,
            nonce=nonce,
        )

    def load_chain(self) -> None:
        """Load blockchain from local JSON ledger file or initialize with genesis block."""
        with self._lock:
            if os.path.isfile(self.file_path):
                try:
                    with open(self.file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    self.chain = [Block.from_dict(item) for item in data]
                    if self.chain and self.verify_chain():
                        logger.info("Loaded valid blockchain with %d blocks from disk.", len(self.chain))
                        return
                    else:
                        logger.warning("Existing blockchain on disk invalid; reinitializing.")
                except Exception as exc:
                    logger.error("Failed to load blockchain from %s: %s", self.file_path, exc)

            # Initialize fresh chain with Genesis block
            genesis = self.create_genesis_block()
            self.chain = [genesis]
            self._save_chain_unlocked()
            logger.info("Initialized fresh blockchain with Genesis block.")

    def _save_chain_unlocked(self) -> None:
        """Persist chain to disk without acquiring lock (internal use)."""
        temp_path = self.file_path + ".tmp"
        data = [block.to_dict() for block in self.chain]
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        os.replace(temp_path, self.file_path)

    def save_chain(self) -> None:
        """Thread-safe save of blockchain ledger to disk."""
        with self._lock:
            self._save_chain_unlocked()

    def add_block(self, scan_data: Dict[str, Any]) -> Block:
        """Mine and append a new block recording scan results.

        Args:
            scan_data: Dict with url_hash, prediction, confidence, and features.

        Returns:
            The newly mined and appended Block.
        """
        with self._lock:
            if not self.chain:
                self.chain.append(self.create_genesis_block())

            prev_block = self.chain[-1]
            index = prev_block.index + 1
            timestamp = time.time()
            url_hash = str(scan_data.get("url_hash", ""))
            prediction = str(scan_data.get("prediction", "unknown"))
            confidence = float(scan_data.get("confidence", 0.0))

            # Calculate deterministic hash of features or payload
            features = scan_data.get("features", {})
            feature_str = json.dumps(features, sort_keys=True)
            feature_hash = hashlib.sha256(feature_str.encode("utf-8")).hexdigest()
            prev_hash = prev_block.block_hash

            block_hash, nonce = self._mine_block(
                index=index,
                timestamp=timestamp,
                url_hash=url_hash,
                prediction=prediction,
                confidence=confidence,
                feature_hash=feature_hash,
                prev_hash=prev_hash,
            )

            new_block = Block(
                index=index,
                timestamp=timestamp,
                url_hash=url_hash,
                prediction=prediction,
                confidence=confidence,
                feature_hash=feature_hash,
                prev_hash=prev_hash,
                block_hash=block_hash,
                nonce=nonce,
            )

            self.chain.append(new_block)
            self._save_chain_unlocked()
            logger.info("Mined block #%d with hash %s (nonce=%d)", index, block_hash, nonce)
            return new_block

    def verify_chain(self) -> bool:
        """Verify the integrity, links, and proof-of-work hashes across all blocks.

        Returns:
            True if all blocks are valid and tamper-free, False otherwise.
        """
        target_prefix = "0" * self.difficulty
        if not self.chain:
            return False

        # Validate genesis block
        genesis = self.chain[0]
        if genesis.index != 0 or genesis.prev_hash != "0" * 64:
            return False

        expected_genesis_hash = calculate_hash(
            index=genesis.index,
            timestamp=genesis.timestamp,
            url_hash=genesis.url_hash,
            prediction=genesis.prediction,
            confidence=genesis.confidence,
            feature_hash=genesis.feature_hash,
            prev_hash=genesis.prev_hash,
            nonce=genesis.nonce,
        )
        if genesis.block_hash != expected_genesis_hash or not genesis.block_hash.startswith(target_prefix):
            return False

        # Validate subsequent blocks
        for i in range(1, len(self.chain)):
            curr = self.chain[i]
            prev = self.chain[i - 1]

            if curr.index != prev.index + 1:
                return False

            if curr.prev_hash != prev.block_hash:
                return False

            expected_hash = calculate_hash(
                index=curr.index,
                timestamp=curr.timestamp,
                url_hash=curr.url_hash,
                prediction=curr.prediction,
                confidence=curr.confidence,
                feature_hash=curr.feature_hash,
                prev_hash=curr.prev_hash,
                nonce=curr.nonce,
            )
            if curr.block_hash != expected_hash:
                return False

            if not curr.block_hash.startswith(target_prefix):
                return False

        return True

    def get_chain(self) -> List[Block]:
        """Return shallow copy of all blocks in the chain."""
        with self._lock:
            return list(self.chain)

    def get_block(self, index: int) -> Optional[Block]:
        """Find and return block by index."""
        with self._lock:
            if 0 <= index < len(self.chain):
                block = self.chain[index]
                if block.index == index:
                    return block
            for b in self.chain:
                if b.index == index:
                    return b
            return None


# Global singleton instance
blockchain = VYRABlockchain()
