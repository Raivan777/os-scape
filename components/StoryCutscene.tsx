"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface StoryScene {
  id: number;
  title: string;
  speaker: string;
  narration: string;
  image: string; // e.g. "/story/prolog-1.png"
  altImage?: string;
  emoji?: string;
}

export interface CreditMember {
  name: string;
  npm: string;
  role: string;
  task: string;
}

interface StoryCutsceneProps {
  mode: "prologue" | "epilogue";
  scenes: StoryScene[];
  targetHref: string;
  skipHref: string;
  completeButtonText: string;
  credits?: CreditMember[];
  requireStartOnFirstScene?: boolean;
}

export default function StoryCutscene({
  mode,
  scenes,
  targetHref,
  skipHref,
  completeButtonText,
  credits,
  requireStartOnFirstScene = false,
}: StoryCutsceneProps) {
  const router = useRouter();
  const [hasStarted, setHasStarted] = useState<boolean>(!requireStartOnFirstScene);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [displayedText, setDisplayedText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showCredits, setShowCredits] = useState<boolean>(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isLastScene = currentIdx === scenes.length - 1;
  const currentScene = scenes[currentIdx] || scenes[0];

  // Preload semua gambar scene sejak awal agar pergantian scene instan tanpa kedip/loading
  useEffect(() => {
    scenes.forEach((scene) => {
      const img = new Image();
      img.src = scene.image;
      if (scene.altImage) {
        const altImg = new Image();
        altImg.src = scene.altImage;
      }
    });
  }, [scenes]);

  // Efek Typewriter Narasi
  useEffect(() => {
    if (!hasStarted || !currentScene) return;

    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    setDisplayedText("");
    setIsTyping(true);

    const fullText = currentScene.narration;
    let charIndex = 0;

    typingTimerRef.current = setInterval(() => {
      if (charIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      }
    }, 18);

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, [hasStarted, currentIdx, currentScene]);

  // Klik teks untuk langsung menampilkan seluruh narasi
  const handleFastForwardText = useCallback(() => {
    if (isTyping && currentScene) {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setDisplayedText(currentScene.narration);
      setIsTyping(false);
    }
  }, [isTyping, currentScene]);

  // Navigasi ke slide berikutnya
  const handleNext = useCallback(() => {
    if (!hasStarted) {
      setHasStarted(true);
      return;
    }

    if (isTyping) {
      handleFastForwardText();
      return;
    }

    if (currentIdx < scenes.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      if (mode === "epilogue" && credits && credits.length > 0 && !showCredits) {
        setShowCredits(true);
      } else {
        router.push(targetHref);
      }
    }
  }, [hasStarted, isTyping, handleFastForwardText, currentIdx, scenes.length, mode, credits, showCredits, router, targetHref]);

  // Navigasi ke slide sebelumnya
  const handlePrev = useCallback(() => {
    if (showCredits) {
      setShowCredits(false);
      return;
    }
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  }, [showCredits, currentIdx]);

  // Shortcut Keyboard: Spasi / Enter / Panah Kanan untuk Lanjut, ESC untuk skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push(skipHref);
      } else if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, router, skipHref]);

  // Tampilan Layar Credits (Hanya di Akhir Epilog)
  if (showCredits && credits) {
    return (
      <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#04020a] p-4 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-[#060411] to-black" />
        <div className="relative z-10 w-full max-w-4xl rounded-2xl border border-cyan-500/30 bg-black/85 p-6 md:p-10 shadow-[0_0_60px_rgba(34,211,238,0.2)] backdrop-blur-md">
          <div className="text-center mb-8 border-b border-white/10 pb-6">
            <span className="inline-block px-3 py-1 text-xs font-mono font-bold tracking-widest text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 rounded-full mb-3">
              PETUALANGAN SELESAI
            </span>
            <h1 className="text-3xl md:text-5xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-purple-400">
              OS-SCAPE: THE CORE SIMULATION
            </h1>
            <p className="mt-2 text-sm text-gray-400 font-mono">
              Final Project Mata Kuliah Sistem Operasi • Program Studi Informatika FT Universitas Siliwangi
            </p>
            <p className="text-xs text-cyan-400/80 font-mono mt-1">
              Dosen Pengampu: Muhammad Sidik Asyaky, S.T., M.T.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-center text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">
              ✨ KELOMPOK INFINITY (6 MAHASISWA) ✨
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {credits.map((member, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold">
                      NPM {member.npm}
                    </span>
                    <span className="text-[10px] font-mono text-purple-300 font-semibold">
                      {member.role}
                    </span>
                  </div>
                  <h3 className="font-mono text-sm font-bold text-white">
                    {member.name}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                    {member.task}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4 border-t border-white/10">
            <button
              onClick={() => setShowCredits(false)}
              className="text-xs font-mono text-gray-400 hover:text-white transition cursor-pointer"
            >
              ◀ Putar Ulang Epilog
            </button>
            <Link
              href="/"
              className="text-xs font-mono font-bold text-cyan-300 hover:text-cyan-100 uppercase tracking-wider transition underline underline-offset-4"
            >
              🏠 Kembali ke Menu Awal
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-black select-none text-white">
      {/* 1. GAMBAR FULLSCREEN PENUH: Berganti secara mulus & instan berdasarkan path gambar */}
      <img
        key={currentScene.image}
        src={currentScene.image}
        alt={currentScene.title}
        onError={(e) => {
          // Fallback otomatis jika .png tidak ada, coba .jpg
          const target = e.currentTarget;
          if (currentScene.altImage && target.src !== currentScene.altImage) {
            target.src = currentScene.altImage;
          }
        }}
        className="fixed inset-0 h-full w-full object-cover z-0 transition-opacity duration-300"
      />

      {/* 2. GRADASI VIGNETTE BAWAH LEMBUT: Hanya memberi kontras tipis di dasar layar agar teks jelas tanpa kotak tebal */}
      <div className="fixed inset-x-0 bottom-0 h-64 pointer-events-none z-10 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

      {/* 3. HEADER ATAS MINIMALIS: Tanpa kotak mengganggu, hanya teks bersih di pojok */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4">
        {/* Indikator Titik Progress Sederhana */}
        <div className="flex items-center gap-2">
          {scenes.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                if (!hasStarted) setHasStarted(true);
                setCurrentIdx(idx);
              }}
              title={`Scene ${idx + 1}: ${s.title}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIdx
                  ? "w-7 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                  : idx < currentIdx
                    ? "w-2.5 bg-cyan-600/70"
                    : "w-1.5 bg-white/30"
              }`}
            />
          ))}
          <span className="text-[11px] font-mono text-gray-300/80 ml-2 drop-shadow">
            {currentIdx + 1}/{scenes.length}
          </span>
        </div>

        {/* Tombol Lewati Bersih Tanpa Kotak */}
        <Link
          href={skipHref}
          className="text-xs font-mono text-gray-300/80 hover:text-cyan-300 transition flex items-center gap-1 drop-shadow"
        >
          <span>Lewati Cerita [ESC]</span>
          <span>➔</span>
        </Link>
      </header>

      {/* 4. TAMPILAN AWAL: Tombol Mulai di Tengah (Hanya sebelum narasi dimulai di Scene 1) */}
      {!hasStarted ? (
        <div className="relative z-30 flex h-full w-full flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <h1 className="text-5xl md:text-7xl font-black font-mono tracking-tight text-white drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
            OS-SCAPE
          </h1>
          <p className="mt-2 text-sm md:text-base font-mono text-cyan-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            The Alien Abduction
          </p>

          {/* Tombol Mulai Bersih & Elegan */}
          <button
            type="button"
            onClick={() => setHasStarted(true)}
            className="mt-8 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black px-8 py-3.5 font-mono text-base font-black shadow-[0_0_30px_rgba(34,211,238,0.7)] hover:scale-105 active:scale-95 transition cursor-pointer flex items-center gap-2"
          >
            <span>▶ MULAI GAME</span>
          </button>

          <Link
            href={skipHref}
            className="mt-4 text-xs font-mono text-gray-300 hover:text-white transition drop-shadow"
          >
            Lewati ke Stage 1 ➔
          </Link>
        </div>
      ) : (
        /* 5. NARASI SUBTITLE SINEMATIK: Tanpa Kotak Tebal, Mengalir Alami di Bawah Layar */
        <div
          onClick={handleFastForwardText}
          className="fixed bottom-0 inset-x-0 z-30 pb-7 pt-12 px-6 md:px-14 flex flex-col justify-end cursor-pointer group"
          title="Klik layar untuk mempercepat teks"
        >
          <div className="max-w-5xl mx-auto w-full">
            {/* Label Pembicara Minimalis */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
              <span className="font-mono text-xs font-bold tracking-widest text-cyan-300 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {currentScene.speaker}
              </span>
            </div>

            {/* Isi Teks Narasi Berketik Langsung di atas Subtitle Transparan */}
            <div className="min-h-[3.6rem] md:min-h-[4rem] flex items-start">
              <p className="font-mono text-sm md:text-lg leading-relaxed text-gray-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                {displayedText}
                {isTyping && (
                  <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                )}
              </p>
            </div>

            {/* Tombol Navigasi Bersih TANPA KOTAK (Hanya Teks Interaktif) */}
            <div className="mt-2.5 pt-2 flex items-center justify-between border-t border-white/10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                disabled={currentIdx === 0}
                className={`text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  currentIdx === 0
                    ? "text-gray-600 cursor-not-allowed opacity-0"
                    : "text-gray-300 hover:text-white drop-shadow"
                }`}
              >
                <span>◀ Sebelumnya</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="text-xs md:text-sm font-mono font-bold text-cyan-300 hover:text-cyan-100 transition cursor-pointer flex items-center gap-2 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)] group-hover:translate-x-1"
              >
                <span>{isLastScene ? completeButtonText : "Lanjut ➔"}</span>
                <span className="text-[10px] text-gray-400 font-normal font-mono">
                  [Spasi / Enter]
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
