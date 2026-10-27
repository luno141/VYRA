'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  FileCode,
  Binary,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Share2,
} from 'lucide-react';

interface ScanResultProps {
  result: ScanResultType;
}

export default function ScanResult({ result }: ScanResultProps) {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [showFeatures, setShowFeatures] = useState(false);
  const [featureSearch, setFeatureSearch] = useState('');

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
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const copyJsonReport = () => {
    copyToClipboard(JSON.stringify(result, null, 2), 'json_report');
  };

  // Extract all 35 features if present
  const featuresList = Object.entries(result.extracted_features || {}).filter(([key]) =>
    key.toLowerCase().includes(featureSearch.toLowerCase())
  );

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Top Verdict Banner (Ultra-High Contrast Dark Neo-Brutalist Layout) */}
      <div
        className={`relative overflow-hidden p-6 sm:p-8 border-[3px] border-white shadow-[8px_8px_0px_0px_#ffffff] bg-[#12141e] text-white`}
      >
        {/* Top Hazard Accent Bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-3 border-b-2 border-white ${
            isPhishing ? 'neo-hazard-red' : 'neo-hazard-green'
          }`}
        />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-3">
          {/* Verdict Info */}
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 border-2 border-white flex items-center justify-center shrink-0 shadow-[4px_4px_0px_0px_#ffffff] ${
                isPhishing ? 'bg-[#ff3366]' : 'bg-[#22c55e]'
              }`}
            >
              {isPhishing ? (
                <ShieldAlert className="w-10 h-10 text-white" />
              ) : (
                <ShieldCheck className="w-10 h-10 text-black" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-3 py-1 font-mono text-xs font-black uppercase tracking-wider border-2 border-white shadow-[2px_2px_0px_0px_#ffffff] ${
                    isPhishing ? 'bg-[#ff3366] text-white' : 'bg-[#22c55e] text-black'
                  }`}
                >
                  {isPhishing ? '⚠️ MALICIOUS THREAT DETECTED' : '🛡️ VERIFIED LEGITIMATE'}
                </span>

                <span className="px-2.5 py-1 bg-[#1a1d2e] text-white text-xs font-mono font-bold border-2 border-white shadow-[2px_2px_0px_0px_#ffffff] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#facc15]" />
                  {new Date(result.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>

                {result.processing_time_ms && (
                  <span className="px-2.5 py-1 bg-[#facc15] text-black text-xs font-mono font-black border-2 border-white shadow-[2px_2px_0px_0px_#ffffff]">
                    {result.processing_time_ms} MS INFERENCE
                  </span>
                )}
              </div>

              {/* Bold High Contrast Heading */}
              <h2 className="text-3xl sm:text-5xl font-black font-mono tracking-tight leading-none uppercase">
                {isPhishing ? (
                  <span className="text-[#ff3366] drop-shadow-[2px_2px_0px_#000]">
                    DECEPTIVE PHISHING DESTINATION
                  </span>
                ) : (
                  <span className="text-[#22c55e] drop-shadow-[2px_2px_0px_#000]">
                    LEGITIMATE VERIFIED DESTINATION
                  </span>
                )}
              </h2>

              {/* Scanned URL display box */}
              <div className="mt-3 flex items-center gap-2 max-w-2xl bg-[#1a1d2e] text-white px-4 py-2.5 border-2 border-white text-xs font-mono font-bold shadow-[4px_4px_0px_0px_#facc15]">
                <span className="text-[#facc15] shrink-0 select-none font-black">TARGET &gt;</span>
                <span className="truncate select-all text-white font-mono">{result.url}</span>
                <button
                  onClick={() => copyToClipboard(result.url, 'url')}
                  className="p-1 bg-[#facc15] text-black hover:bg-white transition-colors ml-auto shrink-0 cursor-pointer border border-white"
                  title="Copy URL"
                >
                  {copiedLabel === 'url' ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-[#1a1d2e] text-white p-3.5 border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] text-center min-w-[120px]">
              <div className="text-[10px] uppercase font-mono font-black text-[#facc15]">CONFIDENCE</div>
              <div className="text-3xl font-black font-mono text-white mt-0.5">{displayConfidence}%</div>
            </div>

            <div
              className={`p-3.5 border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] text-center min-w-[120px] ${
                isPhishing ? 'bg-[#ff3366] text-white' : 'bg-[#22c55e] text-black'
              }`}
            >
              <div className="text-[10px] uppercase font-mono font-black opacity-90">THREAT SCORE</div>
              <div className="text-3xl font-black font-mono mt-0.5">{result.risk_score}/100</div>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="mt-6 pt-4 border-t-2 border-white flex flex-wrap items-center justify-between gap-3 text-xs font-mono font-black">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={copyJsonReport}
              className="px-3.5 py-2 bg-[#facc15] text-black border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] hover:bg-white flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]"
            >
              {copiedLabel === 'json_report' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>REPORT COPIED!</span>
                </>
              ) : (
                <>
                  <FileCode className="w-3.5 h-3.5 text-black" />
                  <span>EXPORT AUDIT JSON</span>
                </>
              )}
            </button>

            {result.blockchain && (
              <Link
                href="/blockchain"
                className="px-3.5 py-2 bg-[#c084fc] text-black border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] hover:bg-white flex items-center gap-1.5 transition-all active:translate-x-[1px] active:translate-y-[1px]"
              >
                <Layers className="w-3.5 h-3.5 text-black" />
                <span>INSPECT BLOCK #{result.blockchain.block_index}</span>
              </Link>
            )}
          </div>

          {Object.keys(result.extracted_features || {}).length > 0 && (
            <button
              onClick={() => setShowFeatures(!showFeatures)}
              className="px-3.5 py-2 bg-[#38bdf8] text-black border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] hover:bg-white flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-[1px] active:translate-y-[1px]"
            >
              <Binary className="w-3.5 h-3.5 text-black" />
              <span>{showFeatures ? 'HIDE 35-D FEATURE VECTOR' : 'VIEW 35-D FEATURE VECTOR'}</span>
              {showFeatures ? <ChevronUp className="w-3.5 h-3.5 text-black" /> : <ChevronDown className="w-3.5 h-3.5 text-black" />}
            </button>
          )}
        </div>
      </div>

      {/* 35-Dimensional Extracted Features Drawer */}
      {showFeatures && Object.keys(result.extracted_features || {}).length > 0 && (
        <div className="p-6 bg-[#12141e] border-[3px] border-white shadow-[6px_6px_0px_0px_#facc15] space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-white gap-2">
            <div>
              <h3 className="text-sm font-black font-mono uppercase tracking-wider text-white flex items-center gap-2">
                <Binary className="w-4 h-4 text-[#facc15]" />
                <span>35-DIMENSIONAL LEXICAL &amp; STRUCTURAL FEATURE VECTORS</span>
              </h3>
              <p className="text-xs font-mono font-bold text-zinc-300 mt-1">
                Mathematical attributes extracted in real-time without fetching remote web payloads
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="FILTER VECTORS..."
                value={featureSearch}
                onChange={(e) => setFeatureSearch(e.target.value)}
                className="w-full bg-[#1a1d2e] border-2 border-white px-3 py-1.5 text-xs font-mono font-bold text-white placeholder:text-zinc-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 font-mono text-xs max-h-96 overflow-y-auto p-1">
            {featuresList.map(([key, val]) => (
              <div
                key={key}
                className="p-3 bg-[#1a1d2e] border-2 border-white shadow-[2px_2px_0px_0px_#ffffff] flex flex-col justify-between"
              >
                <div className="text-[10px] font-black uppercase text-zinc-300 truncate" title={key}>
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="text-sm font-black text-[#facc15] mt-1 select-all">
                  {typeof val === 'number' ? Number(val.toFixed(4)) : String(val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Risk Meter + Threat Intelligence & SHAP Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Risk Meter and Threat Intelligence Card */}
        <div className="lg:col-span-5 space-y-8">
          {/* Visual Risk Meter */}
          <RiskMeter score={result.risk_score} verdict={result.verdict} />

          {/* Threat Intelligence Card (Ultra High Contrast Dark Container) */}
          <div className="p-6 bg-[#12141e] border-[3px] border-white shadow-[6px_6px_0px_0px_#38bdf8] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-white">
              <h3 className="text-sm font-black font-mono uppercase tracking-wider text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#38bdf8]" />
                <span>THREAT INTELLIGENCE GRID</span>
              </h3>
              <span className="px-2 py-0.5 bg-[#facc15] text-black font-mono text-[10px] font-black border border-white">
                {result.threat_intel?.source || 'MULTI-FEED REPUTATION'}
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* Host & IP */}
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#38bdf8]" />
                  RESOLVED IP
                </span>
                <span className="font-black text-white">
                  {result.threat_intel?.ip_address || '127.0.0.1'}{' '}
                  {result.threat_intel?.country ? `[${result.threat_intel.country}]` : ''}
                </span>
              </div>

              {/* Domain Age */}
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#38bdf8]" />
                  DOMAIN REGISTRATION
                </span>
                <span className="font-black text-white">
                  {result.threat_intel?.domain_age_days !== undefined && result.threat_intel?.domain_age_days !== null
                    ? `${result.threat_intel.domain_age_days} DAYS`
                    : 'NEW / UNKNOWN'}
                </span>
              </div>

              {/* SSL Certificate */}
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#38bdf8]" />
                  CRYPTOGRAPHIC TLS
                </span>
                <span
                  className={`font-black px-2 py-0.5 border border-white ${
                    result.threat_intel?.ssl_valid
                      ? 'bg-[#22c55e] text-black'
                      : 'bg-[#ff3366] text-white'
                  }`}
                >
                  {result.threat_intel?.ssl_valid ? 'VALID TLS // SSL' : 'INSECURE / RAW HTTP'}
                </span>
              </div>

              {/* Multi-Feed Breakdown */}
              {result.threat_intel?.threat_feeds_result && (
                <div className="pt-2 border-t border-zinc-700 space-y-2">
                  <span className="text-[10px] font-black uppercase text-zinc-300 block">
                    INDEPENDENT FEED AUDIT:
                  </span>
                  {Object.entries(result.threat_intel.threat_feeds_result).map(([feedKey, feedData]: [string, any]) => (
                    <div
                      key={feedKey}
                      className="p-2.5 bg-[#1a1d2e] border-2 border-white space-y-1 shadow-[2px_2px_0px_0px_#ffffff]"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-black uppercase text-white">
                          {feedKey.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`px-2 py-0.5 border border-white font-black text-[10px] ${
                            feedData.detected ? 'bg-[#ff3366] text-white' : 'bg-[#22c55e] text-black'
                          }`}
                        >
                          {feedData.detected ? 'MALICIOUS' : 'CLEAN'}
                        </span>
                      </div>
                      {feedData.details && (
                        <p className="text-[10px] text-zinc-300 font-bold truncate" title={feedData.details}>
                          {feedData.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Threat Signatures */}
              {result.threat_intel?.threat_types && result.threat_intel.threat_types.length > 0 && (
                <div className="pt-2">
                  <span className="text-zinc-300 block mb-2 font-bold">MATCHED ADVERSARIAL PATTERNS:</span>
                  <div className="flex flex-wrap gap-2">
                    {result.threat_intel.threat_types.map((type, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-[#ff4365] text-white text-[11px] font-black border border-white"
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
        <div className="p-6 bg-[#12141e] border-[3px] border-white shadow-[6px_6px_0px_0px_#c084fc] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-white gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#c084fc] border-2 border-white flex items-center justify-center shadow-[3px_3px_0px_0px_#ffffff]">
                <Layers className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-base font-black font-mono uppercase tracking-wider text-white flex items-center gap-2">
                  <span>IMMUTABLE BLOCKCHAIN AUDIT RECEIPT</span>
                  <span className="px-2 py-0.5 bg-[#22c55e] text-black text-[10px] font-black border border-white">
                    NOTARIZED
                  </span>
                </h3>
                <p className="text-xs font-mono text-zinc-300 font-bold mt-0.5">
                  Cryptographically chained Proof-of-Work block anchored to VYRA ledger
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs font-bold text-zinc-300 uppercase">BLOCK INDEX:</span>
              <span className="px-3 py-1 bg-[#facc15] text-black font-black text-sm border-2 border-white shadow-[2px_2px_0px_0px_#ffffff]">
                #{result.blockchain.block_index}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Block Hash */}
            <div className="bg-[#1a1d2e] p-3.5 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff]">
              <div className="flex items-center justify-between text-zinc-300 font-bold mb-1">
                <span>SHA-256 BLOCK HASH</span>
                <button
                  onClick={() => copyToClipboard(result.blockchain!.block_hash, 'block_hash')}
                  className="p-1 bg-[#facc15] text-black hover:bg-white transition-colors cursor-pointer border border-white"
                  title="Copy Hash"
                >
                  {copiedLabel === 'block_hash' ? (
                    <Check className="w-3.5 h-3.5 text-black" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="font-black text-white break-all select-all">{result.blockchain.block_hash}</div>
            </div>

            {/* Previous Block Hash */}
            <div className="bg-[#1a1d2e] p-3.5 border-2 border-white shadow-[3px_3px_0px_0px_#ffffff]">
              <div className="flex items-center justify-between text-zinc-300 font-bold mb-1">
                <span>PREVIOUS LINK HASH</span>
                <button
                  onClick={() => copyToClipboard(result.blockchain!.prev_hash, 'prev_hash')}
                  className="p-1 bg-[#facc15] text-black hover:bg-white transition-colors cursor-pointer border border-white"
                  title="Copy Hash"
                >
                  {copiedLabel === 'prev_hash' ? (
                    <Check className="w-3.5 h-3.5 text-black" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="font-bold text-zinc-300 break-all select-all">{result.blockchain.prev_hash}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
