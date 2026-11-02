"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface DeadlockQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function DeadlockQuizModal({
  isOpen,
  onClose,
  onComplete,
}: DeadlockQuizModalProps) {
  const router = useRouter();
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const questions = [
    {
      title: "PROTOKOL DEADLOCK // EVALUASI 1: KONDISI COFFMAN",
      question:
        "Manakah dari pernyataan berikut yang BENAR mengenai empat kondisi karakteristik Coffman agar Deadlock dapat terbentuk?",
      options: [
        {
          id: 0,
          text: "Deadlock dapat terjadi jika minimal satu saja dari 4 kondisi Coffman terpenuhi.",
          correct: false,
          feedback:
            "Salah! Deadlock mensyaratkan KEEMPAT kondisi Coffman harus terpenuhi secara simultan (serentak). Menggugurkan satu kondisi saja sudah cukup untuk mencegah deadlock.",
        },
        {
          id: 1,
          text: "Keempat kondisi (Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait) wajib terjadi secara serentak.",
          correct: true,
          feedback:
            "Tepat sekali! Keempat kondisi Coffman merupakan syarat mutlak yang harus ada secara bersamaan agar kebuntuan (Deadlock) bisa terjadi.",
        },
        {
          id: 2,
          text: "Circular Wait adalah satu-satunya kondisi yang menyebabkan deadlock tanpa perlu Mutual Exclusion.",
          correct: false,
          feedback:
            "Salah. Jika sumber daya dapat dibagi bersama (sharable), Circular Wait tidak akan menimbulkan kebuntuan.",
        },
        {
          id: 3,
          text: "No Preemption berarti sistem operasi bebas merampas sumber daya dari proses yang sedang berjalan kapan saja.",
          correct: false,
          feedback:
            "Terbalik! No Preemption berarti sumber daya TIDAK DAPAT dirampas paksa, hanya bisa dilepaskan secara sukarela oleh proses yang memegangnya.",
        },
      ],
    },
    {
      title: "PROTOKOL DEADLOCK // EVALUASI 2: FORMULA BANKER'S ALGORITHM",
      question:
        "Pada Algoritma Banker, jika suatu proses P1 memiliki alokasi Allocation = [2, 1, 3] dan klaim batas maksimum Max = [5, 4, 4], berapakah matriks sisa kebutuhan (Need) untuk proses P1?",
      options: [
        {
          id: 0,
          text: "Need = [7, 5, 7]",
          correct: false,
          feedback: "Salah. Itu adalah hasil penjumlahan Max + Allocation.",
        },
        {
          id: 1,
          text: "Need = [3, 3, 1]",
          correct: true,
          feedback:
            "Benar sekali! Rumus dasar Need adalah Need = Max - Allocation. Maka [5-2, 4-1, 4-3] = [3, 3, 1].",
        },
        {
          id: 2,
          text: "Need = [2, 1, 3]",
          correct: false,
          feedback: "Salah. Itu adalah nilai Allocation saat ini.",
        },
        {
          id: 3,
          text: "Need = [1, 1, 1]",
          correct: false,
          feedback: "Salah perhitungan.",
        },
      ],
    },
    {
      title: "PROTOKOL DEADLOCK // EVALUASI 3: SAFE STATE VS UNSAFE STATE",
      question:
        "Bagaimanakah hubungan yang tepat antara Safe State, Unsafe State, dan Deadlock dalam konsep penghindaran deadlock (Deadlock Avoidance)?",
      options: [
        {
          id: 0,
          text: "Setiap kondisi Unsafe State adalah kondisi yang pasti sudah mengalami Deadlock seketika itu juga.",
          correct: false,
          feedback:
            "Kurang tepat. Unsafe State BUKAN berarti pasti sudah deadlock, melainkan kondisi rawan di mana sistem tidak lagi bisa menjamin bebas dari kemungkinan deadlock.",
        },
        {
          id: 1,
          text: "Safe State menjamin sistem bebas dari deadlock, sedangkan Unsafe State berpotensi memicu deadlock jika permintaan proses melebihi kapasitas.",
          correct: true,
          feedback:
            "Tepat sekali! Safe State menjamin adanya minimal satu Safe Sequence urutan eksekusi aman. Unsafe State adalah zona bahaya di mana deadlock dapat terjadi.",
        },
        {
          id: 2,
          text: "Sistem operasi modern sengaja membiarkan Safe State berubah menjadi Deadlock untuk menghemat RAM.",
          correct: false,
          feedback: "Salah total.",
        },
        {
          id: 3,
          text: "Algoritma Banker bertujuan mengubah Deadlock menjadi Safe State setelah proses macet.",
          correct: false,
          feedback:
            "Salah. Banker adalah algoritma Penghindaran (Avoidance), yaitu mencegah sistem memasuki kondisi Unsafe sejak awal, bukan pemulihan pasca-deadlock.",
        },
      ],
    },
    {
      title: "PROTOKOL DEADLOCK // EVALUASI 4: RESOURCE-REQUEST EVALUATION",
      question:
        "Ketika proses P2 mengajukan Resource-Request, kapankah permintaan tersebut wajib DITANGGUHKAN / DITOLAK SEMENTARA (wajib WAIT) oleh Banker?",
      options: [
        {
          id: 0,
          text: "Hanya jika jumlah proses yang sedang berjalan berjumlah ganjil.",
          correct: false,
          feedback: "Salah. Banker tidak peduli apakah jumlah proses ganjil atau genap.",
        },
        {
          id: 1,
          text: "Ketika alokasi tentatif menyebabkan sistem berpindah dari Safe State menjadi Unsafe State (tidak ada Safe Sequence tersisa).",
          correct: true,
          feedback:
            "Tepat sekali! Jika uji keselamatan (Safety Check) mendeteksi status tidak aman, alokasi dibatalkan (Rollback) dan proses harus menunggu (WAIT) agar sistem tidak terjebak deadlock.",
        },
        {
          id: 2,
          text: "Ketika proses memiliki prioritas CPU lebih tinggi dari kernel.",
          correct: false,
          feedback: "Salah, prioritas CPU tidak menentukan alokasi Banker.",
        },
        {
          id: 3,
          text: "Ketika semua proses lain sudah berstatus Finish = true.",
          correct: false,
          feedback: "Salah. Jika proses lain sudah selesai, sumber daya justru melimpah.",
        },
      ],
    },
    {
      title: "PROTOKOL DEADLOCK // EVALUASI 5: DINING PHILOSOPHERS",
      question:
        "Bagaimana strategi Asymmetric Solution (Solusi Asimetris) berhasil memecahkan masalah deadlock pada skenario Dining Philosophers?",
      options: [
        {
          id: 0,
          text: "Dengan cara membunuh filsuf yang makannya paling lambat.",
          correct: false,
          feedback: "Salah. Itu adalah terminasi paksa yang tidak efisien.",
        },
        {
          id: 1,
          text: "Filsuf bernomor ganjil mengambil garpu kiri dulu lalu kanan, sedangkan filsuf genap mengambil kanan dulu lalu kiri, sehingga memecahkan kondisi Circular Wait.",
          correct: true,
          feedback:
            "Luar biasa, benar sekali! Dengan membedakan urutan pengambilan garpu berdasarkan nomor ganjil-genap, mustahil terbentuk siklus melingkar tertutup (Circular Wait). Minimal satu filsuf selalu berhasil memegang dua garpu!",
        },
        {
          id: 2,
          text: "Dengan menambahkan 10 garpu baru di atas meja makan.",
          correct: false,
          feedback: "Bukan solusi algoritma konkurensi.",
        },
        {
          id: 3,
          text: "Dengan melarang semua filsuf berpikir (Thinking).",
          correct: false,
          feedback: "Salah.",
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
    setIsAnswerChecked(true);
    if (currentQ.options[selectedOption].correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      setIsFinished(true);
      if (onComplete) onComplete();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-purple-500/50 bg-[#0c0820]/95 text-[#e9e4ff] shadow-[0_0_70px_rgba(168,85,247,0.35)]">
        {/* Header Kuis */}
        <div className="flex items-center justify-between border-b border-purple-500/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3.5 w-3.5 rounded-full bg-pink-400 animate-ping" />
            <div>
              <h2 className="text-base md:text-lg font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300">
                GATEWAY SECURITY PROTOCOL // EVALUASI STAGE 4
              </h2>
              <p className="text-xs text-purple-300/80 font-mono">
                Sertifikasi Penanganan Deadlock & Kunci Akses Portal Stage 5
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕ Tutup (ESC)
          </button>
        </div>

        {/* Konten Kuis */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!isFinished ? (
            <>
              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-purple-300">
                  <span>
                    Soal {currentQuestionIdx + 1} dari {questions.length}
                  </span>
                  <span>Skor Saat Ini: {score}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-purple-950/60 overflow-hidden border border-purple-500/20">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{
                      width: `${((currentQuestionIdx + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Soal */}
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
                <span className="text-[11px] font-mono font-bold text-pink-300 block mb-1">
                  {currentQ.title}
                </span>
                <p className="text-sm md:text-base font-semibold text-white leading-snug">
                  {currentQ.question}
                </p>
              </div>

              {/* Opsi Jawaban */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt) => {
                  let optStyle =
                    "border-white/10 bg-black/40 hover:bg-purple-950/40 hover:border-purple-500/40 text-gray-300";

                  if (selectedOption === opt.id) {
                    optStyle =
                      "border-purple-400 bg-purple-900/40 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]";
                  }

                  if (isAnswerChecked) {
                    if (opt.correct) {
                      optStyle =
                        "border-emerald-400 bg-emerald-950/50 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                    } else if (selectedOption === opt.id && !opt.correct) {
                      optStyle =
                        "border-red-400 bg-red-950/50 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                    } else {
                      optStyle = "border-white/5 bg-black/20 text-gray-500 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isAnswerChecked}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs md:text-sm font-medium flex items-start gap-3 ${optStyle}`}
                    >
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-white/5 border border-white/10 font-mono text-xs">
                        {String.fromCharCode(65 + opt.id)}
                      </span>
                      <span className="flex-1 mt-0.5">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback Evaluasi */}
              {isAnswerChecked && selectedOption !== null && (
                <div
                  className={`p-4 rounded-xl border text-xs md:text-sm animate-in fade-in duration-200 ${
                    currentQ.options[selectedOption].correct
                      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                      : "border-red-500/40 bg-red-950/30 text-red-200"
                  }`}
                >
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    {currentQ.options[selectedOption].correct ? "✅ TEPAT!" : "❌ KURANG TEPAT"}
                  </div>
                  <p>{currentQ.options[selectedOption].feedback}</p>
                </div>
              )}
            </>
          ) : (
            /* Tampilan Selesai Kuis */
            <div className="py-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="text-5xl">
                {score >= 4 ? "🏆🛸" : score >= 3 ? "⚡🔓" : "⚠️🔒"}
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                  {score >= 4
                    ? "Evaluasi Penanganan Deadlock Lulus Sempurna!"
                    : score >= 3
                    ? "Sistem Aman! Gerbang Terbuka"
                    : "Kapasitas Banker Belum Optimal"}
                </h3>
                <p className="mt-2 text-sm text-gray-300">
                  Kamu menjawab <span className="font-bold text-pink-300">{score}</span> dari{" "}
                  <span className="font-bold">{questions.length}</span> soal dengan benar.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/30 max-w-md mx-auto text-xs text-purple-200 text-left space-y-2 font-mono">
                {score >= 3 ? (
                  <>
                    <p className="font-bold text-emerald-300">
                      ✅ PROTOKOL KESELAMATAN TERVERIFIKASI:
                    </p>
                    <p>
                      Sistem mengonfirmasi bahwa kamu telah memahami 4 Kondisi Coffman, rumus Banker
                      (Need = Max - Allocation), mitigasi Safe State, dan pemecahan Circular Wait pada
                      Dining Philosophers.
                    </p>
                    <p className="text-cyan-300">
                      Gerbang Portal menuju STAGE 5 (The Void Trap / Penjadwalan Disk) kini TELAH DIBUKA!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-amber-300">⚠️ AKSES PORTAL DITAHAN:</p>
                    <p>
                      Skor minimal untuk membuka portal adalah 3/5. Pelajari kembali materi Banker dan
                      Dining Philosophers lalu coba ulangi evaluasi.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Tombol Aksi */}
        <div className="flex items-center justify-between border-t border-purple-500/30 bg-black/40 px-6 py-4">
          {!isFinished ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-gray-500 font-mono hidden md:inline">
                Pilih satu jawaban yang paling tepat
              </span>
              <div className="flex gap-3 ml-auto">
                {!isAnswerChecked ? (
                  <button
                    type="button"
                    disabled={selectedOption === null}
                    onClick={handleCheckAnswer}
                    className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-xs md:text-sm font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Periksa Jawaban ➔
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs md:text-sm font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] transition hover:scale-105 active:scale-95"
                  >
                    {currentQuestionIdx < questions.length - 1 ? "Soal Berikutnya ➔" : "Lihat Hasil ➔"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleResetQuiz}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 transition hover:bg-white/10"
              >
                🔄 Ulangi Evaluasi
              </button>
              <div className="flex gap-3">
                {score >= 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push("/stage/stage5");
                    }}
                    className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-xs md:text-sm font-bold text-white shadow-[0_0_20px_rgba(34,211,238,0.5)] transition hover:scale-105 active:scale-95 animate-pulse"
                  >
                    Masuk ke Stage 5 ➔
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 text-xs md:text-sm font-bold text-white transition hover:scale-105"
                  >
                    Tutup & Coba Lagi Nanti
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

