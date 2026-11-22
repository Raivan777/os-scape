"use client";

import Link from "next/link";

export default function Stage6Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#060411] p-4 text-white">
      <div className="max-w-md w-full rounded-2xl border border-cyan-500/40 bg-black/85 p-8 text-center shadow-[0_0_60px_rgba(34,211,238,0.3)] backdrop-blur-md">
        <span className="text-6xl block mb-4 animate-bounce">🚀</span>
        <h1 className="text-2xl font-bold font-mono text-cyan-300 mb-2">MISI SELESAI!</h1>
        <p className="text-sm text-gray-300 mb-6">
          Anda berhasil meretas modul inti OMNI dan mencapai ruang pelarian kapal alien!
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/story/epilogue"
            className="rounded-xl border border-cyan-400 bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-mono text-sm font-bold text-black uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:brightness-110 transition"
          >
            🎬 Tonton Cerita Epilog (Tamat) ➔
          </Link>
          <Link
            href="/stage/stage5"
            className="rounded-xl border border-cyan-400/40 bg-cyan-950/60 px-5 py-2.5 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition"
          >
            ← Kembali ke Stage 5
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 font-mono text-xs font-bold text-gray-300 hover:bg-white/20 transition"
          >
            Kembali ke Menu Utama
          </Link>
        </div>
      </div>
    </main>
  );
}
