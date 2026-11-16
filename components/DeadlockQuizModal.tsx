"use client";

import React, { useState } from "react";

interface DeadlockQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPass: () => void;
  isAlreadyPassed: boolean;
}

export default function DeadlockQuizModal({
  isOpen,
  onClose,
  onPass,
  isAlreadyPassed,
}: DeadlockQuizModalProps) {
  const [activeTab, setActiveTab] = useState<"briefing" | "quiz">("briefing");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);

  if (!isOpen) return null;

  const questions = [
    {
      id: 1,
      topic: "Konsep Siklus (Resource Allocation Graph)",
      question:
        "Pada sistem komputer dengan sumber daya berjenis single-instance (hanya ada 1 unit per tipe sumber daya), keberadaan sebuah siklus (cycle) pada Resource Allocation Graph menandakan bahwa...",
      options: [
        {
          id: 0,
          text: "Sistem berada dalam kondisi aman (Safe State).",
          correct: false,
        },
        {
          id: 1,
          text: "Pasti terjadi Deadlock pada proses-proses di dalam siklus.",
          correct: true,
        },
        {
          id: 2,
          text: "Semua proses dapat menyelesaikan tugasnya bergantian.",
          correct: false,
        },
        {
          id: 3,
          text: "Siklus tersebut otomatis hilang setelah CPU restart.",
          correct: false,
        },
      ],
      hint: "Ingat teorema RAG: jika tiap tipe sumber daya hanya memiliki 1 unit, adanya siklus adalah syarat mutlak dan cukup terjadinya Deadlock.",
      explanation:
        "Tepat! Pada sistem single-instance, terbentuknya siklus langsung menandakan terjadinya rantai saling tunggu tertutup (Deadlock).",
    },
    {
      id: 2,
      topic: "Dining Philosophers Problem",
      question:
        "Dalam skenario klasik Dining Philosophers, apa yang menyebabkan kelima filsuf membeku (deadlock) secara serentak?",
      options: [
        {
          id: 0,
          text: "Makanan di meja habis sebelum ada yang sempat makan.",
          correct: false,
        },
        {
          id: 1,
          text: "Setiap filsuf serentak mengambil satu garpu dan menunggu garpu berikutnya yang dipegang tetangganya.",
          correct: true,
        },
        {
          id: 2,
          text: "Semua filsuf menolak untuk makan dan hanya bermeditasi.",
          correct: false,
        },
        {
          id: 3,
          text: "Ada satu filsuf yang mengambil seluruh garpu sekaligus.",
          correct: false,
        },
      ],
      hint: "Perhatikan saat semua filsuf lapar di saat yang sama dan mengambil garpu kiri masing-masing. Apa yang terjadi pada garpu kanan?",
      explanation:
        "Tepat! Saat kelima filsuf memegang 1 garpu dan menunggu garpu kedua dari tetangganya, terbentuk kondisi Hold and Wait serta Circular Wait.",
    },
    {
      id: 3,
      topic: "Circular Wait & Pencegahannya",
      question:
        "Bagaimana cara sistem operasi mencegah atau mematahkan kondisi Circular Wait pada sekumpulan proses yang bersaing?",
      options: [
        {
          id: 0,
          text: "Menetapkan aturan penomoran urutan global pada sumber daya atau menggunakan urutan alokasi asimetris.",
          correct: true,
        },
        {
          id: 1,
          text: "Membiarkan semua proses menunggu tanpa batasan waktu.",
          correct: false,
        },
        {
          id: 2,
          text: "Menambah jumlah proses baru ke dalam sistem antrean.",
          correct: false,
        },
        {
          id: 3,
          text: "Menghapus proteksi memori agar semua proses bisa berebut.",
          correct: false,
        },
      ],
      hint: "Jika sumber daya diberi nomor berurutan (misal R1, R2, R3) dan proses hanya boleh meminta sumber daya bernomor lebih tinggi, mungkinkah terbentuk lingkaran saling tunggu?",
      explanation:
        "Tepat! Dengan penomoran global atau solusi asimetris (ganjil-genap), rantai siklik tertutup mustahil terbentuk.",
    },
  ];

  const currentQ = questions[currentIdx];

  const handleSelect = (idx: number) => {
    if (checked) return;
    setSelectedOpt(idx);
  };

  const handleCheck = () => {
    if (selectedOpt === null) return;
    setChecked(true);
    if (currentQ.options[selectedOpt].correct) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOpt(null);
      setChecked(false);
      setShowHint(false);
    } else {
      setFinished(true);
      const isPass =
        score + (checked && currentQ.options[selectedOpt ?? 0].correct ? 0 : 0) >= 2;
      if (isPass || isAlreadyPassed) {
        onPass();
      }
    }
  };

  const handleRetry = () => {
    setCurrentIdx(0);
    setSelectedOpt(null);
    setChecked(false);
    setScore(0);
    setFinished(false);
    setShowHint(false);
  };

  const passed = score >= 2 || isAlreadyPassed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 md:p-6 backdrop-blur-md">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-cyan-400/40 bg-[#071324]/95 text-gray-100 shadow-[0_0_50px_rgba(34,211,238,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 px-6 py-4 bg-cyan-950/30">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
            <div>
              <h2 className="text-base md:text-lg font-bold tracking-wide text-cyan-200">
                MODUL // STAGE 4: DEADLOCK &amp; PENANGANANNYA
              </h2>
              <p className="text-xs text-gray-400">Briefing Misi &amp; Kuis Evaluasi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10"
          >
            ✕ Tutup (ESC)
          </button>
        </div>

        {/* Tab Navigasi Modal */}
        <div className="flex border-b border-white/10 bg-black/40 px-6 py-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("briefing")}
            className={`px-4 py-1.5 rounded-lg font-semibold transition ${
              activeTab === "briefing"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📋 Briefing Misi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={`px-4 py-1.5 rounded-lg font-semibold transition ${
              activeTab === "quiz"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📝 Kuis Protokol {passed ? "(LULUS ✅)" : ""}
          </button>
        </div>

        {/* Isi Konten dengan Custom Scrollbar */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-4 text-sm leading-relaxed">
          {activeTab === "briefing" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
                <h3 className="font-bold text-cyan-300 text-base mb-2">🎯 Misi Stage 4</h3>
                <div className="space-y-2.5 text-xs md:text-sm text-gray-200">
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center font-bold text-cyan-300 text-xs">
                      1
                    </span>
                    <p>
                      <strong>Baca briefing:</strong> Berdiri di hologram{" "}
                      <span className="text-cyan-300 font-mono">“MODUL: STAGE 4”</span> di konsol
                      meja utama.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center font-bold text-cyan-300 text-xs">
                      2
                    </span>
                    <p>
                      <strong>Jawab kuis:</strong> Ada 3 soal (konsep siklus, Dining Philosophers,
                      dan circular wait). Lulus kalau benar minimal 2 dari 3 soal (+100 poin).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center font-bold text-cyan-300 text-xs">
                      3
                    </span>
                    <p>
                      <strong>Selesaikan mini-game:</strong> Alien Life-Support Banker dengan 3
                      gembok (+100 poin per gembok).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center font-bold text-cyan-300 text-xs">
                      4
                    </span>
                    <p>
                      <strong>Masuk portal ke Level 5:</strong> Gerbang portal aktif setelah kuis
                      dan ketiga gembok terselesaikan (+100 poin).
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2 text-xs text-gray-300">
                <span className="font-bold text-amber-300 block text-sm">💡 Aturan Penilaian:</span>
                <p>• Jawaban salah tidak mengurangi nyawa, pemain hanya mengulang.</p>
                <p>• Hint gratis dan tidak terbatas dapat diakses kapan saja.</p>
                <p>
                  • Skor tetap: Kuis 100 poin, tiap gembok 100 poin, dan gerbang portal 100 poin
                  (Total: 500 poin).
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab("quiz")}
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 font-bold text-black text-xs md:text-sm transition shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  Mulai Jawab Kuis ➔
                </button>
              </div>
            </div>
          ) : !finished ? (
            <div className="space-y-4">
              {/* Progress Bar Kuis */}
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                <span>
                  Soal {currentIdx + 1} dari {questions.length} • {currentQ.topic}
                </span>
                <span>Skor Benar: {score}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Teks Pertanyaan */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <p className="text-sm md:text-base font-semibold text-white leading-snug">
                  {currentQ.question}
                </p>
              </div>

              {/* Tombol Hint Gratis */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs text-cyan-300 hover:underline flex items-center gap-1 font-mono"
                >
                  <span>💡</span> {showHint ? "Sembunyikan Hint" : "Buka Hint Gratis (Tanpa Penalti)"}
                </button>
                <span className="text-[11px] text-gray-500">
                  {selectedOpt === null ? "Pilih satu opsi di bawah" : "Klik 'Periksa Jawaban'"}
                </span>
              </div>

              {showHint && (
                <div className="rounded-lg border border-amber-400/30 bg-amber-950/20 p-3 text-xs text-amber-200">
                  {currentQ.hint}
                </div>
              )}

              {/* Pilihan Opsi */}
              <div className="space-y-2">
                {currentQ.options.map((opt) => {
                  let optStyle =
                    "border-white/10 bg-black/30 hover:bg-cyan-950/30 hover:border-cyan-500/40 text-gray-300";

                  if (selectedOpt === opt.id) {
                    optStyle =
                      "border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]";
                  }

                  if (checked) {
                    if (opt.correct) {
                      optStyle =
                        "border-emerald-400 bg-emerald-950/50 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]";
                    } else if (selectedOpt === opt.id && !opt.correct) {
                      optStyle = "border-red-400 bg-red-950/50 text-red-200";
                    } else {
                      optStyle = "border-white/5 bg-black/20 text-gray-500 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={checked}
                      onClick={() => handleSelect(opt.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition text-xs md:text-sm flex items-start gap-3 ${optStyle}`}
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs">
                        {String.fromCharCode(65 + opt.id)}
                      </span>
                      <span className="flex-1 mt-0.5">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback Jawaban */}
              {checked && selectedOpt !== null && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    currentQ.options[selectedOpt].correct
                      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                      : "border-red-500/40 bg-red-950/30 text-red-200"
                  }`}
                >
                  <p className="font-bold mb-1">
                    {currentQ.options[selectedOpt].correct ? "✅ Benar!" : "❌ Kurang Tepat"}
                  </p>
                  <p>
                    {currentQ.options[selectedOpt].correct
                      ? currentQ.explanation
                      : "Jawaban salah tidak mengurangi nyawa. Kamu bisa melanjutkan ke soal berikutnya atau mengulang setelah kuis selesai."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Hasil Kuis */
            <div className="py-6 text-center space-y-4">
              <div className="text-4xl">{passed ? "🎉" : "🔄"}</div>
              <h3 className="text-xl font-bold text-white">
                {passed ? "Kuis Stage 4 Selesai!" : "Belum Memenuhi Syarat Kelulusan"}
              </h3>
              <p className="text-xs md:text-sm text-gray-300">
                Kamu menjawab <span className="font-bold text-cyan-300">{score}</span> dari{" "}
                <span className="font-bold">{questions.length}</span> soal dengan benar. Syarat
                lulus adalah minimal 2 benar.
              </p>

              {passed ? (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-xs text-emerald-200 max-w-md mx-auto">
                  <p className="font-bold text-emerald-300">✅ SKOR KUIS DITERIMA (+100 POIN)</p>
                  <p className="mt-1">
                    Pemahamanmu mengenai siklus, Dining Philosophers, dan Circular Wait sudah
                    terbukti. Silakan lanjut ke mini-game Alien Life-Support Banker!
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-xs text-amber-200 max-w-md mx-auto">
                  <p className="font-bold text-amber-300">⚠️ SILAKAN ULANGI KUIS</p>
                  <p className="mt-1">
                    Tidak ada pengurangan nyawa. Manfaatkan hint gratis untuk menjawab dengan tepat.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Tombol Aksi Kuis */}
        <div className="flex items-center justify-between border-t border-cyan-500/20 bg-black/40 px-6 py-4">
          {activeTab === "quiz" && !finished && (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-gray-400 font-mono hidden sm:inline">
                {!checked
                  ? "Pilih jawaban lalu tekan tombol 'Periksa Jawaban'"
                  : "Jawaban telah diperiksa"}
              </span>
              <div className="flex gap-2 ml-auto">
                {!checked ? (
                  <button
                    type="button"
                    disabled={selectedOpt === null}
                    onClick={handleCheck}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-6 py-2.5 text-xs md:text-sm font-bold text-black transition shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    🔍 Periksa Jawaban
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-6 py-2.5 text-xs md:text-sm font-bold text-black transition shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  >
                    {currentIdx < questions.length - 1 ? "Soal Berikutnya ➔" : "Lihat Hasil ➔"}
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "quiz" && finished && (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-xl border border-white/20 px-4 py-2 text-xs text-gray-300 hover:bg-white/10"
              >
                🔄 Ulangi Kuis
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2 text-xs md:text-sm font-bold text-black transition shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                Selesai &amp; Lanjutkan ➔
              </button>
            </div>
          )}

          {activeTab === "briefing" && (
            <div className="flex justify-end w-full">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/20 px-4 py-2 text-xs text-gray-300 hover:bg-white/10"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
