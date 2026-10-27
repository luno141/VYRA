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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#facc15] text-black border-2 border-black font-mono text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_#ffffff] mb-2">
            <Terminal className="w-3 h-3 text-black" />
            <span>AUDIT TRAIL // RECORD CATALOG</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-mono text-white uppercase tracking-tight">
            Threat Inspection History
          </h1>
          <p className="text-sm font-mono font-bold text-zinc-300 mt-1">
            Historical ledger of evaluated URLs, model predictions, and notarized blockchain block indices
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="neo-btn flex items-center gap-2 px-4 py-2.5 bg-[#facc15] text-black border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] hover:bg-white text-xs font-mono font-black uppercase cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-black' : ''}`} />
          <span>REFRESH LOGS</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#141624] border-2 border-white shadow-[5px_5px_0px_0px_#facc15] flex flex-col md:flex-row gap-4 items-center justify-between">
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
            className="w-full bg-[#0c0d14] border-2 border-white px-4 py-2 text-xs font-mono font-bold text-white placeholder:text-zinc-500 focus:outline-none shadow-[2px_2px_0px_0px_#ffffff]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto font-mono text-xs font-black">
          <button
            onClick={() => {
              setVerdictFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 border-2 border-white transition-all cursor-pointer ${
              verdictFilter === 'ALL'
                ? 'bg-[#facc15] text-black shadow-[2px_2px_0px_0px_#ffffff]'
                : 'bg-[#0c0d14] text-white hover:bg-zinc-800'
            }`}
          >
            ALL ({history.length})
          </button>

          <button
            onClick={() => {
              setVerdictFilter('PHISHING');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 border-2 border-white transition-all cursor-pointer ${
              verdictFilter === 'PHISHING'
                ? 'bg-[#ff3366] text-white shadow-[2px_2px_0px_0px_#ffffff]'
                : 'bg-[#0c0d14] text-white hover:bg-zinc-800'
            }`}
          >
            ⚠️ PHISHING
          </button>

          <button
            onClick={() => {
              setVerdictFilter('LEGITIMATE');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 border-2 border-white transition-all cursor-pointer ${
              verdictFilter === 'LEGITIMATE'
                ? 'bg-[#22c55e] text-black shadow-[2px_2px_0px_0px_#ffffff]'
                : 'bg-[#0c0d14] text-white hover:bg-zinc-800'
            }`}
          >
            🛡️ LEGITIMATE
          </button>
        </div>
      </div>

      {/* History Table (Ultra High Contrast Dark Neo-Brutalist Layout) */}
      <div className="bg-[#141624] border-[3px] border-white shadow-[6px_6px_0px_0px_#facc15] overflow-hidden">
        {loading && history.length === 0 ? (
          <div className="p-12 text-center font-mono font-bold text-sm text-white">
            LOADING AUDIT LOGS...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center font-mono font-bold text-sm text-zinc-400">
            NO SCAN RECORDS MATCHING QUERY.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#facc15] border-b-2 border-white text-black font-black uppercase text-[11px] tracking-wider select-none">
                <tr>
                  <th className="py-3.5 px-4">VERDICT</th>
                  <th className="py-3.5 px-4">TARGET URL</th>
                  <th className="py-3.5 px-4">CONFIDENCE</th>
                  <th className="py-3.5 px-4">THREAT SCORE</th>
                  <th className="py-3.5 px-4">BLOCK INDEX</th>
                  <th className="py-3.5 px-4">TIMESTAMP</th>
                  <th className="py-3.5 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700 bg-[#141624]">
                {paginatedHistory.map((item) => {
                  const isPhish = item.verdict === 'PHISHING';
                  const displayConf = item.confidence <= 1 ? (item.confidence * 100).toFixed(1) : Number(item.confidence).toFixed(1);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#1d2136] transition-colors font-bold text-white"
                    >
                      {/* Verdict Badge */}
                      <td className="py-3.5 px-4 shrink-0">
                        <span
                          className={`neo-badge px-2.5 py-1 text-[11px] inline-flex items-center gap-1.5 border-2 border-black ${
                            isPhish ? 'bg-[#ff3366] text-white' : 'bg-[#22c55e] text-black'
                          }`}
                        >
                          {isPhish ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          {item.verdict}
                        </span>
                      </td>

                      {/* URL - Bright White */}
                      <td className="py-3.5 px-4 max-w-xs truncate" title={item.url}>
                        <span className="text-white font-mono font-bold">{item.url}</span>
                      </td>

                      {/* Confidence */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-white">{displayConf}%</span>
                      </td>

                      {/* Risk Score */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 border border-black font-black text-xs ${
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
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-[#facc15] text-black border border-black font-black text-[11px]">
                          #{item.blockchain?.block_index || 1}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 text-zinc-300 text-[11px]">
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
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedScan(item)}
                          className="px-3 py-1 bg-[#facc15] text-black border-2 border-white shadow-[2px_2px_0px_0px_#ffffff] hover:bg-white text-[11px] font-black uppercase cursor-pointer transition-all"
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
          <div className="p-4 bg-[#0c0d14] border-t-2 border-white flex items-center justify-between font-mono text-xs font-black text-white">
            <span className="text-zinc-300">
              PAGE {currentPage} OF {totalPages} ({filteredHistory.length} ENTRIES)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-[#141624] text-white border-2 border-white shadow-[2px_2px_0px_0px_#ffffff] hover:bg-[#facc15] hover:text-black disabled:opacity-40 cursor-pointer"
              >
                &lt; PREV
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-[#141624] text-white border-2 border-white shadow-[2px_2px_0px_0px_#ffffff] hover:bg-[#facc15] hover:text-black disabled:opacity-40 cursor-pointer"
              >
                NEXT &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="p-6 bg-[#090a0f] border-[3px] border-white shadow-[8px_8px_0px_0px_#facc15] max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-white">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#facc15] text-black font-mono text-xs font-black">
                  INSPECTION VIEW
                </span>
                <span className="font-mono text-xs font-bold text-zinc-300">
                  RECORD #{selectedScan.id}
                </span>
              </div>

              <button
                onClick={() => setSelectedScan(null)}
                className="p-1.5 bg-[#ff3366] text-white border-2 border-white shadow-[2px_2px_0px_0px_#ffffff] hover:bg-black cursor-pointer font-bold"
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
