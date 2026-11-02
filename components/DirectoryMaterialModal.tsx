"use client";

import React, { useEffect } from "react";

interface DirectoryMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * components/DirectoryMaterialModal.tsx
 *
 * Modal Datalog Edukasi Struktur dan Organisasi Direktori Sistem Operasi.
 * Memuat materi lengkap mengenai:
 * 1. Single-Level Directory & Masalah Name Collision
 * 2. Two-Level Directory (Master File Directory & User File Directory)
 * 3. Tree-Structured Directory (Struktur Pohon Hierarkis Modern)
 * 4. Ringkasan Tabel Metrik Perbandingan & Petunjuk Praktikum Search Lab.
 */
export default function DirectoryMaterialModal({
  isOpen,
  onClose,
}: DirectoryMaterialModalProps) {
  // Dukungan tombol Escape untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-cyan-400/50 bg-[#0b081e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_60px_rgba(34,211,238,0.3)]">
        {/* ─── HEADER TERMINAL ────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
            <div>
              <h2 className="text-lg md:text-xl font-bold tracking-wide text-[#ffb347] font-mono">
                OMNI DATALOG // STAGE 5: STRUKTUR & ORGANISASI DIREKTORI
              </h2>
              <p className="text-xs text-cyan-300/80 font-mono">
                File System Directory Structures & Hierarchical Organization
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs md:text-sm text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕ Tutup (ESC)
          </button>
        </div>

        {/* ─── KONTEN EDUKASI DIREKTORI ─────────────────────────────── */}
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-gray-200">
          {/* Bagian 1: Single-Level Directory */}
          <section className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-blue-300 font-bold text-base">
                <span>📁</span>
                <h3>1. Single-Level Directory (Direktori Satu Tingkat)</h3>
              </div>
              <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300 font-mono">
                Paling Sederhana
              </span>
            </div>
            <p className="text-gray-300 text-xs md:text-sm">
              Semua berkas dari seluruh pengguna diletakkan dalam satu direktori tunggal yang sama (<code className="text-cyan-200">root</code>). Tidak ada pemisahan folder antar-pengguna.
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded-lg border border-emerald-500/30 bg-black/40 p-3">
                <span className="text-emerald-300 font-bold block mb-1">✅ Kelebihan:</span>
                Sangat mudah diimplementasikan, penelusuran berkas hanya pada satu daftar tunggal.
              </div>
              <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3">
                <span className="text-rose-300 font-bold block mb-1">⚠️ Kekurangan & Masalah:</span>
                <strong className="text-rose-200">Name Collision</strong> (tabrakan nama berkas). Tidak boleh ada dua berkas dengan nama yang sama, meskipun dibuat oleh pengguna yang berbeda. Tidak ada pengelompokan berkas.
              </div>
            </div>
          </section>

          {/* Bagian 2: Two-Level Directory */}
          <section className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-base">
                <span>📂</span>
                <h3>2. Two-Level Directory (Direktori Dua Tingkat)</h3>
              </div>
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-300 font-mono">
                Isolasi Per Pengguna
              </span>
            </div>
            <p className="text-gray-300 text-xs md:text-sm">
              Memisahkan struktur direktori menjadi dua tingkat hierarki:
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono font-bold">• MFD (Master File Directory):</span>
                <span>Tingkat pertama yang mencatat direktori untuk masing-masing pengguna di sistem.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-mono font-bold">• UFD (User File Directory):</span>
                <span>Tingkat kedua, setiap pengguna memiliki UFD sendiri yang menyimpan berkas-berkasnya.</span>
              </li>
            </ul>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded-lg border border-emerald-500/30 bg-black/40 p-3">
                <span className="text-emerald-300 font-bold block mb-1">✅ Solusi Name Collision:</span>
                Pengguna yang berbeda dapat memiliki berkas bernama sama (misal <code className="text-cyan-300">/alpha/flight_log.txt</code> dan <code className="text-purple-300">/beta/flight_log.txt</code>) tanpa bentrok.
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/30 p-3">
                <span className="text-amber-300 font-bold block mb-1">⚠️ Kekurangan:</span>
                Isolasi terlalu kaku; sulit berbagi berkas antar pengguna dan pengguna tidak dapat membuat subfolder sendiri di dalam UFD.
              </div>
            </div>
          </section>

          {/* Bagian 3: Tree-Structured Directory */}
          <section className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-base">
                <span>🌲</span>
                <h3>3. Tree-Structured Directory (Direktori Struktur Pohon)</h3>
              </div>
              <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300 font-mono">
                Standar OS Modern
              </span>
            </div>
            <p className="text-gray-300 text-xs md:text-sm">
              Struktur direktori pohon hierarkis yang menjadi standar sistem operasi modern (Linux, Unix, Windows, macOS). Dimulai dari akar (<code className="text-cyan-300">/</code> atau <code className="text-cyan-300">C:\</code>) dan dapat memiliki subdirektori dengan kedalaman tak terbatas.
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded-lg border border-cyan-500/30 bg-black/40 p-3">
                <span className="text-cyan-300 font-bold block mb-1">📍 Path Absolut vs Relatif:</span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  • <strong>Absolut:</strong> Dari akar, misal <code className="text-cyan-200">/home/alpha/missions/mission_plan.md</code>.<br />
                  • <strong>Relatif:</strong> Dari direktori kerja saat ini, misal <code className="text-emerald-300">./mission_plan.md</code>.
                </p>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-black/40 p-3">
                <span className="text-emerald-300 font-bold block mb-1">✅ Keunggulan Utama:</span>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  Skalabilitas tinggi, pengelompokan logis berkas secara bebas, kemudahan pengelolaan hak akses (permissions) per cabang pohon.
                </p>
              </div>
            </div>
          </section>

          {/* Bagian 4: Ringkasan Metrik Perbandingan */}
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-base font-semibold text-[#ffb347] mb-3 font-mono">
              📊 4. Ringkasan Metrik Perbandingan Antar Struktur
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-white/20 text-gray-400 text-[10px]">
                    <th className="py-2 px-2.5">FITUR / METRIK</th>
                    <th className="py-2 px-2.5">SINGLE-LEVEL</th>
                    <th className="py-2 px-2.5">TWO-LEVEL</th>
                    <th className="py-2 px-2.5">TREE-STRUCTURED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-gray-300 text-[11px]">
                  <tr>
                    <td className="py-2 px-2.5 font-bold text-white">Kedalaman (Depth)</td>
                    <td className="py-2 px-2.5 text-blue-300">1 Level (Flat)</td>
                    <td className="py-2 px-2.5 text-cyan-300">2 Level (MFD → UFD)</td>
                    <td className="py-2 px-2.5 text-purple-300">N Level (Hierarkis)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5 font-bold text-white">Name Collision</td>
                    <td className="py-2 px-2.5 text-rose-400 font-bold">Tinggi (Ditolak)</td>
                    <td className="py-2 px-2.5 text-emerald-400">Nol Antar-User</td>
                    <td className="py-2 px-2.5 text-emerald-400">Nol Antar-Folder</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5 font-bold text-white">Langkah Pencarian</td>
                    <td className="py-2 px-2.5">Scan linier seluruh file</td>
                    <td className="py-2 px-2.5">Scan MFD + UFD user</td>
                    <td className="py-2 px-2.5">Telusuri cabang path spesifik</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2.5 font-bold text-white">Pengelompokan</td>
                    <td className="py-2 px-2.5 text-gray-500">Tidak ada</td>
                    <td className="py-2 px-2.5">Hanya per pengguna</td>
                    <td className="py-2 px-2.5 text-emerald-300">Subfolder bebas &amp; fleksibel</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Petunjuk Praktikum Search Lab */}
            <div className="mt-4 rounded-lg border border-cyan-400/40 bg-cyan-950/40 p-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-cyan-300 block">💡 Ingin Menguji Simulasi Langkah Pencarian Nyata?</span>
                <span className="text-gray-300 text-[11px]">
                  Buka tab <strong>&quot;🔎 Search Lab&quot;</strong> pada Terminal Directory Architect untuk melihat animasi penelusuran berkas secara langsung!
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* ─── FOOTER MODAL ────────────────────────────────────────── */}
        <div className="mt-6 flex justify-end border-t border-cyan-500/30 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition hover:scale-105"
          >
            Paham, Kembali ke Stasiun ➔
          </button>
        </div>
      </div>
    </div>
  );
}

