"use client";

import React, { useId } from "react";

interface DiskBackgroundProps {
  intensity?: "normal" | "subtle" | "vibrant";
  showGrid?: boolean;
}

export default function DiskBackground({
  intensity = "normal",
  showGrid = true,
}: DiskBackgroundProps) {
  const maskId = useId();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* 1. Latar Belakang Gradien Deep Space & Magnetic Flux Core */}
      <div className="absolute inset-0 bg-[#060410]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,40,200,0.25),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_120%,rgba(6,182,212,0.18),rgba(255,255,255,0))]" />

      {/* 2. Grid Sirkuit PCB & Bus Data Heksadesimal */}
      {showGrid && (
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(34, 211, 238, 0.4) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(34, 211, 238, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      )}

      {/* 3. Piringan Magnetik Raksasa Berputar (Holographic Platter Stack) di Latar Tengah */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-35">
        <svg
          width="820"
          height="820"
          viewBox="0 0 820 820"
          className="animate-[spin_40s_linear_infinite]"
        >
          <defs>
            <radialGradient id={`platter-grad-${maskId}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0b0820" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#1e144a" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#0e2a47" stopOpacity="0.6" />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
            </radialGradient>
            <linearGradient id={`track-laser-${maskId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Platter Outer Ring */}
          <circle
            cx="410"
            cy="410"
            r="390"
            fill={`url(#platter-grad-${maskId})`}
            stroke="#06b6d4"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.6"
          />

          {/* Concentric Cylinder Tracks */}
          {[350, 310, 270, 230, 190, 150, 110, 70].map((radius, idx) => (
            <circle
              key={idx}
              cx="410"
              cy="410"
              r={radius}
              fill="none"
              stroke={idx % 2 === 0 ? `url(#track-laser-${maskId})` : "#6366f1"}
              strokeWidth={idx % 3 === 0 ? "2" : "1"}
              strokeDasharray={idx % 2 === 0 ? "12 8" : "4 4"}
              opacity={0.35 + (idx % 3) * 0.15}
            />
          ))}

          {/* Sektor-Sektor Disk (Spokes & Data Blocks) */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 360) / 16;
            const rad = (angle * Math.PI) / 180;
            const x2 = 410 + 380 * Math.cos(rad);
            const y2 = 410 + 380 * Math.sin(rad);
            return (
              <line
                key={i}
                x1="410"
                y1="410"
                x2={x2}
                y2={y2}
                stroke="#06b6d4"
                strokeWidth="1"
                opacity="0.25"
                strokeDasharray="4 8"
              />
            );
          })}

          {/* Bad Sector Anomaly Indicators (Peringatan Sektor Rusak pada Platter) */}
          <circle
            cx="410"
            cy="180"
            r="16"
            fill="#ef4444"
            fillOpacity="0.3"
            stroke="#f87171"
            strokeWidth="2"
            className="animate-pulse"
          />
          <circle
            cx="600"
            cy="470"
            r="20"
            fill="#ef4444"
            fillOpacity="0.25"
            stroke="#f87171"
            strokeWidth="1.5"
            className="animate-ping"
          />

          {/* Spindle Motor Hub Pusat */}
          <circle cx="410" cy="410" r="50" fill="#0d0926" stroke="#22d3ee" strokeWidth="3" />
          <circle cx="410" cy="410" r="30" fill="#1e1245" stroke="#a855f7" strokeWidth="2" />
          <circle cx="410" cy="410" r="10" fill="#22d3ee" />
        </svg>
      </div>

      {/* 4. Actuator Head Arm Hologram (Lengan Mekanik Pembaca Disk) */}
      <div className="absolute -top-16 -right-16 h-[500px] w-[500px] opacity-40">
        <svg viewBox="0 0 500 500" className="h-full w-full">
          {/* Actuator Axis Pivot */}
          <circle cx="420" cy="80" r="45" fill="#15103a" stroke="#06b6d4" strokeWidth="3" />
          <circle cx="420" cy="80" r="25" fill="#2a1f68" stroke="#a855f7" strokeWidth="2" />

          {/* Arm Body yang membentang ke tengah */}
          <polygon
            points="420,80 160,280 145,295 180,310 435,95"
            fill="url(#track-laser)"
            opacity="0.35"
          />
          <line x1="420" y1="80" x2="155" y2="295" stroke="#22d3ee" strokeWidth="3" />

          {/* Laser Head Slider Tip */}
          <rect
            x="135"
            y="285"
            width="28"
            height="18"
            rx="4"
            fill="#06b6d4"
            stroke="#38bdf8"
            strokeWidth="2"
            className="animate-pulse"
          />

          {/* Laser Beam Spot ke Platter */}
          <circle
            cx="149"
            cy="312"
            r="6"
            fill="#f43f5e"
            className="animate-ping"
            style={{ animationDuration: "1.5s" }}
          />
          <line
            x1="149"
            y1="298"
            x2="149"
            y2="360"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeDasharray="2 2"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* 5. Rak Server Penyimpanan Data (Storage Racks) di Kiri & Kanan */}
      {/* Sisi Kiri: Server Bay Alpha */}
      <div className="absolute -left-6 top-10 flex flex-col gap-3 opacity-60">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex h-14 w-44 items-center justify-between rounded-r-xl border-y border-r border-cyan-500/30 bg-[#0d0924]/80 px-4 py-2 backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            <div className="flex flex-col">
              <span className="font-mono text-[9px] font-bold text-cyan-300">
                CYL_BAY_0{i + 1}
              </span>
              <span className="text-[8px] text-gray-400">15,000 RPM // SAS</span>
            </div>
            {/* LED Blinkers Read/Write */}
            <div className="flex gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  i % 2 === 0 ? "bg-emerald-400 animate-ping" : "bg-cyan-400"
                }`}
                style={{ animationDuration: `${0.8 + (i % 3) * 0.4}s` }}
              />
              <span
                className={`h-2 w-2 rounded-full ${
                  i % 3 === 0 ? "bg-amber-400 animate-pulse" : "bg-purple-400"
                }`}
              />
              <span className="h-2 w-2 rounded-full bg-rose-500/70" />
            </div>
          </div>
        ))}
      </div>

      {/* Sisi Kanan: Server Bay Beta */}
      <div className="absolute -right-6 top-10 flex flex-col gap-3 opacity-60">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex h-14 w-44 items-center justify-between rounded-l-xl border-y border-l border-purple-500/30 bg-[#0d0924]/80 px-4 py-2 backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          >
            <div className="flex gap-1.5">
              <span
                className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"
                style={{ animationDuration: `${0.6 + (i % 2) * 0.5}s` }}
              />
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="flex flex-col text-right">
              <span className="font-mono text-[9px] font-bold text-purple-300">
                SECTOR_ACT_0{i + 5}
              </span>
              <span className="text-[8px] text-gray-400">SEEK ACTIVE</span>
            </div>
          </div>
        ))}
      </div>

      {/* 6. Partikel Data Bit 0 & 1 Mengalir Vertikal */}
      <div className="absolute inset-0 flex justify-around opacity-15 overflow-hidden">
        {["0 1 1 0 1 0 0 1 1 1", "1 0 0 1 0 1 1 0 0 1", "1 1 0 0 1 0 1 0 1 1", "0 0 1 1 1 0 1 0 0 1"].map(
          (stream, idx) => (
            <div
              key={idx}
              className="font-mono text-[10px] tracking-widest text-cyan-300 select-none animate-[pulse_4s_ease-in-out_infinite]"
              style={{
                writingMode: "vertical-rl",
                animationDelay: `${idx * 0.8}s`,
              }}
            >
              {stream}
            </div>
          )
        )}
      </div>

      {/* 7. Garis Bahaya Hazard Stripes di Bagian Bawah */}
      <div
        className="absolute bottom-0 left-0 right-0 h-3 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #f59e0b, #f59e0b 12px, #000 12px, #000 24px)",
        }}
      />
    </div>
  );
}

