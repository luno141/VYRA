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
  Sparkles,
  ArrowRight,
  Server,
  Globe,
  CheckCircle,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-12 max-w-5xl mx-auto py-4">
      {/* Hero Overview */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Academic & Research Project Documentation</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-mono">
          ABOUT{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
            VYRA
          </span>
        </h1>

        <div className="text-lg text-gray-300 font-medium">
          Verifiable Yield Risk Assessment & Real-Time Phishing Defense
        </div>

        <p className="text-gray-400 text-sm leading-relaxed max-w-4xl">
          VYRA is an advanced cybersecurity research framework developed to confront modern evasive
          credential phishing, homograph attacks, and zero-day malicious domains. By fusing
          high-dimensional feature extraction with explainable artificial intelligence (TreeSHAP) and
          tamper-evident blockchain auditing, VYRA not only detects attacks in real time but also produces
          court-admissible, cryptographically immutable evidence trails.
        </p>
      </div>

      {/* Research Objective Card */}
      <div className="bg-gray-900/60 rounded-2xl border border-gray-800 p-6 sm:p-8 backdrop-blur-md space-y-4">
        <h2 className="text-lg font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Research Objective & Thesis
        </h2>
        <div className="text-sm text-gray-300 space-y-3 leading-relaxed">
          <p>
            <strong className="text-gray-100">Academic Title:</strong> Explainable Machine Learning
            with Cryptographic Ledger Immutability for Real-Time Zero-Hour Phishing Threat Neutralization.
          </p>
          <p>
            Traditional black-box machine learning models suffer from opacity, preventing security
            analysts from understanding why a benign domain was flagged or why an evasive attack bypassed
            rules. Simultaneously, centralized security logs remain vulnerable to internal tampering,
            retroactive log deletion, and evidence corruption.
          </p>
          <p>
            VYRA solves both challenges: (1) calculating exact marginal feature attributions via
            local SHAP force algorithms so operators inspect the underlying mathematical reasons, and (2)
            committing every inference payload, feature hash, and timestamp directly into an append-only
            cryptographic blockchain ledger.
          </p>
        </div>
      </div>

      {/* HTML / CSS Interactive Architecture Diagram */}
      <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div>
          <h2 className="text-lg font-bold font-mono text-gray-100 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            System Architecture Pipeline
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            End-to-end data lifecycle from browser interception to cryptographic ledger commitment
          </p>
        </div>

        {/* CSS Diagram Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative pt-2">
          {/* Step 1 */}
          <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 flex flex-col justify-between relative group hover:border-cyan-500/50 transition-all">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
                01
              </div>
              <h3 className="font-mono text-sm font-bold text-gray-200">Browser Guard / Client</h3>
              <p className="text-xs text-gray-400">
                Chrome/Firefox MV3 extension intercepts navigation requests and transmits URL payloads.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-800/60 font-mono text-[10px] text-cyan-400 flex items-center gap-1">
              <span>WebNavigation API</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 flex flex-col justify-between relative group hover:border-cyan-500/50 transition-all">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/50 flex items-center justify-center text-blue-400 font-mono font-bold text-xs">
                02
              </div>
              <h3 className="font-mono text-sm font-bold text-gray-200">Feature Extraction</h3>
              <p className="text-xs text-gray-400">
                Calculates Shannon entropy, domain age, SSL validity, DNS resolution, and OTX threat feeds.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-800/60 font-mono text-[10px] text-blue-400 flex items-center gap-1">
              <span>32+ Extracted Vectors</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 flex flex-col justify-between relative group hover:border-cyan-500/50 transition-all">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400 font-mono font-bold text-xs">
                03
              </div>
              <h3 className="font-mono text-sm font-bold text-gray-200">ML & TreeSHAP</h3>
              <p className="text-xs text-gray-400">
                Ensemble gradient boosting predicts risk score; TreeSHAP yields local feature attributions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-800/60 font-mono text-[10px] text-purple-400 flex items-center gap-1">
              <span>F1: 0.992 | Shapley Math</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 flex flex-col justify-between relative group hover:border-cyan-500/50 transition-all">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
                04
              </div>
              <h3 className="font-mono text-sm font-bold text-gray-200">Blockchain Ledger</h3>
              <p className="text-xs text-gray-400">
                Cryptographic block is mined with SHA-256 hash linkage, ensuring non-repudiation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-800/60 font-mono text-[10px] text-emerald-400 flex items-center gap-1">
              <span>Tamper-Evident SHA-256</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-mono text-gray-100 uppercase tracking-wider flex items-center gap-2">
          <Code2 className="w-5 h-5 text-cyan-400" />
          Technical Stack
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Frontend */}
          <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800 space-y-3">
            <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Frontend & Presentation
            </div>
            <ul className="space-y-2 text-xs text-gray-300 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Next.js 14 (App Router)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>React 19 & TypeScript</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tailwind CSS v4 Engine</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Custom CSS/SVG Visualizations</span>
              </li>
            </ul>
          </div>

          {/* Machine Learning & AI */}
          <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800 space-y-3">
            <div className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
              Machine Learning & XAI
            </div>
            <ul className="space-y-2 text-xs text-gray-300 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>LightGBM & XGBoost Classifier</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>TreeSHAP Local Attribution</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Scikit-Learn & NumPy</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Lexical & Heuristic Feature Extractors</span>
              </li>
            </ul>
          </div>

          {/* Backend & Blockchain */}
          <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800 space-y-3">
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Backend & Cryptography
            </div>
            <ul className="space-y-2 text-xs text-gray-300 font-mono">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>FastAPI Async Python Framework</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>SHA-256 Merkle Block Ledger</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cryptographic Chain Verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>AlienVault OTX & Threat Intelligence</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Academic & University Affiliation Placeholders */}
      <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-6 space-y-4">
        <h2 className="text-base font-bold font-mono text-gray-200 uppercase tracking-wider flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-cyan-400" />
          Academic Information & Institutional Context
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-gray-950 p-3.5 rounded-lg border border-gray-800">
            <div className="text-gray-500 uppercase">Degree Program</div>
            <div className="text-gray-200 font-bold mt-1">B.Tech Computer Science</div>
            <div className="text-cyan-400 text-[10px] mt-0.5">Semester V Capstone</div>
          </div>

          <div className="bg-gray-950 p-3.5 rounded-lg border border-gray-800">
            <div className="text-gray-500 uppercase">Specialization</div>
            <div className="text-gray-200 font-bold mt-1">Cybersecurity & AI Systems</div>
            <div className="text-cyan-400 text-[10px] mt-0.5">Applied ML Track</div>
          </div>

          <div className="bg-gray-950 p-3.5 rounded-lg border border-gray-800">
            <div className="text-gray-500 uppercase">Supervision</div>
            <div className="text-gray-200 font-bold mt-1">Faculty of Cyber Defense</div>
            <div className="text-cyan-400 text-[10px] mt-0.5">Research Advisory Board</div>
          </div>

          <div className="bg-gray-950 p-3.5 rounded-lg border border-gray-800">
            <div className="text-gray-500 uppercase">Artifact Version</div>
            <div className="text-gray-200 font-bold mt-1">Release v1.0.0-PROD</div>
            <div className="text-emerald-400 text-[10px] mt-0.5">Validated Architecture</div>
          </div>
        </div>
      </div>
    </div>
  );
}
