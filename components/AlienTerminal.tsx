"use client";

import React from "react";

interface AlienTerminalProps {
  x: number;
  y: number;
  isUnlocked: boolean;
  isNearPlayer: boolean;
  onInteract: () => void;
}

export default function AlienTerminal({
  x,
  y,
  isUnlocked,
  isNearPlayer,
  onInteract,
}: AlienTerminalProps) {
  return (
    <div
      className="absolute z-20 flex flex-col items-center"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: "90px",
        height: "120px",
      }}
    >
      {/* Tombol Prompt Melayang saat Pemain Mendekat */}
      {isNearPlayer && (
        <div className="absolute -top-12 z-30 animate-bounce whitespace-nowrap">
          <button
            type="button"
            onClick={onInteract}
            className="flex items-center gap-1.5 rounded-full border border-amber-400/80 bg-black/85 px-3 py-1 text-xs font-bold text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)] backdrop-blur-md transition hover:scale-105"
          >
            <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-black">
              E
            </span>
            <span>Baca Log OMNI</span>
          </button>
        </div>
      )}

      {/* Hologram Proyeksi Cahaya */}
      <div className="relative flex flex-col items-center justify-center cursor-pointer group" onClick={onInteract}>
        {/* Ikon Hologram berputar */}
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
            isUnlocked
              ? "border-emerald-400/70 bg-emerald-950/40 shadow-[0_0_25px_rgba(52,211,153,0.5)]"
              : "border-cyan-400/80 bg-cyan-950/40 shadow-[0_0_25px_rgba(34,211,238,0.5)] animate-pulse"
          } backdrop-blur-sm transition-all group-hover:scale-110`}
        >
          <span className="text-2xl">{isUnlocked ? "💾" : "🖥️"}</span>
        </div>

        {/* Tiang / Basis Konsol Alien */}
        <div className="mt-2 h-10 w-8 rounded-t-lg border-x border-t border-purple-500/40 bg-gradient-to-b from-purple-900/60 to-black/80 shadow-inner" />
        <div className="h-2 w-16 rounded-full bg-cyan-400/30 blur-xs" />

        {/* Label Status */}
        <span
          className={`mt-1 text-[10px] font-mono tracking-wider uppercase ${
            isUnlocked ? "text-emerald-300" : "text-cyan-300"
          }`}
        >
          {isUnlocked ? "[DATA OK]" : "[LOG BARU]"}
        </span>
      </div>
    </div>
  );
}

