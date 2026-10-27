'use client';

import React from 'react';

interface RiskMeterProps {
  score: number; // 0 to 100
  verdict?: 'PHISHING' | 'LEGITIMATE';
  size?: 'sm' | 'md' | 'lg';
}

export default function RiskMeter({ score, verdict, size = 'md' }: RiskMeterProps) {
  // Normalize score between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  // Color selection based on score
  const getColor = (val: number) => {
    if (val >= 70) {
      return {
        text: 'text-red-400',
        bg: 'bg-red-500',
        border: 'border-red-500/30',
        stroke: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.4)',
        label: 'CRITICAL RISK',
        sublabel: 'Phishing Pattern Confirmed',
      };
    }
    if (val >= 35) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500',
        border: 'border-amber-500/30',
        stroke: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.4)',
        label: 'MODERATE RISK',
        sublabel: 'Suspicious Indicators Found',
      };
    }
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500',
      border: 'border-emerald-500/30',
      stroke: '#22c55e',
      glow: 'rgba(34, 197, 94, 0.4)',
      label: 'SAFE / VERIFIED',
      sublabel: 'Legitimate Domain Signals',
    };
  };

  const colorInfo = getColor(normalizedScore);

  // Semicircle gauge parameters
  // Radius = 80, Center = (100, 95)
  // Arc goes from 180 deg to 360 deg (half circle)
  // Arc length = PI * 80 ≈ 251.327
  const radius = 70;
  const circumference = Math.PI * radius; // ~219.9
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-900/60 rounded-xl border border-gray-800">
      <div className="text-xs uppercase font-semibold tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
        <span className={`inline-block w-2 h-2 rounded-full ${colorInfo.bg} animate-pulse`} />
        Threat Risk Assessment
      </div>

      {/* Semicircle SVG Gauge */}
      <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
        <svg
          viewBox="0 0 160 90"
          className="w-full h-full transform transition-all duration-700 ease-out"
        >
          <defs>
            <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d="M 15 80 A 65 65 0 0 1 145 80"
            fill="none"
            stroke="#1f2937"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Active Progress Arc */}
          <path
            d="M 15 80 A 65 65 0 0 1 145 80"
            fill="none"
            stroke={colorInfo.stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={Math.PI * 65}
            strokeDashoffset={Math.PI * 65 * (1 - normalizedScore / 100)}
            filter="url(#gaugeGlow)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <span className={`text-4xl font-extrabold tracking-tight font-mono ${colorInfo.text}`}>
            {normalizedScore}
          </span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest -mt-0.5">
            / 100 Score
          </span>
        </div>
      </div>

      {/* Rating badge & status */}
      <div className="mt-3 text-center">
        <div
          className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${colorInfo.border} ${colorInfo.text} bg-gray-950/80`}
        >
          {colorInfo.label}
        </div>
        <p className="text-xs text-gray-400 mt-1">{colorInfo.sublabel}</p>
      </div>

      {/* Horizontal Bar Breakdown */}
      <div className="w-full mt-4 pt-3 border-t border-gray-800/80">
        <div className="flex justify-between text-[11px] text-gray-400 mb-1.5 font-mono">
          <span>0 (Safe)</span>
          <span>50 (Suspicious)</span>
          <span>100 (Phishing)</span>
        </div>
        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${normalizedScore}%`,
              backgroundColor: colorInfo.stroke,
              boxShadow: `0 0 8px ${colorInfo.stroke}`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
