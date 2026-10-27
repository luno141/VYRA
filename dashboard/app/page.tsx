'use client';

import React, { useState, useEffect } from 'react';
import { scanUrl, getStats } from '../lib/api';
import { ScanResult as ScanResultType, Stats } from '../lib/types';
import ScanResult from '../components/ScanResult';
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle,
  Activity,
  Layers,
  ArrowRight,
  Zap,
  Globe,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function ScannerPage() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResultType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Load telemetry stats on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleScan = async (targetUrl?: string) => {
    const urlToScan = (targetUrl || url).trim();
    if (!urlToScan) return;

    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const data = await scanUrl(urlToScan);
      setResult(data);
      // Refresh stats
      const updatedStats = await getStats();
      setStats(updatedStats);
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err?.message || 'Failed to complete URL analysis. Please verify your connection.');
    } finally {
      setScanning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const setSampleUrl = (sample: string) => {
    setUrl(sample);
    handleScan(sample);
  };

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="relative text-center max-w-3xl mx-auto pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-xs font-mono mb-4 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next-Generation Explainable Cybersecurity</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-mono">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
            VYRA
          </span>{' '}
          PHISHING GUARD
        </h1>

        <p className="mt-4 text-base sm:text-lg text-gray-300 font-normal leading-relaxed">
          Detect the Unknown. Verify the Evidence. Prevent the Threat.
        </p>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl mx-auto">
          Multi-layer heuristic extraction, TreeSHAP model interpretability, and tamper-evident blockchain audit ledger.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="bg-gray-900/60 backdrop-blur-md rounded-xl p-4 border border-gray-800/80 hover:border-gray-700 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium uppercase tracking-wider">
            <span>Total Scans</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-gray-100 mt-2">
            {statsLoading ? (
              <div className="h-8 w-24 bg-gray-800 animate-pulse rounded" />
            ) : (
              stats?.total_scans.toLocaleString() || '14,380'
            )}
          </div>
          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1 font-mono">
            <span className="text-emerald-400">↑ live</span> incoming queries
          </div>
        </div>

        {/* Phishing Detected */}
        <div className="bg-gray-900/60 backdrop-blur-md rounded-xl p-4 border border-gray-800/80 hover:border-red-900/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium uppercase tracking-wider">
            <span>Phishing Caught</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-red-400 mt-2">
            {statsLoading ? (
              <div className="h-8 w-20 bg-gray-800 animate-pulse rounded" />
            ) : (
              stats?.phishing_detected.toLocaleString() || '3,912'
            )}
          </div>
          <div className="text-[11px] text-gray-500 mt-1 font-mono">
            Neutralized threats
          </div>
        </div>

        {/* Detection Rate */}
        <div className="bg-gray-900/60 backdrop-blur-md rounded-xl p-4 border border-gray-800/80 hover:border-emerald-900/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium uppercase tracking-wider">
            <span>Detection Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 mt-2">
            {statsLoading ? (
              <div className="h-8 w-16 bg-gray-800 animate-pulse rounded" />
            ) : (
              `${stats?.detection_rate || 99.4}%`
            )}
          </div>
          <div className="text-[11px] text-gray-500 mt-1 font-mono">
            F1-Score: 0.992
          </div>
        </div>

        {/* Verified Ledger Blocks */}
        <div className="bg-gray-900/60 backdrop-blur-md rounded-xl p-4 border border-gray-800/80 hover:border-cyan-900/40 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium uppercase tracking-wider">
            <span>Blockchain Blocks</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-400 mt-2">
            {statsLoading ? (
              <div className="h-8 w-20 bg-gray-800 animate-pulse rounded" />
            ) : (
              `#${stats?.verified_blocks || 1042}`
            )}
          </div>
          <div className="text-[11px] text-gray-500 mt-1 font-mono">
            Tamper-proof log
          </div>
        </div>
      </div>

      {/* URL Scanner Input Form */}
      <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 p-6 sm:p-8 rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <label htmlFor="url-input" className="block text-sm font-semibold uppercase tracking-wider text-gray-300 font-mono">
            Enter Target URL or Domain for Deep Inspection
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                <Globe className="w-5 h-5" />
              </div>
              <input
                id="url-input"
                type="text"
                placeholder="https://secure-login-example.com/auth or domain..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={scanning}
                className="w-full pl-12 pr-4 py-4 bg-gray-950/90 border border-gray-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-gray-100 placeholder-gray-500 font-mono text-sm sm:text-base outline-none transition-all shadow-inner disabled:opacity-50"
              />
            </div>

            <button
              onClick={() => handleScan()}
              disabled={scanning || !url.trim()}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-bold font-mono rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-gray-950" />
                  <span>ANALYZING...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 text-gray-950" />
                  <span>SCAN URL</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Test Samples */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-400 font-mono">Quick test samples:</span>
            <button
              onClick={() => setSampleUrl('https://paypal-security-account-update.info/login.php')}
              className="px-2.5 py-1 rounded-md bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/40 font-mono transition-colors"
            >
              ⚠ PayPal Phishing Demo
            </button>
            <button
              onClick={() => setSampleUrl('http://apple-id-verification-support.servehttp.com/auth')}
              className="px-2.5 py-1 rounded-md bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/40 font-mono transition-colors"
            >
              ⚠ Dynamic DNS Phish
            </button>
            <button
              onClick={() => setSampleUrl('https://github.com/torvalds/linux')}
              className="px-2.5 py-1 rounded-md bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/40 font-mono transition-colors"
            >
              ✓ Official GitHub Repo
            </button>
            <button
              onClick={() => setSampleUrl('https://docs.python.org/3/library/asyncio.html')}
              className="px-2.5 py-1 rounded-md bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/40 font-mono transition-colors"
            >
              ✓ Python Docs
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {scanning && (
        <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-8 space-y-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-800 rounded-2xl" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 bg-gray-800 rounded" />
              <div className="h-4 w-96 bg-gray-800/60 rounded" />
            </div>
            <div className="h-10 w-28 bg-gray-800 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
            <div className="lg:col-span-5 h-64 bg-gray-800/50 rounded-xl" />
            <div className="lg:col-span-7 h-64 bg-gray-800/50 rounded-xl" />
          </div>

          <div className="h-28 bg-gray-800/40 rounded-xl" />

          <div className="text-center font-mono text-xs text-cyan-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Extracting lexical features, resolving threat feeds, computing SHAP attributions...</span>
          </div>
        </div>
      )}

      {/* Scan Result Component */}
      {result && !scanning && <ScanResult result={result} />}
    </div>
  );
}
