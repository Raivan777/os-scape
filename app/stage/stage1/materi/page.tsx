"use client";

import Link from "next/link";

export default function Stage1MateriPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-[#e9e4ff]">
      <div className="max-w-2xl rounded-2xl border border-cyan-400/30 bg-[#0d091e]/90 p-8 text-center backdrop-blur-md shadow-[0_0_50px_rgba(34,211,238,0.2)]">
        <span className="text-4xl animate-bounce">🛸</span>
        <h1 className="mt-3 text-3xl md:text-4xl font-bold text-[#ffb347]">
          Stage 1: Koridor Pelarian OMNI
        </h1>
        <p className="mt-4 text-gray-300 leading-relaxed text-sm md:text-base">
          Kamu telah melarikan diri dari sel tahanan 7. Di depanmu terbentang koridor berbahaya yang penuh dengan kebocoran plasma dan sistem pertahanan laser.
        </p>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left text-xs md:text-sm text-gray-300 space-y-2">
          <p className="font-semibold text-cyan-300">🎯 Misi Penjelajahan Koridor:</p>
          <p>1. Hindari zona radiasi plasma & sinar laser di sepanjang koridor (jangan sampai nyawa habis!).</p>
          <p>2. Cari dan akses <strong>Terminal Data Log OMNI</strong> di tengah koridor untuk mempelajari konsep Proses & CPU Scheduling.</p>
          <p>3. Capai gerbang portal di ujung koridor dan selesaikan tantangan evaluasi sistem operasi untuk membuka pintu Stage 2!</p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/stage/stage1"
            className="w-full sm:w-auto rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20 text-sm"
          >
            ← Kembali ke Ruang Sel
          </Link>
          <Link
            href="/stage/stage1"
            className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#ffb347] to-[#ffc774] px-8 py-3 font-bold text-[#140b2e] shadow-[0_0_25px_rgba(255,179,71,0.5)] transition hover:scale-105 active:scale-95 text-sm"
          >
            Mulai Masuk Platformer ➔
          </Link>
        </div>
      </div>
    </main>
  );
}
