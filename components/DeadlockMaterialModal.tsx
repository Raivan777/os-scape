"use client";

import React, { useState } from "react";

interface DeadlockMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMiniGame?: () => void;
}

export default function DeadlockMaterialModal({
  isOpen,
  onClose,
  onOpenMiniGame,
}: DeadlockMaterialModalProps) {
  const [activeTab, setActiveTab] = useState<
    "coffman" | "rag" | "handling" | "banker" | "philosophers"
  >("coffman");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-purple-500/40 bg-[#0a071a]/95 text-[#e9e4ff] shadow-[0_0_70px_rgba(168,85,247,0.3)]">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-purple-500/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3.5 w-3.5 rounded-full bg-purple-400 animate-ping" />
            <div>
              <h2 className="text-lg md:text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300">
                OMNI DATALOG // STAGE 4: DEADLOCK & PENANGANANNYA
              </h2>
              <p className="text-xs text-purple-300/80 font-mono">
                System Concurrency, Banker's Algorithm, & The Dining Philosophers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕ Tutup (ESC)
          </button>
        </div>

        {/* Tab Navigasi Materi */}
        <div className="flex border-b border-purple-500/20 bg-black/40 px-6 py-2 overflow-x-auto gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("coffman")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === "coffman"
                ? "bg-purple-600/30 text-purple-200 border border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            1. 4 Kondisi Coffman
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rag")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === "rag"
                ? "bg-purple-600/30 text-purple-200 border border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            2. Graf Alokasi (RAG)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("handling")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === "handling"
                ? "bg-purple-600/30 text-purple-200 border border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            3. Metode Penanganan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("banker")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === "banker"
                ? "bg-purple-600/30 text-purple-200 border border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            4. Algoritma Banker
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("philosophers")}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === "philosophers"
                ? "bg-purple-600/30 text-purple-200 border border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            5. Dining Philosophers
          </button>
        </div>

        {/* Konten Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm leading-relaxed text-gray-200">
          {/* TAB 1: 4 KONDISI COFFMAN */}
          {activeTab === "coffman" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
                <h3 className="text-base font-bold text-purple-300 flex items-center gap-2">
                  <span>🔒</span> Apa itu Deadlock?
                </h3>
                <p className="mt-2 text-gray-300 text-xs md:text-sm">
                  <strong>Deadlock (Kebuntuan)</strong> adalah situasi di mana sekumpulan proses terhenti permanen (macet) karena setiap proses sedang memegang sumber daya dan pada saat yang sama sedang menunggu sumber daya lain yang sedang dipegang oleh proses lain dalam kelompok tersebut. Akibatnya, tidak ada satu pun proses yang dapat melanjutkan eksekusinya.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <h4 className="text-sm font-bold text-amber-300 mb-3">
                  Empat Kondisi Karakteristik Coffman (Coffman Conditions)
                </h4>
                <p className="text-xs text-gray-400 mb-3">
                  Deadlock <span className="text-amber-400 font-bold">HANYA DAPAT TERJADI</span> jika keempat kondisi berikut ini terpenuhi secara serentak (simultan):
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3">
                    <span className="font-bold text-red-300 block mb-1">1. Mutual Exclusion:</span>
                    Hanya satu proses pada satu waktu yang dapat menggunakan suatu sumber daya non-sharable. Jika proses lain memintanya, ia harus menunggu hingga sumber daya dilepaskan.
                  </div>
                  <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3">
                    <span className="font-bold text-amber-300 block mb-1">2. Hold and Wait:</span>
                    Suatu proses sedang memegang (menahan) setidaknya satu sumber daya, sambil menunggu untuk mendapatkan sumber daya tambahan yang sedang dipegang oleh proses lain.
                  </div>
                  <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3">
                    <span className="font-bold text-cyan-300 block mb-1">3. No Preemption:</span>
                    Sumber daya tidak dapat dirampas secara paksa dari proses yang sedang memegangnya. Sumber daya hanya dapat dilepaskan secara sukarela oleh proses setelah tugasnya selesai.
                  </div>
                  <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-3">
                    <span className="font-bold text-purple-300 block mb-1">4. Circular Wait:</span>
                    Terdapat rantai proses tertutup: P0 menunggu sumber daya milik P1, P1 menunggu P2, ..., dan Pn menunggu P0. Rantai saling tunggu ini membentuk lingkaran tertutup (siklus).
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-emerald-950/30 border border-emerald-500/30 p-3 text-xs text-emerald-200">
                  <span className="font-bold block text-emerald-300 mb-1">💡 Prinsip Dasar Penanganan Deadlock:</span>
                  Untuk mencegah terjadinya deadlock, sistem hanya perlu menggugurkan (mencegah) <strong>salah satu saja</strong> dari keempat kondisi Coffman di atas!
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GRAF ALOKASI SUMBER DAYA (RAG) */}
          {activeTab === "rag" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
                <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                  <span>🕸️</span> Resource Allocation Graph (RAG)
                </h3>
                <p className="mt-2 text-xs md:text-sm text-gray-300">
                  Kondisi deadlock dapat digambarkan secara grafis menggunakan graf berarah yang disebut <strong>Resource-Allocation Graph (RAG)</strong>. Graf ini terdiri dari himpunan simpul (Nodes) dan sisi berarah (Edges).
                </p>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="rounded-lg border border-white/10 bg-black/40 p-3">
                    <span className="text-cyan-300 font-bold block mb-1">Simpul (Nodes):</span>
                    • Lingkaran = Himpunan Proses P = &#123;P1, P2, ...&#125;<br />
                    • Kotak / Persegi = Himpunan Tipe Sumber Daya R = &#123;R1, R2, ...&#125; (di dalamnya terdapat titik-titik mewakili jumlah unit/instans).
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/40 p-3">
                    <span className="text-pink-300 font-bold block mb-1">Sisi Berarah (Edges):</span>
                    • Request Edge (Permintaan): P_i ➔ R_j (Proses meminta sumber daya)<br />
                    • Assignment Edge (Alokasi): R_j ➔ P_i (Sumber daya telah dialokasikan ke proses).
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs md:text-sm space-y-3">
                <h4 className="font-bold text-amber-300">Teorema Siklus pada RAG:</h4>
                <div className="space-y-2 text-gray-300">
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <strong>1. Jika RAG TIDAK memiliki siklus:</strong> Sistem dipastikan <span className="text-emerald-400 font-bold">TIDAK MENGALAMI DEADLOCK</span>.
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <strong>2. Jika RAG memiliki siklus DAN setiap tipe sumber daya hanya memiliki 1 instans:</strong> Sistem dipastikan <span className="text-red-400 font-bold">PASTI MENGALAMI DEADLOCK</span>.
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                    <strong>3. Jika RAG memiliki siklus TETAPI sumber daya memiliki banyak instans (Multi-instance):</strong> Sistem <span className="text-amber-400 font-bold">MUNGKIN mengalami deadlock</span> (belum tentu, perlu diuji dengan algoritma Banker / Deteksi Deadlock).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 4 METODE PENANGANAN DEADLOCK */}
          {activeTab === "handling" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold mb-2">
                    <span>🛡️</span>
                    <h4>1. Deadlock Prevention (Pencegahan)</h4>
                  </div>
                  <p className="text-gray-300 text-xs">
                    Memastikan secara desain sistem bahwa minimal satu dari 4 kondisi Coffman tidak pernah dapat terpenuhi.
                  </p>
                  <ul className="mt-2 list-disc list-inside space-y-1 text-gray-400 text-xs font-mono">
                    <li>Pencegahan Hold & Wait: Proses harus meminta seluruh sumber daya sekaligus di awal.</li>
                    <li>Pencegahan Circular Wait: Berikan nomor urut global pada setiap sumber daya, proses hanya boleh meminta sumber daya dengan urutan menaik.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold mb-2">
                    <span>🧭</span>
                    <h4>2. Deadlock Avoidance (Penghindaran)</h4>
                  </div>
                  <p className="text-gray-300 text-xs">
                    Sistem memiliki informasi apriori (kebutuhan maksimum setiap proses). Setiap kali ada permintaan, OS mengevaluasi status dinamis alokasi menggunakan <strong>Algoritma Banker</strong> untuk menjamin sistem selalu berada di <strong>Safe State</strong>.
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                  <div className="flex items-center gap-2 text-amber-300 font-bold mb-2">
                    <span>🔍</span>
                    <h4>3. Deadlock Detection & Recovery</h4>
                  </div>
                  <p className="text-gray-300 text-xs">
                    Membiarkan deadlock terjadi, namun sistem secara berkala menjalankan algoritma pendeteksi siklus/macet. Jika deadlock ditemukan, lakukan pemulihan:
                  </p>
                  <ul className="mt-2 list-disc list-inside space-y-1 text-gray-400 text-xs font-mono">
                    <li>Process Termination: Menghentikan (kill) satu atau semua proses yang terlibat.</li>
                    <li>Resource Preemption: Merampas paksa sumber daya dari suatu proses lalu melakukan Rollback.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
                  <div className="flex items-center gap-2 text-purple-300 font-bold mb-2">
                    <span>🦤</span>
                    <h4>4. Ostrich Algorithm (Pengabaian)</h4>
                  </div>
                  <p className="text-gray-300 text-xs">
                    Mengabaikan masalah deadlock seolah-olah hal tersebut tidak pernah terjadi. Pendekatan ini umum dipakai pada OS komersial modern (seperti Windows dan Linux) karena biaya komputasi pencegahan deadlock lebih mahal dibanding frekuensi terjadinya kasus.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ALGORITMA BANKER */}
          {activeTab === "banker" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
                <h3 className="text-base font-bold text-purple-300 flex items-center gap-2">
                  <span>🏦</span> Algoritma Banker (Dijkstra)
                </h3>
                <p className="mt-2 text-xs md:text-sm text-gray-300">
                  Dinamakan demikian karena konsepnya menyerupai bagaimana seorang bankir mengelola kas kredit nasabahnya: bank tidak akan meminjamkan uang kepada nasabah jika sisa kas tidak cukup untuk memenuhi jaminan nasabah lain yang sedang berjalan.
                </p>

                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono text-center">
                  <div className="rounded-lg bg-black/40 border border-cyan-500/30 p-2">
                    <span className="text-cyan-400 font-bold block">Available[m]</span>
                    Vektor sumber daya bebas
                  </div>
                  <div className="rounded-lg bg-black/40 border border-purple-500/30 p-2">
                    <span className="text-purple-400 font-bold block">Max[n][m]</span>
                    Klaim maksimum tiap proses
                  </div>
                  <div className="rounded-lg bg-black/40 border border-amber-500/30 p-2">
                    <span className="text-amber-400 font-bold block">Allocation[n][m]</span>
                    Alokasi saat ini
                  </div>
                  <div className="rounded-lg bg-black/40 border border-emerald-500/30 p-2">
                    <span className="text-emerald-400 font-bold block">Need[n][m]</span>
                    Need = Max - Allocation
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Safety Check */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <span className="font-bold text-cyan-300 block text-sm">
                    A. Banker's Safety Check Algorithm
                  </span>
                  <p className="text-gray-300">
                    Menentukan apakah sistem saat ini berada dalam <strong>Safe State</strong> (kondisi aman):
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-400 font-mono">
                    <li>Inisialisasi: Work = Available, Finish[i] = false untuk semua i.</li>
                    <li>Cari indeks i dengan Finish[i] == false dan Need[i] &lt;= Work.</li>
                    <li>Jika ketemu: Work = Work + Allocation[i], Finish[i] = true. Ulangi langkah 2.</li>
                    <li>Jika semua Finish[i] == true, maka sistem AMAN dengan Urutan Keselamatan (Safe Sequence).</li>
                  </ol>
                </div>

                {/* Resource-Request */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <span className="font-bold text-amber-300 block text-sm">
                    B. Banker's Resource-Request Algorithm
                  </span>
                  <p className="text-gray-300">
                    Mengevaluasi permintaan Request_i dari proses Pi:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-400 font-mono">
                    <li>Cek: Request_i &lt;= Need_i (jika lebih, error!).</li>
                    <li>Cek: Request_i &lt;= Available (jika tidak, Pi wajib WAIT).</li>
                    <li>Alokasi Tentatif: Available -= Request, Allocation += Request, Need -= Request.</li>
                    <li>Jalankan Safety Check. Jika Safe ➔ Setujui (GRANT). Jika Unsafe ➔ Pi WAIT & Rollback status.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DINING PHILOSOPHERS */}
          {activeTab === "philosophers" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="rounded-xl border border-pink-500/30 bg-pink-950/20 p-4">
                <h3 className="text-base font-bold text-pink-300 flex items-center gap-2">
                  <span>🍝</span> Dining Philosophers Problem
                </h3>
                <p className="mt-2 text-xs md:text-sm text-gray-300">
                  Diciptakan oleh Edsger Dijkstra pada tahun 1965 sebagai model klasik persoalan konkurensi, sinkronisasi, dan deadlock.
                </p>
                <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-gray-300">
                  <strong>Skenario:</strong> 5 orang filsuf duduk melingkar di meja bundar. Di tengah meja ada semangkuk spageti (atau tabung plasma alien). Di antara setiap pasang filsuf terdapat 1 sumpit/garpu (total 5 garpu). Seorang filsuf hanya bisa makan jika ia berhasil memegang <strong>kedua garpu</strong> (garpu kiri dan garpu kanan) secara bersamaan!
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3">
                  <span className="font-bold text-red-300 block text-sm mb-1">
                    💀 Jebakan Deadlock Klasik (Circular Wait):
                  </span>
                  <p className="text-gray-300 leading-relaxed">
                    Jika kelima filsuf lapar pada saat bersamaan dan masing-masing serentak mengambil garpu di sebelah kirinya:
                  </p>
                  <p className="mt-2 font-mono text-red-200">
                    P0 memegang Garpu 0, P1 memegang Garpu 1, ..., P4 memegang Garpu 4.<br />
                    Semua berusaha mengambil garpu kanan, namun garpu kanan sedang dipegang oleh tetangganya! Tidak ada garpu yang tersedia, tidak ada yang bisa makan, dan tidak ada yang mau melepas garpu kirinya (Deadlock Total).
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
                  <span className="font-bold text-emerald-300 block text-sm mb-1">
                    🛠️ Tiga Solusi Pemecahan Deadlock:
                  </span>
                  <ul className="space-y-2 text-gray-300 font-mono">
                    <li>
                      <strong className="text-emerald-300">1. Asymmetric Solution:</strong> Filsuf ganjil mengambil garpu kiri dulu lalu kanan; filsuf genap mengambil kanan dulu lalu kiri. Rantai Circular Wait pecah!
                    </li>
                    <li>
                      <strong className="text-cyan-300">2. Semaphore Limiter:</strong> Maksimal hanya 4 filsuf yang diizinkan duduk di meja secara bersamaan. Terjamin ada 1 filsuf yang memegang 2 garpu.
                    </li>
                    <li>
                      <strong className="text-amber-300">3. Timeout & Preemption:</strong> Jika gagal memperoleh garpu kedua dalam batas waktu, lepaskan garpu pertama!
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-between border-t border-purple-500/30 bg-black/40 px-6 py-4">
          <div className="text-xs text-purple-300 font-mono hidden md:block">
            Tekan [ESC] atau tombol tutup untuk kembali ke petualangan
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {onOpenMiniGame && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMiniGame();
                }}
                className="rounded-lg border border-purple-400 bg-purple-950/60 px-4 py-2 text-xs font-bold text-purple-200 transition hover:bg-purple-800/50 hover:scale-105 active:scale-95"
              >
                🎮 Buka Mini-Game Life-Support Banker
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 px-5 py-2 text-xs md:text-sm font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition hover:scale-105 active:scale-95"
            >
              Tutup & Lanjutkan ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

