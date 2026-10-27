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
  Terminal,
  FileCheck2,
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
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Top Verdict Banner (Neo-Brutalist High Impact Card) */}
      <div
        className={`neo-card relative overflow-hidden p-6 sm:p-8 ${
          isPhishing ? 'bg-[#ff3366] text-white' : 'bg-[#22c55e] text-black'
        }`}
      >
        {/* Top Hazard Accent Bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-3 border-b-2 border-black ${
            isPhishing ? 'neo-hazard-red' : 'neo-hazard-green'
          }`}
        />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-2">
          {/* Verdict Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-black border-2 border-black flex items-center justify-center shrink-0 shadow-[4px_4px_0px_0px_#ffffff]">
              {isPhishing ? (
                <ShieldAlert className="w-10 h-10 text-[#ff3366]" />
              ) : (
                <ShieldCheck className="w-10 h-10 text-[#22c55e]" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 bg-black text-white text-xs font-mono font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.8)]">
                  {isPhishing ? '⚠️ MALICIOUS THREAT DETECTED' : '🛡️ VERIFIED LEGITIMATE'}
                </span>

                <span className="px-2.5 py-1 bg-white text-black text-xs font-mono font-bold border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(result.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>

                {result.processing_time_ms && (
                  <span className="px-2.5 py-1 bg-[#facc15] text-black text-xs font-mono font-bold border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                    {result.processing_time_ms} MS INFERENCE
                  </span>
                )}
              </div>

              <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tight leading-none uppercase">
                {isPhishing
                  ? 'Deceptive Phishing Destination'
                  : 'Legitimate Verified Destination'}
              </h2>

              {/* Scanned URL display box */}
              <div className="mt-3 flex items-center gap-2 max-w-2xl bg-white text-black px-3 py-2 border-2 border-black text-xs font-mono font-bold shadow-[3px_3px_0px_0px_#000]">
                <span className="text-zinc-500 shrink-0 select-none">TARGET:</span>
                <span className="truncate select-all">{result.url}</span>
                <button
                  onClick={() => copyToClipboard(result.url, 'url')}
                  className="p-1 bg-black text-white hover:bg-zinc-800 transition-colors ml-auto shrink-0"
                  title="Copy URL"
                >
                  {copiedHash === 'url' ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white text-black p-3.5 border-2 border-black shadow-[4px_4px_0px_0px_#000] text-center min-w-[110px]">
              <div className="text-[10px] uppercase font-mono font-black text-zinc-500">CONFIDENCE</div>
              <div className="text-2xl font-black font-mono">{displayConfidence}%</div>
            </div>

            <div
              className={`p-3.5 border-2 border-black shadow-[4px_4px_0px_0px_#000] text-center min-w-[110px] ${
                isPhishing ? 'bg-black text-[#ff3366]' : 'bg-[#facc15] text-black'
              }`}
            >
              <div className="text-[10px] uppercase font-mono font-black opacity-80">THREAT SCORE</div>
              <div className="text-2xl font-black font-mono">{result.risk_score}/100</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Risk Meter + Threat Intelligence & SHAP Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Risk Meter and Threat Intelligence Card */}
        <div className="lg:col-span-5 space-y-8">
          {/* Visual Risk Meter */}
          <RiskMeter score={result.risk_score} verdict={result.verdict} />

          {/* Threat Intelligence Card */}
          <div className="neo-card p-5 bg-white">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <h3 className="text-sm font-black font-mono uppercase tracking-wider text-black flex items-center gap-2">
                <Globe className="w-4 h-4 text-black" />
                THREAT INTELLIGENCE GRID
              </h3>
              <span className="neo-badge px-2 py-0.5 bg-[#facc15] text-[10px] text-black">
                {result.threat_intel?.source || 'ALIENVAULT + VYRA'}
              </span>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              {/* Host & IP */}
              <div className="flex items-center justify-between py-2 border-b border-zinc-200">
                <span className="text-zinc-600 font-bold flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-black" />
                  RESOLVED IP
                </span>
                <span className="font-black text-black">
                  {result.threat_intel?.ip_address || '127.0.0.1'}{' '}
                  {result.threat_intel?.country ? `[${result.threat_intel.country}]` : ''}
                </span>
              </div>

              {/* Domain Age */}
              <div className="flex items-center justify-between py-2 border-b border-zinc-200">
                <span className="text-zinc-600 font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-black" />
                  DOMAIN REGISTRATION
                </span>
                <span className="font-black text-black">
                  {result.threat_intel?.domain_age_days !== undefined && result.threat_intel?.domain_age_days !== null
                    ? `${result.threat_intel.domain_age_days} DAYS`
                    : 'NEW / UNKNOWN'}
                </span>
              </div>

              {/* SSL Certificate */}
              <div className="flex items-center justify-between py-2 border-b border-zinc-200">
                <span className="text-zinc-600 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-black" />
                  CRYPTOGRAPHIC TLS
                </span>
                <span
                  className={`font-black px-2 py-0.5 border border-black ${
                    result.threat_intel?.ssl_valid
                      ? 'bg-[#22c55e] text-black'
                      : 'bg-[#ff3366] text-white'
                  }`}
                >
                  {result.threat_intel?.ssl_valid ? 'VALID TLS // SSL' : 'INSECURE / RAW HTTP'}
                </span>
              </div>

              {/* Security Engine Flags */}
              <div className="flex items-center justify-between py-2 border-b border-zinc-200">
                <span className="text-zinc-600 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-black" />
                  REPUTATION HITS
                </span>
                <span
                  className={`font-black px-2 py-0.5 border border-black ${
                    (result.threat_intel?.virustotal_positives || 0) > 0
                      ? 'bg-[#ff3366] text-white'
                      : 'bg-[#22c55e] text-black'
                  }`}
                >
                  {result.threat_intel?.virustotal_positives || 0} / 88 ENGINES
                </span>
              </div>

              {/* Threat Signatures */}
              {result.threat_intel?.threat_types && result.threat_intel.threat_types.length > 0 && (
                <div className="pt-2">
                  <span className="text-zinc-600 block mb-2 font-bold">MATCHED ADVERSARIAL PATTERNS:</span>
                  <div className="flex flex-wrap gap-2">
                    {result.threat_intel.threat_types.map((type, i) => (
                      <span
                        key={i}
                        className="neo-badge px-2 py-1 bg-[#ff4365] text-white text-[11px]"
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
        <div className="neo-card p-6 bg-[#fdfbf7]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-black gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#c084fc] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000]">
                <Layers className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-base font-black font-mono uppercase tracking-wider text-black flex items-center gap-2">
                  IMMUTABLE BLOCKCHAIN AUDIT RECEIPT
                  <span className="neo-badge px-2 py-0.5 bg-[#22c55e] text-black text-[10px]">
                    NOTARIZED
                  </span>
                </h3>
                <p className="text-xs font-mono text-zinc-600">
                  Cryptographically chained Proof-of-Work block anchored to VYRA ledger
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs font-bold text-black uppercase">BLOCK INDEX:</span>
              <span className="px-3 py-1 bg-black text-[#facc15] font-black text-sm border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                #{result.blockchain.block_index}
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Block Hash */}
            <div className="bg-white p-3.5 border-2 border-black shadow-[3px_3px_0px_0px_#000]">
              <div className="flex items-center justify-between text-zinc-500 font-bold mb-1">
                <span>SHA-256 BLOCK HASH</span>
                <button
                  onClick={() => copyToClipboard(result.blockchain!.block_hash, 'block_hash')}
                  className="p-1 bg-black text-white hover:bg-zinc-800 transition-colors"
                  title="Copy Hash"
                >
                  {copiedHash === 'block_hash' ? (
                    <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="font-black text-black break-all select-all">{result.blockchain.block_hash}</div>
            </div>

            {/* Previous Block Hash */}
            <div className="bg-white p-3.5 border-2 border-black shadow-[3px_3px_0px_0px_#000]">
              <div className="flex items-center justify-between text-zinc-500 font-bold mb-1">
                <span>PREVIOUS LINK HASH</span>
                <button
                  onClick={() => copyToClipboard(result.blockchain!.prev_hash, 'prev_hash')}
                  className="p-1 bg-black text-white hover:bg-zinc-800 transition-colors"
                  title="Copy Hash"
                >
                  {copiedHash === 'prev_hash' ? (
                    <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="font-black text-zinc-600 break-all select-all">{result.blockchain.prev_hash}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
