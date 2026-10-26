"use client";

import Link from "next/link";

export default function Stage2Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-[#e9e4ff]">
      <div className="max-w-xl rounded-2xl border border-emerald-400/40 bg-[#071318]/90 p-8 text-center backdrop-blur-md shadow-[0_0_50px_rgba(52,211,153,0.3)]">
        <span className="text-5xl animate-bounce">🚪✨</span>
        <h1 className="mt-4 text-3xl font-bold text-emerald-300">
          Stage 2: Pintu Kedua Terbuka!
        </h1>
        <p className="mt-3 text-sm text-gray-300 leading-relaxed">
          Selamat! Kamu telah berhasil menaklukkan tantangan penjadwalan CPU di Pintu 1. Sektor memori dan sinkronisasi proses menunggumu di stage berikutnya.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/stage/stage1"
            className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs md:text-sm font-semibold text-white transition hover:bg-white/20"
          >
            ← Kembali ke Stage 1
          </Link>
          <Link
            href="/"
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 text-xs md:text-sm font-bold text-black transition hover:scale-105"
          >
            Kembali ke Menu Utama
          </Link>
        </div>
      </div>
    </main>
  );
}

