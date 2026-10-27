"""
VYRA — test_blockchain.py
Unit tests for the VYRAChain audit-trail blockchain.

Run with:
    pytest tests/test_blockchain.py -v
"""

import hashlib
import os
import tempfile
import time

import pytest

# ---------------------------------------------------------------------------
# Import the blockchain module under test
# ---------------------------------------------------------------------------
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from blockchain.chain import VYRAChain, Block, reset_chain_instance


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def tmp_chain(tmp_path):
    """
    Provide a fresh VYRAChain backed by a temporary file so tests never
    touch the real chain_data.json.
    """
    reset_chain_instance()
    chain_file = str(tmp_path / "test_chain.json")
    chain = VYRAChain(chain_file=chain_file)
    yield chain
    reset_chain_instance()


@pytest.fixture
def sample_detection():
    """Reusable detection event data."""
    return {
        "url": "http://secure-login.bankofamerica-verify.com/",
        "prediction": "phishing",
        "confidence": 0.97,
        "features": {
            "has_ip": False,
            "url_length": 53,
            "num_dots": 4,
            "has_https": False,
        },
        "shap": {
            "url_length": 0.32,
            "num_dots": 0.21,
            "has_https": -0.18,
        },
    }


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestGenesisBlock:
    def test_genesis_block_created(self, tmp_chain: VYRAChain):
        """A new chain must always start with exactly one genesis block."""
        assert len(tmp_chain) == 1

    def test_genesis_index_is_zero(self, tmp_chain: VYRAChain):
        genesis = tmp_chain.get_block(0)
        assert genesis is not None
        assert genesis.index == 0

    def test_genesis_prediction_label(self, tmp_chain: VYRAChain):
        genesis = tmp_chain.get_block(0)
        assert genesis.prediction == "genesis"

    def test_genesis_prev_hash_is_zeros(self, tmp_chain: VYRAChain):
        genesis = tmp_chain.get_block(0)
        assert genesis.prev_hash == "0" * 64

    def test_genesis_hash_satisfies_pow(self, tmp_chain: VYRAChain):
        genesis = tmp_chain.get_block(0)
        assert genesis.block_hash.startswith("0" * 2)  # DIFFICULTY == 2


class TestAddBlock:
    def test_add_block_returns_block(self, tmp_chain: VYRAChain, sample_detection):
        d = sample_detection
        block = tmp_chain.add_block(
            d["url"], d["prediction"], d["confidence"],
            d["features"], d["shap"]
        )
        assert isinstance(block, Block)

    def test_add_block_increments_chain_length(self, tmp_chain: VYRAChain, sample_detection):
        d = sample_detection
        tmp_chain.add_block(d["url"], d["prediction"], d["confidence"],
                            d["features"], d["shap"])
        assert len(tmp_chain) == 2

    def test_add_block_index_is_correct(self, tmp_chain: VYRAChain, sample_detection):
        d = sample_detection
        block = tmp_chain.add_block(d["url"], d["prediction"], d["confidence"],
                                    d["features"], d["shap"])
        assert block.index == 1

    def test_add_block_url_stored_as_hash(self, tmp_chain: VYRAChain, sample_detection):
        d = sample_detection
        expected_hash = hashlib.sha256(d["url"].encode()).hexdigest()
        block = tmp_chain.add_block(d["url"], d["prediction"], d["confidence"],
                                    d["features"], d["shap"])
        assert block.url_hash == expected_hash

    def test_add_block_confidence_stored(self, tmp_chain: VYRAChain, sample_detection):
        d = sample_detection
        block = tmp_chain.add_block(d["url"], d["prediction"], d["confidence"],
                                    d["features"], d["shap"])
        assert abs(block.confidence - d["confidence"]) < 1e-9

    def test_multiple_blocks_added(self, tmp_chain: VYRAChain):
        for i in range(5):
            tmp_chain.add_block(f"http://site{i}.com", "legitimate", 0.8 + i * 0.01,
                                 {"feat": i}, {"shap": i})
        assert len(tmp_chain) == 6  # 5 blocks + genesis


class TestChainVerification:
    def test_chain_verification_valid_fresh_chain(self, tmp_chain: VYRAChain):
        report = tmp_chain.verify_chain()
        assert report["valid"] is True
        assert report["errors"] == []

    def test_chain_verification_valid_after_additions(self, tmp_chain: VYRAChain, sample_detection):
        d = sample_detection
        for _ in range(3):
            tmp_chain.add_block(d["url"], d["prediction"], d["confidence"],
                                 d["features"], d["shap"])
        report = tmp_chain.verify_chain()
        assert report["valid"] is True
        assert report["length"] == 4  # genesis + 3

    def test_chain_verification_tamper_detection_hash(self, tmp_chain: VYRAChain, sample_detection):
        """
        Directly mutating a block's stored hash must be detected by verify_chain().
        """
        d = sample_detection
        tmp_chain.add_block(d["url"], d["prediction"], d["confidence"],
                             d["features"], d["shap"])
        # Tamper with block 1's stored hash
        tmp_chain._chain[1].block_hash = "a" * 64
        report = tmp_chain.verify_chain()
        assert report["valid"] is False
        assert any("1" in err for err in report["errors"])

    def test_chain_verification_tamper_detection_field(self, tmp_chain: VYRAChain, sample_detection):
        """
        Changing a block field (prediction) without updating the hash must fail.
        """
        d = sample_detection
        tmp_chain.add_block(d["url"], d["prediction"], d["confidence"],
                             d["features"], d["shap"])
        # Tamper: change prediction label without re-hashing
        tmp_chain._chain[1].prediction = "legitimate"
        report = tmp_chain.verify_chain()
        assert report["valid"] is False

    def test_chain_verification_tamper_detection_linkage(self, tmp_chain: VYRAChain, sample_detection):
        """
        Breaking the prev_hash linkage between two blocks must fail.
        """
        d = sample_detection
        tmp_chain.add_block(d["url"], d["prediction"], d["confidence"],
                             d["features"], d["shap"])
        # Sever the link
        tmp_chain._chain[1].prev_hash = "0" * 64
        report = tmp_chain.verify_chain()
        assert report["valid"] is False


class TestBlockHashConsistency:
    def test_block_hash_consistency(self, tmp_chain: VYRAChain, sample_detection):
        """
        Re-computing a block's hash using the chain's own method must equal the
        stored block_hash (i.e. PoW was applied correctly).
        """
        d = sample_detection
        block = tmp_chain.add_block(d["url"], d["prediction"], d["confidence"],
                                    d["features"], d["shap"])
        recomputed = tmp_chain._compute_hash(block)
        assert recomputed == block.block_hash

    def test_block_hash_changes_with_nonce(self, tmp_chain: VYRAChain):
        """Nonce must actually change the hash output."""
        genesis = tmp_chain.get_block(0)
        original_hash = genesis.block_hash
        genesis.nonce += 1
        new_hash = tmp_chain._compute_hash(genesis)
        assert new_hash != original_hash
        # Restore
        genesis.nonce -= 1


class TestPersistence:
    def test_chain_persists_across_instances(self, tmp_path):
        """Chain written to disk must be reloaded identically by a new instance."""
        chain_file = str(tmp_path / "persist.json")
        c1 = VYRAChain(chain_file=chain_file)
        c1.add_block("http://test.com", "legitimate", 0.9, {"k": 1}, {"s": 0.1})
        genesis_hash = c1.get_block(0).block_hash

        c2 = VYRAChain(chain_file=chain_file)
        assert len(c2) == 2
        assert c2.get_block(0).block_hash == genesis_hash

    def test_get_block_out_of_range_returns_none(self, tmp_chain: VYRAChain):
        assert tmp_chain.get_block(999) is None

    def test_get_block_negative_returns_none(self, tmp_chain: VYRAChain):
        assert tmp_chain.get_block(-1) is None
