"use client";

import Link from "next/link";

export default function Stage3Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-[#e9e4ff]">
      <div className="max-w-xl rounded-2xl border border-cyan-400/40 bg-[#071318]/90 p-8 text-center backdrop-blur-md shadow-[0_0_50px_rgba(34,211,238,0.3)]">
        <span className="text-5xl animate-bounce">⚡🛸</span>
        <h1 className="mt-4 text-3xl font-bold text-cyan-300">
          Stage 3: The Parallel Builder
        </h1>
        <p className="mt-3 text-sm text-gray-300 leading-relaxed">
          Hebat! Kamu telah berhasil menghubungkan transmisi data IPC di Sektor 2. Tahap berikutnya adalah tantangan konkurensi dan eksekusi paralel (<code className="text-amber-300 font-mono">begin-end</code> & <code className="text-amber-300 font-mono">parbegin-parend</code>).
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/stage/stage2"
            className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs md:text-sm font-semibold text-white transition hover:bg-white/20"
          >
            ← Kembali ke Stage 2
          </Link>
          <Link
            href="/"
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs md:text-sm font-bold text-white transition hover:scale-105"
          >
            Kembali ke Menu Utama
          </Link>
        </div>
      </div>
    </main>
  );
}

