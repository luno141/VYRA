'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getHistory } from '../../lib/api';
import { ScanResult as ScanResultType } from '../../lib/types';
import ScanResult from '../../components/ScanResult';
import {
  History,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Eye,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Terminal,
} from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState<ScanResultType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<'ALL' | 'PHISHING' | 'LEGITIMATE'>('ALL');
  const [selectedScan, setSelectedScan] = useState<ScanResultType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getHistory(50, 0);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filter and search history
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch = item.url.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVerdict =
        verdictFilter === 'ALL' ? true : item.verdict === verdictFilter;
      return matchesSearch && matchesVerdict;
    });
  }, [history, searchTerm, verdictFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, currentPage, pageSize]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#facc15] border-2 border-black font-mono text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_#000] mb-2">
            <Terminal className="w-3 h-3 text-black" />
            <span>AUDIT TRAIL // RECORD CATALOG</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-mono text-black uppercase tracking-tight">
            Threat Inspection History
          </h1>
          <p className="text-xs font-mono font-bold text-zinc-600 mt-1">
            Historical ledger of evaluated URLs, model predictions, and notarized blockchain block indices
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="neo-btn flex items-center gap-2 px-4 py-2.5 bg-black text-white text-xs font-mono font-black uppercase cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#facc15]' : ''}`} />
          <span>REFRESH LOGS</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="neo-card p-4 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="FILTER BY URL OR DOMAIN..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#fdfbf7] border-2 border-black px-4 py-2 text-xs font-mono font-bold text-black placeholder:text-zinc-400 focus:outline-none shadow-[2px_2px_0px_0px_#000]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto font-mono text-xs font-black">
          <button
            onClick={() => {
              setVerdictFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 border-2 border-black transition-all ${
              verdictFilter === 'ALL'
                ? 'bg-black text-white shadow-[2px_2px_0px_0px_#facc15]'
                : 'bg-white text-black hover:bg-zinc-100'
            }`}
          >
            ALL ({history.length})
          </button>

          <button
            onClick={() => {
              setVerdictFilter('PHISHING');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 border-2 border-black transition-all ${
              verdictFilter === 'PHISHING'
                ? 'bg-[#ff3366] text-white shadow-[2px_2px_0px_0px_#000]'
                : 'bg-white text-black hover:bg-zinc-100'
            }`}
          >
            ⚠️ PHISHING
          </button>

          <button
            onClick={() => {
              setVerdictFilter('LEGITIMATE');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 border-2 border-black transition-all ${
              verdictFilter === 'LEGITIMATE'
                ? 'bg-[#22c55e] text-black shadow-[2px_2px_0px_0px_#000]'
                : 'bg-white text-black hover:bg-zinc-100'
            }`}
          >
            🛡️ LEGITIMATE
          </button>
        </div>
      </div>

      {/* History Table (Neo-Brutalist Layout) */}
      <div className="neo-card bg-white overflow-hidden">
        {loading && history.length === 0 ? (
          <div className="p-12 text-center font-mono font-bold text-sm text-black">
            LOADING AUDIT LOGS...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center font-mono font-bold text-sm text-zinc-500">
            NO SCAN RECORDS MATCHING QUERY.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#facc15] border-b-2 border-black text-black font-black uppercase text-[11px] tracking-wider select-none">
                <tr>
                  <th className="py-3 px-4">VERDICT</th>
                  <th className="py-3 px-4">TARGET URL</th>
                  <th className="py-3 px-4">CONFIDENCE</th>
                  <th className="py-3 px-4">THREAT SCORE</th>
                  <th className="py-3 px-4">BLOCK INDEX</th>
                  <th className="py-3 px-4">TIMESTAMP</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                {paginatedHistory.map((item) => {
                  const isPhish = item.verdict === 'PHISHING';
                  const displayConf = item.confidence <= 1 ? (item.confidence * 100).toFixed(1) : Number(item.confidence).toFixed(1);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#fef9c3] transition-colors font-bold text-black"
                    >
                      {/* Verdict Badge */}
                      <td className="py-3 px-4 shrink-0">
                        <span
                          className={`neo-badge px-2.5 py-1 text-[11px] inline-flex items-center gap-1.5 ${
                            isPhish ? 'bg-[#ff3366] text-white' : 'bg-[#22c55e] text-black'
                          }`}
                        >
                          {isPhish ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          {item.verdict}
                        </span>
                      </td>

                      {/* URL */}
                      <td className="py-3 px-4 max-w-xs truncate" title={item.url}>
                        <span className="text-black font-mono font-bold">{item.url}</span>
                      </td>

                      {/* Confidence */}
                      <td className="py-3 px-4">
                        <span className="font-black">{displayConf}%</span>
                      </td>

                      {/* Risk Score */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 border border-black font-black ${
                            item.risk_score >= 70
                              ? 'bg-[#ff3366] text-white'
                              : item.risk_score >= 35
                              ? 'bg-[#facc15] text-black'
                              : 'bg-[#22c55e] text-black'
                          }`}
                        >
                          {item.risk_score}/100
                        </span>
                      </td>

                      {/* Blockchain Block */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-black text-[#facc15] border border-black font-black text-[11px]">
                          #{item.blockchain?.block_index || 1}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3 px-4 text-zinc-600 text-[11px]">
                        {new Date(item.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedScan(item)}
                          className="neo-btn px-3 py-1 bg-white text-black hover:bg-[#facc15] text-[11px] font-black uppercase cursor-pointer"
                        >
                          INSPECT
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-[#fdfbf7] border-t-2 border-black flex items-center justify-between font-mono text-xs font-black">
            <span className="text-zinc-600">
              PAGE {currentPage} OF {totalPages} ({filteredHistory.length} ENTRIES)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="neo-btn px-3 py-1 bg-white text-black disabled:opacity-40 cursor-pointer"
              >
                &lt; PREV
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="neo-btn px-3 py-1 bg-white text-black disabled:opacity-40 cursor-pointer"
              >
                NEXT &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="neo-card bg-[#f6f5f0] max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-black text-white font-mono text-xs font-black">
                  INSPECTION VIEW
                </span>
                <span className="font-mono text-xs font-bold text-zinc-600">
                  RECORD #{selectedScan.id}
                </span>
              </div>

              <button
                onClick={() => setSelectedScan(null)}
                className="neo-btn p-1 bg-[#ff3366] text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ScanResult result={selectedScan} />
          </div>
        </div>
      )}
    </div>
  );
}
