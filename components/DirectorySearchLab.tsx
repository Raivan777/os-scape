"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Owner,
  OWNERS,
  FILES,
  searchAll,
  SearchResult,
} from "@/utils/directoryLogic";

/**
 * components/DirectorySearchLab.tsx
 *
 * Komponen Laboratorium Pencarian Direktori Interaktif.
 * Memvisualisasikan perbandingan pencarian berkas langkah-demi-langkah
 * pada 3 arsitektur direktori:
 * 1. Single-Level Directory
 * 2. Two-Level Directory (MFD & UFD)
 * 3. Tree-Structured Directory
 *
 * Dilengkapi animasi penelusuran (450ms per langkah) dan tabel perbandingan metrik.
 */
export default function DirectorySearchLab() {
  // Input nama berkas dan pemilik
  const [fileName, setFileName] = useState<string>("flight_log.txt");
  const [selectedOwner, setSelectedOwner] = useState<Owner>("alpha");

  // State hasil pencarian dari directoryLogic
  const [results, setResults] = useState<[SearchResult, SearchResult, SearchResult] | null>(null);

  // State langkah yang sedang tampil (untuk animasi bertahap)
  const [visibleStepCount, setVisibleStepCount] = useState<{
    single: number;
    twoLevel: number;
    tree: number;
  }>({ single: 0, twoLevel: 0, tree: 0 });

  // State status animasi
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [allFinished, setAllFinished] = useState<boolean>(false);

  // Ref untuk menyimpan timeout agar bisa dibersihkan saat cleanup
  const timerRefs = useRef<NodeJS.Timeout[]>([]);

  // Fungsi pembersihan semua timer aktif
  const clearAllTimers = () => {
    timerRefs.current.forEach((t) => clearTimeout(t));
    timerRefs.current = [];
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  // Reset hasil setiap kali input teks atau pemilik berubah
  const handleFileNameChange = (newVal: string) => {
    clearAllTimers();
    setFileName(newVal);
    setResults(null);
    setIsSearching(false);
    setAllFinished(false);
    setVisibleStepCount({ single: 0, twoLevel: 0, tree: 0 });
  };

  const handleOwnerChange = (newOwner: Owner) => {
    clearAllTimers();
    setSelectedOwner(newOwner);
    setResults(null);
    setIsSearching(false);
    setAllFinished(false);
    setVisibleStepCount({ single: 0, twoLevel: 0, tree: 0 });
  };

  // Pilih cepat dari dataset FILES
  const handleQuickSelect = (name: string, owner: Owner) => {
    clearAllTimers();
    setFileName(name);
    setSelectedOwner(owner);
    setResults(null);
    setIsSearching(false);
    setAllFinished(false);
    setVisibleStepCount({ single: 0, twoLevel: 0, tree: 0 });
  };

  // Menjalankan simulasi pencarian serentak dengan animasi
  const handleExecuteSearch = () => {
    if (!fileName.trim()) return;

    clearAllTimers();
    const searchRes = searchAll(fileName.trim(), selectedOwner);
    setResults(searchRes);
    setIsSearching(true);
    setAllFinished(false);
    setVisibleStepCount({ single: 0, twoLevel: 0, tree: 0 });

    const [resSingle, resTwoLevel, resTree] = searchRes;
    const maxSteps = Math.max(
      resSingle.steps.length,
      resTwoLevel.steps.length,
      resTree.steps.length
    );

    const STEP_DELAY = 450; // 450 ms per langkah sesuai spesifikasi

    // Jadwalkan pembukaan langkah demi langkah
    for (let step = 1; step <= maxSteps; step++) {
      const t = setTimeout(() => {
        setVisibleStepCount({
          single: Math.min(step, resSingle.steps.length),
          twoLevel: Math.min(step, resTwoLevel.steps.length),
          tree: Math.min(step, resTree.steps.length),
        });

        if (step === maxSteps) {
          setIsSearching(false);
          setAllFinished(true);
        }
      }, step * STEP_DELAY);

      timerRefs.current.push(t);
    }
  };

  // Cari jumlah langkah terkecil untuk disorot pada tabel
  const minSteps = results
    ? Math.min(
        results[0].steps.length,
        results[1].steps.length,
        results[2].steps.length
      )
    : 0;

  return (
    <div className="space-y-5 text-white font-mono select-none">
      {/* ─── 1. PANEL FORM INPUT & PILIH CEPAT ───────────────────────── */}
      <div className="rounded-xl border border-cyan-500/30 bg-[#0d0926] p-4 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
        <div className="flex flex-col md:flex-row gap-3 items-end">
          {/* Input Nama Berkas */}
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-cyan-300 mb-1">
              NAMA BERKAS TARGET:
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => handleFileNameChange(e.target.value)}
              placeholder="misal: flight_log.txt"
              className="w-full rounded-lg border border-cyan-500/40 bg-black/60 px-3 py-2 text-xs text-cyan-100 placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          {/* Select Pemilik Berkas */}
          <div className="w-full md:w-48">
            <label className="block text-xs font-bold text-cyan-300 mb-1">
              PEMILIK (OWNER):
            </label>
            <select
              value={selectedOwner}
              onChange={(e) => handleOwnerChange(e.target.value as Owner)}
              className="w-full rounded-lg border border-cyan-500/40 bg-black/60 px-3 py-2 text-xs text-cyan-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              {OWNERS.map((o) => (
                <option key={o} value={o} className="bg-[#0d0926] text-white">
                  {o} ({o === "system" ? "/opt/station" : `/home/${o}`})
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Jalankan Pencarian */}
          <button
            type="button"
            onClick={handleExecuteSearch}
            disabled={isSearching || !fileName.trim()}
            className="w-full md:w-auto rounded-lg bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 px-5 py-2 text-xs font-black text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] transition hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isSearching ? "🔍 Menelusuri..." : "🚀 Jalankan Pencarian"}
          </button>
        </div>

        {/* Tombol Pilih Cepat dari Dataset Bersama (8 Berkas) */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <span className="text-[10px] text-gray-400 font-bold block mb-1.5">
            PILIH CEPAT DARI DATASET BERSAMA (FILES):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {FILES.map((f, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickSelect(f.name, f.owner)}
                className={`rounded px-2 py-0.5 text-[10px] transition border ${
                  fileName === f.name && selectedOwner === f.owner
                    ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_8px_#22d3ee]"
                    : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                📄 {f.name} <span className="text-gray-500">({f.owner})</span>
              </button>
            ))}
            {/* Opsi Uji Berkas Tidak Ditemukan */}
            <button
              type="button"
              onClick={() => handleQuickSelect("nope.txt", "beta")}
              className={`rounded px-2 py-0.5 text-[10px] transition border ${
                fileName === "nope.txt" && selectedOwner === "beta"
                  ? "border-rose-400 bg-rose-950/80 text-rose-200"
                  : "border-rose-500/30 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40"
              }`}
            >
              ❌ nope.txt (beta) [Uji Miss]
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. TAMPILAN 3 KOLOM HASIL LANGKAH DEMI LANGKAH ──────────── */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Kolom 1: Single-Level Directory */}
          <div className="flex flex-col rounded-xl border border-blue-500/40 bg-blue-950/20 p-3.5 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            <div className="flex items-center justify-between border-b border-blue-500/30 pb-2 mb-2.5">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase">
                  1. Single-Level Directory
                </span>
                <span className="block text-[9px] text-gray-400">Namespace Datar (Depth: 1)</span>
              </div>
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-300">
                {visibleStepCount.single}/{results[0].steps.length} Langkah
              </span>
            </div>

            {/* Daftar Langkah */}
            <div className="flex-1 space-y-1.5 text-[11px] min-h-[160px]">
              {results[0].steps.slice(0, visibleStepCount.single).map((st, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-2 border transition-all animate-in fade-in duration-200 ${
                    st.hit
                      ? "border-emerald-500/70 bg-emerald-950/50 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      : "border-white/10 bg-black/40 text-gray-300"
                  }`}
                >
                  <span className="text-gray-400 mr-1.5">[{i + 1}]</span>
                  {st.label}
                </div>
              ))}
            </div>

            {/* Catatan Hasil Kolom 1 */}
            {visibleStepCount.single >= results[0].steps.length && (
              <div
                className={`mt-2.5 rounded-lg p-2 text-[10px] border leading-relaxed animate-in fade-in ${
                  results[0].found
                    ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-200"
                    : results[0].steps.some((s) => s.label.includes("Collision"))
                    ? "border-rose-500/60 bg-rose-950/40 text-rose-200 font-bold"
                    : "border-amber-500/50 bg-amber-950/30 text-amber-200"
                }`}
              >
                {results[0].note}
              </div>
            )}
          </div>

          {/* Kolom 2: Two-Level Directory */}
          <div className="flex flex-col rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-3.5 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2 mb-2.5">
              <div>
                <span className="text-[10px] font-bold text-cyan-300 uppercase">
                  2. Two-Level Directory
                </span>
                <span className="block text-[9px] text-gray-400">MFD & UFD (Depth: 2)</span>
              </div>
              <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">
                {visibleStepCount.twoLevel}/{results[1].steps.length} Langkah
              </span>
            </div>

            {/* Daftar Langkah */}
            <div className="flex-1 space-y-1.5 text-[11px] min-h-[160px]">
              {results[1].steps.slice(0, visibleStepCount.twoLevel).map((st, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-2 border transition-all animate-in fade-in duration-200 ${
                    st.hit
                      ? "border-emerald-500/70 bg-emerald-950/50 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      : "border-white/10 bg-black/40 text-gray-300"
                  }`}
                >
                  <span className="text-gray-400 mr-1.5">[{i + 1}]</span>
                  {st.label}
                </div>
              ))}
            </div>

            {/* Catatan Hasil Kolom 2 */}
            {visibleStepCount.twoLevel >= results[1].steps.length && (
              <div
                className={`mt-2.5 rounded-lg p-2 text-[10px] border leading-relaxed animate-in fade-in ${
                  results[1].found
                    ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-200"
                    : "border-amber-500/50 bg-amber-950/30 text-amber-200"
                }`}
              >
                {results[1].note}
              </div>
            )}
          </div>

          {/* Kolom 3: Tree-Structured Directory */}
          <div className="flex flex-col rounded-xl border border-purple-500/40 bg-purple-950/20 p-3.5 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-2 mb-2.5">
              <div>
                <span className="text-[10px] font-bold text-purple-300 uppercase">
                  3. Tree-Structured Directory
                </span>
                <span className="block text-[9px] text-gray-400">Pohon Hierarki (Depth: {results[2].depth})</span>
              </div>
              <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">
                {visibleStepCount.tree}/{results[2].steps.length} Langkah
              </span>
            </div>

            {/* Daftar Langkah */}
            <div className="flex-1 space-y-1.5 text-[11px] min-h-[160px]">
              {results[2].steps.slice(0, visibleStepCount.tree).map((st, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-2 border transition-all animate-in fade-in duration-200 ${
                    st.hit
                      ? "border-emerald-500/70 bg-emerald-950/50 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      : "border-white/10 bg-black/40 text-gray-300"
                  }`}
                >
                  <span className="text-gray-400 mr-1.5">[{i + 1}]</span>
                  {st.label}
                </div>
              ))}
            </div>

            {/* Catatan Hasil Kolom 3 */}
            {visibleStepCount.tree >= results[2].steps.length && (
              <div
                className={`mt-2.5 rounded-lg p-2 text-[10px] border leading-relaxed animate-in fade-in ${
                  results[2].found
                    ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-200"
                    : "border-amber-500/50 bg-amber-950/30 text-amber-200"
                }`}
              >
                {results[2].note}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 3. TABEL PERBANDINGAN METRIK (MUNCUL SETELAH ANIMASI SELESAI) ─── */}
      {allFinished && results && (
        <div className="rounded-xl border border-cyan-500/30 bg-black/60 p-4 shadow-[0_0_25px_rgba(6,182,212,0.2)] animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <h4 className="text-xs font-bold text-cyan-300 tracking-wider uppercase">
              TABEL PERBANDINGAN METRIK PENCARIAN
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/15 text-gray-400 text-[10px]">
                  <th className="py-2 px-3">STRUKTUR</th>
                  <th className="py-2 px-3">LANGKAH PENCARIAN</th>
                  <th className="py-2 px-3">LEVEL DILALUI (DEPTH)</th>
                  <th className="py-2 px-3">NAME COLLISION (DATASET)</th>
                  <th className="py-2 px-3">HASIL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {results.map((res, idx) => {
                  const isLowest = res.steps.length === minSteps;
                  return (
                    <tr
                      key={idx}
                      className={
                        res.structure === "single"
                          ? "bg-blue-950/15"
                          : res.structure === "two-level"
                          ? "bg-cyan-950/15"
                          : "bg-purple-950/15"
                      }
                    >
                      <td className="py-2.5 px-3 font-bold text-gray-200">
                        {res.structure === "single" && "Single-Level Directory"}
                        {res.structure === "two-level" && "Two-Level Directory (MFD/UFD)"}
                        {res.structure === "tree" && "Tree-Structured Directory"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`rounded px-2 py-0.5 font-bold ${
                            isLowest
                              ? "bg-emerald-500 text-black shadow-[0_0_10px_#10b981]"
                              : "bg-white/10 text-gray-300"
                          }`}
                        >
                          {res.steps.length} Langkah {isLowest && "★ (Terkecil)"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-300">
                        {res.depth} Level
                      </td>
                      <td className="py-2.5 px-3">
                        {res.collisions > 0 ? (
                          <span className="text-rose-400 font-bold">
                            {res.collisions} Berkas Ditolak
                          </span>
                        ) : (
                          <span className="text-emerald-400">0 (Bebas Tabrakan)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        {res.found ? (
                          <span className="text-emerald-400">✅ Ditemukan</span>
                        ) : res.steps.some((s) => s.label.includes("Collision")) ? (
                          <span className="text-rose-400">⚠️ Name Collision</span>
                        ) : (
                          <span className="text-gray-500">❌ Tidak Ada</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Catatan Tambahan Skalabilitas & Hierarki */}
          <p className="mt-3 text-[10px] text-gray-400 leading-relaxed border-t border-white/10 pt-2.5">
            <strong className="text-cyan-300">Catatan Analisis:</strong> Pada dataset kecil, Tree-Structured Directory dapat membutuhkan langkah lebih banyak karena menelusuri setiap simpul folder hierarkis. Namun, keunggulan utamanya terletak pada <strong className="text-white">skalabilitas</strong>, <strong className="text-white">proteksi hak akses</strong>, dan <strong className="text-white">kemudahan pengelompokan</strong> ribuan berkas tanpa risiko tabrakan nama antar-pengguna.
          </p>
        </div>
      )}
    </div>
  );
}

