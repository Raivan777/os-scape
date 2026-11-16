"use client";

import React, { useEffect } from "react";

interface MemoryMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoryMaterialModal({
  isOpen,
  onClose,
}: MemoryMaterialModalProps) {
  // Dukungan tombol Escape untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-cyan-400/50 bg-[#0b081e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_60px_rgba(34,211,238,0.3)]">
        {/* Header Terminal */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
            <div>
              <h2 className="text-lg md:text-xl font-bold tracking-wide text-[#ffb347]">
                OMNI DATALOG // STAGE 2: ALOKASI MEMORI KONTIGU
              </h2>
              <p className="text-xs text-cyan-300/80 font-mono">
                Contiguous Memory Allocation & Dynamic Partitioning Algorithms
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

        {/* Konten Edukasi */}
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-gray-200">
          {/* Bagian 1: Konsep Alokasi Kontigu & Hole */}
          <section className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-base mb-2">
              <span>📦</span>
              <h3>1. Apa itu Alokasi Memori Kontigu & Hole?</h3>
            </div>
            <p className="text-gray-300 text-xs md:text-sm">
              Pada <strong className="text-cyan-200">Alokasi Memori Kontigu</strong>, setiap proses atau kargo dimuat ke dalam blok memori fisik tunggal yang berurutan tanpa terputus. Sistem operasi melacak bagian memori yang kosong sebagai blok bebas bernama <strong className="text-cyan-200">Hole</strong> (lubang partisi).
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div className="rounded-lg border border-purple-500/30 bg-[#160d33] p-3">
                <span className="text-purple-300 font-bold block mb-1">✂️ Pemotongan Partisi (Hole Split):</span>
                Saat kargo menempati hole yang lebih besar, hole tersebut dipecah: sebagian menjadi memori terisi kargo, dan sisanya tetap menjadi hole bebas dengan alamat awal baru.
              </div>
              <div className="rounded-lg border border-cyan-500/30 bg-[#0d2133] p-3">
                <span className="text-cyan-300 font-bold block mb-1">⚡ Alokasi Pas Persis:</span>
                Jika ukuran kargo tepat sama dengan ukuran hole, hole terpakai sempurna (sisa 0 KB) dan dihapus dari daftar ruang bebas.
              </div>
            </div>

            {/* Ilustrasi Bar Memori Sederhana (CSS) */}
            <div className="mt-4 rounded-lg border border-white/10 bg-black/50 p-3">
              <span className="text-[11px] font-mono text-gray-400 block mb-2">
                Ilustrasi Blok Memori Kontigu:
              </span>
              <div className="flex h-8 w-full overflow-hidden rounded-md border border-cyan-500/40 text-[10px] font-mono font-bold">
                <div className="flex items-center justify-center bg-cyan-700/80 text-cyan-100" style={{ width: "25%" }}>
                  Proses A (250 KB)
                </div>
                <div className="flex items-center justify-center bg-[#1a1438] text-amber-300 border-x border-amber-400/40" style={{ width: "35%" }}>
                  Hole #1 (350 KB)
                </div>
                <div className="flex items-center justify-center bg-purple-700/80 text-purple-100" style={{ width: "20%" }}>
                  Proses B (200 KB)
                </div>
                <div className="flex items-center justify-center bg-[#1a1438] text-amber-300 border-l border-amber-400/40" style={{ width: "20%" }}>
                  Hole #2 (200 KB)
                </div>
              </div>
            </div>
          </section>

          {/* Bagian 2: Fragmentasi Eksternal vs Internal */}
          <section className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-4">
            <div className="flex items-center gap-2 text-[#ffb347] font-bold text-base mb-2">
              <span>⚠️</span>
              <h3>2. Fragmentasi: Eksternal vs Internal</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm text-gray-300">
              <div className="rounded-lg bg-black/40 p-3 border border-rose-500/30">
                <span className="font-bold text-rose-300 block mb-1">
                  1. Fragmentasi Eksternal (External Fragmentation):
                </span>
                <p>
                  Terjadi saat <strong>total memori bebas sebenarnya mencukupi</strong> untuk menampung proses, namun memori tersebut terpecah-pecah menjadi lubang-lubang kecil yang tersebar secara terpisah sehingga tidak ada satu pun slot kontigu yang muat.
                </p>
              </div>
              <div className="rounded-lg bg-black/40 p-3 border border-amber-500/30">
                <span className="font-bold text-amber-300 block mb-1">
                  2. Fragmentasi Internal (Internal Fragmentation):
                </span>
                <p>
                  Terjadi pada partisi berukuran tetap (fixed partition), di mana proses dialokasikan ke blok berukuran tetap yang sedikit lebih besar dari kebutuhannya, menyisakan ruang mubazir di dalam partisi tersebut.
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-xs text-emerald-200">
              <strong className="text-emerald-300">💡 Solusi Fragmentasi Eksternal:</strong> Menggunakan teknik <strong>Compaction (Pemadatan Memori)</strong> untuk menggeser proses dan menyatukan semua hole menjadi satu blok besar, atau beralih ke arsitektur <strong>Paging / Segmentasi</strong>.
            </div>
          </section>

          {/* Bagian 3: Tiga Algoritma Alokasi Memori */}
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-base mb-3">
              <span>⚙️</span>
              <h3>3. Tiga Algoritma Alokasi Memori Utama</h3>
            </div>

            <div className="space-y-4">
              {/* First-Fit */}
              <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono font-bold text-blue-300 text-sm">
                    A. First-Fit (Slot Pertama yang Muat)
                  </h4>
                  <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300 font-mono">
                    Paling Cepat
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-300">
                  Memeriksa daftar hole mulai dari awal (alamat terendah) dan langsung mengalokasikan ke hole pertama yang ukurannya cukup.
                </p>
                <div className="mt-2 text-[11px] grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-400">
                  <div><strong className="text-emerald-400">Kelebihan:</strong> Sangat cepat karena tidak perlu memeriksa seluruh slot.</div>
                  <div><strong className="text-rose-400">Kelemahan:</strong> Cenderung memecah partisi awal menjadi potongan kecil-kecil (*fragmentasi di bagian awal*).</div>
                </div>
              </div>

              {/* Best-Fit */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono font-bold text-amber-300 text-sm">
                    B. Best-Fit (Slot Paling Pas)
                  </h4>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300 font-mono">
                    Minimal Sisa
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-300">
                  Memeriksa <strong>seluruh</strong> hole dalam memori dan memilih hole terkecil yang masih muat (selisih ukuran paling minimal).
                </p>
                <div className="mt-2 text-[11px] grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-400">
                  <div><strong className="text-emerald-400">Kelebihan:</strong> Menjaga slot-slot berukuran besar tetap utuh untuk proses besar nanti.</div>
                  <div><strong className="text-rose-400">Kelemahan:</strong> Lebih lambat (harus scan seluruh memori) dan menyisakan lubang-lubang renik (*tiny holes*) yang sulit dipakai lagi.</div>
                </div>
              </div>

              {/* Worst-Fit */}
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono font-bold text-purple-300 text-sm">
                    C. Worst-Fit (Slot Paling Besar)
                  </h4>
                  <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300 font-mono">
                    Maksimal Sisa
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-300">
                  Memeriksa <strong>seluruh</strong> hole dan selalu memilih hole dengan kapasitas terbesar yang muat.
                </p>
                <div className="mt-2 text-[11px] grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-400">
                  <div><strong className="text-emerald-400">Kelebihan:</strong> Sisa ruang partisi setelah pemotongan berukuran cukup besar sehingga bisa dipakai kargo lain.</div>
                  <div><strong className="text-rose-400">Kelemahan:</strong> Cepat menghabiskan partisi raksasa yang krusial bagi kargo bervolume besar.</div>
                </div>
              </div>
            </div>
          </section>

          {/* Bagian 4: Tabel Contoh Skenario Standar */}
          <section className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-base mb-2">
              <span>📊</span>
              <h3>4. Studi Kasus Skenario Standar</h3>
            </div>
            <p className="text-xs text-gray-300 mb-3">
              Diberikan Hole Awal: <code className="text-amber-300 font-mono">[100, 500, 200, 300, 600] KB</code> dan antrean Kargo: <code className="text-cyan-300 font-mono">[212, 417, 112, 426] KB</code>.
            </p>

            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-black/60 text-cyan-300 border-b border-white/10">
                  <tr>
                    <th className="p-2.5">Kargo (KB)</th>
                    <th className="p-2.5">First-Fit</th>
                    <th className="p-2.5">Best-Fit</th>
                    <th className="p-2.5">Worst-Fit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-black/30">
                  <tr>
                    <td className="p-2.5 font-bold text-white">1. C1 (212 KB)</td>
                    <td className="p-2.5 text-blue-300">Slot 500 (sisa 288)</td>
                    <td className="p-2.5 text-amber-300">Slot 300 (sisa 88)</td>
                    <td className="p-2.5 text-purple-300">Slot 600 (sisa 388)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">2. C2 (417 KB)</td>
                    <td className="p-2.5 text-blue-300">Slot 600 (sisa 183)</td>
                    <td className="p-2.5 text-amber-300">Slot 500 (sisa 83)</td>
                    <td className="p-2.5 text-purple-300">Slot 500 (sisa 83)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">3. C3 (112 KB)</td>
                    <td className="p-2.5 text-blue-300">Slot 288 (sisa 176)</td>
                    <td className="p-2.5 text-amber-300">Slot 200 (sisa 88)</td>
                    <td className="p-2.5 text-purple-300">Slot 388 (sisa 276)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-white">4. C4 (426 KB)</td>
                    <td className="p-2.5 font-bold text-rose-400">❌ GAGAL (Tolak)</td>
                    <td className="p-2.5 font-bold text-emerald-400">✅ Slot 600 (sisa 174)</td>
                    <td className="p-2.5 font-bold text-rose-400">❌ GAGAL (Tolak)</td>
                  </tr>
                  <tr className="bg-white/[0.04] font-bold">
                    <td className="p-2.5 text-gray-200">Status Akhir</td>
                    <td className="p-2.5 text-rose-300">3/4 Berhasil (75%)</td>
                    <td className="p-2.5 text-emerald-300">4/4 Berhasil (100%)</td>
                    <td className="p-2.5 text-rose-300">3/4 Berhasil (75%)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-gray-400 italic">
              *Pada skenario ini, Best-Fit unggul telak karena menghemat partisi besar 600 KB untuk kargo terakhir (426 KB).
            </p>
          </section>

          {/* Bagian 5: Metrik Evaluasi */}
          <section className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-4">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-base mb-2">
              <span>📈</span>
              <h3>5. Metrik Kunci Evaluasi Alokasi Memori</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-300">
              <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
                <strong className="text-cyan-300">Pemanfaatan Memori (Utilization %):</strong> Persentase memori yang berhasil dimuat kargo dari total kapasitas memori awal.
              </div>
              <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
                <strong className="text-rose-300">Sisa Fragmentasi Eksternal:</strong> Total memori bebas dikurangi hole terbesar yang tersisa saat terjadi penolakan alokasi.
              </div>
              <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
                <strong className="text-amber-300">Jumlah Slot Diperiksa:</strong> Indikator overhead komputasi CPU dalam mencari partisi kosong sebelum alokasi terjadi.
              </div>
              <div className="rounded-lg bg-black/40 p-2.5 border border-white/5">
                <strong className="text-emerald-300">Kapasitas Hole Terbesar:</strong> Menentukan batas atas ukuran kargo berikutnya yang masih bisa diterima sistem.
              </div>
            </div>
          </section>
        </div>

        {/* Footer Modal */}
        <div className="mt-6 flex justify-end border-t border-cyan-500/30 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition hover:scale-105"
          >
            Paham, Buka Ruang Kargo! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}

