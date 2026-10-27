import React from 'react';
import {
  Shield,
  Cpu,
  Layers,
  Database,
  Lock,
  Binary,
  Code2,
  GraduationCap,
  Terminal,
  ArrowRight,
  Server,
  Globe,
  CheckCircle2,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-10 max-w-5xl mx-auto py-4">
      {/* Hero Overview */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#facc15] border-2 border-black font-mono text-xs font-black uppercase shadow-[3px_3px_0px_0px_#ffffff]">
          <Terminal className="w-3.5 h-3.5 text-black" />
          <span className="text-black">ACADEMIC THESIS // SYSTEM ARCHITECTURE SPECIFICATION</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-mono leading-none">
          ABOUT{' '}
          <span className="bg-[#ccff00] text-black px-2 py-0.5 border-2 border-black shadow-[4px_4px_0px_0px_#ffffff] inline-block -rotate-1">
            VYRA
          </span>
        </h1>

        <div className="text-xl font-mono font-black text-zinc-200">
          Verifiable Yield Risk Assessment &amp; Real-Time Phishing Defense
        </div>

        <p className="text-black font-mono font-bold text-sm leading-relaxed max-w-4xl bg-white p-5 border-[3px] border-white shadow-[6px_6px_0px_0px_#facc15]">
          VYRA is an advanced cybersecurity engineering framework developed to counter modern evasive
          credential harvesting, zero-day phishing infrastructure, and cloud abuse. By synthesizing
          35-dimensional lexical feature extraction, explainable machine learning (TreeSHAP), and an
          append-only SHA-256 Proof-of-Work blockchain audit trail, VYRA delivers both sub-100ms real-time
          interception and tamper-evident cryptographic provenance.
        </p>
      </div>

      {/* Research Objective Card */}
      <div className="neo-card p-6 sm:p-8 bg-white border-[3px] border-white shadow-[6px_6px_0px_0px_#38bdf8] space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-black" />
          <h2 className="text-lg font-black font-mono uppercase tracking-wider text-black">
            RESEARCH OBJECTIVE &amp; THESIS
          </h2>
        </div>

        <div className="text-xs sm:text-sm font-mono font-bold text-black space-y-3 leading-relaxed">
          <p className="p-3 bg-[#f6f5f0] border-2 border-black">
            <span className="bg-black text-white px-1.5 py-0.5 mr-2">THESIS TITLE:</span>
            Explainable Artificial Intelligence and Blockchain-Integrated Framework for Real-Time Detection and Prevention of Previously Unseen Phishing Attacks.
          </p>
          <p>
            Traditional black-box machine learning models suffer from opacity, preventing security
            operators from understanding why a benign domain was flagged or why an evasive attack slipped past
            heuristics. Concurrently, centralized security logs remain vulnerable to insider mutation,
            retroactive log tampering, and evidence corruption.
          </p>
          <p>
            VYRA bridges this gap: (1) calculating exact marginal feature attributions via
            local TreeSHAP so operators inspect the underlying mathematical reasons, and (2)
            committing every inference payload, feature hash, and timestamp directly into an append-only
            cryptographic blockchain ledger.
          </p>
        </div>
      </div>

      {/* Architecture Pipeline Boxes */}
      <div className="neo-card p-6 sm:p-8 bg-white border-[3px] border-white shadow-[6px_6px_0px_0px_#ccff00] space-y-6">
        <div>
          <h2 className="text-lg font-black font-mono uppercase tracking-wider text-black flex items-center gap-2">
            <Layers className="w-5 h-5 text-black" />
            END-TO-END SYSTEM PIPELINE
          </h2>
          <p className="text-xs font-mono font-bold text-zinc-600 mt-1">
            Data lifecycle from browser navigation intercept to cryptographic ledger notarization
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Station 1 */}
          <div className="p-4 bg-[#fdfbf7] border-2 border-black shadow-[3px_3px_0px_0px_#000] space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="w-7 h-7 bg-black text-[#facc15] font-mono font-black text-xs flex items-center justify-center border border-black">
                01
              </span>
              <h3 className="font-mono text-xs font-black uppercase text-black">CLIENT INTERCEPTOR</h3>
              <p className="text-[11px] font-mono font-bold text-zinc-600">
                Manifest V3 extension hooks navigation events and forwards URLs for evaluation.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-300 font-mono text-[10px] font-black text-black">
              TECH: Chrome WebNav API
            </div>
          </div>

          {/* Station 2 */}
          <div className="p-4 bg-[#fdfbf7] border-2 border-black shadow-[3px_3px_0px_0px_#000] space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="w-7 h-7 bg-black text-[#38bdf8] font-mono font-black text-xs flex items-center justify-center border border-black">
                02
              </span>
              <h3 className="font-mono text-xs font-black uppercase text-black">FEATURE VECTORIZER</h3>
              <p className="text-[11px] font-mono font-bold text-zinc-600">
                Extracts 35 lexical, structural, host, and Shannon entropy attributes in parallel.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-300 font-mono text-[10px] font-black text-black">
              TECH: NumPy + tldextract
            </div>
          </div>

          {/* Station 3 */}
          <div className="p-4 bg-[#fdfbf7] border-2 border-black shadow-[3px_3px_0px_0px_#000] space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="w-7 h-7 bg-black text-[#ff3366] font-mono font-black text-xs flex items-center justify-center border border-black">
                03
              </span>
              <h3 className="font-mono text-xs font-black uppercase text-black">XGBOOST + TREESHAP</h3>
              <p className="text-[11px] font-mono font-bold text-zinc-600">
                Predicts threat probability with 94% live detection and computes SHAP force values.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-300 font-mono text-[10px] font-black text-black">
              TECH: XGBoost + TreeExplainer
            </div>
          </div>

          {/* Station 4 */}
          <div className="p-4 bg-[#fdfbf7] border-2 border-black shadow-[3px_3px_0px_0px_#000] space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="w-7 h-7 bg-black text-[#ccff00] font-mono font-black text-xs flex items-center justify-center border border-black">
                04
              </span>
              <h3 className="font-mono text-xs font-black uppercase text-black">BLOCKCHAIN NOTARY</h3>
              <p className="text-[11px] font-mono font-bold text-zinc-600">
                Mines Proof-of-Work block (difficulty=2) linking SHA-256 hash to permanent ledger.
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-300 font-mono text-[10px] font-black text-black">
              TECH: SHA-256 PoW Ledger
            </div>
          </div>
        </div>
      </div>

      {/* Technical Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
        <div className="neo-card p-5 bg-[#facc15] border-[3px] border-white shadow-[6px_6px_0px_0px_#ffffff] space-y-3">
          <div className="font-black text-sm uppercase text-black border-b-2 border-black pb-2">
            MODEL ARCHITECTURE
          </div>
          <ul className="space-y-1.5 font-bold text-black">
            <li>• Algorithm: XGBoost Hist Gradient Boosting</li>
            <li>• Training Dataset: 111,024 Real URLs</li>
            <li>• Sources: PhishTank + Tranco Top 1M</li>
            <li>• Live OpenPhish Detection: 94.0%</li>
            <li>• Test ROC-AUC: 0.9944</li>
          </ul>
        </div>

        <div className="neo-card p-5 bg-[#38bdf8] border-[3px] border-white shadow-[6px_6px_0px_0px_#ffffff] space-y-3">
          <div className="font-black text-sm uppercase text-black border-b-2 border-black pb-2">
            BLOCKCHAIN ENGINE
          </div>
          <ul className="space-y-1.5 font-bold text-black">
            <li>• Consensus: Proof-of-Work (PoW)</li>
            <li>• Cryptographic Hash: SHA-256</li>
            <li>• Target Difficulty: 2 Leading Zeros</li>
            <li>• Average Mining Time: &lt; 50ms</li>
            <li>• Verification: Continuous Merkle Linkage</li>
          </ul>
        </div>

        <div className="neo-card p-5 bg-[#ff3366] text-white border-[3px] border-white shadow-[6px_6px_0px_0px_#ffffff] space-y-3">
          <div className="font-black text-sm uppercase text-white border-b-2 border-white pb-2">
            THREAT INTELLIGENCE
          </div>
          <ul className="space-y-1.5 font-bold text-white">
            <li>• OpenPhish Live Feed Stream</li>
            <li>• Brand Impersonation Heuristics</li>
            <li>• Phishing Kit Signatures Analyzer</li>
            <li>• Google Safe Browsing Patterns</li>
            <li>• Subdomain Masquerading Filters</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
