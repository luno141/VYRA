'use client';

import React, { useState, useEffect } from 'react';
import { getBlockchain, verifyBlockchain } from '../../lib/api';
import { Block, VerifyResult } from '../../lib/types';
import {
  Link as ChainIcon,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ArrowDown,
  Lock,
  Layers,
  Cpu,
  Hash,
  Terminal,
} from 'lucide-react';

export default function BlockchainPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const data = await getBlockchain();
      setBlocks(data);
    } catch (err) {
      console.error('Failed to load blockchain', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
    handleVerify();
  }, []);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await verifyBlockchain();
      setVerifyResult(res);
    } catch (err) {
      console.error('Failed to verify chain', err);
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#c084fc] border-2 border-black font-mono text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_#000] mb-2">
            <Lock className="w-3 h-3 text-black" />
            <span>PROOF-OF-WORK // SHA-256 AUDIT TRAIL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-mono text-white uppercase tracking-tight">
            Blockchain Audit Ledger
          </h1>
          <p className="text-xs font-mono font-bold text-zinc-300 mt-1">
            Tamper-evident, cryptographically linked notarization blocks securing every prediction
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBlocks}
            disabled={loading}
            className="neo-btn flex items-center gap-2 px-3 py-2 bg-white text-black font-mono text-xs font-black uppercase cursor-pointer border-2 border-white shadow-[3px_3px_0px_0px_#facc15] hover:bg-zinc-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-black' : ''}`} />
            <span>SYNC NODE</span>
          </button>

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="neo-btn flex items-center gap-2 px-4 py-2 bg-[#ccff00] text-black font-mono text-xs font-black uppercase cursor-pointer disabled:opacity-60 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] hover:bg-[#b8e600]"
          >
            {verifying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>VERIFYING HASHES...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>VERIFY CHAIN</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chain Verification Status Card */}
      {verifyResult && (
        <div
          className={`neo-card p-6 border-[3px] border-white shadow-[6px_6px_0px_0px_#ffffff] ${
            verifyResult.is_valid
              ? 'bg-[#22c55e] text-black'
              : 'bg-[#ff3366] text-white'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-black border-2 border-black flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_#ffffff]">
                {verifyResult.is_valid ? (
                  <ShieldCheck className="w-8 h-8 text-[#22c55e]" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-[#ff3366]" />
                )}
              </div>

              <div>
                <span className="px-2 py-0.5 bg-black text-white text-[10px] font-mono font-black uppercase tracking-wider">
                  {verifyResult.is_valid ? 'INTEGRITY VERIFIED' : 'TAMPER DETECTED'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black font-mono uppercase tracking-tight mt-1">
                  {verifyResult.is_valid
                    ? 'Cryptographic Ledger Immutable & Valid'
                    : 'Cryptographic Hash Mismatch Detected'}
                </h3>
                <p className="text-xs font-mono font-bold mt-1 max-w-2xl opacity-90">
                  {verifyResult.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs font-black shrink-0">
              <span className="px-3 py-1.5 bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                {verifyResult.total_blocks} BLOCKS CHECKED
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Block Sequence (Neo-Brutalist Concrete Tiles) */}
      <div className="space-y-6">
        {loading && blocks.length === 0 ? (
          <div className="bg-[#141624] border-2 border-white p-12 text-center font-mono font-bold text-sm text-white">
            LOADING BLOCKCHAIN LEDGER...
          </div>
        ) : (
          blocks.map((block, idx) => {
            const isPhish = block.prediction === 'PHISHING';
            const isLast = idx === blocks.length - 1;

            return (
              <div key={block.index} className="space-y-4">
                <div className="neo-card p-6 bg-white border-[3px] border-white shadow-[6px_6px_0px_0px_#facc15] space-y-5">
                  {/* Block Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-black gap-2">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-black text-[#facc15] font-mono font-black text-sm border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                        BLOCK #{block.index}
                      </span>

                      <span
                        className={`neo-badge px-2.5 py-1 text-xs inline-flex items-center gap-1 ${
                          isPhish ? 'bg-[#ff3366] text-white' : 'bg-[#22c55e] text-black'
                        }`}
                      >
                        {isPhish ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        {block.prediction}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-zinc-600">
                      {block.nonce !== undefined && (
                        <span className="px-2 py-0.5 bg-zinc-200 border border-black text-black">
                          NONCE: {block.nonce}
                        </span>
                      )}
                      <span>
                        {new Date(block.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Target URL if present */}
                  {block.target_url && (
                    <div className="p-2.5 bg-[#fdfbf7] border-2 border-black font-mono text-xs font-bold flex items-center gap-2">
                      <span className="text-zinc-500 uppercase shrink-0">NOTARIZED URL:</span>
                      <span className="text-black truncate select-all">{block.target_url}</span>
                    </div>
                  )}

                  {/* Hashes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                    {/* Block Hash */}
                    <div className="p-3 bg-[#f6f5f0] border-2 border-black shadow-[3px_3px_0px_0px_#000]">
                      <div className="flex items-center justify-between text-zinc-500 font-bold mb-1">
                        <span>BLOCK HASH (SHA-256)</span>
                        <button
                          onClick={() => copyToClipboard(block.block_hash, `hash-${block.index}`)}
                          className="p-1 bg-black text-white hover:bg-zinc-800 transition-colors"
                          title="Copy"
                        >
                          {copiedHash === `hash-${block.index}` ? (
                            <Check className="w-3 h-3 text-[#22c55e]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="font-black text-black break-all select-all">
                        {block.block_hash}
                      </div>
                    </div>

                    {/* Previous Hash */}
                    <div className="p-3 bg-[#f6f5f0] border-2 border-black shadow-[3px_3px_0px_0px_#000]">
                      <div className="flex items-center justify-between text-zinc-500 font-bold mb-1">
                        <span>PREVIOUS BLOCK HASH</span>
                        <button
                          onClick={() => copyToClipboard(block.prev_hash, `prev-${block.index}`)}
                          className="p-1 bg-black text-white hover:bg-zinc-800 transition-colors"
                          title="Copy"
                        >
                          {copiedHash === `prev-${block.index}` ? (
                            <Check className="w-3 h-3 text-[#22c55e]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="font-bold text-zinc-600 break-all select-all">
                        {block.prev_hash}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chained Connector Arrow */}
                {!isLast && (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-black text-white font-mono text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_#facc15]">
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>CRYPTOGRAPHIC LINKAGE</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
