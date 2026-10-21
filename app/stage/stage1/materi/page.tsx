"use client";

import Link from "next/link";

export default function Stage1MateriPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-[#e9e4ff]">
      <div className="max-w-2xl rounded-2xl border border-white/20 bg-white/5 p-8 text-center backdrop-blur-md shadow-2xl">
        <h1 className="text-4xl font-bold text-[#ffb347]">Stage 1: Pintu 1 - Proses & Thread</h1>
        <p className="mt-4 text-gray-300 leading-relaxed">
          Selamat! Kamu berhasil menavigasi ruangan dan mencapai portal pintu pertama kapal alien OMNI.
          Materi dan tantangan sistem operasi stage 1 akan dimulai di sini.
        </p>
        <div className="mt-8">
          <Link
            href="/stage/stage1"
            className="rounded-lg bg-[#b9aef0] px-6 py-2.5 font-semibold text-[#140b2e] transition hover:bg-[#cfc6fb]"
          >
            ← Kembali ke Ruangan
          </Link>
        </div>
      </div>
    </main>
  );
}

