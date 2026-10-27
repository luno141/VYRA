"""
VYRA Blockchain — SHA-256 chained audit trail for phishing detection events.

Each block stores a tamper-evident record of:
  url_hash, prediction, confidence, feature_hash, shap_hash

No external blockchain library required; pure Python + hashlib.
"""

import hashlib
import json
import os
import time
from dataclasses import dataclass, asdict, field
from typing import List, Optional, Dict, Any

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

CHAIN_FILE = os.path.join(os.path.dirname(__file__), "chain_data.json")
DIFFICULTY = 2          # PoW prefix: hash must start with '0' * DIFFICULTY
_INSTANCE: Optional["VYRAChain"] = None   # module-level singleton


# ---------------------------------------------------------------------------
# Block dataclass
# ---------------------------------------------------------------------------

@dataclass
class Block:
    """
    Represents a single immutable record in the VYRA audit chain.

    Fields
    ------
    index          : position in the chain (0 = genesis)
    timestamp      : Unix epoch float (UTC)
    url_hash       : SHA-256 hex digest of the scanned URL
    prediction     : model output label, e.g. 'phishing' | 'legitimate'
    confidence     : model confidence in [0.0, 1.0]
    feature_hash   : SHA-256 hex digest of the serialised feature dict
    shap_hash      : SHA-256 hex digest of the serialised SHAP value dict
    prev_hash      : block_hash of the preceding block
    nonce          : proof-of-work counter
    block_hash     : SHA-256 digest of all other fields (set after PoW)
    """

    index: int
    timestamp: float
    url_hash: str
    prediction: str
    confidence: float
    feature_hash: str
    shap_hash: str
    prev_hash: str
    nonce: int = 0
    block_hash: str = ""


# ---------------------------------------------------------------------------
# VYRAChain
# ---------------------------------------------------------------------------

class VYRAChain:
    """
    Lightweight append-only blockchain for VYRA phishing-detection audit logs.

    Usage
    -----
    chain = get_chain_instance()
    block = chain.add_block(url, prediction, confidence, features, shap_vals)
    report = chain.verify_chain()
    """

    def __init__(self, chain_file: str = CHAIN_FILE) -> None:
        self._chain_file = chain_file
        self._chain: List[Block] = []
        self._load()
        if not self._chain:
            self._chain.append(self._create_genesis())
            self._save()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _hash_dict(d: Dict[str, Any]) -> str:
        """Return SHA-256 hex digest of a deterministically sorted JSON blob."""
        serialised = json.dumps(d, sort_keys=True, default=str)
        return hashlib.sha256(serialised.encode()).hexdigest()

    def _compute_hash(self, block: Block) -> str:
        """
        Compute SHA-256 over all block fields (block_hash is excluded so that
        the hash can be computed before it is known).
        """
        data = {
            "index": block.index,
            "timestamp": block.timestamp,
            "url_hash": block.url_hash,
            "prediction": block.prediction,
            "confidence": block.confidence,
            "feature_hash": block.feature_hash,
            "shap_hash": block.shap_hash,
            "prev_hash": block.prev_hash,
            "nonce": block.nonce,
        }
        raw = json.dumps(data, sort_keys=True)
        return hashlib.sha256(raw.encode()).hexdigest()

    def _proof_of_work(self, block: Block) -> Block:
        """
        Increment nonce until the block's hash satisfies the difficulty
        requirement (starts with '0' * DIFFICULTY).
        """
        prefix = "0" * DIFFICULTY
        block.nonce = 0
        candidate = self._compute_hash(block)
        while not candidate.startswith(prefix):
            block.nonce += 1
            candidate = self._compute_hash(block)
        block.block_hash = candidate
        return block

    def _create_genesis(self) -> Block:
        """Return the hard-coded genesis block (index 0)."""
        genesis = Block(
            index=0,
            timestamp=time.time(),
            url_hash="0" * 64,
            prediction="genesis",
            confidence=0.0,
            feature_hash="0" * 64,
            shap_hash="0" * 64,
            prev_hash="0" * 64,
        )
        return self._proof_of_work(genesis)

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def _save(self) -> None:
        """Serialise the chain to JSON on disk."""
        os.makedirs(os.path.dirname(self._chain_file), exist_ok=True)
        with open(self._chain_file, "w", encoding="utf-8") as fh:
            json.dump([asdict(b) for b in self._chain], fh, indent=2)

    def _load(self) -> None:
        """Deserialise the chain from disk (if file exists)."""
        if not os.path.exists(self._chain_file):
            return
        try:
            with open(self._chain_file, "r", encoding="utf-8") as fh:
                raw = json.load(fh)
            self._chain = [Block(**item) for item in raw]
        except (json.JSONDecodeError, TypeError, KeyError):
            # Corrupted file — start fresh (genesis will be created by caller)
            self._chain = []

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def add_block(
        self,
        url: str,
        prediction: str,
        confidence: float,
        features_dict: Dict[str, Any],
        shap_dict: Dict[str, Any],
    ) -> Block:
        """
        Commit a new detection event to the chain.

        Parameters
        ----------
        url          : the raw URL that was scanned
        prediction   : model label ('phishing' | 'legitimate')
        confidence   : model confidence score [0.0, 1.0]
        features_dict: dict of extracted URL/page features
        shap_dict    : dict of SHAP explanation values

        Returns
        -------
        The newly appended Block.
        """
        prev = self._chain[-1]
        url_hash = hashlib.sha256(url.encode()).hexdigest()
        feature_hash = self._hash_dict(features_dict)
        shap_hash = self._hash_dict(shap_dict)

        block = Block(
            index=len(self._chain),
            timestamp=time.time(),
            url_hash=url_hash,
            prediction=prediction,
            confidence=float(confidence),
            feature_hash=feature_hash,
            shap_hash=shap_hash,
            prev_hash=prev.block_hash,
        )
        block = self._proof_of_work(block)
        self._chain.append(block)
        self._save()
        return block

    def verify_chain(self) -> Dict[str, Any]:
        """
        Walk the chain and verify structural integrity.

        Checks
        ------
        * Each block's stored hash matches the recomputed hash.
        * Each block's prev_hash matches the preceding block's block_hash.
        * Each block's hash satisfies the PoW difficulty requirement.

        Returns
        -------
        {
            "valid"   : bool,
            "length"  : int,
            "errors"  : List[str]   # empty when valid
        }
        """
        errors: List[str] = []
        prefix = "0" * DIFFICULTY

        for i, block in enumerate(self._chain):
            # 1. Re-derive hash (excluding stored block_hash)
            recomputed = self._compute_hash(block)
            if recomputed != block.block_hash:
                errors.append(
                    f"Block {i}: stored hash mismatch "
                    f"(stored={block.block_hash[:12]}… "
                    f"computed={recomputed[:12]}…)"
                )

            # 2. PoW check
            if not block.block_hash.startswith(prefix):
                errors.append(
                    f"Block {i}: PoW violated "
                    f"(hash={block.block_hash[:12]}… "
                    f"prefix required='{prefix}')"
                )

            # 3. Linkage check (skip genesis)
            if i > 0:
                if block.prev_hash != self._chain[i - 1].block_hash:
                    errors.append(
                        f"Block {i}: prev_hash mismatch with block {i - 1}"
                    )

        return {
            "valid": len(errors) == 0,
            "length": len(self._chain),
            "errors": errors,
        }

    def get_chain(self) -> List[Block]:
        """Return the full chain (list of Block objects)."""
        return list(self._chain)

    def get_block(self, index: int) -> Optional[Block]:
        """Return a single block by index, or None if out of range."""
        if 0 <= index < len(self._chain):
            return self._chain[index]
        return None

    def __len__(self) -> int:
        return len(self._chain)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<VYRAChain length={len(self._chain)} file='{self._chain_file}'>"


# ---------------------------------------------------------------------------
# Singleton accessor
# ---------------------------------------------------------------------------

def get_chain_instance(chain_file: str = CHAIN_FILE) -> VYRAChain:
    """
    Return the module-level singleton VYRAChain.

    Subsequent calls with a different *chain_file* are ignored — call
    ``reset_chain_instance()`` first if you need a fresh instance (e.g. tests).
    """
    global _INSTANCE
    if _INSTANCE is None:
        _INSTANCE = VYRAChain(chain_file=chain_file)
    return _INSTANCE


def reset_chain_instance() -> None:
    """
    Destroy the current singleton so the next ``get_chain_instance()`` call
    creates a fresh one.  Primarily intended for unit-testing.
    """
    global _INSTANCE
    _INSTANCE = None
