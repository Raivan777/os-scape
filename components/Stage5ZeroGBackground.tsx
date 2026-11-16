"use client";

import React, { useId } from "react";

/**
 * Stage5ZeroGBackground
 * Latar belakang interior stasiun luar angkasa zero-gravity dengan gaya vibrant sci-fi cartoon.
 * Mengandung:
 * - Jendela observasi heksagonal dengan pemandangan nebula & bintang kosmik
 * - Dinding bulkhead stasiun luar angkasa dengan plating modular
 * - Pipa konduit neon dengan cairan pendingin mengalir
 * - Serpihan luar angkasa (debris) & kabel-kabel putus melayang tanpa bobot (zero-G drift)
 */
export default function Stage5ZeroGBackground() {
  const compId = useId().replace(/:/g, "_");

  // Serpihan luar angkasa mengambang tanpa bobot (debris: baut, plat logam, kristal energi)
  const floatingDebris = [
    { x: "12%", y: "18%", size: 14, rot: 25, delay: "0s", duration: "7s", type: "bolt" },
    { x: "24%", y: "42%", size: 20, rot: -40, delay: "1.2s", duration: "9s", type: "plate" },
    { x: "38%", y: "15%", size: 10, rot: 60, delay: "2.5s", duration: "6.5s", type: "nut" },
    { x: "52%", y: "68%", size: 16, rot: -15, delay: "0.8s", duration: "8s", type: "chip" },
    { x: "68%", y: "22%", size: 18, rot: 85, delay: "3s", duration: "10s", type: "crystal" },
    { x: "82%", y: "45%", size: 12, rot: -70, delay: "1.7s", duration: "7.5s", type: "bolt" },
    { x: "91%", y: "20%", size: 15, rot: 30, delay: "2.1s", duration: "8.5s", type: "plate" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* 1. Deep Space & Nebula Base Gradient / Custom Backdrop */}
      <div className="absolute inset-0 bg-[#060412]" />
      
      {/* Gambar Latar Belakang Zero-G Space Station jika tersedia */}
      <img
        src="/stage5bg.jpg"
        alt="Stage 5 Zero-G Interior"
        className="absolute inset-0 h-full w-full object-cover opacity-55 mix-blend-screen"
        onError={(e) => {
          // Graceful fallback jika gambar tidak dimuat
          (e.currentTarget as HTMLElement).style.display = "none";
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(110,40,210,0.3),rgba(0,0,0,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_100%,rgba(6,182,212,0.22),rgba(0,0,0,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(168,85,247,0.18),rgba(0,0,0,0))]" />

      {/* 2. Jendela Observasi Heksagonal Raksasa Ruang Hampa (Zero-G Viewport) */}
      <div className="absolute left-1/2 top-10 -translate-x-1/2 h-[260px] w-[580px] opacity-40">
        <svg viewBox="0 0 580 260" className="h-full w-full">
          <defs>
            <radialGradient id={`space-nebula-${compId}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b0764" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#1e1b4b" stopOpacity="0.6" />
              <stop offset="80%" stopColor="#082f49" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
            </radialGradient>
            <linearGradient id={`frame-glow-${compId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Bingkai Luar Jendela Heksagonal */}
          <polygon
            points="60,10 520,10 570,130 520,250 60,250 10,130"
            fill={`url(#space-nebula-${compId})`}
            stroke={`url(#frame-glow-${compId})`}
            strokeWidth="3"
          />

          {/* Garis Penyangga Kaca Kosmik */}
          <line x1="60" y1="10" x2="520" y2="250" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />
          <line x1="520" y1="10" x2="60" y2="250" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />
          <line x1="10" y1="130" x2="570" y2="130" stroke="#a855f7" strokeWidth="1" strokeDasharray="8 6" opacity="0.4" />

          {/* Bintang-Bintang Kosmik Jauh */}
          {[
            [120, 50, 1.5], [200, 80, 2], [320, 60, 1.2], [410, 95, 2.5],
            [160, 180, 1.8], [280, 200, 2], [390, 160, 1.5], [470, 210, 2.2],
            [260, 120, 3], [340, 140, 1.8]
          ].map(([cx, cy, r], idx) => (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={r}
              fill="#ffffff"
              opacity={0.6 + (idx % 3) * 0.15}
              className="animate-pulse"
              style={{ animationDuration: `${2 + (idx % 4)}s` }}
            />
          ))}
        </svg>
      </div>

      {/* 3. Panel-Panel Bulkhead & Struktur Dinding Stasiun Luar Angkasa */}
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6, 182, 212, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(168, 85, 247, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* 4. Pipa Konduit Neon Sci-Fi Berkelok di Atas Plafond */}
      <svg className="absolute top-0 left-0 w-full h-24 opacity-60">
        <path
          d="M0,24 L180,24 L220,50 L480,50 L520,24 L820,24 L860,60 L1000,60"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="3"
        />
        <path
          d="M0,32 L175,32 L215,58 L485,58 L525,32 L815,32 L855,68 L1000,68"
          fill="none"
          stroke="#a855f7"
          strokeWidth="1.5"
          strokeDasharray="12 8"
        />
        {/* Lampu Status Konduit */}
        {[100, 350, 650, 920].map((xPos, i) => (
          <circle
            key={i}
            cx={xPos}
            cy="24"
            r="4"
            fill="#22d3ee"
            className="animate-ping"
            style={{ animationDuration: `${1.5 + i * 0.5}s` }}
          />
        ))}
      </svg>

      {/* 5. Kabel-Kabel Putus Melayang Tanpa Bobot (Weightless Disconnected Cables) */}
      {/* Kabel Melayang Sisi Kiri */}
      <div className="absolute top-28 left-6 w-36 h-48 opacity-75 animate-[cableFloat_6s_ease-in-out_infinite]">
        <svg viewBox="0 0 140 180" className="h-full w-full">
          {/* Kabel 1 */}
          <path
            d="M10,0 C30,50 -10,100 45,150"
            fill="none"
            stroke="#1e293b"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M10,0 C30,50 -10,100 45,150"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Ujung Kabel Terbuka & Percikan Listrik */}
          <circle cx="45" cy="150" r="4" fill="#38bdf8" className="animate-ping" />
          <line x1="45" y1="150" x2="52" y2="158" stroke="#facc15" strokeWidth="2" />
          <line x1="45" y1="150" x2="38" y2="160" stroke="#38bdf8" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Kabel Melayang Sisi Kanan Tengah */}
      <div
        className="absolute top-36 right-16 w-32 h-44 opacity-75 animate-[cableFloat_7.5s_ease-in-out_infinite]"
        style={{ animationDelay: "1.5s" }}
      >
        <svg viewBox="0 0 130 160" className="h-full w-full">
          <path
            d="M120,0 C80,45 130,90 70,140"
            fill="none"
            stroke="#1e293b"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M120,0 C80,45 130,90 70,140"
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="70" cy="140" r="3.5" fill="#c084fc" className="animate-ping" />
          <line x1="70" y1="140" x2="62" y2="148" stroke="#f43f5e" strokeWidth="2" />
        </svg>
      </div>

      {/* 6. Serpihan Luar Angkasa (Debris: Mur, Baut, Pecahan Plat) Melayang Mengapung */}
      {floatingDebris.map((deb, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: deb.x,
            top: deb.y,
            animation: `zeroGDrift ${deb.duration} ease-in-out infinite alternate`,
            animationDelay: deb.delay,
          }}
        >
          <svg
            width={deb.size}
            height={deb.size}
            viewBox="0 0 24 24"
            style={{ transform: `rotate(${deb.rot}deg)` }}
            className="drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
          >
            {deb.type === "bolt" && (
              <g fill="#94a3b8" stroke="#38bdf8" strokeWidth="1">
                <rect x="7" y="3" width="10" height="6" rx="1" fill="#cbd5e1" />
                <rect x="9" y="9" width="6" height="12" fill="#64748b" />
                <line x1="9" y1="12" x2="15" y2="12" stroke="#38bdf8" />
                <line x1="9" y1="15" x2="15" y2="15" stroke="#38bdf8" />
                <line x1="9" y1="18" x2="15" y2="18" stroke="#38bdf8" />
              </g>
            )}
            {deb.type === "plate" && (
              <polygon
                points="4,4 20,2 18,18 2,16"
                fill="#334155"
                stroke="#a855f7"
                strokeWidth="1.5"
              />
            )}
            {deb.type === "nut" && (
              <g fill="#475569" stroke="#06b6d4" strokeWidth="1.2">
                <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
                <circle cx="12" cy="12" r="4" fill="#0f172a" />
              </g>
            )}
            {deb.type === "chip" && (
              <g fill="#0284c7" stroke="#38bdf8" strokeWidth="1">
                <rect x="4" y="4" width="16" height="16" rx="2" fill="#0369a1" />
                <circle cx="12" cy="12" r="3" fill="#38bdf8" />
                <line x1="2" y1="8" x2="4" y2="8" stroke="#38bdf8" />
                <line x1="2" y1="16" x2="4" y2="16" stroke="#38bdf8" />
                <line x1="20" y1="8" x2="22" y2="8" stroke="#38bdf8" />
                <line x1="20" y1="16" x2="22" y2="16" stroke="#38bdf8" />
              </g>
            )}
            {deb.type === "crystal" && (
              <polygon
                points="12,2 20,12 12,22 4,12"
                fill="#c084fc"
                fillOpacity="0.8"
                stroke="#f472b6"
                strokeWidth="1.5"
              />
            )}
          </svg>
        </div>
      ))}

      {/* Keyframe Animasi Zero-G Float */}
      <style jsx>{`
        @keyframes cableFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-16px) rotate(4deg);
          }
        }
        @keyframes zeroGDrift {
          0% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-18px) translateX(10px) rotate(15deg);
          }
          100% {
            transform: translateY(-8px) translateX(-8px) rotate(-10deg);
          }
        }
      `}</style>
    </div>
  );
}
