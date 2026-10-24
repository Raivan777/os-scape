"use client";

import React from "react";

interface OSMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OSMaterialModal({ isOpen, onClose }: OSMaterialModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cyan-400/40 bg-[#0d091e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_50px_rgba(34,211,238,0.25)]">
        {/* Header Terminal */}
        <div className="flex items-center justify-between border-b border-purple-500/30 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
            <h2 className="text-xl font-bold tracking-wide text-[#ffb347]">
              OMNI DATALOG // PINTU 1: PROSES & THREAD
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1 text-sm text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕ Tutup (ESC)
          </button>
        </div>

        {/* Konten Edukasi */}
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-gray-200">
          {/* Bagian 1: Proses vs Thread */}
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-base font-semibold text-cyan-300">
              1. Konsep Proses vs Thread
            </h3>
            <p className="mt-2 text-gray-300">
              • <strong className="text-white">Proses</strong> adalah program yang sedang dieksekusi di memori, memiliki ruang alamat (address space) independen, PCB (Process Control Block), dan sumber daya terisolasi.
            </p>
            <p className="mt-1 text-gray-300">
              • <strong className="text-white">Thread (Lightweight Process)</strong> adalah unit dasar pemanfaatan CPU di dalam suatu proses. Thread berbagi ruang kode, data, dan file dengan thread lain dalam proses yang sama, namun memiliki PC (Program Counter) dan stack sendiri.
            </p>
          </section>

          {/* Bagian 2: Penjadwalan CPU */}
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-base font-semibold text-[#ffb347]">
              2. Algoritma Penjadwalan CPU (CPU Scheduling)
            </h3>
            <p className="mt-2 text-gray-300">
              Ketika banyak proses antre di memori, OS memerlukan algoritma penjadwalan agar CPU bekerja optimal:
            </p>
            <ul className="mt-2 space-y-2 text-xs md:text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono font-bold">FCFS:</span>
                <span>First-Come, First-Served. Sederhana, namun rentan mengalami <em>Convoy Effect</em> (proses pendek menunggu proses panjang).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono font-bold">SJF:</span>
                <span>Shortest Job First. Memprioritaskan durasi eksekusi terpendek, optimal untuk rata-rata waktu tunggu, tapi berisiko kelaparan (<em>starvation</em>) bagi proses panjang.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono font-bold">Round Robin (RR):</span>
                <span>Menggunakan jatah waktu giliran tetap (<strong>Time Quantum</strong>). Setiap proses diberi giliran secara bergilir (preemptive) sehingga sangat adil untuk sistem interaktif dan mencegah starvation.</span>
              </li>
            </ul>
          </section>

          {/* Tips Kunci Gerbang Portal */}
          <div className="rounded-xl border border-amber-400/30 bg-amber-950/20 p-4 text-amber-200">
            <p className="font-semibold text-amber-300">
              💡 Catatan Kunci Gerbang Portal:
            </p>
            <p className="mt-1 text-xs">
              Portal kapal alien dijaga firewall OMNI. Untuk membuka gerbang berikutnya, kamu harus membuktikan pemahamanmu mengenai bagaimana OS membagi waktu CPU secara adil tanpa kelaparan proses!
            </p>
          </div>
        </div>

        {/* Footer Aksi */}
        <div className="mt-6 flex justify-end border-t border-purple-500/30 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 font-bold text-white shadow-[0_0_20px_rgba(34,211,238,0.4)] transition hover:scale-105 active:scale-95"
          >
            Lanjutkan Perjalanan ➔
          </button>
        </div>
      </div>
    </div>
  );
}

