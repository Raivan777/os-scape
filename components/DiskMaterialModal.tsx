"use client";

import React, { useEffect, useState } from "react";

interface DiskMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── TIPE DATA SATU SLIDE MATERI ─────────────────────────────────
interface MaterialSlide {
  id: string;
  icon: string;
  title: string;          // judul algoritma
  badge: string;          // label kecil di kanan judul
  concept: React.ReactNode; // penjelasan konsep
  diagram: string;        // ilustrasi struktur direktori (monospace)
  pros: string;           // kelebihan
  cons: string;           // kekurangan
  challenge: React.ReactNode; // kaitan dengan tantangan di Terminal Architect
  // Kelas warna ditulis utuh (bukan dirangkai) agar terbaca oleh Tailwind
  box: string;            // border + background section
  titleColor: string;     // warna judul
  badgeStyle: string;     // warna badge
}

// ─── ISI MATERI: STRUKTUR & ORGANISASI DIREKTORI ─────────────────
// 1 slide = 1 algoritma (Single-Level, Two-Level, Tree-Structured) + 1 slide ringkasan
const SLIDES: MaterialSlide[] = [
  {
    id: "single",
    icon: "📁",
    title: "1. Single-Level Directory (Direktori Satu Tingkat)",
    badge: "Paling Sederhana",
    concept: (
      <>
        Semua berkas dari seluruh pengguna diletakkan dalam <strong className="text-cyan-200">satu direktori tunggal</strong> (
        <code className="text-cyan-200">root</code>). Tidak ada subdirektori dan tidak ada pemisahan folder antar-pengguna.
        Mencari berkas berarti menelusuri satu daftar datar dari atas ke bawah.
      </>
    ),
    diagram: `ROOT_DIR
├── telemetry.dat      (User_Alpha)
├── nav_system.sys     (System)
└── telemetry.dat      (User_Beta)  ✖ DITOLAK!
                       └─ nama sudah dipakai → NAME COLLISION`,
    pros: "Sangat mudah diimplementasikan dan dipahami. Penelusuran berkas hanya pada satu daftar tunggal.",
    cons: "Name Collision: tidak boleh ada dua berkas bernama sama, walaupun dibuat pengguna berbeda. Tidak ada pengelompokan berkas, dan pencarian makin lambat saat berkas bertambah banyak.",
    challenge: (
      <>
        <strong className="text-cyan-300">Tantangan 1:</strong> User_Beta menyimpan <code className="text-cyan-200">telemetry.dat</code>{" "}
        yang namanya sudah ada, lalu muncul <em>ERROR 409 NAME COLLISION</em>. Pilih solusi: paksa ganti nama berkas
        (tidak praktis untuk sistem besar) atau upgrade ke Two-Level Directory.
      </>
    ),
    box: "border-blue-500/30 bg-blue-950/20",
    titleColor: "text-blue-300",
    badgeStyle: "bg-blue-500/20 text-blue-300",
  },
  {
    id: "two-level",
    icon: "📂",
    title: "2. Two-Level Directory (Direktori Dua Tingkat)",
    badge: "Isolasi Per Pengguna",
    concept: (
      <>
        Struktur dipecah menjadi dua tingkat hierarki. <strong className="text-cyan-300">MFD (Master File Directory)</strong>{" "}
        adalah tingkat pertama yang mencatat direktori tiap pengguna. <strong className="text-purple-300">UFD (User File Directory)</strong>{" "}
        adalah tingkat kedua; setiap pengguna punya UFD sendiri untuk menyimpan berkas-berkasnya. Berkas ditemukan lewat
        path <code className="text-cyan-200">/pengguna/berkas</code>.
      </>
    ),
    diagram: `MFD
├── UFD_ALPHA  (/UserAlpha/)
│   ├── flight_log.txt
│   └── keys.pem
└── UFD_BETA   (/UserBeta/)
    ├── flight_log.txt      ← nama sama, TIDAK bentrok
    └── sensor_data.bin`,
    pros: "Menyelesaikan name collision: pengguna berbeda boleh punya berkas bernama sama (/UserAlpha/flight_log.txt dan /UserBeta/flight_log.txt). Berkas tiap pengguna terisolasi dan pencarian dibatasi pada UFD pemiliknya.",
    cons: "Isolasi terlalu kaku: sulit berbagi berkas antar pengguna, dan pengguna tidak bisa membuat subfolder sendiri di dalam UFD-nya.",
    challenge: (
      <>
        <strong className="text-cyan-300">Tantangan 2:</strong> Antrean berkas di MFD harus dirutekan ke UFD yang berhak
        (Alpha atau Beta). Perhatikan, dua <code className="text-cyan-200">flight_log.txt</code> milik user berbeda
        boleh berdampingan karena berada di UFD masing-masing.
      </>
    ),
    box: "border-cyan-500/30 bg-cyan-950/20",
    titleColor: "text-cyan-300",
    badgeStyle: "bg-cyan-500/20 text-cyan-300",
  },
  {
    id: "tree",
    icon: "🌲",
    title: "3. Tree-Structured Directory (Direktori Struktur Pohon)",
    badge: "Standar OS Modern",
    concept: (
      <>
        Struktur pohon hierarkis yang dipakai sistem operasi modern (Linux, Unix, Windows, macOS). Dimulai dari akar (
        <code className="text-cyan-300">/</code> atau <code className="text-cyan-300">C:\</code>), setiap direktori boleh
        berisi berkas <em>dan</em> subdirektori dengan kedalaman tak terbatas. Setiap berkas punya path yang unik.
      </>
    ),
    diagram: `/ (root)
├── bin
│   └── warp_drive.bin
├── etc
│   └── life_support.cfg
├── home
│   └── pilot
│       └── pilot_diary.txt
└── var
    └── log
        └── core_dump.log

Path absolut : /home/pilot/pilot_diary.txt   (dari root)
Path relatif : ./pilot_diary.txt             (dari direktori kerja)`,
    pros: "Skalabilitas tinggi, pengelompokan berkas bebas lewat subdirektori, nama sama boleh dipakai di folder berbeda, dan hak akses (permissions) mudah diatur per cabang pohon.",
    cons: "Path bisa menjadi panjang, dan berbagi berkas antar cabang butuh mekanisme tambahan (misalnya link). Penelusuran harus mengikuti path dari akar atau direktori kerja.",
    challenge: (
      <>
        <strong className="text-cyan-300">Tantangan 3:</strong> Tempatkan tiap berkas ke subdirektori yang sesuai
        fungsinya: <code className="text-cyan-200">/bin</code> (eksekutabel), <code className="text-cyan-200">/etc</code> (konfigurasi),{" "}
        <code className="text-cyan-200">/home/pilot</code> (dokumen pengguna), dan <code className="text-cyan-200">/var/log</code> (log).
      </>
    ),
    box: "border-purple-500/30 bg-purple-950/20",
    titleColor: "text-purple-300",
    badgeStyle: "bg-purple-500/20 text-purple-300",
  },
];

const TOTAL_SLIDES = SLIDES.length + 1; // + slide ringkasan perbandingan

export default function DiskMaterialModal({ isOpen, onClose }: DiskMaterialModalProps) {
  // Slide aktif: 0..SLIDES.length-1 = algoritma, SLIDES.length = ringkasan
  const [slideIndex, setSlideIndex] = useState(0);

  // Setiap kali modal dibuka, mulai dari slide pertama
  useEffect(() => {
    if (isOpen) setSlideIndex(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const isSummary = slideIndex === SLIDES.length;
  const isLast = slideIndex === TOTAL_SLIDES - 1;
  const slide = isSummary ? null : SLIDES[slideIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-cyan-400/50 bg-[#0b081e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_60px_rgba(34,211,238,0.3)]">
        {/* Header Terminal */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
            <div>
              <h2 className="text-lg md:text-xl font-bold tracking-wide text-[#ffb347]">
                OMNI DATALOG // STAGE 5: STRUKTUR &amp; ORGANISASI DIREKTORI
              </h2>
              <p className="text-xs text-cyan-300/80 font-mono">
                Single-Level • Two-Level • Tree-Structured Directory
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

        {/* Penanda slide */}
        <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-gray-400">
          <span>
            SLIDE {slideIndex + 1} / {TOTAL_SLIDES}
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ke slide ${i + 1}`}
                onClick={() => setSlideIndex(i)}
                className={`h-2 w-6 rounded-full transition ${
                  i === slideIndex ? "bg-cyan-400" : "bg-white/15 hover:bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Konten Edukasi: satu slide per algoritma */}
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-200">
          {slide && (
            <section className={`rounded-xl border p-4 ${slide.box}`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`flex items-center gap-2 font-bold text-base ${slide.titleColor}`}>
                  <span>{slide.icon}</span>
                  <h3>{slide.title}</h3>
                </div>
                <span className={`rounded px-2 py-0.5 text-[10px] font-mono ${slide.badgeStyle}`}>
                  {slide.badge}
                </span>
              </div>

              <p className="text-gray-300 text-xs md:text-sm">{slide.concept}</p>

              {/* Diagram struktur direktori */}
              <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-3 text-[11px] md:text-xs leading-snug text-emerald-300 font-mono">
                {slide.diagram}
              </pre>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                <div className="rounded-lg border border-emerald-500/30 bg-black/40 p-3">
                  <span className="text-emerald-300 font-bold block mb-1">✅ Kelebihan:</span>
                  <span className="text-gray-300 text-[11px] leading-relaxed">{slide.pros}</span>
                </div>
                <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3">
                  <span className="text-rose-300 font-bold block mb-1">⚠️ Kekurangan:</span>
                  <span className="text-gray-300 text-[11px] leading-relaxed">{slide.cons}</span>
                </div>
              </div>

              {/* Kaitan dengan tantangan di mini game */}
              <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-950/20 p-3 text-[11px] md:text-xs text-gray-300">
                🎮 {slide.challenge}
              </div>
            </section>
          )}

          {/* Slide ringkasan metrik perbandingan */}
          {isSummary && (
            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="text-base font-semibold text-[#ffb347] mb-3 font-mono">
                📊 4. Ringkasan Perbandingan Antar Struktur
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

              <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-950/20 p-3 text-[11px] md:text-xs text-gray-300">
                🎮 Di Terminal Directory Architect, selesaikan <strong className="text-cyan-300">Tantangan 1 ➔ 2 ➔ 3</strong>{" "}
                secara berurutan. Portal Stage 6 hanya terbuka setelah ketiganya selesai. Tab{" "}
                <strong className="text-emerald-300">🔎 Search Lab</strong> bisa dipakai untuk melihat animasi langkah
                pencarian berkas di tiap struktur.
              </div>
            </section>
          )}
        </div>

        {/* Footer Modal: navigasi slide */}
        <div className="mt-6 flex items-center justify-between border-t border-cyan-500/30 pt-4">
          <button
            type="button"
            onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
            disabled={slideIndex === 0}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-gray-300 transition hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Sebelumnya
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition hover:scale-105"
            >
              Paham, Mulai Tantangan! 🚀
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSlideIndex((i) => Math.min(TOTAL_SLIDES - 1, i + 1))}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition hover:scale-105"
            >
              Berikutnya →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}