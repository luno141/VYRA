'use client';

import React from 'react';
import { AlertOctagon, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RiskMeterProps {
  score: number; // 0 to 100
  verdict?: 'PHISHING' | 'LEGITIMATE';
  size?: 'sm' | 'md' | 'lg';
}

export default function RiskMeter({ score, verdict }: RiskMeterProps) {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  const getRiskDetails = (val: number) => {
    if (val >= 70) {
      return {
        badgeBg: 'bg-[#ff3366] text-white',
        border: 'border-black',
        label: 'CRITICAL THREAT LEVEL',
        sublabel: 'Zero-Day Phishing Architecture Confirmed',
        icon: AlertOctagon,
        segmentActive: 'bg-[#ff3366]',
      };
    }
    if (val >= 35) {
      return {
        badgeBg: 'bg-[#facc15] text-black',
        border: 'border-black',
        label: 'SUSPICIOUS / ELEVATED RISK',
        sublabel: 'Structural Anomalies Detected in URL',
        icon: AlertTriangle,
        segmentActive: 'bg-[#facc15]',
      };
    }
    return {
      badgeBg: 'bg-[#22c55e] text-black',
      border: 'border-black',
      label: 'BENIGN / VERIFIED SAFE',
      sublabel: 'Authentic Domain & Topology Confirmed',
      icon: ShieldCheck,
      segmentActive: 'bg-[#22c55e]',
    };
  };

  const risk = getRiskDetails(normalizedScore);
  const Icon = risk.icon;

  // 10 brutalist segments
  const totalSegments = 10;
  const activeSegments = Math.round((normalizedScore / 100) * totalSegments);

  return (
    <div className="neo-card p-6 bg-white space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-black" />
          <span className="font-mono font-black text-xs uppercase tracking-wider text-black">
            THREAT RISK ASSESSMENT
          </span>
        </div>
        <span className="px-2 py-0.5 bg-black text-white font-mono text-[10px] font-black uppercase">
          SCORE ENGINE
        </span>
      </div>

      {/* Chunky Score Readout */}
      <div className="flex items-center justify-between gap-4 p-4 bg-[#fdfbf7] border-2 border-black shadow-[3px_3px_0px_0px_#000]">
        <div>
          <div className="text-[10px] font-mono font-black uppercase text-zinc-500">CALCULATED RISK</div>
          <div className="text-4xl sm:text-5xl font-mono font-black text-black leading-none mt-1">
            {normalizedScore}
            <span className="text-sm font-normal text-zinc-500 ml-1">/100</span>
          </div>
        </div>

        <div className="text-right">
          <div className={`neo-badge px-3 py-1.5 text-xs font-black uppercase inline-block ${risk.badgeBg}`}>
            {risk.label}
          </div>
          <p className="text-[11px] font-mono font-bold text-zinc-600 mt-1 max-w-[200px]">
            {risk.sublabel}
          </p>
        </div>
      </div>

      {/* 10-Segment Brutalist Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between font-mono text-[10px] font-black text-black">
          <span>0 (BENIGN)</span>
          <span>50 (ELEVATED)</span>
          <span>100 (CRITICAL)</span>
        </div>

        <div className="grid grid-cols-10 gap-1.5 p-1.5 bg-black border-2 border-black shadow-[2px_2px_0px_0px_#000]">
          {Array.from({ length: totalSegments }).map((_, i) => {
            const isActive = i < activeSegments;
            let colorClass = 'bg-zinc-800';

            if (isActive) {
              if (i < 4) colorClass = 'bg-[#22c55e]';
              else if (i < 7) colorClass = 'bg-[#facc15]';
              else colorClass = 'bg-[#ff3366]';
            }

            return (
              <div
                key={i}
                className={`h-6 border border-black transition-all ${colorClass}`}
                title={`Level ${i + 1}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
