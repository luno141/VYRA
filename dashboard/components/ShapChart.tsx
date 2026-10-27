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
      <div className="neo-card p-8 bg-white text-center space-y-2">
        <div className="font-mono font-black text-sm text-black">
          NO SHAP FEATURE ATTRIBUTION DATA AVAILABLE
        </div>
        <p className="font-mono text-xs text-zinc-500">
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
    <div className="neo-card p-6 bg-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-black gap-2">
        <div>
          <h3 className="text-sm font-black font-mono uppercase tracking-wider text-black flex items-center gap-2">
            <Cpu className="w-4 h-4 text-black" />
            {title}
          </h3>
          <p className="text-xs font-mono font-bold text-zinc-600 mt-0.5">
            Local feature attributions decomposing the XGBoost tree decision
          </p>
        </div>

        {/* Legend Badges */}
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold">
          <span className="neo-badge px-2 py-0.5 bg-[#38bdf8] text-black">
            - SAFE (BENIGN)
          </span>
          <span className="neo-badge px-2 py-0.5 bg-[#ff3366] text-white">
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
              className="p-3 bg-[#fdfbf7] border-2 border-black shadow-[3px_3px_0px_0px_#000] space-y-2"
            >
              <div className="flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-black text-white flex items-center justify-center font-black text-[10px]">
                    #{index + 1}
                  </span>
                  <span className="font-black text-black tracking-tight uppercase">
                    {feat.feature}
                  </span>
                  {feat.value !== undefined && (
                    <span className="px-1.5 py-0.2 bg-zinc-200 border border-black text-[10px] text-zinc-800 font-bold">
                      VAL: {feat.value}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 font-mono font-black">
                  {isPhishPush ? (
                    <span className="flex items-center gap-0.5 text-[#ff3366]">
                      <ArrowUpRight className="w-4 h-4" />
                      +{feat.contribution.toFixed(3)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[#0284c7]">
                      <ArrowDownRight className="w-4 h-4" />
                      {feat.contribution.toFixed(3)}
                    </span>
                  )}
                </div>
              </div>

              {/* Brutalist Bar */}
              <div className="h-4 w-full bg-zinc-200 border-2 border-black p-0.5 relative">
                <div
                  className={`h-full border-r-2 border-black transition-all duration-500 ${
                    isPhishPush ? 'bg-[#ff3366]' : 'bg-[#38bdf8]'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {feat.description && (
                <div className="text-[10px] font-mono text-zinc-500 font-bold">
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
