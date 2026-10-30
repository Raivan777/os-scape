"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface DiskQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function DiskQuizModal({ isOpen, onClose, onComplete }: DiskQuizModalProps) {
  const router = useRouter();
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const questions = [
    {
      title: "PROTOKOL STORAGE // EVALUASI 1: SEEK TIME",
      question:
        "Komponen waktu manakah pada disk drive yang membutuhkan durasi paling lama dan menjadi target utama optimasi algoritma penjadwalan disk?",
      options: [
        {
          id: 0,
          text: "Transfer Time - Waktu mentransfer bit byte melintasi bus data.",
          correct: false,
          feedback: "Kurang tepat. Kecepatan transfer elektronik jauh lebih cepat daripada gerakan fisik lengan mekanik.",
        },
        {
          id: 1,
          text: "Seek Time - Waktu lengan aktuator menggerakkan head menuju track/silinder sasaran.",
          correct: true,
          feedback: "Tepat sekali! Karena melibatkan pergerakan mekanis fisik, seek time adalah komponen akses disk terlambat (bottleneck utama).",
        },
        {
          id: 2,
          text: "Rotational Latency - Waktu menunggu piringan disk berputar.",
          correct: false,
          feedback: "Meskipun butuh waktu tunggu, rotasi piringan jauh lebih konsisten dan tidak diatur langsung oleh algoritma pemindahan head.",
        },
        {
          id: 3,
          text: "Disk Controller Delay - Waktu pemrosesan sinyal oleh microchip controller.",
          correct: false,
          feedback: "Salah. Delay controller elektronik berada dalam skala nanodetik.",
        },
      ],
    },
    {
      title: "PROTOKOL STORAGE // EVALUASI 2: STARVATION",
      question:
        "Mengapa algoritma SSTF (Shortest Seek Time First) berisiko menimbulkan fenomena 'Starvation' (kelaparan permintaan)?",
      options: [
        {
          id: 0,
          text: "Karena SSTF selalu menolak permintaan silinder dengan nomor ganjil.",
          correct: false,
          feedback: "Salah, SSTF tidak membedakan nomor ganjil/genap.",
        },
        {
          id: 1,
          text: "Karena jika permintaan baru terus berdatangan di dekat posisi head, silinder yang letaknya jauh tidak akan pernah dilayani.",
          correct: true,
          feedback: "Tepat sekali! Sifat 'greedy' SSTF menyebabkan permintaan di tepi disk tertinggal terus-menerus bila ada request baru yang dekat.",
        },
        {
          id: 2,
          text: "Karena arah putaran piringan disk harus dibalik setiap kali request selesai.",
          correct: false,
          feedback: "Salah, motor piringan disk selalu berputar searah.",
        },
        {
          id: 3,
          text: "Karena SSTF memaksakan head disk kembali ke silinder 0 setiap saat.",
          correct: false,
          feedback: "Salah, itu adalah varian C-SCAN / C-LOOK, bukan karakteristik SSTF.",
        },
      ],
    },
    {
      title: "PROTOKOL STORAGE // EVALUASI 3: SCAN (ELEVATOR)",
      question:
        "Manakah pernyataan yang paling akurat mengenai keunggulan algoritma SCAN (Elevator Algorithm)?",
      options: [
        {
          id: 0,
          text: "Head disk melompat secara acak demi menghemat daya listrik.",
          correct: false,
          feedback: "Salah. Gerakan acak justru memperbesar seek time.",
        },
        {
          id: 1,
          text: "Head disk bergerak konsisten menyapu satu arah melayani semua silinder di jalurnya hingga ujung, lalu berbalik arah, sehingga adil dan mencegah starvation.",
          correct: true,
          feedback: "Sempurna! Bekerja persis seperti lift gedung bertingkat, memberikan keadilan distribusi waktu tunggu tanpa starvation.",
        },
        {
          id: 2,
          text: "SCAN selalu menghasilkan total jarak seek terkecil dibandingkan SSTF.",
          correct: false,
          feedback: "Kurang tepat. Pada antrean tertentu SSTF bisa memiliki total seek lebih rendah, tetapi SCAN unggul dalam keadilan dan pencegahan kelaparan.",
        },
        {
          id: 3,
          text: "SCAN hanya bisa digunakan jika piringan disk memiliki bad sector.",
          correct: false,
          feedback: "Salah, SCAN adalah algoritma penjadwalan umum untuk semua disk drive.",
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-purple-500/50 bg-[#0c0822]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_60px_rgba(168,85,247,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/30 pb-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
              {currentQ.title}
            </span>
            <h2 className="text-lg md:text-xl font-bold text-[#ffb347]">
              FIREWALL DISK CORE // PINTU 5
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
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-2.5 font-bold text-black shadow-[0_0_20px_rgba(34,211,238,0.5)] transition hover:scale-105"
                >
                  {currentQuestionIdx < questions.length - 1 ? "Soal Berikutnya ➔" : "Lihat Hasil Akhir 🏆"}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Tampilan Hasil Akhir */
          <div className="mt-6 text-center space-y-6">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-950/60 text-4xl shadow-[0_0_30px_rgba(52,211,153,0.5)]">
              {score >= 2 ? "🎉" : "⚠️"}
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                {score >= 2 ? "Akses Port Silinder Terbuka!" : "Kalibrasi Kurang Akurat"}
              </h3>
              <p className="mt-2 text-sm text-gray-300">
                Kamu menjawab dengan benar{" "}
                <span className="font-bold text-emerald-400">{score}</span> dari{" "}
                <span className="font-bold text-white">{questions.length}</span> pertanyaan evaluasi storage.
              </p>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              {score >= 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onComplete) onComplete();
                    router.push("/stage/stage6");
                  }}
                  className="rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 px-7 py-3 font-bold text-black shadow-[0_0_30px_rgba(52,211,153,0.7)] transition hover:scale-105"
                >
                  Buka Portal Stage 6: The RAM Tetris ➔
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetQuiz}
                  className="rounded-xl bg-rose-600 px-6 py-2.5 font-bold text-white shadow-lg transition hover:bg-rose-500"
                >
                  Ulangi Evaluasi ↺
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

