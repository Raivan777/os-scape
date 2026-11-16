"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DirectoryQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

/**
 * components/DirectoryQuizModal.tsx
 *
 * Modal Evaluasi / Kuis Pemahaman Struktur Direktori (Firewall OMNI Pintu 5).
 * Berisi 4 soal pilihan ganda mengenai:
 * 1. Name collision pada Single-Level Directory
 * 2. Peran dan fungsi Master File Directory (MFD) pada Two-Level Directory
 * 3. Format dan contoh path absolut (Absolute Path)
 * 4. Alasan pemilihan Tree-Structured Directory pada OS modern
 *
 * Syarat lulus: Skor minimal 3 dari 4 soal (>= 3).
 * Bila lulus, memicu onComplete() dan navigasi ke Stage 6.
 */
export default function DirectoryQuizModal({
  isOpen,
  onClose,
  onComplete,
}: DirectoryQuizModalProps) {
  const router = useRouter();

  // State kuis
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Keyboard shortcut listener untuk Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Daftar 4 soal pilihan ganda sesuai spesifikasi materi Stage 5
  const questions = [
    {
      title: "PROTOKOL DIREKTORI // EVALUASI 1: SINGLE-LEVEL DIRECTORY",
      question:
        "Apa kelemahan dan kendala paling mendasar saat menerapkan arsitektur Single-Level Directory pada sistem komputer multi-pengguna?",
      options: [
        {
          id: 0,
          text: "Waktu pencarian berkas menjadi lambat karena harus memeriksa sektor piringan disk.",
          correct: false,
          feedback:
            "Kurang tepat. Kecepatan baca disk adalah isu hardware storage, bukan masalah mendasar konsep direktori satu tingkat.",
        },
        {
          id: 1,
          text: "Terjadinya Name Collision (tabrakan nama), di mana dua berkas dari pengguna berbeda tidak boleh memiliki nama yang sama.",
          correct: true,
          feedback:
            "Tepat sekali! Karena semua berkas disimpan dalam satu namespace global yang sama, tabrakan nama (name collision) tidak dapat dihindari saat ada pengguna lain yang menggunakan nama berkas serupa.",
        },
        {
          id: 2,
          text: "Sistem operasi membutuhkan kapasitas memori RAM dua kali lipat untuk menyimpan tabel root.",
          correct: false,
          feedback:
            "Salah. Single-Level Directory justru membutuhkan tabel paling kecil karena strukturnya yang datar.",
        },
        {
          id: 3,
          text: "Berkas tidak dapat dihapus setelah disimpan ke dalam sistem direktori.",
          correct: false,
          feedback: "Salah. Operasi penghapusan berkas tetap dapat dilakukan secara normal.",
        },
      ],
    },
    {
      title: "PROTOKOL DIREKTORI // EVALUASI 2: TWO-LEVEL DIRECTORY",
      question:
        "Pada arsitektur Two-Level Directory, apakah peran dan fungsi utama dari simpul Master File Directory (MFD)?",
      options: [
        {
          id: 0,
          text: "Menyimpan seluruh isi file dokumen dan data biner secara terpusat.",
          correct: false,
          feedback: "Salah. Berkas data disimpan di dalam User File Directory (UFD) milik tiap pengguna.",
        },
        {
          id: 1,
          text: "Mengindeks daftar akun pengguna sistem dan mengarahkan pencarian ke User File Directory (UFD) masing-masing secara terisolasi.",
          correct: true,
          feedback:
            "Tepat sekali! MFD berperan sebagai direktori tingkat pertama yang mencatat entri setiap pengguna, sehingga tiap pengguna memiliki UFD tersendiri dan nama berkas yang sama dapat berdampingan tanpa konflik.",
        },
        {
          id: 2,
          text: "Mengompresi ukuran folder agar tidak memenuhi kuota blok partisi disk.",
          correct: false,
          feedback: "Kurang tepat. Kompresi data bukan fungsi arsitektur direktori dua tingkat.",
        },
        {
          id: 3,
          text: "Menghubungkan direktori lokal komputer dengan server jaringan awan.",
          correct: false,
          feedback: "Salah. MFD adalah konsep manajemen file lokal di dalam sistem operasi.",
        },
      ],
    },
    {
      title: "PROTOKOL DIREKTORI // EVALUASI 3: PENULISAN PATH ABSOLUT",
      question:
        "Manakah di bawah ini yang merupakan contoh penulisan path absolut (Absolute Path) yang valid pada sistem operasi hierarki pohon?",
      options: [
        {
          id: 0,
          text: "../missions/mission_plan.md",
          correct: false,
          feedback: "Kurang tepat. Tanda '..' mengindikasikan direktori induk, yang merupakan ciri path relatif.",
        },
        {
          id: 1,
          text: "./flight_log.txt",
          correct: false,
          feedback: "Salah. Tanda './' mengindikasikan direktori kerja saat ini (working directory), yakni path relatif.",
        },
        {
          id: 2,
          text: "/home/alpha/missions/mission_plan.md",
          correct: true,
          feedback:
            "Sempurna! Path absolut selalu dimulai dari direktori akar (root '/') hingga ke lokasi berkas tujuan secara lengkap.",
        },
        {
          id: 3,
          text: "flight_log.txt",
          correct: false,
          feedback: "Salah. Penulisan nama berkas langsung tanpa awalan root merupakan path relatif.",
        },
      ],
    },
    {
      title: "PROTOKOL DIREKTORI // EVALUASI 4: TREE-STRUCTURED DIRECTORY",
      question:
        "Mengapa arsitektur Tree-Structured Directory (Struktur Pohon) diadopsi secara universal oleh hampir seluruh sistem operasi modern?",
      options: [
        {
          id: 0,
          text: "Karena selalu membutuhkan jumlah langkah pencarian yang paling sedikit pada semua ukuran data.",
          correct: false,
          feedback:
            "Kurang tepat. Pada dataset yang sangat kecil, penelusuran hierarki bisa membutuhkan langkah perantara lebih banyak.",
        },
        {
          id: 1,
          text: "Karena memberikan fleksibilitas pengelompokan hierarkis tanpa batas, skalabilitas tinggi, dukungan subdirektori bebas, dan proteksi hak akses terperinci.",
          correct: true,
          feedback:
            "Tepat sekali! Tree-Structured Directory memungkinkan pengguna dan sistem mengelompokkan jutaan file secara logis ke dalam subfolder bercabang tanpa risiko name collision serta memudahkan pengelolaan izin akses.",
        },
        {
          id: 2,
          text: "Karena arsitektur pohon tidak memerlukan sistem file tabel sama sekali.",
          correct: false,
          feedback: "Salah. Sistem operasi tetap memerlukan struktur tabel seperti inode atau FAT untuk mengelola pohon berkas.",
        },
        {
          id: 3,
          text: "Karena direktori pohon secara otomatis menghapus berkas yang tidak pernah diakses.",
          correct: false,
          feedback: "Salah. Penghapusan berkas tidak terjadi otomatis hanya karena struktur pohon.",
        },
      ],
    },
  ];

  // Semua hook dipanggil di atas sebelum early return
  if (!isOpen) return null;

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

  const isPassed = score >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-purple-500/50 bg-[#0c0822]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_60px_rgba(168,85,247,0.3)]">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-purple-500/30 pb-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
              {currentQ.title}
            </span>
            <h2 className="text-lg md:text-xl font-bold text-[#ffb347] font-mono">
              FIREWALL PINTU 5 // EVALUASI STRUKTUR DIREKTORI
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕ Batal
          </button>
        </div>

        {!isFinished ? (
          <div className="mt-6 space-y-6">
            {/* Progress Bar */}
            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs text-cyan-300">
                Soal {currentQuestionIdx + 1} / {questions.length}
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
                  borderClass =
                    "border-cyan-400 bg-cyan-950/40 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.3)]";
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
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold font-mono">
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
                className={`rounded-xl border p-4 text-xs md:text-sm animate-in fade-in duration-200 leading-relaxed ${
                  currentQ.options[selectedOption].correct
                    ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                    : "border-rose-500/40 bg-rose-950/30 text-rose-200"
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1 font-mono">
                  <span>
                    {currentQ.options[selectedOption].correct ? "✅ Tepat Sekali!" : "❌ Kurang Tepat!"}
                  </span>
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
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-6 py-2.5 font-bold text-white shadow-lg transition hover:scale-105 disabled:opacity-40 font-mono text-xs"
                >
                  Konfirmasi Jawaban ➔
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-2.5 font-bold text-black shadow-[0_0_20px_rgba(34,211,238,0.5)] transition hover:scale-105 font-mono text-xs"
                >
                  {currentQuestionIdx < questions.length - 1
                    ? "Soal Berikutnya ➔"
                    : "Lihat Hasil Evaluasi 🏆"}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Tampilan Hasil Akhir Kuis */
          <div className="mt-6 text-center space-y-6">
            <div
              className={`inline-flex h-20 w-20 items-center justify-center rounded-full border-2 text-4xl ${
                isPassed
                  ? "border-emerald-400 bg-emerald-950/60 shadow-[0_0_30px_rgba(52,211,153,0.5)]"
                  : "border-rose-500 bg-rose-950/60 shadow-[0_0_30px_rgba(244,63,94,0.5)]"
              }`}
            >
              {isPassed ? "🎉" : "⚠️"}
            </div>

            <div>
              <h3 className="text-xl font-bold text-white font-mono">
                {isPassed
                  ? "Akses Firewall Pintu 5 Terbuka!"
                  : "Akses Ditolak: Skor Belum Mencukupi"}
              </h3>
              <p className="mt-2 text-sm text-gray-300">
                Kamu menjawab dengan benar{" "}
                <span
                  className={`font-bold font-mono text-base ${
                    isPassed ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {score}
                </span>{" "}
                dari <span className="font-bold text-white font-mono">{questions.length}</span> soal
                struktur direktori. (Syarat lulus: minimal 3 benar).
              </p>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              {isPassed ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onComplete) onComplete();
                    router.push("/stage/stage6");
                  }}
                  className="rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 px-7 py-3 font-bold text-black shadow-[0_0_30px_rgba(52,211,153,0.7)] transition hover:scale-105 font-mono text-xs"
                >
                  Buka Portal Stage 6: The RAM Tetris ➔
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetQuiz}
                  className="rounded-xl bg-rose-600 px-6 py-2.5 font-bold text-white shadow-lg transition hover:bg-rose-500 font-mono text-xs"
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

