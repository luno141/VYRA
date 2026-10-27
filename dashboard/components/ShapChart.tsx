'use client';

import React from 'react';
import { ShapFeature } from '../lib/types';

interface ShapChartProps {
  features: ShapFeature[];
  title?: string;
  maxFeatures?: number;
}

export default function ShapChart({
  features,
  title = 'SHAP Model Explainability (Feature Impact Analysis)',
  maxFeatures = 8,
}: ShapChartProps) {
  if (!features || features.length === 0) {
    return (
      <div className="p-6 bg-gray-900/60 rounded-xl border border-gray-800 text-center text-gray-400 text-sm">
        No SHAP feature attribution data available for this scan.
      </div>
    );
  }

  // Sort by absolute contribution descending and take top N
  const displayFeatures = [...features]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, maxFeatures);

  // Find maximum absolute contribution to scale bars
  const maxAbs = Math.max(...displayFeatures.map((f) => Math.abs(f.contribution)), 0.01);

  return (
    <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-5 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            {title}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Local SHAP attributions explaining model decision pathways
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500 shadow-sm shadow-blue-500/50" />
            <span className="text-gray-300">Pushes Legitimate (Negative)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500 shadow-sm shadow-red-500/50" />
            <span className="text-gray-300">Pushes Phishing (Positive)</span>
          </div>
        </div>
      </div>

      {/* Axis header */}
      <div className="hidden sm:grid grid-cols-12 gap-2 text-[11px] font-mono text-gray-400 pt-3 pb-1 border-b border-gray-800/60">
        <div className="col-span-4">FEATURE & DETECTED VALUE</div>
        <div className="col-span-6 text-center">
          <div className="flex justify-between px-2">
            <span className="text-blue-400">← Toward Legitimate</span>
            <span className="text-gray-400">0.0 (Base)</span>
            <span className="text-red-400">Toward Phishing →</span>
          </div>
        </div>
        <div className="col-span-2 text-right">IMPACT (SHAP)</div>
      </div>

      {/* Feature List */}
      <div className="divide-y divide-gray-800/60 mt-1">
        {displayFeatures.map((f, idx) => {
          const isPhishingIndicator = f.contribution > 0;
          const percentage = Math.min(100, Math.round((Math.abs(f.contribution) / maxAbs) * 100));

          return (
            <div
              key={`${f.feature}-${idx}`}
              className="py-3 group hover:bg-gray-800/30 transition-colors px-1 rounded-md"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:items-center">
                {/* Feature Name & Value */}
                <div className="sm:col-span-4">
                  <div className="text-xs font-medium text-gray-200 group-hover:text-cyan-300 transition-colors">
                    {f.feature}
                  </div>
                  <div className="text-[11px] font-mono text-gray-400 truncate max-w-xs">
                    val: <span className="text-gray-300">{String(f.value)}</span>
                  </div>
                  {f.description && (
                    <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                      {f.description}
                    </div>
                  )}
                </div>

                {/* Center-aligned Diverging Horizontal Bar */}
                <div className="sm:col-span-6 relative h-6 flex items-center">
                  {/* Center vertical reference line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gray-700 z-10" />

                  {/* Left half: Legitimate (blue) */}
                  <div className="w-1/2 h-full flex items-center justify-end pr-[1px]">
                    {!isPhishingIndicator && (
                      <div
                        className="h-4 rounded-l bg-gradient-to-l from-blue-500 to-cyan-500 shadow-sm shadow-blue-500/30 transition-all duration-700"
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                  </div>

                  {/* Right half: Phishing (red) */}
                  <div className="w-1/2 h-full flex items-center justify-start pl-[1px]">
                    {isPhishingIndicator && (
                      <div
                        className="h-4 rounded-r bg-gradient-to-r from-red-500 to-rose-600 shadow-sm shadow-red-500/30 transition-all duration-700"
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                  </div>
                </div>

                {/* Contribution Value */}
                <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      isPhishingIndicator
                        ? 'text-red-400 bg-red-950/60 border border-red-800/40'
                        : 'text-blue-400 bg-blue-950/60 border border-blue-800/40'
                    }`}
                  >
                    {isPhishingIndicator ? `+${f.contribution.toFixed(2)}` : f.contribution.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanatory Footer */}
      <div className="mt-4 pt-3 border-t border-gray-800/70 flex flex-col sm:flex-row justify-between items-center text-[11px] text-gray-400 gap-2">
        <span>Features with positive values increase phishing probability score</span>
        <span className="font-mono text-cyan-400">TreeSHAP Kernel Explainer v1.4</span>
      </div>
    </div>
  );
}
