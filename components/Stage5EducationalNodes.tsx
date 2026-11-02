"use client";

import React, { useState } from "react";

interface EducationalNodesProps {
  onSelectNode?: (nodeType: "single" | "two-level" | "tree") => void;
}

export default function Stage5EducationalNodes({ onSelectNode }: EducationalNodesProps) {
  const [activeInfo, setActiveInfo] = useState<"single" | "two-level" | "tree" | null>(null);

  const handleOpen = (type: "single" | "two-level" | "tree") => {
    setActiveInfo(type);
    if (onSelectNode) onSelectNode(type);
  };

  return (
    <>
      {/* ========================================================
          1. NODE 1: SINGLE-LEVEL DIRECTORY
          Hologram neon dalam gelembung energi Zero-G dengan folder raksasa 
          dan beberapa file digital melayang bebas di sekelilingnya.
         ======================================================== */}
      <div
        className="absolute z-20 cursor-pointer group transition-transform hover:scale-105"
        style={{ left: "155px", top: "270px", width: "135px", height: "130px" }}
        onClick={() => handleOpen("single")}
      >
        {/* Floating Zero-G Energy Bubble (Gelembung Energi Anti-Gravitasi) */}
        <div className="absolute inset-0 rounded-full border border-cyan-400/60 bg-gradient-to-tr from-cyan-500/10 via-purple-500/20 to-cyan-300/15 shadow-[0_0_25px_rgba(6,182,212,0.45)] backdrop-blur-[2px] animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute -inset-1 rounded-full border border-purple-400/30 animate-spin" style={{ animationDuration: "14s" }} />

        {/* Partikel Data Shimmering */}
        <div className="absolute top-2 left-4 h-1.5 w-1.5 rounded-full bg-cyan-300 animate-ping" />
        <div className="absolute bottom-3 right-5 h-1.5 w-1.5 rounded-full bg-purple-300 animate-ping" style={{ animationDelay: "1s" }} />

        {/* Folder Raksasa Utama (Single Massive Main Folder) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <svg width="58" height="46" viewBox="0 0 58 46" className="drop-shadow-[0_0_12px_#22d3ee]">
            {/* Tab Folder */}
            <path d="M4,10 L22,10 L28,16 L54,16 A4,4 0 0 1 58,20 L58,40 A4,4 0 0 1 54,44 L4,44 A4,4 0 0 1 0,40 L0,14 A4,4 0 0 1 4,10 Z" fill="#0891b2" fillOpacity="0.4" stroke="#22d3ee" strokeWidth="2" />
            <path d="M0,20 L58,20 L54,44 L4,44 Z" fill="#06b6d4" fillOpacity="0.6" stroke="#67e8f9" strokeWidth="1.5" />
            <text x="29" y="34" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              ROOT_DIR
            </text>
          </svg>
          <span className="mt-1 font-mono text-[8px] font-black tracking-wider text-cyan-200 uppercase bg-black/60 px-1.5 py-0.5 rounded border border-cyan-400/40">
            Single-Level
          </span>
        </div>

        {/* Ikon-Ikon File Digital Melayang Bebas di Sekitarnya (Zero-G File Drift) */}
        <div className="absolute top-2 left-2 animate-[zeroGDrift_5s_ease-in-out_infinite]">
          <span className="flex items-center gap-0.5 rounded bg-blue-950/80 px-1 py-0.5 text-[7px] font-mono font-bold text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_#38bdf8]">
            📄 data.bin
          </span>
        </div>
        <div className="absolute top-3 right-1 animate-[zeroGDrift_6s_ease-in-out_infinite]" style={{ animationDelay: "1s" }}>
          <span className="flex items-center gap-0.5 rounded bg-purple-950/80 px-1 py-0.5 text-[7px] font-mono font-bold text-purple-300 border border-purple-500/50 shadow-[0_0_8px_#c084fc]">
            📊 log.sys
          </span>
        </div>
        <div className="absolute bottom-2 left-3 animate-[zeroGDrift_7s_ease-in-out_infinite]" style={{ animationDelay: "2s" }}>
          <span className="flex items-center gap-0.5 rounded bg-emerald-950/80 px-1 py-0.5 text-[7px] font-mono font-bold text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_#34d399]">
            📄 test.txt
          </span>
        </div>
        <div className="absolute bottom-3 right-1 animate-[zeroGDrift_5.5s_ease-in-out_infinite]" style={{ animationDelay: "1.5s" }}>
          <span className="flex items-center gap-0.5 rounded bg-rose-950/80 px-1 py-0.5 text-[7px] font-mono font-bold text-rose-300 border border-rose-500/50 shadow-[0_0_8px_#f43f5e]">
            ⚠️ collision!
          </span>
        </div>

        {/* Indicator Badge Info */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="rounded bg-cyan-400 px-2 py-0.5 text-[9px] font-black text-black shadow-[0_0_10px_#22d3ee]">
            [Klik] Pelajari Single-Level
          </span>
        </div>
      </div>

      {/* ========================================================
          2. NODE 2: TWO-LEVEL DIRECTORY
          Blueprint holografis melayang di udara yang memperlihatkan
          Master File Directory (MFD) menyabang ke User File Directory (UFD).
         ======================================================== */}
      <div
        className="absolute z-20 cursor-pointer group transition-transform hover:scale-105"
        style={{ left: "375px", top: "165px", width: "165px", height: "135px" }}
        onClick={() => handleOpen("two-level")}
      >
        {/* Holographic Blueprint Grid Frame */}
        <div className="absolute inset-0 rounded-xl border border-cyan-400/50 bg-[#071329]/80 p-2 shadow-[0_0_30px_rgba(34,211,238,0.3)] backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 mb-1.5">
            <span className="font-mono text-[8px] font-bold text-cyan-300 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              BLUEPRINT: TWO-LEVEL DIR
            </span>
            <span className="text-[7px] text-gray-400 font-mono">MFD / UFD</span>
          </div>

          {/* SVG Diagram MFD -> UFD */}
          <svg viewBox="0 0 150 90" className="w-full h-[85px]">
            {/* Master File Directory (MFD) Node di Atas */}
            <g transform="translate(45, 2)">
              <rect width="60" height="20" rx="4" fill="#0891b2" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="30" y="14" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                MFD [ROOT]
              </text>
            </g>

            {/* Neon Connection Lines with Pulses */}
            <path d="M75,22 L75,34 L32,34 L32,46" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3 2" />
            <path d="M75,22 L75,34 L118,34 L118,46" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 2" />

            {/* Secondary UFD Node 1 (User Alpha) */}
            <g transform="translate(6, 46)">
              <rect width="52" height="18" rx="3" fill="#1e1b4b" stroke="#38bdf8" strokeWidth="1.2" />
              <text x="26" y="12" fill="#67e8f9" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                UFD: USER_A
              </text>
              {/* File di UFD A */}
              <text x="26" y="28" fill="#93c5fd" fontSize="6.5" fontFamily="monospace" textAnchor="middle">
                └ data.txt
              </text>
            </g>

            {/* Secondary UFD Node 2 (User Beta) */}
            <g transform="translate(92, 46)">
              <rect width="52" height="18" rx="3" fill="#3b0764" stroke="#c084fc" strokeWidth="1.2" />
              <text x="26" y="12" fill="#e9d5ff" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                UFD: USER_B
              </text>
              {/* File di UFD B dengan nama sama tapi terisolasi! */}
              <text x="26" y="28" fill="#d8b4fe" fontSize="6.5" fontFamily="monospace" textAnchor="middle">
                └ data.txt (OK)
              </text>
            </g>
          </svg>
        </div>

        {/* Floating Indicator */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="rounded bg-cyan-400 px-2 py-0.5 text-[9px] font-black text-black shadow-[0_0_10px_#22d3ee]">
            [Klik] Blueprint MFD/UFD
          </span>
        </div>
      </div>

      {/* ========================================================
          3. NODE 3: TREE-STRUCTURED DIRECTORY
          Diagram hierarki pohon besar dari folder-folder bercahaya neon,
          menjalar ke bawah dan mengambang bebas di ruang anti-gravitasi.
         ======================================================== */}
      <div
        className="absolute z-20 cursor-pointer group transition-transform hover:scale-105"
        style={{ left: "555px", top: "115px", width: "175px", height: "155px" }}
        onClick={() => handleOpen("tree")}
      >
        <div className="absolute inset-0 rounded-xl border border-purple-500/50 bg-[#110729]/80 p-2 shadow-[0_0_35px_rgba(168,85,247,0.35)] backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-purple-500/30 pb-1 mb-1">
            <span className="font-mono text-[8px] font-bold text-purple-300 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
              TREE-STRUCTURED DIR
            </span>
            <span className="text-[7px] text-emerald-400 font-mono">Hierarchical</span>
          </div>

          {/* SVG Complex Cascading Tree Diagram */}
          <svg viewBox="0 0 160 115" className="w-full h-[110px]">
            {/* Level 1: Root Folder (/) */}
            <g transform="translate(62, 0)">
              <rect width="36" height="15" rx="3" fill="#6b21a8" stroke="#d8b4fe" strokeWidth="1.5" />
              <text x="18" y="11" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                / (root)
              </text>
            </g>

            {/* Cabang Level 1 -> Level 2 */}
            <path d="M80,15 L80,24 L25,24 L25,32" fill="none" stroke="#a855f7" strokeWidth="1.2" />
            <path d="M80,15 L80,32" fill="none" stroke="#22d3ee" strokeWidth="1.2" />
            <path d="M80,15 L80,24 L135,24 L135,32" fill="none" stroke="#34d399" strokeWidth="1.2" />

            {/* Level 2: Subfolder /bin */}
            <g transform="translate(10, 32)">
              <rect width="30" height="14" rx="2" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1" />
              <text x="15" y="10" fill="#c7d2fe" fontSize="7" fontFamily="monospace" textAnchor="middle">
                bin/
              </text>
              <line x1="15" y1="46" x2="15" y2="54" stroke="#818cf8" strokeWidth="1" strokeDasharray="2 2" />
              <text x="15" y="62" fill="#94a3b8" fontSize="6" fontFamily="monospace" textAnchor="middle">
                bash
              </text>
            </g>

            {/* Level 2: Subfolder /home */}
            <g transform="translate(64, 32)">
              <rect width="32" height="14" rx="2" fill="#064e3b" stroke="#34d399" strokeWidth="1.2" />
              <text x="16" y="10" fill="#a7f3d0" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                home/
              </text>
              {/* Cabang ke subfolder user */}
              <path d="M16,14 L16,22 L16,30" fill="none" stroke="#34d399" strokeWidth="1" />
            </g>

            {/* Level 2: Subfolder /etc */}
            <g transform="translate(120, 32)">
              <rect width="30" height="14" rx="2" fill="#3b0764" stroke="#c084fc" strokeWidth="1" />
              <text x="15" y="10" fill="#e9d5ff" fontSize="7" fontFamily="monospace" textAnchor="middle">
                etc/
              </text>
              <text x="15" y="24" fill="#94a3b8" fontSize="6" fontFamily="monospace" textAnchor="middle">
                conf
              </text>
            </g>

            {/* Level 3: Cascading Child /home/astronaut */}
            <g transform="translate(52, 64)">
              <rect width="56" height="15" rx="2" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.2" />
              <text x="28" y="11" fill="#67e8f9" fontSize="6.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                astronaut/
              </text>

              {/* Level 4: Daun Pohon (Files) */}
              <line x1="28" y1="15" x2="10" y2="25" stroke="#22d3ee" strokeWidth="0.8" />
              <line x1="28" y1="15" x2="46" y2="25" stroke="#22d3ee" strokeWidth="0.8" />
              <text x="10" y="33" fill="#cbd5e1" fontSize="5.5" fontFamily="monospace" textAnchor="middle">
                notes.txt
              </text>
              <text x="46" y="33" fill="#cbd5e1" fontSize="5.5" fontFamily="monospace" textAnchor="middle">
                game.ts
              </text>
            </g>
          </svg>
        </div>

        {/* Indicator Badge Info */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="rounded bg-purple-400 px-2 py-0.5 text-[9px] font-black text-black shadow-[0_0_10px_#c084fc]">
            [Klik] Pohon Direktori Hirarki
          </span>
        </div>
      </div>

      {/* ========================================================
          MODAL DETAIL PENJELASAN SAAT NODE DIKLIK
         ======================================================== */}
      {activeInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-cyan-400/50 bg-[#0c0822]/95 p-6 text-[#e9e4ff] shadow-[0_0_50px_rgba(34,211,238,0.3)]">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
                <h3 className="font-mono text-base font-bold text-[#ffb347]">
                  {activeInfo === "single" && "1. SINGLE-LEVEL DIRECTORY"}
                  {activeInfo === "two-level" && "2. TWO-LEVEL DIRECTORY"}
                  {activeInfo === "tree" && "3. TREE-STRUCTURED DIRECTORY"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveInfo(null)}
                className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white"
              >
                ✕ Tutup (ESC)
              </button>
            </div>

            {/* Isi Konten Edukasi Spesifik */}
            <div className="mt-4 space-y-4 text-xs md:text-sm leading-relaxed text-gray-200 font-sans">
              {activeInfo === "single" && (
                <>
                  <p>
                    <strong className="text-cyan-300">Single-Level Directory</strong> adalah bentuk struktur direktori paling sederhana dalam sistem operasi. Semua file dari semua pengguna diletakkan dalam satu direktori tunggal yang sama.
                  </p>
                  <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3">
                    <span className="font-mono font-bold text-rose-300 block mb-1">
                      ⚠️ Masalah Utama: Name Collision (Tabrakan Nama File)
                    </span>
                    <p className="text-gray-300 text-xs">
                      Karena hanya ada satu direktori, tidak boleh ada dua file dengan nama yang sama, meskipun dibuat oleh pengguna yang berbeda. Jika User A membuat file <code className="text-amber-300">data.txt</code>, maka User B tidak bisa membuat file dengan nama yang sama.
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    <strong>Karakteristik:</strong> Sangat mudah diimplementasikan, namun tidak cocok untuk sistem multi-user atau disk berukuran besar.
                  </div>
                </>
              )}

              {activeInfo === "two-level" && (
                <>
                  <p>
                    <strong className="text-cyan-300">Two-Level Directory</strong> membagi struktur menjadi dua lapisan:
                  </p>
                  <ul className="space-y-2 text-xs md:text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-mono font-bold">• MFD (Master File Directory):</span>
                      <span>Direktori induk utama yang mencatat daftar semua pengguna di sistem.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-400 font-mono font-bold">• UFD (User File Directory):</span>
                      <span>Setiap pengguna memiliki direktori pribadinya sendiri yang berdiri terpisah.</span>
                    </li>
                  </ul>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3">
                    <span className="font-mono font-bold text-emerald-300 block mb-1">
                      ✅ Solusi Name Collision
                    </span>
                    <p className="text-gray-300 text-xs">
                      User 1 dan User 2 dapat sama-sama memiliki file bernama <code className="text-emerald-300">test.txt</code> tanpa bentrok karena jalurnya berbeda: <code className="text-cyan-200">/User1/test.txt</code> dan <code className="text-purple-200">/User2/test.txt</code>.
                    </p>
                  </div>
                </>
              )}

              {activeInfo === "tree" && (
                <>
                  <p>
                    <strong className="text-purple-300">Tree-Structured Directory</strong> adalah standar yang digunakan pada sistem operasi modern (seperti Linux, Windows, macOS). Struktur direktori berbentuk pohon hierarkis dengan root direktori (<code className="text-cyan-300">/</code> atau <code className="text-cyan-300">C:\</code>) sebagai pangkal.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs">
                    <div className="rounded-lg bg-black/40 border border-purple-500/30 p-2.5">
                      <span className="text-purple-300 font-bold block mb-1">Path Absolut (Full Path):</span>
                      Dimulai dari root hingga file sasaran, misal: <code className="text-cyan-300">/home/astronaut/notes.txt</code>
                    </div>
                    <div className="rounded-lg bg-black/40 border border-cyan-500/30 p-2.5">
                      <span className="text-cyan-300 font-bold block mb-1">Path Relatif:</span>
                      Mengacu pada direktori kerja saat ini (working directory), misal: <code className="text-emerald-300">./notes.txt</code>
                    </div>
                  </div>
                  <div className="text-xs text-gray-300">
                    Mendukung kedalaman direktori tak terbatas, fleksibilitas pengelompokan file, dan proteksi hak akses (permissions) per subdirektori.
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveInfo(null)}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg transition hover:scale-105"
              >
                Tutup Datalog ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

