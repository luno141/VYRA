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
  ArrowRight,
  Lock,
  Layers,
  Cpu,
  Hash,
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
    // Default initial verification
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-xs font-mono mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>SHA-256 Merkle Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-gray-100 flex items-center gap-3">
            <ChainIcon className="w-7 h-7 text-cyan-400" />
            Blockchain Audit Ledger
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Tamper-evident, cryptographically chained records of all detection outcomes and ML inferences
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBlocks}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700 rounded-lg text-xs font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-bold font-mono rounded-lg text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {verifying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>VERIFYING CHAIN...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>VERIFY CHAIN INTEGRITY</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Verification Status Card */}
      {verifyResult && (
        <div
          className={`p-5 rounded-xl border backdrop-blur-md transition-all ${
            verifyResult.is_valid
              ? 'bg-emerald-950/40 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
              : 'bg-red-950/40 border-red-500/40 shadow-lg shadow-red-950/20'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-xl border ${
                  verifyResult.is_valid
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-red-500/20 border-red-500/40 text-red-400'
                }`}
              >
                {verifyResult.is_valid ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono font-bold text-xs uppercase px-2.5 py-0.5 rounded-full border ${
                      verifyResult.is_valid
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}
                  >
                    {verifyResult.is_valid ? 'LEDGER INTEGRITY VERIFIED' : 'INTEGRITY TAMPER DETECTED'}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {blocks.length} Blocks Checked
                  </span>
                </div>
                <p className="text-sm text-gray-200 mt-1 font-sans">{verifyResult.message}</p>
              </div>
            </div>

            <div className="text-xs font-mono text-gray-400 self-end md:self-center text-right shrink-0">
              <div>Verified at: {new Date(verifyResult.verified_at).toLocaleTimeString()}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Consensus: Local PoA Node</div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Chain Diagram */}
      <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-200 font-mono">
              Visual Cryptographic Chain Linkage
            </h2>
          </div>
          <span className="text-xs font-mono text-gray-400">Scroll horizontally to inspect block links →</span>
        </div>

        {/* Horizontal Block Chain Scrollview */}
        <div className="overflow-x-auto pb-4 pt-2">
          <div className="flex items-center gap-4 min-w-max px-2">
            {blocks.map((block, idx) => {
              const isPhishing = block.prediction === 'PHISHING';
              const isGenesis =
                block.prev_hash === '0000000000000000000000000000000000000000000000000000000000000000' ||
                idx === blocks.length - 1;

              return (
                <React.Fragment key={block.index}>
                  {/* Block Node Box */}
                  <div
                    className={`w-72 bg-gray-950 p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] shadow-md ${
                      isPhishing
                        ? 'border-red-900/60 hover:border-red-500/80'
                        : 'border-emerald-900/60 hover:border-emerald-500/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-xs font-bold border border-cyan-800/40">
                        Block #{block.index}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${
                          isPhishing
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {block.prediction}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-gray-400 truncate mb-2" title={block.target_url}>
                      {block.target_url || block.url_hash.slice(0, 24) + '...'}
                    </div>

                    {/* Hash Previews */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-800 text-[10px] font-mono">
                      <div>
                        <span className="text-gray-500 block">HASH:</span>
                        <span className="text-cyan-400 truncate block font-mono">
                          {block.block_hash.slice(0, 18)}...
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">PREV:</span>
                        <span className="text-gray-400 truncate block font-mono">
                          {isGenesis ? 'GENESIS (0x0)' : `${block.prev_hash.slice(0, 18)}...`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Chain connector arrow */}
                  {idx < blocks.length - 1 && (
                    <div className="flex flex-col items-center justify-center text-cyan-500/70">
                      <div className="w-8 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500" />
                      <span className="text-[9px] font-mono text-gray-500 mt-1">prev</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Ledger Blocks Table */}
      <div className="bg-gray-900/60 rounded-xl border border-gray-800 overflow-hidden shadow-lg backdrop-blur-sm">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-200 font-mono">
            Ledger Blocks Full Details
          </h2>
          <span className="text-xs font-mono text-gray-400">{blocks.length} recorded blocks</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-950/80 border-b border-gray-800 font-mono uppercase text-gray-400 text-[11px]">
              <tr>
                <th className="py-3 px-4">Block #</th>
                <th className="py-3 px-4">Prediction</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Block Hash</th>
                <th className="py-3 px-4">Previous Hash</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Nonce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400 mb-2" />
                    Loading blockchain records...
                  </td>
                </tr>
              ) : (
                blocks.map((block) => {
                  const isPhishing = block.prediction === 'PHISHING';
                  const isGenesis =
                    block.prev_hash === '0000000000000000000000000000000000000000000000000000000000000000';

                  return (
                    <tr key={block.index} className="hover:bg-gray-800/40 transition-colors">
                      {/* Block index */}
                      <td className="py-3.5 px-4 font-bold text-cyan-400">
                        #{block.index}
                      </td>

                      {/* Prediction */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            isPhishing
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {block.prediction}
                        </span>
                      </td>

                      {/* Confidence */}
                      <td className="py-3.5 px-4 text-gray-300">
                        {block.confidence}%
                      </td>

                      {/* Block Hash */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-cyan-400 truncate max-w-[140px] select-all">
                            {block.block_hash}
                          </span>
                          <button
                            onClick={() => copyToClipboard(block.block_hash, `b-${block.index}`)}
                            className="p-1 hover:text-cyan-300 text-gray-500 transition-colors"
                            title="Copy full block hash"
                          >
                            {copiedHash === `b-${block.index}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Previous Hash */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 truncate max-w-[140px] select-all">
                            {isGenesis ? 'GENESIS ROOT' : block.prev_hash}
                          </span>
                          {!isGenesis && (
                            <button
                              onClick={() => copyToClipboard(block.prev_hash, `p-${block.index}`)}
                              className="p-1 hover:text-cyan-300 text-gray-500 transition-colors"
                              title="Copy previous hash"
                            >
                              {copiedHash === `p-${block.index}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-gray-400 text-[11px] whitespace-nowrap">
                        {new Date(block.timestamp).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </td>

                      {/* Nonce */}
                      <td className="py-3.5 px-4 text-gray-500">
                        {block.nonce || '42910'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
