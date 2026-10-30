"use client";

import React from "react";

interface DiskMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiskMaterialModal({ isOpen, onClose }: DiskMaterialModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-cyan-400/50 bg-[#0b081e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_60px_rgba(34,211,238,0.3)]">
        {/* Header Terminal */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
            <div>
              <h2 className="text-lg md:text-xl font-bold tracking-wide text-[#ffb347]">
                OMNI DATALOG // STAGE 5: PENJADWALAN HEAD DISK
              </h2>
              <p className="text-xs text-cyan-300/80 font-mono">
                Storage Core Architecture & Disk Scheduling Algorithms
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
          {/* Bagian 1: Anatomi Fisik Disk & Silinder */}
          <section className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-base mb-2">
              <span>💾</span>
              <h3>1. Anatomi Disk Storage: Platter, Track, & Silinder</h3>
            </div>
            <p className="text-gray-300 text-xs md:text-sm">
              Hard disk magnetik terdiri dari satu atau beberapa piringan bundar (<strong className="text-cyan-200">Platters</strong>) yang diputar oleh motor spindel. Permukaan piringan dibagi menjadi lingkaran-lingkaran konsentris bernama <strong className="text-cyan-200">Tracks</strong>, dan tiap track dipecah lagi menjadi bagian-bagian data kecil berukuran tetap bernama <strong className="text-cyan-200">Sectors</strong> (umumnya 512 byte atau 4 KB).
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div className="rounded-lg border border-purple-500/30 bg-[#160d33] p-3">
                <span className="text-purple-300 font-bold block mb-1">🎯 Silinder (Cylinder):</span>
                Kumpulan track dengan nomor radius yang sama pada seluruh permukaan piringan (platters) yang tersusun bertingkat vertikal.
              </div>
              <div className="rounded-lg border border-cyan-500/30 bg-[#0d2133] p-3">
                <span className="text-cyan-300 font-bold block mb-1">🦾 Head & Actuator Arm:</span>
                Semua read/write head terpasang pada satu lengan mekanik yang sama, bergerak serentak masuk dan keluar melintasi silinder.
              </div>
            </div>
          </section>

          {/* Bagian 2: Waktu Akses Disk (Disk Access Time) */}
          <section className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-4">
            <div className="flex items-center gap-2 text-[#ffb347] font-bold text-base mb-2">
              <span>⏱️</span>
              <h3>2. Tiga Komponen Waktu Akses Disk</h3>
            </div>
            <div className="space-y-2.5 text-xs md:text-sm text-gray-300">
              <div className="flex items-start gap-3 rounded-lg bg-black/40 p-2.5 border border-white/5">
                <span className="font-mono font-bold text-amber-400 min-w-[130px]">1. Seek Time:</span>
                <span>Waktu yang dibutuhkan oleh lengan mekanik (head) untuk berpindah ke track/silinder tempat data berada. <em>Inilah komponen paling lambat dan menjadi fokus utama penjadwalan disk!</em></span>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-black/40 p-2.5 border border-white/5">
                <span className="font-mono font-bold text-cyan-400 min-w-[130px]">2. Rotational Latency:</span>
                <span>Waktu yang dibutuhkan hingga piringan disk berputar membawa sektor yang diinginkan tepat ke bawah read/write head.</span>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-black/40 p-2.5 border border-white/5">
                <span className="font-mono font-bold text-emerald-400 min-w-[130px]">3. Transfer Time:</span>
                <span>Waktu nyata perpindahan bit data antara permukaan piringan disk dan memori utama komputer.</span>
              </div>
            </div>
          </section>

          {/* Bagian 3: Tiga Algoritma Penjadwalan Disk */}
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-base mb-3">
              <span>⚙️</span>
              <h3>3. Tiga Algoritma Penjadwalan Head Disk Utama</h3>
            </div>

            <div className="space-y-4">
              {/* Algoritma 1: FCFS */}
              <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono font-bold text-blue-300 text-sm">
                    A. FCFS (First-Come, First-Served Disk)
                  </h4>
                  <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300 font-mono">
                    Paling Sederhana
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-300">
                  Melayani permintaan blok silinder persis sesuai urutan antrean kedatangan tanpa melakukan penataan ulang.
                </p>
                <div className="mt-2 text-[11px] grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-400">
                  <div><strong className="text-emerald-400">Kelebihan:</strong> Sangat adil, tidak ada permintaan yang kelaparan (no starvation).</div>
                  <div><strong className="text-rose-400">Kelemahan:</strong> Gerakan head bolak-balik sangat jauh dan boros waktu (total seek distance tinggi).</div>
                </div>
              </div>

              {/* Algoritma 2: SSTF */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono font-bold text-amber-300 text-sm">
                    B. SSTF (Shortest Seek Time First)
                  </h4>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300 font-mono">
                    Greedy Terdekat
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-300">
                  Dari posisi head saat ini, SSTF selalu memilih permintaan silinder berikutnya yang memiliki jarak seek paling minimal.
                </p>
                <div className="mt-2 text-[11px] grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-400">
                  <div><strong className="text-emerald-400">Kelebihan:</strong> Menurunkan rata-rata waktu pencarian (seek time) secara signifikan.</div>
                  <div><strong className="text-rose-400">Kelemahan:</strong> Berisiko tinggi terjadi <em>Starvation</em> pada silinder yang jauh bila permintaan terus berdatangan di area silinder dekat.</div>
                </div>
              </div>

              {/* Algoritma 3: SCAN */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono font-bold text-emerald-300 text-sm">
                    C. SCAN (Elevator Algorithm)
                  </h4>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 font-mono">
                    Prinsip Lift Gedung
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-300">
                  Lengan head bergerak terus ke satu arah (misal ke silinder terluar 199) melayani semua permintaan di jalurnya, lalu setelah mencapai tepi disk, berbalik arah melayani permintaan di arah sebaliknya.
                </p>
                <div className="mt-2 text-[11px] grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-400">
                  <div><strong className="text-emerald-400">Kelebihan:</strong> Mencegah starvation, variasi waktu tunggu seragam dan performa stabil.</div>
                  <div><strong className="text-rose-400">Kelemahan:</strong> Tetap harus menempuh hingga ujung silinder meskipun tidak ada request di tepi disk.</div>
                </div>
              </div>
            </div>
          </section>

          {/* Bagian 4: Rintangan Sektor Rusak & Kalibrasi */}
          <section className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-base mb-2">
              <span>⚠️</span>
              <h3>4. Rintangan Bad Sector & Kalibrasi Head Laser</h3>
            </div>
            <p className="text-xs md:text-sm text-gray-300">
              Pada media penyimpanan fisik, kerap ditemukan <strong className="text-rose-400">Bad Sectors</strong> akibat keausan magnetik atau distorsi fluks. Pengontrol disk modern menandai sektor ini pada <em>Defect List</em> agar head laser tidak membaca data korup. Di mini-game kalibrasi, pemain harus memandu laser head menjauhi anomali bad sector ini!
            </p>
          </section>
        </div>

        {/* Footer Modal */}
        <div className="mt-6 flex justify-end border-t border-cyan-500/30 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition hover:scale-105"
          >
            Paham, Mulai Kalibrasi! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}

