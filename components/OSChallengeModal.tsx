"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface OSChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnswerCorrect: () => void;
  onAnswerWrong: () => void;
  hasUnlockedMaterial: boolean;
}

export default function OSChallengeModal({
  isOpen,
  onClose,
  onAnswerCorrect,
  onAnswerWrong,
  hasUnlockedMaterial,
}: OSChallengeModalProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (!isOpen) return null;

  const challenge = {
    title: "FIREWALL OMNI PINTU 1: EVALUASI KERNEL",
    scenario:
      "Sistem navigasi darurat kapal alien OMNI mengalami kemacetan akibat banyak proses antre secara bersamaan. Untuk mencegah proses interaktif mengalami starvation (kelaparan waktu CPU) dan memastikan setiap proses mendapat giliran secara adil, arsitektur sistem operasi harus menerapkan algoritma penjadwalan CPU dengan time-slice bergantian.",
    question:
      "Algoritma penjadwalan CPU preemptive manakah yang paling tepat digunakan untuk skenario pembagian waktu giliran tetap (Time Quantum) tersebut?",
    options: [
      {
        id: 0,
        text: "FCFS (First-Come, First-Served) - Menjalankan tugas pertama sampai tuntas tanpa interupsi.",
        correct: false,
        feedback: "Salah. FCFS bersifat non-preemptive dan rentan menyebabkan Convoy Effect bagi proses interaktif.",
      },
      {
        id: 1,
        text: "Round Robin (RR) - Membagi waktu eksekusi CPU berdasarkan Time Quantum berulang secara bergantian.",
        correct: true,
        feedback: "Tepat sekali! Round Robin menggunakan konsep time-sharing dengan Time Quantum, mencegah proses panjang memonopoli CPU.",
      },
      {
        id: 2,
        text: "SJF Non-Preemptive - Hanya menjalankan proses dengan burst time paling sedikit tanpa jeda.",
        correct: false,
        feedback: "Kurang tepat. SJF dapat menyebabkan proses panjang menunggu selamanya (starvation).",
      },
      {
        id: 3,
        text: "Priority Scheduling Tanpa Aging - Mengabaikan proses berprioritas rendah sepenuhnya.",
        correct: false,
        feedback: "Salah. Tanpa mekanisme penuaan (aging), proses berprioritas rendah akan mengalami kelaparan tanpa henti.",
      },
    ],
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    const correct = challenge.options[selectedOption].correct;
    setIsCorrect(correct);
    setIsSubmitted(true);

    if (correct) {
      onAnswerCorrect();
    } else {
      onAnswerWrong();
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsCorrect(false);
  };

  const handleProceedNextStage = () => {
    // Arahkan ke stage 2 atau stage berikutnya
    router.push("/stage/stage2");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-purple-500/50 bg-[#0f0924]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_60px_rgba(168,85,247,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/30 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 rounded-full bg-purple-400 animate-pulse" />
            <h2 className="text-lg md:text-xl font-bold tracking-wide text-purple-300">
              {challenge.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1 text-sm text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕ Batalkan
          </button>
        </div>

        {/* Peringatan jika belum membaca materi */}
        {!hasUnlockedMaterial && !isSubmitted && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-300 flex items-center gap-2">
            <span>⚠️</span>
            <span>
              Tips: Kamu belum membuka Terminal Data Log di tengah koridor. Kamu bisa membaca materi terlebih dahulu agar lebih mudah menjawab tantangan ini!
            </span>
          </div>
        )}

        {/* Skenario Soal */}
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs md:text-sm text-gray-300 leading-relaxed">
            <span className="font-semibold text-cyan-300">SKENARIO SISTEM: </span>
            {challenge.scenario}
          </div>

          <p className="text-sm font-semibold text-white">
            {challenge.question}
          </p>

          {/* Opsi Pilihan Ganda */}
          <div className="space-y-2.5 pt-1">
            {challenge.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              let optionClass = "border-white/10 bg-white/[0.04] text-gray-200 hover:border-cyan-400/50 hover:bg-white/[0.08]";

              if (isSubmitted) {
                if (opt.correct) {
                  optionClass = "border-emerald-500 bg-emerald-950/60 text-emerald-200";
                } else if (isSelected && !opt.correct) {
                  optionClass = "border-rose-500 bg-rose-950/60 text-rose-200";
                }
              } else if (isSelected) {
                optionClass = "border-cyan-400 bg-cyan-950/60 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.3)]";
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full text-left rounded-xl border p-3.5 text-xs md:text-sm transition-all flex items-start gap-3 ${optionClass}`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                    {String.fromCharCode(65 + opt.id)}
                  </span>
                  <span>{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback Hasil */}
          {isSubmitted && (
            <div
              className={`mt-4 rounded-xl border p-4 text-xs md:text-sm leading-relaxed ${
                isCorrect
                  ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300"
                  : "border-rose-500/50 bg-rose-950/40 text-rose-300"
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                <span>{isCorrect ? "✅ AKSES DIIZINKAN (ACCESS GRANTED)" : "❌ KODE OTENTIKASI SALAH"}</span>
              </div>
              <p>{selectedOption !== null && challenge.options[selectedOption].feedback}</p>
            </div>
          )}
        </div>

        {/* Footer Tombol Aksi */}
        <div className="mt-6 flex items-center justify-between border-t border-purple-500/30 pt-4">
          {!isSubmitted ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs md:text-sm text-gray-300 transition hover:bg-white/10"
              >
                Kembali ke Koridor
              </button>
              <button
                type="button"
                disabled={selectedOption === null}
                onClick={handleSubmit}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 px-6 py-2.5 text-xs md:text-sm font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                Konfirmasi Kode ➔
              </button>
            </>
          ) : isCorrect ? (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-mono">
                [PORTAL 1 SECURE LOCK DEACTIVATED]
              </span>
              <button
                type="button"
                onClick={handleProceedNextStage}
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 text-xs md:text-sm font-bold text-black shadow-[0_0_25px_rgba(52,211,153,0.6)] transition hover:scale-105 active:scale-95"
              >
                Masuk ke Stage 2 🚀
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-rose-400">
                Nyawa berkurang 1! Pelajari log OMNI dan coba lagi.
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg bg-rose-600 px-5 py-2 text-xs md:text-sm font-bold text-white transition hover:bg-rose-500"
              >
                Coba Lagi ↺
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

