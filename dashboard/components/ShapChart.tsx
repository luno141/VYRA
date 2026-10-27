'use client';

import React from 'react';
import { ShapFeature } from '../lib/types';
import { Cpu, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ShapChartProps {
  features: ShapFeature[];
  title?: string;
  maxFeatures?: number;
}

export default function ShapChart({
  features,
  title = 'TREESHAP MODEL EXPLAINABILITY',
  maxFeatures = 8,
}: ShapChartProps) {
  if (!features || features.length === 0) {
    return (
      <div className="p-8 bg-[#12141e] border-[3px] border-white shadow-[6px_6px_0px_0px_#ccff00] text-center space-y-2">
        <div className="font-mono font-black text-sm text-white">
          NO SHAP FEATURE ATTRIBUTION DATA AVAILABLE
        </div>
        <p className="font-mono text-xs text-zinc-400">
          Run a live URL scan to generate TreeSHAP decision path attributions.
        </p>
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
    <div className="p-6 bg-[#12141e] border-[3px] border-white shadow-[6px_6px_0px_0px_#ccff00] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-white gap-2">
        <div>
          <h3 className="text-sm font-black font-mono uppercase tracking-wider text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#ccff00]" />
            <span>{title}</span>
          </h3>
          <p className="text-xs font-mono font-bold text-zinc-300 mt-1">
            Local feature attributions decomposing the XGBoost tree decision
          </p>
        </div>

        {/* Legend Badges */}
        <div className="flex items-center gap-2 font-mono text-[11px] font-black">
          <span className="px-2.5 py-1 bg-[#38bdf8] text-black border-2 border-white shadow-[2px_2px_0px_0px_#ffffff]">
            - SAFE (BENIGN)
          </span>
          <span className="px-2.5 py-1 bg-[#ff3366] text-white border-2 border-white shadow-[2px_2px_0px_0px_#ffffff]">
            + THREAT (PHISH)
          </span>
        </div>
      </div>

      {/* Feature Attribution Rows */}
      <div className="space-y-4">
        {displayFeatures.map((feat, index) => {
          const isPhishPush = feat.contribution > 0;
          const pct = Math.min(100, Math.max(8, (Math.abs(feat.contribution) / maxAbs) * 100));

          return (
            <div
              key={index}
              className="p-3 bg-[#1a1d2e] border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] space-y-2"
            >
              <div className="flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#facc15] text-black flex items-center justify-center font-black text-[10px] border border-black">
                    #{index + 1}
                  </span>
                  <span className="font-black text-white tracking-tight uppercase">
                    {feat.feature}
                  </span>
                  {feat.value !== undefined && (
                    <span className="px-1.5 py-0.2 bg-[#090a0f] border border-white text-[10px] text-zinc-200 font-bold">
                      VAL: {feat.value}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 font-mono font-black">
                  {isPhishPush ? (
                    <span className="flex items-center gap-0.5 text-[#ff3366] bg-[#090a0f] px-2 py-0.5 border border-white">
                      <ArrowUpRight className="w-4 h-4" />
                      +{feat.contribution.toFixed(3)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[#38bdf8] bg-[#090a0f] px-2 py-0.5 border border-white">
                      <ArrowDownRight className="w-4 h-4" />
                      {feat.contribution.toFixed(3)}
                    </span>
                  )}
                </div>
              </div>

              {/* Brutalist Bar */}
              <div className="h-4 w-full bg-[#090a0f] border-2 border-white p-0.5 relative">
                <div
                  className={`h-full border-r-2 border-white transition-all duration-500 ${
                    isPhishPush ? 'bg-[#ff3366]' : 'bg-[#38bdf8]'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {feat.description && (
                <div className="text-[10px] font-mono text-zinc-300 font-bold">
                  NOTE: {feat.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
