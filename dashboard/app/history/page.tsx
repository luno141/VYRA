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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-gray-100 flex items-center gap-3">
            <History className="w-7 h-7 text-cyan-400" />
            Threat Inspection History
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Historical catalog of evaluated URLs, model inferences, and blockchain records
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-lg text-xs font-mono transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-gray-900/70 p-4 rounded-xl border border-gray-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by URL or domain..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-xs font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Verdict filter tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs">
          <button
            onClick={() => {
              setVerdictFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              verdictFilter === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            All ({history.length})
          </button>
          <button
            onClick={() => {
              setVerdictFilter('PHISHING');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
              verdictFilter === 'PHISHING'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-gray-400 hover:text-red-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Phishing ({history.filter((h) => h.verdict === 'PHISHING').length})
          </button>
          <button
            onClick={() => {
              setVerdictFilter('LEGITIMATE');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
              verdictFilter === 'LEGITIMATE'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-gray-400 hover:text-emerald-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Legitimate ({history.filter((h) => h.verdict === 'LEGITIMATE').length})
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-gray-900/60 rounded-xl border border-gray-800 overflow-hidden shadow-lg backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-950/80 border-b border-gray-800 font-mono uppercase text-gray-400 text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Scanned URL</th>
                <th className="py-3.5 px-4">Verdict</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Risk Score</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-mono">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400 mb-2" />
                    Loading threat history...
                  </td>
                </tr>
              ) : paginatedHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-mono">
                    No scan records found matching query criteria.
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((item) => {
                  const isPhishing = item.verdict === 'PHISHING';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedScan(item)}
                      className={`cursor-pointer transition-colors group ${
                        isPhishing
                          ? 'hover:bg-red-950/20 border-l-2 border-l-transparent hover:border-l-red-500'
                          : 'hover:bg-emerald-950/20 border-l-2 border-l-transparent hover:border-l-emerald-500'
                      }`}
                    >
                      {/* URL */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                        <div className="flex items-center gap-2">
                          {isPhishing ? (
                            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          <span className="font-mono text-gray-200 truncate group-hover:text-cyan-300 transition-colors">
                            {item.url}
                          </span>
                        </div>
                      </td>

                      {/* Verdict */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px] uppercase border ${
                            isPhishing
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {item.verdict}
                        </span>
                      </td>

                      {/* Confidence */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-gray-300">
                        {item.confidence}%
                      </td>

                      {/* Risk Score */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold ${
                              item.risk_score >= 70
                                ? 'text-red-400'
                                : item.risk_score >= 35
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {item.risk_score}
                          </span>
                          <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${item.risk_score}%`,
                                backgroundColor:
                                  item.risk_score >= 70
                                    ? '#ef4444'
                                    : item.risk_score >= 35
                                    ? '#f59e0b'
                                    : '#22c55e',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-400 font-mono text-[11px]">
                        {new Date(item.timestamp).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedScan(item);
                          }}
                          className="px-2.5 py-1 rounded bg-gray-800 hover:bg-cyan-950 hover:text-cyan-400 text-gray-300 border border-gray-700 hover:border-cyan-800 transition-colors font-mono text-[11px] inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-gray-950/80 px-4 py-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400 font-mono">
          <div>
            Showing <span className="text-gray-200">{filteredHistory.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="text-gray-200">
              {Math.min(currentPage * pageSize, filteredHistory.length)}
            </span>{' '}
            of <span className="text-gray-200">{filteredHistory.length}</span> results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-950 border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  SCAN AUDIT LOG #{selectedScan.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedScan(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded Scan Result in Modal */}
            <ScanResult result={selectedScan} />
          </div>
        </div>
      )}
    </div>
  );
}
