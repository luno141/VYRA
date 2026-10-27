'use client';

import React, { useState } from 'react';
import { ScanResult as ScanResultType } from '../lib/types';
import RiskMeter from './RiskMeter';
import ShapChart from './ShapChart';
import {
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Globe,
  Server,
  Calendar,
  Layers,
  Clock,
  Cpu,
  AlertTriangle,
} from 'lucide-react';

interface ScanResultProps {
  result: ScanResultType;
}

export default function ScanResult({ result }: ScanResultProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const isPhishing =
    result.verdict === 'PHISHING' ||
    String((result as any).prediction || '').toUpperCase() === 'PHISHING' ||
    result.risk_score >= 50;

  const displayConfidence =
    result.confidence <= 1
      ? (result.confidence * 100).toFixed(1)
      : Number(result.confidence).toFixed(1);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(label);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Top Verdict Banner */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 backdrop-blur-md ${
          isPhishing
            ? 'bg-gradient-to-r from-red-950/80 via-gray-900 to-red-950/40 border-red-500/40 shadow-xl shadow-red-950/30'
            : 'bg-gradient-to-r from-emerald-950/80 via-gray-900 to-emerald-950/40 border-emerald-500/40 shadow-xl shadow-emerald-950/30'
        }`}
      >
        {/* Subtle background glow */}
        <div
          className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
            isPhishing ? 'bg-red-500' : 'bg-emerald-500'
          }`}
        />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Verdict Info */}
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl border ${
                isPhishing
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {isPhishing ? <ShieldAlert className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full border ${
                    isPhishing
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}
                >
                  {isPhishing ? 'PHISHING' : 'LEGITIMATE'}
                </span>

                <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(result.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>

                {result.processing_time_ms && (
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                    {result.processing_time_ms} ms latency
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-100 mt-2 flex items-center gap-2">
                {isPhishing ? 'Deceptive Phishing Destination' : 'Legitimate Verified Destination'}
                <span className="text-sm font-semibold text-gray-400 font-mono">
                  ({displayConfidence}% confidence)
                </span>
              </h2>

              {/* Scanned URL display */}
              <div className="mt-2.5 flex items-center gap-2 max-w-2xl bg-gray-950/70 px-3 py-1.5 rounded-lg border border-gray-800 text-xs font-mono">
                <span className="text-gray-400 shrink-0">TARGET:</span>
                <span className="text-gray-200 truncate select-all">{result.url}</span>
                <button
                  onClick={() => copyToClipboard(result.url, 'url')}
                  className="p-1 hover:text-cyan-400 text-gray-400 transition-colors ml-auto"
                  title="Copy URL"
                >
                  {copiedHash === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-gray-950/80 p-3 rounded-xl border border-gray-800 text-center min-w-[100px]">
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Confidence</div>
              <div className="text-xl font-bold font-mono text-gray-100">{displayConfidence}%</div>
            </div>
            <div className="bg-gray-950/80 p-3 rounded-xl border border-gray-800 text-center min-w-[100px]">
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Risk Score</div>
              <div
                className={`text-xl font-bold font-mono ${
                  result.risk_score >= 70
                    ? 'text-red-400'
                    : result.risk_score >= 35
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {result.risk_score}/100
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Risk Meter + Threat Intelligence & SHAP Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Risk Meter and Threat Intelligence Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Visual Risk Meter */}
          <RiskMeter score={result.risk_score} verdict={result.verdict} />

          {/* Threat Intelligence Card */}
          <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-5 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Threat Intelligence Grid
              </h3>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                {result.threat_intel?.source || 'AlienVault + VYRA'}
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              {/* Host & IP */}
              <div className="flex items-center justify-between py-1.5 border-b border-gray-800/60">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-gray-400" />
                  Resolved IP Address
                </span>
                <span className="font-mono text-gray-200">
                  {result.threat_intel?.ip_address || 'Unresolved'} {result.threat_intel?.country ? `(${result.threat_intel.country})` : ''}
                </span>
              </div>

              {/* Domain Age */}
              <div className="flex items-center justify-between py-1.5 border-b border-gray-800/60">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Domain Age
                </span>
                <span className="font-mono text-gray-200">
                  {result.threat_intel?.domain_age_days !== undefined && result.threat_intel?.domain_age_days !== null
                    ? `${result.threat_intel.domain_age_days} days`
                    : 'Unknown'}
                </span>
              </div>

              {/* SSL Certificate */}
              <div className="flex items-center justify-between py-1.5 border-b border-gray-800/60">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  SSL Certificate
                </span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    result.threat_intel?.ssl_valid ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {result.threat_intel?.ssl_valid ? 'Valid TLS / SSL' : 'Invalid / Insecure'}
                </span>
              </div>

              {/* VirusTotal / Blacklist Positives */}
              <div className="flex items-center justify-between py-1.5 border-b border-gray-800/60">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
                  Security Engine Flags
                </span>
                <span
                  className={`font-mono font-bold ${
                    (result.threat_intel?.virustotal_positives || 0) > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {result.threat_intel?.virustotal_positives || 0} / {result.threat_intel?.virustotal_total || 88} engines
                </span>
              </div>

              {/* Threat Classification Tags */}
              {result.threat_intel?.threat_types && result.threat_intel.threat_types.length > 0 && (
                <div className="pt-2">
                  <span className="text-gray-400 block mb-2 font-medium">Identified Threat Signatures:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.threat_intel.threat_types.map((type, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-red-950/60 border border-red-800/50 text-red-400 rounded text-[11px] font-mono"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: SHAP Model Feature Attribution */}
        <div className="lg:col-span-7">
          <ShapChart features={result.shap_features} />
        </div>
      </div>

      {/* Blockchain Commitment Card */}
      {result.blockchain && (
        <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                  Blockchain Immutability Proof
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                    COMMITTED
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Tamper-proof cryptographic record permanently anchored on VYRA ledger
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">Block Index:</span>
              <span className="px-2.5 py-1 bg-cyan-950/80 text-cyan-300 font-mono text-xs font-bold rounded border border-cyan-800/50">
                #{result.blockchain.block_index}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Block Hash */}
            <div className="bg-gray-950/80 p-3 rounded-lg border border-gray-800/80">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span>BLOCK HASH (SHA-256)</span>
                <button
                  onClick={() => copyToClipboard(result.blockchain!.block_hash, 'block_hash')}
                  className="hover:text-cyan-400 transition-colors"
                  title="Copy Hash"
                >
                  {copiedHash === 'block_hash' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-cyan-400 break-all select-all">{result.blockchain.block_hash}</div>
            </div>

            {/* Previous Block Hash */}
            <div className="bg-gray-950/80 p-3 rounded-lg border border-gray-800/80">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span>PREVIOUS BLOCK LINK</span>
                <button
                  onClick={() => copyToClipboard(result.blockchain!.prev_hash, 'prev_hash')}
                  className="hover:text-cyan-400 transition-colors"
                  title="Copy Hash"
                >
                  {copiedHash === 'prev_hash' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-gray-400 break-all select-all">{result.blockchain.prev_hash}</div>
            </div>
          </div>

          {result.blockchain.tx_hash && (
            <div className="mt-3 bg-gray-950/80 p-3 rounded-lg border border-gray-800/80 text-xs font-mono">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span>TRANSACTION RECEIPT (TX HASH)</span>
                <button
                  onClick={() => copyToClipboard(result.blockchain!.tx_hash!, 'tx_hash')}
                  className="hover:text-cyan-400 transition-colors"
                  title="Copy Tx Hash"
                >
                  {copiedHash === 'tx_hash' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="text-emerald-400/90 break-all select-all">{result.blockchain.tx_hash}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
