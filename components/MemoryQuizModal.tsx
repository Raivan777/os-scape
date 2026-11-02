"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface MemoryQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function MemoryQuizModal({
  isOpen,
  onClose,
  onComplete,
}: MemoryQuizModalProps) {
  const router = useRouter();
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const questions = [
    {
      title: "PROTOKOL MEMORI // EVALUASI 1: FRAGMENTASI EKSTERNAL",
      question:
        "Apa yang dimaksud dengan fenomena Fragmentasi Eksternal pada manajemen memori alokasi kontigu dinamis?",
      options: [
        {
          id: 0,
          text: "A. Ruang kosong di dalam suatu blok partisi tetap yang terbuang karena kargo berukuran lebih kecil dari partisi.",
          correct: false,
          feedback: "Kurang tepat. Itu adalah definisi Fragmentasi Internal yang terjadi pada partisi ukuran tetap (fixed partitioning).",
        },
        {
          id: 1,
          text: "B. Total ruang memori bebas mencukupi, namun terpecah-pecah menjadi lubang-lubang kecil non-kontigu sehingga tidak ada satu slot pun yang mampu menampung kargo besar.",
          correct: true,
          feedback: "Tepat sekali! Karena alokasi kontigu membutuhkan blok fisik tunggal yang utuh, pecahan lubang kecil tidak bisa digunakan tanpa pemadatan.",
        },
        {
          id: 2,
          text: "C. Terputusnya kabel bus data antara memory controller dan kartu grafis eksternal.",
          correct: false,
          feedback: "Salah. Ini adalah kerusakan perangkat keras fisik, bukan konsep manajemen memori sistem operasi.",
        },
        {
          id: 3,
          text: "D. Kondisi di mana CPU kehabisan ruang register cache L1 saat menjalankan thread.",
          correct: false,
          feedback: "Salah. Fragmentasi eksternal berkaitan dengan RAM utama dan alokasi partisi proses.",
        },
      ],
    },
    {
      title: "PROTOKOL MEMORI // EVALUASI 2: BEST-FIT VS FIRST-FIT",
      question:
        "Mengapa algoritma Best-Fit cenderung memiliki overhead komputasi CPU pencarian yang lebih tinggi dibandingkan First-Fit?",
      options: [
        {
          id: 0,
          text: "A. Karena Best-Fit wajib mengacak ulang nomor alamat fisik setiap kali ada kargo baru.",
          correct: false,
          feedback: "Salah. Alamat fisik memori tidak diacak ulang oleh Best-Fit.",
        },
        {
          id: 1,
          text: "B. Karena Best-Fit harus memeriksa SELURUH daftar hole untuk mencari partisi terkecil yang cukup, sedangkan First-Fit langsung berhenti pada slot pertama yang muat.",
          correct: true,
          feedback: "Tepat sekali! First-Fit berhenti begitu menemukan slot yang cukup (cepat), sementara Best-Fit memindai seluruh memori untuk membandingkan selisih kapasitas terkecil.",
        },
        {
          id: 2,
          text: "C. Karena Best-Fit hanya boleh dijalankan jika kapasitas RAM komputer berupa bilangan prima.",
          correct: false,
          feedback: "Salah, tidak ada batasan bilangan prima pada algoritma Best-Fit.",
        },
        {
          id: 3,
          text: "D. Karena Best-Fit selalu menghapus partisi terbesar dari tabel memori.",
          correct: false,
          feedback: "Salah, itu bukan karakteristik Best-Fit.",
        },
      ],
    },
    {
      title: "PROTOKOL MEMORI // EVALUASI 3: PEMADATAN (COMPACTION)",
      question:
        "Bagaimanakah sistem operasi dapat mengatasi fragmentasi eksternal pada alokasi kontigu tanpa harus beralih ke arsitektur paging?",
      options: [
        {
          id: 0,
          text: "A. Menjalankan Compaction (Pemadatan Memori), yaitu merelokasi proses yang aktif secara dinamis untuk menyatukan semua lubang partisi bebas menjadi satu blok besar.",
          correct: true,
          feedback: "Sempurna! Pemadatan menggeser semua proses yang sedang berjalan ke salah satu ujung memori, sehingga semua hole tersisa bersatu menjadi satu ruang besar.",
        },
        {
          id: 1,
          text: "B. Mematikan (terminate) semua proses yang sedang berjalan di latar belakang secara paksa.",
          correct: false,
          feedback: "Kurang tepat. Menghapus proses secara paksa menyebabkan kehilangan data pengguna dan bukan solusi alokasi yang elegan.",
        },
        {
          id: 2,
          text: "C. Mengganti semua ukuran partisi menjadi kelipatan 1024 KB secara permanen.",
          correct: false,
          feedback: "Salah. Mengubah ukuran menjadi partisi tetap justru menimbulkan fragmentasi internal yang parah.",
        },
        {
          id: 3,
          text: "D. Mengunci memori agar tidak ada proses baru yang diizinkan masuk ke Ready Queue.",
          correct: false,
          feedback: "Salah, ini menyebabkan sistem tidak dapat memproses tugas baru.",
        },
      ],
    },
  ];

  const currentQ = questions[currentQuestionIdx];

  const handleSelectOption = (idx: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    const isCorrect = currentQ.options[selectedOption].correct;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    setIsAnswerChecked(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setScore(0);
    setIsFinished(false);
  };

  const handleProceedToStage3 = () => {
    if (onComplete) onComplete();
    router.push("/stage/stage3");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-purple-500/50 bg-[#0c0822]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_60px_rgba(168,85,247,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/30 pb-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
              {currentQ.title}
            </span>
            <h2 className="text-lg md:text-xl font-bold text-[#ffb347]">
              FIREWALL CORE MEMORI // PINTU 2
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕ Batalkan
          </button>
        </div>

        {!isFinished ? (
          <div className="mt-6 space-y-6">
            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-300">
                Pertanyaan {currentQuestionIdx + 1} / {questions.length}
              </span>
              <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIdx + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Pertanyaan */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm md:text-base font-medium text-white leading-relaxed">
                {currentQ.question}
              </p>
            </div>

            {/* Pilihan Opsi */}
            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                let borderClass = "border-white/10 hover:border-cyan-400/50 bg-white/[0.02]";

                if (isAnswerChecked) {
                  if (opt.correct) {
                    borderClass = "border-emerald-500 bg-emerald-950/40 text-emerald-200";
                  } else if (isSelected && !opt.correct) {
                    borderClass = "border-rose-500 bg-rose-950/40 text-rose-200";
                  }
                } else if (isSelected) {
                  borderClass = "border-cyan-400 bg-cyan-950/40 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.3)]";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswerChecked}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left rounded-xl border p-3.5 text-xs md:text-sm transition-all duration-150 ${borderClass}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feedback Penjelasan */}
            {isAnswerChecked && selectedOption !== null && (
              <div
                className={`rounded-xl border p-4 text-xs md:text-sm animate-in fade-in duration-200 ${
                  currentQ.options[selectedOption].correct
                    ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                    : "border-rose-500/40 bg-rose-950/30 text-rose-200"
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  <span>{currentQ.options[selectedOption].correct ? "✅ Tepat!" : "❌ Kurang Tepat!"}</span>
                </div>
                <p>{currentQ.options[selectedOption].feedback}</p>
              </div>
            )}

            {/* Action Button */}
            <div className="flex justify-end pt-3">
              {!isAnswerChecked ? (
                <button
                  type="button"
                  disabled={selectedOption === null}
                  onClick={handleCheckAnswer}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-6 py-2.5 font-bold text-white shadow-lg transition hover:scale-105 disabled:opacity-40"
                >
                  Konfirmasi Jawaban ➔
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-2.5 font-bold text-black shadow-lg transition hover:scale-105"
                >
                  {currentQuestionIdx < questions.length - 1 ? "Soal Berikutnya ➔" : "Lihat Hasil Evaluasi 🎯"}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Tampilan Selesai Kuis */
          <div className="mt-6 text-center space-y-6">
            <span className="text-5xl animate-bounce inline-block">
              {score >= 2 ? "🎉🔓" : "⚡🔒"}
            </span>
            <div>
              <h3 className="text-xl font-bold text-[#ffb347]">
                {score >= 2 ? "OTENTIKASI KERNEL BERHASIL!" : "OTENTIKASI BELUM MEMADAI"}
              </h3>
              <p className="mt-2 text-sm text-gray-300">
                Skor Anda: <strong className="text-cyan-300 text-lg">{score}</strong> / {questions.length} Soal Benar
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {score >= 2
                  ? "Selamat! Pemahaman Anda tentang alokasi memori kontigu memenuhi syarat protokol keamanan OMNI. Firewall Pintu 2 terbuka!"
                  : "Dibutuhkan minimal 2 jawaban benar untuk meretas firewall Pintu 2. Silakan pelajari kembali log materi di terminal!"}
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-4 border-t border-purple-500/30">
              {score >= 2 ? (
                <button
                  type="button"
                  onClick={handleProceedToStage3}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-3 text-sm font-bold text-black shadow-[0_0_25px_rgba(52,211,153,0.8)] transition hover:scale-105"
                >
                  Buka Pintu 3 (Masuk ke Stage 3) 🚀
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetQuiz}
                  className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-rose-500"
                >
                  Coba Lagi ↺
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

