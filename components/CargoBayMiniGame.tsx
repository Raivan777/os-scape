"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  generateRoundMissions,
  Mission,
  Hole,
  Cargo,
  MemoryAlgorithm,
} from "../utils/memoryLogic";

interface CargoBayMiniGameProps {
  onComplete?: () => void;
  onOpenMaterial?: () => void;
  onOpenSimulator?: () => void;
}

export default function CargoBayMiniGame({
  onComplete,
  onOpenMaterial,
  onOpenSimulator,
}: CargoBayMiniGameProps) {
  // 1. State Ronde & Misi
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 9000) + 100);
  const [missionIndex, setMissionIndex] = useState<number>(0);
  const missions: Mission[] = useMemo(() => generateRoundMissions(seed), [seed]);
  const currentMission: Mission = missions[missionIndex] || missions[0];

  // 2. State Interaksi & Jawaban
  const [selectedSlotId, setSelectedSlotId] = useState<string | number | null>(null);
  const [selectedAlgo, setSelectedAlgo] = useState<MemoryAlgorithm | null>(null);
  const [selectedLeftover, setSelectedLeftover] = useState<number | null>(null);
  const [clickedSequence, setClickedSequence] = useState<Array<string | number>>([]);
  const [selectedWrongCandidate, setSelectedWrongCandidate] = useState<string | number | null>(null);
  const [willFitAnswer, setWillFitAnswer] = useState<boolean | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, MemoryAlgorithm>>({});

  // 3. State Evaluasi & Skor
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [missionScore, setMissionScore] = useState<number>(10);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [isRoundFinished, setIsRoundFinished] = useState<boolean>(false);

  // Reset form interaksi saat pindah misi
  useEffect(() => {
    setSelectedSlotId(null);
    setSelectedAlgo(null);
    setSelectedLeftover(null);
    setClickedSequence([]);
    setSelectedWrongCandidate(null);
    setWillFitAnswer(null);
    setMatchedPairs({});
    setAttemptCount(0);
    setMissionScore(10);
    setFeedback(null);
  }, [missionIndex, seed]);

  // Handler Pengecekan Jawaban
  const handleCheckAnswer = () => {
    let isCorrect = false;
    let customExplanation = currentMission.explanation;

    switch (currentMission.type) {
      case "drag_and_drop":
      case "guess_slot": {
        isCorrect = selectedSlotId === currentMission.correctSlotId;
        break;
      }
      case "guess_algorithm": {
        isCorrect = selectedAlgo === currentMission.correctAlgorithm;
        break;
      }
      case "calculate_leftover": {
        isCorrect = selectedLeftover === currentMission.correctLeftover;
        break;
      }
      case "inspection_order": {
        const correct = currentMission.correctInspectionOrder || [];
        isCorrect =
          clickedSequence.length === correct.length &&
          clickedSequence.every((val, idx) => val === correct[idx]);
        break;
      }
      case "find_the_wrong": {
        const wrongCandidate = currentMission.wrongCandidates?.find((c) => c.isWrong);
        isCorrect = selectedWrongCandidate === wrongCandidate?.id;
        break;
      }
      case "will_it_fit": {
        isCorrect = willFitAnswer === currentMission.canFit;
        break;
      }
      case "match_cards": {
        const pairs = currentMission.matchPairs || [];
        isCorrect = pairs.every((p) => matchedPairs[p.description] === p.algo);
        break;
      }
    }

    if (isCorrect) {
      setTotalScore((prev) => prev + missionScore);
      setFeedback({
        isCorrect: true,
        message: `✅ Tepat Sekali! (+${missionScore} Poin) ${customExplanation}`,
      });
    } else {
      setAttemptCount((prev) => prev + 1);
      setMissionScore((prev) => Math.max(5, prev - 3)); // Pengurangan skor sedikit jika salah
      setFeedback({
        isCorrect: false,
        message: `❌ Belum tepat. ${customExplanation} Silakan coba lagi!`,
      });
    }
  };

  // Lanjut ke Misi Berikutnya
  const handleNextMission = () => {
    if (missionIndex < missions.length - 1) {
      setMissionIndex((prev) => prev + 1);
    } else {
      setIsRoundFinished(true);
    }
  };

  // Reset Ronde Baru dengan Seed Baru
  const handleNewRound = () => {
    setSeed(Math.floor(Math.random() * 9000) + 100);
    setMissionIndex(0);
    setTotalScore(0);
    setIsRoundFinished(false);
  };

  // Bintang Performa di Akhir Ronde
  const starCount = totalScore >= 50 ? 3 : totalScore >= 35 ? 2 : 1;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border-2 border-cyan-500/40 bg-[#060410] shadow-[0_0_50px_rgba(34,211,238,0.25)] select-none">
      {/* Container Utama Beraspek Rasio 16:9 */}
      <div className="relative w-full aspect-[16/9] min-h-[540px] overflow-hidden">
        {/* Layer 1: Background Image interior stasiun luar angkasa dengan fallback SVG */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: "url('/stage2bg.png')",
          }}
        >
          {/* Fallback CSS / SVG Dekoratif jika gambar belum dimuat / gagal */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b081e] via-[#090616] to-[#04020a] -z-10" />
          <svg className="absolute inset-0 h-full w-full opacity-30 pointer-events-none -z-10" xmlns="http://www.w3.org/2000/svg">
            {/* Jendela Luar Angkasa Raksasa di Tengah Atas */}
            <ellipse cx="50%" cy="20%" rx="35%" ry="18%" fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="8 6" opacity="0.6" />
            <circle cx="50%" cy="18%" r="40" fill="#38bdf8" opacity="0.1" />
            {/* Tabung Cyan Kiri Atas (Sumber Kargo) */}
            <rect x="6%" y="8%" width="9%" height="22%" rx="12" fill="#082f49" stroke="#22d3ee" strokeWidth="2" opacity="0.7" />
            {/* Tabung Hijau Kanan Atas */}
            <rect x="85%" y="8%" width="9%" height="22%" rx="12" fill="#064e3b" stroke="#34d399" strokeWidth="2" opacity="0.7" />
          </svg>
        </div>

        {/* Layer 2: Overlay Gelap 40% agar Kontras Teks Tetap Optimal */}
        <div className="absolute inset-0 bg-black/45 pointer-events-none" />

        {/* Layer 3: HUD Atas (Info Misi, Skor, Tombol Bantuan) */}
        <div className="absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/75 px-4 py-2 text-xs backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-mono font-bold tracking-wider text-[#ffb347] uppercase">
              CARGO BAY OPERATOR // MISI {missionIndex + 1} / {missions.length}
            </span>
            <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-[11px] text-cyan-300">
              {currentMission.type.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-gray-300">
              Skor Total: <strong className="text-amber-300 font-bold">{totalScore}</strong>
            </span>
            {onOpenMaterial && (
              <button
                type="button"
                onClick={onOpenMaterial}
                className="rounded-lg border border-cyan-400/40 bg-cyan-950/50 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-900/60 transition"
              >
                📖 Teori
              </button>
            )}
            {onOpenSimulator && (
              <button
                type="button"
                onClick={onOpenSimulator}
                className="rounded-lg border border-purple-400/40 bg-purple-950/50 px-2.5 py-1 text-[11px] font-semibold text-purple-300 hover:bg-purple-900/60 transition"
              >
                🔬 Simulator
              </button>
            )}
            <button
              type="button"
              onClick={handleNewRound}
              className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-gray-400 hover:text-white transition"
              title="Acak ronde baru dengan seed baru"
            >
              ↺ Ronde Baru
            </button>
          </div>
        </div>

        {/* Layer 4: Antrean Kargo di Area Tabung Kiri Atas (Turun ke Panel Bay) */}
        {currentMission.targetCargo && (
          <div className="absolute top-[13%] left-[4.5%] z-20 flex flex-col items-center">
            <span className="text-[9px] font-mono font-bold text-cyan-300 tracking-wider mb-1 animate-pulse">
              INCOMING CRATE
            </span>
            <div
              draggable={currentMission.type === "drag_and_drop"}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", String(currentMission.targetCargo?.id));
              }}
              onClick={() => {
                // Alternatif klik untuk perangkat mobile / touch
                if (currentMission.type === "drag_and_drop") {
                  setSelectedSlotId(null);
                }
              }}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 p-2 shadow-[0_0_20px_rgba(251,191,36,0.6)] cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
              style={{ width: "115px", height: "65px" }}
              title="Seret atau klik slot untuk menempatkan kargo ini"
            >
              <div className="flex items-center gap-1">
                <span className="text-base">📦</span>
                <span className="font-mono text-[10px] font-black text-amber-100">
                  {currentMission.targetCargo.size} KB
                </span>
              </div>
              <span className="text-[9px] font-mono text-amber-200 truncate max-w-[100px]">
                {currentMission.targetCargo.name}
              </span>
              <div className="mt-1 h-1 w-full bg-[repeating-linear-gradient(45deg,#000,#000_4px,#fbbf24_4px,#fbbf24_8px)] rounded" />
            </div>
          </div>
        )}

        {/* Layer 5: Banner Misi di Bawah Jendela Besar (Tengah Atas) */}
        <div className="absolute top-[11%] left-[24%] right-[24%] z-20 text-center">
          <div className="inline-block rounded-xl border border-cyan-400/40 bg-[#0c081e]/90 px-4 py-2 shadow-[0_0_25px_rgba(34,211,238,0.3)] backdrop-blur-md">
            <h3 className="font-mono text-xs md:text-sm font-bold text-[#ffb347]">
              {currentMission.title}
              {currentMission.algorithm && (
                <span className="ml-2 rounded bg-cyan-500/20 px-2 py-0.5 text-cyan-300">
                  {currentMission.algorithm}
                </span>
              )}
            </h3>
            <p className="mt-1 text-[11px] md:text-xs text-gray-200">
              {currentMission.instruction}
            </p>
          </div>
        </div>

        {/* Layer 6: Area Dinding Polos Tengah-Bawah (Panel Bay Partisi) */}
        <div className="absolute top-[32%] left-[18%] right-[18%] bottom-[8%] z-10 flex flex-col justify-between rounded-2xl border-2 border-cyan-400/60 bg-[#09061a]/85 p-4 md:p-5 backdrop-blur-md shadow-[0_0_40px_rgba(34,211,238,0.2)] overflow-x-auto">
          {/* Judul Panel Bay */}
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
            <span className="font-mono text-[11px] font-bold text-cyan-300 tracking-wider">
              STORAGE BAY // PARTISI MEMORI AKTIF
            </span>
            <span className="font-mono text-[10px] text-gray-400">
              Klik atau Seret Kargo ke Slot Target
            </span>
          </div>

          {/* Area Interaksi Sesuai Jenis Misi */}
          <div className="my-auto py-2">
            {/* TIPE 1 & 2: Slot Partisi (Seret Kargo / Tebak Slot) */}
            {(currentMission.type === "drag_and_drop" || currentMission.type === "guess_slot") &&
              currentMission.holes && (
                <div className="flex items-center justify-center gap-3">
                  {currentMission.holes.map((hole) => {
                    const isSelected = selectedSlotId === hole.id;
                    return (
                      <div
                        key={hole.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          setSelectedSlotId(hole.id);
                        }}
                        onClick={() => setSelectedSlotId(hole.id)}
                        className={`relative flex flex-col items-center justify-between rounded-xl border-2 p-3 transition-all cursor-pointer ${
                          isSelected
                            ? "border-emerald-400 bg-emerald-950/60 shadow-[0_0_20px_rgba(52,211,153,0.8)] scale-105"
                            : "border-cyan-400/40 bg-cyan-950/20 hover:border-cyan-300 hover:bg-cyan-950/40"
                        }`}
                        style={{ minWidth: "110px", height: "130px" }}
                      >
                        {/* Garis Pembatas Laser Oranye di Kiri & Kanan */}
                        <div className="absolute -left-1 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#fb923c] to-transparent shadow-[0_0_8px_#fb923c]" />
                        <div className="absolute -right-1 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#fb923c] to-transparent shadow-[0_0_8px_#fb923c]" />

                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono text-[10px] text-cyan-300 font-bold">
                            SLOT #{hole.id}
                          </span>
                          <span className="font-mono text-[9px] text-gray-400">@{hole.start}</span>
                        </div>

                        <div className="my-auto text-center">
                          {isSelected && currentMission.targetCargo ? (
                            <div className="flex flex-col items-center animate-in zoom-in-75">
                              <span className="text-2xl">📦</span>
                              <span className="text-[10px] font-bold text-amber-300">
                                {currentMission.targetCargo.name}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="font-mono text-xl font-black text-cyan-200">
                                {hole.size}
                              </span>
                              <span className="font-mono text-[10px] text-gray-400">KB BEBAS</span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          className={`w-full rounded py-1 text-[10px] font-mono font-bold transition ${
                            isSelected ? "bg-emerald-500 text-black" : "bg-cyan-500/20 text-cyan-300"
                          }`}
                        >
                          {isSelected ? "TERPILIH" : "PILIH SLOT"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

            {/* TIPE 3: Tebak Algoritma */}
            {currentMission.type === "guess_algorithm" && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-4">
                  {(["First-Fit", "Best-Fit", "Worst-Fit"] as MemoryAlgorithm[]).map((algo) => {
                    const isSel = selectedAlgo === algo;
                    return (
                      <button
                        key={algo}
                        type="button"
                        onClick={() => setSelectedAlgo(algo)}
                        className={`rounded-xl border-2 px-5 py-3 font-mono text-xs md:text-sm font-bold transition-all ${
                          isSel
                            ? "border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.8)] scale-105"
                            : "border-white/10 bg-white/[0.03] text-gray-300 hover:border-cyan-400/40"
                        }`}
                      >
                        {algo}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TIPE 4: Hitung Sisa Partisi (Split) */}
            {currentMission.type === "calculate_leftover" && currentMission.leftoverOptions && (
              <div className="flex flex-col items-center gap-3">
                <span className="font-mono text-xs text-gray-300">
                  Pilih sisa memori partisi yang tepat:
                </span>
                <div className="flex gap-3">
                  {currentMission.leftoverOptions.map((opt) => {
                    const isSel = selectedLeftover === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedLeftover(opt)}
                        className={`rounded-xl border-2 px-5 py-2.5 font-mono text-sm font-bold transition-all ${
                          isSel
                            ? "border-amber-400 bg-amber-950/80 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.8)] scale-105"
                            : "border-white/10 bg-white/[0.03] text-gray-300 hover:border-amber-400/40"
                        }`}
                      >
                        {opt} KB
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TIPE 5: Urutan Slot yang Diperiksa */}
            {currentMission.type === "inspection_order" && currentMission.holes && (
              <div className="flex flex-col items-center gap-3">
                <span className="font-mono text-xs text-gray-300">
                  Klik slot berurutan dari langkah 1 sampai berhenti:
                </span>
                <div className="flex gap-3">
                  {currentMission.holes.map((hole) => {
                    const orderIdx = clickedSequence.indexOf(hole.id);
                    const isClicked = orderIdx !== -1;
                    return (
                      <button
                        key={hole.id}
                        type="button"
                        onClick={() => {
                          if (isClicked) {
                            setClickedSequence(clickedSequence.filter((id) => id !== hole.id));
                          } else {
                            setClickedSequence([...clickedSequence, hole.id]);
                          }
                        }}
                        className={`relative flex flex-col items-center justify-center rounded-xl border-2 p-3 transition-all ${
                          isClicked
                            ? "border-cyan-400 bg-cyan-950/80 shadow-[0_0_15px_rgba(34,211,238,0.8)] scale-105"
                            : "border-white/10 bg-white/[0.03] text-gray-300 hover:border-cyan-400/40"
                        }`}
                        style={{ width: "95px", height: "95px" }}
                      >
                        {isClicked && (
                          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 font-mono text-xs font-bold text-black shadow-md">
                            {orderIdx + 1}
                          </span>
                        )}
                        <span className="font-mono text-xs font-bold text-cyan-300">
                          SLOT #{hole.id}
                        </span>
                        <span className="font-mono text-[11px] text-gray-300">{hole.size} KB</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TIPE 6: Cari Penempatan yang Salah */}
            {currentMission.type === "find_the_wrong" && currentMission.wrongCandidates && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {currentMission.wrongCandidates.map((cand) => {
                  const isSel = selectedWrongCandidate === cand.id;
                  return (
                    <button
                      key={cand.id}
                      type="button"
                      onClick={() => setSelectedWrongCandidate(cand.id)}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        isSel
                          ? "border-rose-400 bg-rose-950/80 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.8)]"
                          : "border-white/10 bg-white/[0.03] text-gray-300 hover:border-rose-400/40"
                      }`}
                    >
                      <div className="font-mono text-xs font-bold text-white mb-1">
                        {cand.cargoName}
                      </div>
                      <div className="font-mono text-[11px] text-gray-300">
                        ➔ Dialokasikan ke Slot #{cand.holeId} ({cand.holeSize} KB)
                      </div>
                      <span className="mt-2 block font-mono text-[10px] text-rose-300">
                        {isSel ? "● Dipilih Sebagai Pelanggaran" : "Klik jika ini salah"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TIPE 7: Muat Nggak Ya? (Fragmentasi Eksternal) */}
            {currentMission.type === "will_it_fit" && (
              <div className="flex flex-col items-center gap-3">
                <span className="font-mono text-xs text-gray-300">
                  Keputusan Sistem Alokasi Kontigu:
                </span>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setWillFitAnswer(true)}
                    className={`rounded-xl border-2 px-6 py-2.5 font-mono text-xs md:text-sm font-bold transition-all ${
                      willFitAnswer === true
                        ? "border-emerald-400 bg-emerald-950/80 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.8)]"
                        : "border-white/10 bg-white/[0.03] text-gray-300 hover:border-emerald-400/40"
                    }`}
                  >
                    Bisa Diterima
                  </button>
                  <button
                    type="button"
                    onClick={() => setWillFitAnswer(false)}
                    className={`rounded-xl border-2 px-6 py-2.5 font-mono text-xs md:text-sm font-bold transition-all ${
                      willFitAnswer === false
                        ? "border-rose-400 bg-rose-950/80 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.8)]"
                        : "border-white/10 bg-white/[0.03] text-gray-300 hover:border-rose-400/40"
                    }`}
                  >
                    Tolak Kargo (Fragmentasi Eksternal)
                  </button>
                </div>
              </div>
            )}

            {/* TIPE 8: Pasangkan Kartu */}
            {currentMission.type === "match_cards" && currentMission.matchPairs && (
              <div className="space-y-2">
                {currentMission.matchPairs.map((pair, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs font-mono"
                  >
                    <span className="text-gray-300 max-w-md">{pair.description}</span>
                    <div className="flex gap-1.5">
                      {(["First-Fit", "Best-Fit", "Worst-Fit"] as MemoryAlgorithm[]).map((algo) => {
                        const isChosen = matchedPairs[pair.description] === algo;
                        return (
                          <button
                            key={algo}
                            type="button"
                            onClick={() => {
                              setMatchedPairs({
                                ...matchedPairs,
                                [pair.description]: algo,
                              });
                            }}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                              isChosen
                                ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                                : "bg-white/5 text-gray-400 hover:text-white"
                            }`}
                          >
                            {algo}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback & Tombol Aksi */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cyan-500/30 pt-3">
            <div className="flex-1">
              {feedback && (
                <div
                  className={`rounded-xl border p-2.5 text-xs font-mono leading-relaxed animate-in fade-in ${
                    feedback.isCorrect
                      ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-200"
                      : "border-rose-500/50 bg-rose-950/60 text-rose-200"
                  }`}
                >
                  {feedback.message}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!feedback?.isCorrect ? (
                <button
                  type="button"
                  onClick={handleCheckAnswer}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 font-mono text-xs md:text-sm font-bold text-white shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:scale-105 active:scale-95 transition"
                >
                  Konfirmasi Jawaban ➔
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextMission}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2 font-mono text-xs md:text-sm font-bold text-black shadow-[0_0_20px_rgba(52,211,153,0.7)] hover:scale-105 active:scale-95 transition"
                >
                  {missionIndex < missions.length - 1 ? "Misi Berikutnya ➔" : "Lihat Hasil Ronde 🏆"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MODAL AKHIR RONDE (RINGKASAN & BINTANG) */}
        {isRoundFinished && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in">
            <div className="max-w-md w-full rounded-2xl border-2 border-cyan-400 bg-[#0c0822] p-6 text-center shadow-[0_0_60px_rgba(34,211,238,0.4)]">
              <span className="text-5xl animate-bounce inline-block">🚀📦</span>
              <h2 className="mt-3 text-2xl font-bold text-[#ffb347] font-mono">
                RONDE CARGO BAY SELESAI!
              </h2>

              {/* Bintang Evaluasi */}
              <div className="my-3 flex justify-center gap-2 text-3xl">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span
                    key={i}
                    className={i < starCount ? "text-amber-400 drop-shadow-[0_0_10px_#fbbf24]" : "text-gray-600"}
                  >
                    ★
                  </span>
                ))}
              </div>

              <p className="font-mono text-sm text-cyan-200">
                Skor Akhir: <strong className="text-white text-lg">{totalScore}</strong> / 60 Poin
              </p>
              <p className="mt-2 text-xs text-gray-300 leading-relaxed">
                {totalScore >= 50
                  ? "Luar biasa! Pemahamanmu mengenai strategi First-Fit, Best-Fit, dan Worst-Fit sangat presisi. Gerbang Portal Stage 2 telah terbuka!"
                  : "Bagus! Kamu telah menuntaskan simulasi partisi ruang kargo. Pelajari kembali materi jika ingin menyempurnakan strategi alokasi!"}
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                {onComplete && (
                  <button
                    type="button"
                    onClick={onComplete}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 font-mono text-sm font-bold text-black shadow-[0_0_20px_rgba(52,211,153,0.8)] hover:scale-105 transition"
                  >
                    Verifikasi Pintu 2 (Menuju Portal) ➔
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNewRound}
                  className="w-full rounded-xl border border-white/20 bg-white/5 py-2.5 font-mono text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition"
                >
                  Mainkan Ronde Baru ↺
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

