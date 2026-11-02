"use client";

import React, { useId } from "react";

interface DeadlockBackgroundProps {
  intensity?: "normal" | "subtle" | "vibrant";
  showGrid?: boolean;
}

export default function DeadlockBackground({
  intensity = "normal",
  showGrid = true,
}: DeadlockBackgroundProps) {
  const maskId = useId();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* 1. Gradien Ruang Hampa Dalam (Deep Space & Deadlock Core Atmosphere) */}
      <div className="absolute inset-0 bg-[#070512]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_-10%,rgba(147,51,234,0.22),rgba(0,0,0,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_90%,rgba(6,182,212,0.18),rgba(0,0,0,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_85%_75%,rgba(239,68,68,0.15),rgba(0,0,0,0))]" />

      {/* 2. Grid Matriks Sumber Daya Alien */}
      {showGrid && (
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(168, 85, 247, 0.35) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(34, 211, 238, 0.35) 1px, transparent 1px)
            `,
            backgroundSize: "44px 44px",
          }}
        />
      )}

      {/* 3. Cincin Kunci Deadlock & Pipa Penopang Hidup di Latar Belakang */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
        <svg
          width="860"
          height="860"
          viewBox="0 0 860 860"
          className="animate-[spin_60s_linear_infinite]"
        >
          <defs>
            <radialGradient id={`core-grad-${maskId}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e0b36" stopOpacity="0.8" />
              <stop offset="45%" stopColor="#0d1b2a" stopOpacity="0.5" />
              <stop offset="80%" stopColor="#a855f7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
            </radialGradient>
            <linearGradient id={`pipe-flow-${maskId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Cincin Luar Simbol Ketergantungan Siklik */}
          <circle
            cx="430"
            cy="430"
            r="380"
            fill="none"
            stroke={`url(#pipe-flow-${maskId})`}
            strokeWidth="2.5"
            strokeDasharray="24 16"
            className="opacity-70"
          />

          {/* Cincin Lingkaran Dalam */}
          <circle
            cx="430"
            cy="430"
            r="280"
            fill={`url(#core-grad-${maskId})`}
            stroke="#a855f7"
            strokeWidth="1.5"
            strokeDasharray="12 8"
            className="opacity-50"
          />

          {/* 4 Simpul Sumber Daya Melingkar (RAG Cycle Hologram) */}
          {[0, 90, 180, 270].map((angle, idx) => {
            const rad = (angle * Math.PI) / 180;
            const cx = 430 + 380 * Math.cos(rad);
            const cy = 430 + 380 * Math.sin(rad);
            return (
              <g key={idx}>
                <circle cx={cx} cy={cy} r="16" fill="#0b081e" stroke="#22d3ee" strokeWidth="2" />
                <circle cx={cx} cy={cy} r="8" fill="#a855f7" className="animate-ping" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* 4. Tabung Sumber Daya Penopang Hidup di Sisi Latar (Visual Tabung O2, H2O, Plasma) */}
      <div className="absolute top-8 left-8 flex gap-4 opacity-40">
        <div className="flex flex-col items-center">
          <div className="w-4 h-24 rounded-full border border-cyan-400 bg-cyan-950/60 overflow-hidden relative">
            <div className="absolute bottom-0 inset-x-0 bg-cyan-400/70 h-3/4 animate-pulse" />
          </div>
          <span className="text-[10px] font-mono text-cyan-300 mt-1">O2</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-4 h-24 rounded-full border border-emerald-400 bg-emerald-950/60 overflow-hidden relative">
            <div className="absolute bottom-0 inset-x-0 bg-emerald-400/70 h-1/2 animate-pulse" />
          </div>
          <span className="text-[10px] font-mono text-emerald-300 mt-1">H2O</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-4 h-24 rounded-full border border-purple-400 bg-purple-950/60 overflow-hidden relative">
            <div className="absolute bottom-0 inset-x-0 bg-purple-400/70 h-5/6 animate-pulse" />
          </div>
          <span className="text-[10px] font-mono text-purple-300 mt-1">PLS</span>
        </div>
      </div>

      {/* 5. Lampu Peringatan Deadlock Sensor di Bagian Atas */}
      <div className="absolute top-0 inset-x-0 flex justify-center gap-16 py-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/40 backdrop-blur-xs">
          <span className="h-2 w-2 rounded-full bg-purple-400 animate-ping" />
          <span className="text-[11px] font-mono text-purple-300 tracking-wider">
            OMNI CORE // DEADLOCK PREVENTION GRID: MONITORING
          </span>
        </div>
      </div>
    </div>
  );
}

