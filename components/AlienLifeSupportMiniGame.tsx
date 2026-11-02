"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  calculateBankerSafety,
  evaluateResourceRequest,
  createInitialDiningState,
  triggerDeadlockScenario,
  stepDiningSimulation,
  DiningPhilosophersSnapshot,
} from "../utils/deadlockAlgorithms";

interface AlienLifeSupportMiniGameProps {
  onGameComplete?: () => void;
  onOpenMaterial?: () => void;
  onOpenQuiz?: () => void;
}

// Preset Misi Cerita untuk Alien Life-Support Banker
interface MissionScenario {
  id: number;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  story: string;
  resourceNames: string[];
  processNames: string[];
  available: number[];
  allocation: number[][];
  max: number[][];
  incomingRequest: {
    processIndex: number;
    request: number[];
    isSafeToGrant: boolean;
    explanation: string;
  };
}

const MISSIONS: MissionScenario[] = [
  {
    id: 1,
    title: "Misi 1: Krisis Oksigen Pod Sektor Kiri",
    difficulty: "EASY",
    story:
      "Kapal OMNI mengalami penurunan tekanan pada dua sektor utama. Alokasikan tabung O2 dan H2O secara bijak agar modul pod dapat beroperasi tanpa membekukan sirkulasi penopang hidup.",
    resourceNames: ["O2", "H2O"],
    processNames: ["Pod P0 (Cryo)", "Pod P1 (Habitat)", "Pod P2 (Med-Bay)"],
    available: [3, 2],
    allocation: [
      [1, 0],
      [1, 1],
      [1, 1],
    ],
    max: [
      [3, 2],
      [2, 2],
      [2, 2],
    ],
    incomingRequest: {
      processIndex: 1,
      request: [1, 0],
      isSafeToGrant: true,
      explanation:
        "Aman! Jika Pod P1 dialokasikan [1 O2, 0 H2O], Need P1 menjadi [0, 1] dan Available menjadi [2, 2]. Pod P1 dapat langsung menyelesaikan tugasnya dan mengembalikan seluruh sumber daya!",
    },
  },
  {
    id: 2,
    title: "Misi 2: Jebakan Sumber Daya Reaktor Plasma",
    difficulty: "MEDIUM",
    story:
      "Tiga jenis tabung (O2, H2O, Plasma) diatur oleh Life-Support Core. Sebuah permintaan mendesak datang dari modul Bio-Shield. Hati-hati, menyetujui permintaan ini dapat menjerumuskan kapal ke dalam Unsafe State!",
    resourceNames: ["O2", "H2O", "PLS"],
    processNames: ["P0 (Cryo)", "P1 (Bio-Shield)", "P2 (Hydroponics)", "P3 (Core Nav)"],
    available: [2, 1, 1],
    allocation: [
      [2, 0, 1],
      [1, 1, 0],
      [1, 1, 1],
      [0, 0, 2],
    ],
    max: [
      [4, 2, 2],
      [2, 2, 2],
      [3, 1, 1],
      [1, 2, 2],
    ],
    incomingRequest: {
      processIndex: 0,
      request: [1, 0, 1],
      isSafeToGrant: false,
      explanation:
        "BAHAYA! Jika permintaan P0 disetujui, sisa Available menjadi [1, 1, 0]. Tidak ada satu pun proses yang kebutuhan sisa (Need)-nya dapat dipenuhi dengan sisa sumber daya tersebut. Sistem jatuh ke UNSAFE STATE (Deadlock)!",
    },
  },
  {
    id: 3,
    title: "Misi 3: OMNI Void Lockdown Protocol",
    difficulty: "HARD",
    story:
      "Protokol darurat tingkat tinggi: 5 modul kapal saling bersaing memperebutkan tabung penopang hidup kritis. Sebagai Kepala Banker, kamu harus menganalisis apakah alokasi cadangan warp akan melumpuhkan seluruh kapal.",
    resourceNames: ["O2", "H2O", "PLS"],
    processNames: [
      "P0 (Chamber A)",
      "P1 (Chamber B)",
      "P2 (Chamber C)",
      "P3 (Chamber D)",
      "P4 (Chamber E)",
    ],
    available: [3, 3, 2],
    allocation: [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2],
    ],
    max: [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3],
    ],
    incomingRequest: {
      processIndex: 1,
      request: [1, 0, 2],
      isSafeToGrant: true,
      explanation:
        "AMAN! Meskipun alokasi tampak ketat, setelah P1 diberi [1, 0, 2], sistem masih memiliki Safe Sequence: < P1 ➔ P3 ➔ P4 ➔ P0 ➔ P2 >. Semua proses dapat selesai tanpa macet!",
    },
  },
];

export default function AlienLifeSupportMiniGame({
  onGameComplete,
  onOpenMaterial,
  onOpenQuiz,
}: AlienLifeSupportMiniGameProps) {
  // Mode Utama: "game" (Permainan Misi Banker) atau "lab" (Laboratorium Eksperimen 3 Algoritma)
  const [activeMainTab, setActiveMainTab] = useState<"game" | "lab">("game");

  // ─────────────────────────────────────────────────────────────
  // STATE PERMAINAN MISI BANKER
  // ─────────────────────────────────────────────────────────────
  const [currentMissionIdx, setCurrentMissionIdx] = useState<number>(0);
  const currentMission = MISSIONS[currentMissionIdx];

  const [availableTanks, setAvailableTanks] = useState<number[]>(currentMission.available);
  const [allocationMatrix, setAllocationMatrix] = useState<number[][]>(currentMission.allocation);
  const [maxMatrix, setMaxMatrix] = useState<number[][]>(currentMission.max);

  const [integrity, setIntegrity] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [decisionFeedback, setDecisionFeedback] = useState<{
    correct: boolean;
    title: string;
    message: string;
    isDeadlock: boolean;
  } | null>(null);
  const [hasEvaluatedSafety, setHasEvaluatedSafety] = useState<boolean>(false);

  // Sync state ketika misi berganti
  useEffect(() => {
    setAvailableTanks([...currentMission.available]);
    setAllocationMatrix(currentMission.allocation.map((r) => [...r]));
    setMaxMatrix(currentMission.max.map((r) => [...r]));
    setDecisionFeedback(null);
    setHasEvaluatedSafety(false);
  }, [currentMissionIdx]);

  // Hitung Need Matrix saat ini
  const needMatrix = useMemo(() => {
    return allocationMatrix.map((row, i) =>
      row.map((val, j) => Math.max(0, maxMatrix[i][j] - val))
    );
  }, [allocationMatrix, maxMatrix]);

  // Evaluasi Banker untuk request misi saat ini
  const missionEvaluation = useMemo(() => {
    const req = currentMission.incomingRequest;
    return evaluateResourceRequest(
      allocationMatrix,
      maxMatrix,
      availableTanks,
      req.processIndex,
      req.request,
      currentMission.processNames,
      currentMission.resourceNames
    );
  }, [allocationMatrix, maxMatrix, availableTanks, currentMission]);

  // Handler Keputusan Pemain: GRANT (Setujui)
  const handleGrantDecision = () => {
    const req = currentMission.incomingRequest;
    if (req.isSafeToGrant) {
      setScore((s) => s + 100);
      setDecisionFeedback({
        correct: true,
        title: "KEPUTUSAN TEPAT // ALOKASI DISAHKAN",
        message: `Bagus sekali! ${req.explanation} Modul berhasil menyelesaikan misinya dan mengembalikan seluruh sumber daya!`,
        isDeadlock: false,
      });

      const newAvail = [...availableTanks];
      for (let j = 0; j < currentMission.resourceNames.length; j++) {
        newAvail[j] += allocationMatrix[req.processIndex][j];
      }
      setAvailableTanks(newAvail);
    } else {
      setIntegrity((integ) => Math.max(10, integ - 35));
      setDecisionFeedback({
        correct: false,
        title: "ALARM DEADLOCK // SISTEM TERKUNCI!",
        message: `BAHAYA FATAL! ${req.explanation} Semua proses kini saling menunggu tabung sumber daya. Kapal OMNI mengalami krisis penopang hidup!`,
        isDeadlock: true,
      });
    }
  };

  // Handler Keputusan Pemain: DENY / WAIT (Tolak & Tunda)
  const handleDenyDecision = () => {
    const req = currentMission.incomingRequest;
    if (!req.isSafeToGrant) {
      setScore((s) => s + 100);
      setDecisionFeedback({
        correct: true,
        title: "KEPUTUSAN BRILIAN // DEADLOCK DIGAGALKAN",
        message: `Tepat sekali! ${req.explanation} Sebagai Banker yang handal, kamu berhasil menyelamatkan kapal dari jebakan kondisi Unsafe State!`,
        isDeadlock: false,
      });
    } else {
      setIntegrity((integ) => Math.max(10, integ - 15));
      setDecisionFeedback({
        correct: false,
        title: "PERINGATAN INEFISIENSI // ALOKASI SEHARUSNYA AMAN",
        message: `Permintaan ini sebenarnya memiliki Safe Sequence yang valid! Menundanya menyebabkan penurunan efisiensi sistem penopang hidup.`,
        isDeadlock: false,
      });
    }
  };

  const handleNextMission = () => {
    if (currentMissionIdx < MISSIONS.length - 1) {
      setCurrentMissionIdx((prev) => prev + 1);
    } else {
      if (onGameComplete) onGameComplete();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // STATE LABORATORIUM 3 ALGORITMA
  // ─────────────────────────────────────────────────────────────
  const [labSubTab, setLabSubTab] = useState<"safety" | "request" | "philosophers">("safety");

  // LAB 1: Banker's Safety Check
  const [labSafetyAlloc] = useState<number[][]>([
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ]);
  const [labSafetyMax] = useState<number[][]>([
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ]);
  const [labSafetyAvail] = useState<number[]>([3, 3, 2]);
  const labProcessNames = ["P0", "P1", "P2", "P3", "P4"];
  const labResourceNames = ["O2", "H2O", "PLS"];

  const safetyResult = useMemo(() => {
    return calculateBankerSafety(
      labSafetyAlloc,
      labSafetyMax,
      labSafetyAvail,
      labProcessNames,
      labResourceNames
    );
  }, [labSafetyAlloc, labSafetyMax, labSafetyAvail]);

  // LAB 2: Banker's Resource-Request
  const [reqProcessIdx, setReqProcessIdx] = useState<number>(1);
  const [customRequestInput, setCustomRequestInput] = useState<number[]>([1, 0, 2]);

  const customReqResult = useMemo(() => {
    return evaluateResourceRequest(
      labSafetyAlloc,
      labSafetyMax,
      labSafetyAvail,
      reqProcessIdx,
      customRequestInput,
      labProcessNames,
      labResourceNames
    );
  }, [labSafetyAlloc, labSafetyMax, labSafetyAvail, reqProcessIdx, customRequestInput]);

  // LAB 3: Dining Philosophers Simulator
  const [diningState, setDiningState] = useState<DiningPhilosophersSnapshot>(() =>
    createInitialDiningState("NAIVE_DEADLOCK")
  );
  const [diningAutoPlay, setDiningAutoPlay] = useState<boolean>(false);
  const [diningStrategy, setDiningStrategy] = useState<
    "NAIVE_DEADLOCK" | "ASYMMETRIC" | "RESOURCE_LIMITER" | "TIMEOUT_PREEMPTION"
  >("NAIVE_DEADLOCK");

  // Timer loop untuk Dining Philosophers autoplay
  useEffect(() => {
    if (!diningAutoPlay) return;

    const interval = setInterval(() => {
      setDiningState((prev) => stepDiningSimulation(prev, diningStrategy));
    }, 1200);

    return () => clearInterval(interval);
  }, [diningAutoPlay, diningStrategy]);

  // Switch strategy
  const handleStrategyChange = (
    newStrat: "NAIVE_DEADLOCK" | "ASYMMETRIC" | "RESOURCE_LIMITER" | "TIMEOUT_PREEMPTION"
  ) => {
    setDiningStrategy(newStrat);
    setDiningState((prev) => ({
      ...prev,
      activeStrategy: newStrat,
      explanation: `Strategi diubah menjadi: ${newStrat}. Jalankan simulasi atau klik Step untuk mengamati!`,
    }));
  };

  return (
    <div className="relative flex flex-col w-full rounded-2xl border border-purple-500/40 bg-[#090616]/95 text-[#e9e4ff] shadow-[0_0_80px_rgba(168,85,247,0.3)] overflow-hidden">
      {/* Header Utama Mini-Game */}
      <div className="flex flex-wrap items-center justify-between border-b border-purple-500/30 px-6 py-4 bg-purple-950/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="flex h-3.5 w-3.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-cyan-500" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300">
              ALIEN LIFE-SUPPORT BANKER // CORE TERMINAL
            </h2>
            <p className="text-xs text-purple-300/80 font-mono">
              Deadlock Avoidance & Concurrency Simulator
            </p>
          </div>
        </div>

        {/* Tab Switcher: Permainan Misi vs Lab 3 Algoritma */}
        <div className="flex items-center gap-2 mt-3 sm:mt-0 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveMainTab("game")}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeMainTab === "game"
                ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-purple-400"
                : "border border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>🎮</span> Misi Banker (Story)
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab("lab")}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeMainTab === "lab"
                ? "bg-cyan-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)] border border-cyan-400"
                : "border border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>🔬</span> Lab 3 Algoritma
          </button>
        </div>
      </div>

      {/* Konten Utama */}
      <div className="p-4 md:p-6 space-y-6">
        {/* ======================================================== */}
        {/* MODE 1: MISI STORY BANKER                                */}
        {/* ======================================================== */}
        {activeMainTab === "game" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top HUD: Status Integritas, Skor, & Level Misi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="rounded-xl border border-white/10 bg-black/40 p-3 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 block">Level Misi:</span>
                  <span className="font-bold text-sm text-purple-300">
                    {currentMission.id} / {MISSIONS.length} - {currentMission.difficulty}
                  </span>
                </div>
                <div className="flex gap-1">
                  {MISSIONS.map((m, idx) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCurrentMissionIdx(idx)}
                      className={`w-7 h-7 rounded-lg font-bold border transition ${
                        currentMissionIdx === idx
                          ? "border-purple-400 bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                          : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-3 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 block">Life-Support Core Integrity:</span>
                  <span
                    className={`font-bold text-sm ${
                      integrity > 60
                        ? "text-emerald-400"
                        : integrity > 30
                        ? "text-amber-400"
                        : "text-red-400 animate-pulse"
                    }`}
                  >
                    {integrity}% {integrity <= 30 ? "⚠️ DEADLOCK RISK" : "STABIL"}
                  </span>
                </div>
                <div className="w-20 h-2.5 rounded-full bg-white/10 overflow-hidden border border-white/10">
                  <div
                    className={`h-full transition-all duration-300 ${
                      integrity > 60 ? "bg-emerald-500" : integrity > 30 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${integrity}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/40 p-3 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 block">Skor Evaluasi Banker:</span>
                  <span className="font-bold text-cyan-300">{score} PTS</span>
                </div>
                <span className="text-2xl">🏦</span>
              </div>
            </div>

            {/* Narasi Cerita Misi */}
            <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-purple-300 mb-1">
                <span>🛸</span>
                <h3>{currentMission.title}</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{currentMission.story}</p>
            </div>

            {/* TABUNG SUMBER DAYA TERSEDIA (AVAILABLE LIFE-SUPPORT TANKS) */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🧪</span> Tabung Sumber Daya Bebas (Available Matrix)
                </span>
                <span className="text-[11px] font-mono text-gray-400">
                  Total Tabung Siap Dialokasikan
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currentMission.resourceNames.map((rName, idx) => {
                  const val = availableTanks[idx];
                  const colorMap: Record<string, { border: string; bg: string; text: string; glow: string }> = {
                    O2: { border: "border-cyan-400", bg: "bg-cyan-500/20", text: "text-cyan-300", glow: "shadow-[0_0_15px_rgba(6,182,212,0.3)]" },
                    H2O: { border: "border-emerald-400", bg: "bg-emerald-500/20", text: "text-emerald-300", glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]" },
                    PLS: { border: "border-purple-400", bg: "bg-purple-500/20", text: "text-purple-300", glow: "shadow-[0_0_15px_rgba(168,85,247,0.3)]" },
                  };
                  const colors = colorMap[rName] || colorMap["PLS"];

                  return (
                    <div
                      key={rName}
                      className={`rounded-xl border ${colors.border} ${colors.bg} ${colors.glow} p-3 flex items-center justify-between`}
                    >
                      <div>
                        <span className="text-[10px] font-mono text-gray-300 block">Tabung {rName}</span>
                        <span className={`text-xl font-bold font-mono ${colors.text}`}>{val} Unit</span>
                      </div>
                      <div className="w-3.5 h-12 rounded-full border border-white/20 bg-black/40 relative overflow-hidden flex flex-col justify-end">
                        <div
                          className={`w-full ${rName === "O2" ? "bg-cyan-400" : rName === "H2O" ? "bg-emerald-400" : "bg-purple-400"} transition-all duration-300`}
                          style={{ height: `${Math.min(100, val * 25)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TABEL MATRIKS ALOKASI, MAX, DAN NEED */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3 overflow-x-auto">
              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider block">
                📊 Matriks Alokasi & Kebutuhan Pod Kompartemen
              </span>

              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="py-2 px-2">Kompartemen</th>
                    <th className="py-2 px-2">Allocation (Sedang Dipakai)</th>
                    <th className="py-2 px-2">Max (Klaim Maksimum)</th>
                    <th className="py-2 px-2">Need = Max - Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentMission.processNames.map((pName, i) => {
                    const isTarget = i === currentMission.incomingRequest.processIndex;
                    return (
                      <tr
                        key={pName}
                        className={`transition ${
                          isTarget ? "bg-purple-950/40 text-purple-200 font-bold" : "text-gray-300 hover:bg-white/5"
                        }`}
                      >
                        <td className="py-2.5 px-2 flex items-center gap-1.5">
                          {isTarget && <span className="h-2 w-2 rounded-full bg-pink-400 animate-ping" />}
                          <span>{pName}</span>
                        </td>
                        <td className="py-2.5 px-2">
                          [{allocationMatrix[i].join(", ")}]
                        </td>
                        <td className="py-2.5 px-2">
                          [{maxMatrix[i].join(", ")}]
                        </td>
                        <td className="py-2.5 px-2 text-cyan-300">
                          [{needMatrix[i].join(", ")}]
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ALERT GELOMBANG PERMINTAAN (INCOMING ALLOCATION REQUEST) */}
            <div className="rounded-2xl border-2 border-pink-500/50 bg-gradient-to-r from-[#1c0828] to-[#12092c] p-5 shadow-[0_0_30px_rgba(236,72,153,0.25)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pink-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 rounded-full bg-pink-500 animate-bounce" />
                  <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider">
                    TRANSMISI PERMINTAAN ALOKASI MASUK // INCOMING REQUEST
                  </span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-pink-950 border border-pink-400/30 text-pink-300">
                  Action Required
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm md:text-base font-bold text-white">
                    {currentMission.processNames[currentMission.incomingRequest.processIndex]} meminta tambahan tabung:
                  </p>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-gray-400">Vektor Permintaan:</span>
                    <span className="px-3 py-1 rounded-lg bg-black/60 border border-pink-400/40 text-pink-300 font-bold text-sm">
                      [{currentMission.incomingRequest.request.map((v, idx) => `${v} ${currentMission.resourceNames[idx]}`).join(", ")}]
                    </span>
                  </div>
                </div>

                {/* Tombol Diagnostic Banker Safety Check */}
                <button
                  type="button"
                  onClick={() => setHasEvaluatedSafety(!hasEvaluatedSafety)}
                  className="px-4 py-2.5 rounded-xl border border-cyan-400/40 bg-cyan-950/40 text-cyan-300 font-mono text-xs font-bold transition hover:bg-cyan-800/40 hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>🔬</span> {hasEvaluatedSafety ? "Sembunyikan Diagnosis" : "Jalankan Diagnosis Banker"}
                </button>
              </div>

              {/* Panel Diagnosis Real-Time jika diaktifkan */}
              {hasEvaluatedSafety && (
                <div className="p-4 rounded-xl border border-cyan-500/30 bg-black/60 text-xs font-mono space-y-2 animate-in fade-in duration-150">
                  <span className="font-bold text-cyan-300 block mb-1">
                    🔍 HASIL DIAGNOSIS SEMENTARA BANKER:
                  </span>
                  <div className="space-y-1 text-gray-300">
                    <p>
                      • Kondisi 1 (Request &le; Need):{" "}
                      {missionEvaluation.detailedSteps[1] || "Terpenuhi."}
                    </p>
                    <p>
                      • Kondisi 2 (Request &le; Available):{" "}
                      {missionEvaluation.detailedSteps[2] || "Terpenuhi."}
                    </p>
                    <p>
                      • Status Percobaan Banker:{" "}
                      <span
                        className={
                          missionEvaluation.decision === "GRANTED"
                            ? "text-emerald-400 font-bold"
                            : "text-red-400 font-bold"
                        }
                      >
                        {missionEvaluation.decision === "GRANTED"
                          ? "SAFE STATE (Ada Safe Sequence)"
                          : "UNSAFE STATE (Berpotensi Macet / Deadlock)"}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Tombol Keputusan Banker */}
              <div className="pt-2 flex flex-wrap gap-4 justify-end">
                <button
                  type="button"
                  onClick={handleGrantDecision}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-white text-xs md:text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] transition hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>🟢</span> SETUJUI ALOKASI (GRANT)
                </button>
                <button
                  type="button"
                  onClick={handleDenyDecision}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 font-bold text-white text-xs md:text-sm shadow-[0_0_20px_rgba(239,68,68,0.4)] transition hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>🔴</span> TOLAK & TUNDA (DENY & WAIT)
                </button>
              </div>
            </div>

            {/* POPUP FEEDBACK HASIL KEPUTUSAN */}
            {decisionFeedback && (
              <div
                className={`p-5 rounded-2xl border text-xs md:text-sm animate-in zoom-in-95 duration-200 ${
                  decisionFeedback.correct
                    ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    : "border-red-500/50 bg-red-950/40 text-red-200 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-base mb-2">
                  <span className="flex items-center gap-2">
                    {decisionFeedback.correct ? "✅" : "⚠️"} {decisionFeedback.title}
                  </span>
                  <span className="font-mono text-xs">
                    {decisionFeedback.correct ? "+100 PTS" : "-Integrity"}
                  </span>
                </div>
                <p className="leading-relaxed mb-4">{decisionFeedback.message}</p>

                <div className="flex justify-end gap-3">
                  {currentMissionIdx < MISSIONS.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNextMission}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-white text-xs transition hover:scale-105"
                    >
                      Misi Berikutnya ➔
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenQuiz) onOpenQuiz();
                      }}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-white text-xs transition hover:scale-105"
                    >
                      Buka Kuis Portal Stage 5 ➔
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 2: LABORATORIUM 3 ALGORITMA DEADLOCK                */}
        {/* ======================================================== */}
        {activeMainTab === "lab" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Sub-tab Navigasi Lab */}
            <div className="flex border-b border-cyan-500/20 bg-black/40 p-1.5 rounded-xl gap-2 font-mono text-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setLabSubTab("safety")}
                className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
                  labSubTab === "safety"
                    ? "bg-cyan-600/30 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                1. Banker's Safety Check Lab
              </button>
              <button
                type="button"
                onClick={() => setLabSubTab("request")}
                className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
                  labSubTab === "request"
                    ? "bg-purple-600/30 text-purple-200 border border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                2. Banker's Resource-Request Lab
              </button>
              <button
                type="button"
                onClick={() => setLabSubTab("philosophers")}
                className={`px-4 py-2 rounded-lg font-bold transition whitespace-nowrap ${
                  labSubTab === "philosophers"
                    ? "bg-pink-600/30 text-pink-200 border border-pink-400/50 shadow-[0_0_12px_rgba(236,72,153,0.4)]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                3. Dining Philosophers Visualizer
              </button>
            </div>

            {/* ─────────────────────────────────────────────────── */}
            {/* SUB-TAB 1: BANKER'S SAFETY CHECK                    */}
            {/* ─────────────────────────────────────────────────── */}
            {labSubTab === "safety" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-xs text-gray-300 space-y-1">
                  <h4 className="font-bold text-cyan-300 text-sm">
                    Banker's Safety Check: Pengecekan Kondisi Bebas Deadlock
                  </h4>
                  <p>
                    Algoritma mencari apakah terdapat setidaknya satu <strong>Urutan Aman (Safe Sequence)</strong> di mana seluruh proses dapat memperoleh sumber daya hingga batas maksimum klaim mereka, menyelesaikan tugas, dan mengembalikan sumber daya ke sistem.
                  </p>
                </div>

                {/* Status Aman / Tidak Aman */}
                <div
                  className={`p-4 rounded-xl border text-sm font-mono flex items-center justify-between ${
                    safetyResult.isSafe
                      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                      : "border-red-500/40 bg-red-950/30 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                  }`}
                >
                  <div>
                    <span className="font-bold text-base block">
                      {safetyResult.isSafe ? "✅ STATUS: KONDISI AMAN (SAFE STATE)" : "❌ STATUS: KONDISI TIDAK AMAN (UNSAFE STATE)"}
                    </span>
                    <p className="text-xs opacity-90 mt-1">{safetyResult.summary}</p>
                  </div>
                  {safetyResult.isSafe && (
                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-gray-400 block">Safe Sequence:</span>
                      <span className="font-bold text-cyan-300">
                        &lt; {safetyResult.safeSequence.map((i) => labProcessNames[i]).join(" ➔ ")} &gt;
                      </span>
                    </div>
                  )}
                </div>

                {/* Jejak Langkah demi Langkah (Step Trace) */}
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-gray-400 block">
                    JEJAK LANGKAH KALKULASI ALGORITMA (WORK & NEED TRACE):
                  </span>
                  <div className="space-y-2 font-mono text-xs max-h-72 overflow-y-auto">
                    {safetyResult.steps.map((st) => (
                      <div
                        key={st.step}
                        className="p-3 rounded-lg border border-white/10 bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <span className="text-cyan-400 font-bold">
                            Langkah #{st.step} [{st.processName}]:
                          </span>
                          <p className="text-gray-300">{st.explanation}</p>
                        </div>
                        <div className="text-right text-[11px] text-gray-400 whitespace-nowrap">
                          Work Baru: [{st.workAfter.join(", ")}]
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────── */}
            {/* SUB-TAB 2: BANKER'S RESOURCE-REQUEST                */}
            {/* ─────────────────────────────────────────────────── */}
            {labSubTab === "request" && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 text-xs text-gray-300 space-y-1">
                  <h4 className="font-bold text-purple-300 text-sm">
                    Banker's Resource-Request: Evaluasi Alokasi Dinamis
                  </h4>
                  <p>
                    Uji apakah suatu proses boleh langsung menerima alokasi sumber daya. Jika alokasi menghasilkan status tidak aman, proses wajib ditunda (WAIT) dan perubahan dibatalkan (Rollback).
                  </p>
                </div>

                {/* Input Kontrol Permintaan */}
                <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3 font-mono text-xs">
                  <span className="text-purple-300 font-bold block">
                    SIMULASIKAN PERMINTAAN SUMBER DAYA:
                  </span>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-gray-400">Pilih Proses:</label>
                      <select
                        value={reqProcessIdx}
                        onChange={(e) => setReqProcessIdx(Number(e.target.value))}
                        className="px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-950/40 text-purple-200"
                      >
                        {labProcessNames.map((p, idx) => (
                          <option key={p} value={idx} className="bg-gray-900">
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-gray-400">Request [O2, H2O, PLS]:</label>
                      {customRequestInput.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span className="text-gray-500 text-[10px]">{labResourceNames[idx]}:</span>
                          <input
                            type="number"
                            min="0"
                            max="9"
                            value={val}
                            onChange={(e) => {
                              const newArr = [...customRequestInput];
                              newArr[idx] = Math.max(0, Number(e.target.value));
                              setCustomRequestInput(newArr);
                            }}
                            className="w-12 px-2 py-1 rounded bg-black/60 border border-white/20 text-center text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hasil Evaluasi Permintaan */}
                <div
                  className={`p-4 rounded-xl border text-xs md:text-sm font-mono space-y-3 ${
                    customReqResult.decision === "GRANTED"
                      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                      : "border-amber-500/40 bg-amber-950/30 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>KEPUTUSAN BANKER: {customReqResult.decision}</span>
                    <span className="text-xs">
                      {customReqResult.canImmediatelyAllocate ? "Boleh Dialokasikan" : "Harus Menunggu (WAIT)"}
                    </span>
                  </div>
                  <p>{customReqResult.message}</p>

                  <div className="space-y-1 text-xs border-t border-white/10 pt-2 text-gray-300">
                    <span className="font-bold text-gray-400 block mb-1">
                      LOG 4-LANGKAH PENGECEKAN BANKER:
                    </span>
                    {customReqResult.detailedSteps.map((step, idx) => (
                      <p key={idx} className="text-gray-300">
                        {step}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────── */}
            {/* SUB-TAB 3: DINING PHILOSOPHERS VISUALIZER           */}
            {/* ─────────────────────────────────────────────────── */}
            {labSubTab === "philosophers" && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl border border-pink-500/30 bg-pink-950/20 text-xs text-gray-300 space-y-1">
                  <h4 className="font-bold text-pink-300 text-sm">
                    Dining Philosophers: Visualisasi Deadlock & Solusi Konkurensi
                  </h4>
                  <p>
                    5 Filsuf Alien mengelilingi meja makan sumber daya dengan 5 garpu/selang plasma. Jika semua lapar serentak dan mengambil garpu kiri, terjadi <strong>Circular Wait</strong> (Deadlock Total). Amati bagaimana strategi konkurensi memecahkan kebuntuan tersebut!
                  </p>
                </div>

                {/* Kontrol Eksperimen Dining Philosophers */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-black/40 font-mono text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDiningState((prev) => triggerDeadlockScenario(prev))
                      }
                      className="px-3.5 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 font-bold text-white border border-red-400/50 shadow-[0_0_12px_rgba(239,68,68,0.4)] transition"
                    >
                      ⚡ Picu Deadlock (All Grab Left)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStrategyChange("ASYMMETRIC")}
                      className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                        diningStrategy === "ASYMMETRIC"
                          ? "bg-emerald-600 text-white border-emerald-400"
                          : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      🛠️ Solusi Asimetris (Ganjil-Genap)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStrategyChange("RESOURCE_LIMITER")}
                      className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                        diningStrategy === "RESOURCE_LIMITER"
                          ? "bg-cyan-600 text-white border-cyan-400"
                          : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      🛡️ Solusi Limiter (Max 4)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStrategyChange("TIMEOUT_PREEMPTION")}
                      className={`px-3 py-1.5 rounded-lg font-bold border transition ${
                        diningStrategy === "TIMEOUT_PREEMPTION"
                          ? "bg-amber-600 text-white border-amber-400"
                          : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      ⏱️ Solusi Timeout Preemption
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDiningState((prev) => stepDiningSimulation(prev, diningStrategy))
                      }
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-white transition"
                    >
                      ⏩ 1 Step
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiningAutoPlay(!diningAutoPlay)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition ${
                        diningAutoPlay
                          ? "bg-amber-600 text-white animate-pulse"
                          : "bg-purple-600 text-white hover:bg-purple-500"
                      }`}
                    >
                      {diningAutoPlay ? "⏸️ Pause" : "▶️ Auto Play"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiningAutoPlay(false);
                        setDiningState(createInitialDiningState(diningStrategy));
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-white/10 transition"
                    >
                      🔄 Reset
                    </button>
                  </div>
                </div>

                {/* ARENA VISUAL MEJA DINING PHILOSOPHERS (SVG BUNDAR) */}
                <div className="relative rounded-2xl border border-white/10 bg-[#070514] p-4 flex flex-col items-center justify-center min-h-[420px] overflow-hidden">
                  {/* Efek Kunci Deadlock Flashing jika Deadlock */}
                  {diningState.hasDeadlock && (
                    <div className="absolute inset-0 bg-red-950/30 border-2 border-red-500/60 rounded-2xl animate-pulse flex items-center justify-center pointer-events-none z-20">
                      <div className="bg-black/80 px-6 py-3 rounded-xl border border-red-500 text-center">
                        <span className="text-xl md:text-2xl font-bold text-red-400 block font-mono">
                          🚨 DEADLOCK TERDETEKSI (CIRCULAR WAIT)!
                        </span>
                        <span className="text-xs text-gray-300">
                          Semua filsuf memegang 1 garpu dan menunggu garpu tetangganya.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* SVG Meja Bundar Filosofis Alien */}
                  <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center">
                    <svg viewBox="0 0 500 500" className="w-full h-full">
                      {/* Meja Tengah */}
                      <circle
                        cx="250"
                        cy="250"
                        r="140"
                        fill="#120c2a"
                        stroke="#a855f7"
                        strokeWidth="3"
                        strokeDasharray="8 6"
                        className="opacity-70"
                      />
                      {/* Mangkuk Energi Plasma di Tengah Meja */}
                      <circle cx="250" cy="250" r="50" fill="#2d0b4e" stroke="#22d3ee" strokeWidth="2" />
                      <circle cx="250" cy="250" r="30" fill="#a855f7" className="animate-pulse opacity-80" />
                      <text
                        x="250"
                        y="255"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        ENERGY CORE
                      </text>

                      {/* 5 Garpu Selang Plasma (Chopsticks / Forks) di antara filsuf */}
                      {[0, 1, 2, 3, 4].map((fIdx) => {
                        const angleDeg = fIdx * 72 + 36 - 90;
                        const rad = (angleDeg * Math.PI) / 180;
                        const fx = 250 + 105 * Math.cos(rad);
                        const fy = 250 + 105 * Math.sin(rad);

                        const holder = diningState.forkOwners[fIdx];
                        const isHeld = holder !== null;

                        return (
                          <g key={`fork-${fIdx}`} className="transition-all duration-300">
                            <circle
                              cx={fx}
                              cy={fy}
                              r="15"
                              fill={isHeld ? "#ef4444" : "#10b981"}
                              stroke="#ffffff"
                              strokeWidth="1.5"
                              className={isHeld ? "animate-pulse" : ""}
                            />
                            <text
                              x={fx}
                              y={fy + 4}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="9"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              F{fIdx}
                            </text>
                            {isHeld && (
                              <text
                                x={fx}
                                y={fy + 25}
                                textAnchor="middle"
                                fill="#fca5a5"
                                fontSize="8"
                                fontFamily="monospace"
                              >
                                Dipegang P{holder}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* 5 Filsuf Alien di Sekeliling Meja */}
                      {diningState.philosophers.map((phil, pIdx) => {
                        const angleDeg = pIdx * 72 - 90;
                        const rad = (angleDeg * Math.PI) / 180;
                        const px = 250 + 190 * Math.cos(rad);
                        const py = 250 + 190 * Math.sin(rad);

                        const stateColors: Record<
                          string,
                          { bg: string; border: string; text: string; label: string }
                        > = {
                          THINKING: { bg: "#0d2847", border: "#38bdf8", text: "#38bdf8", label: "THINK" },
                          HUNGRY: { bg: "#4a3505", border: "#facc15", text: "#facc15", label: "HUNGRY" },
                          HOLDING_ONE: { bg: "#451a03", border: "#fb923c", text: "#fb923c", label: "HOLD 1" },
                          EATING: { bg: "#064e3b", border: "#34d399", text: "#34d399", label: "EATING" },
                          DEADLOCKED: { bg: "#450a0a", border: "#f87171", text: "#f87171", label: "LOCKED" },
                        };

                        const conf = stateColors[phil.state] || stateColors.THINKING;

                        return (
                          <g key={`phil-${pIdx}`} className="transition-all duration-300">
                            <circle
                              cx={px}
                              cy={py}
                              r="32"
                              fill={conf.bg}
                              stroke={conf.border}
                              strokeWidth="2.5"
                              className={phil.state === "DEADLOCKED" ? "animate-pulse" : ""}
                            />
                            <text
                              x={px}
                              y={py - 6}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="10"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              P{pIdx}
                            </text>
                            <text
                              x={px}
                              y={py + 8}
                              textAnchor="middle"
                              fill={conf.text}
                              fontSize="8"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {conf.label}
                            </text>
                            <text
                              x={px}
                              y={py + 18}
                              textAnchor="middle"
                              fill="#9ca3af"
                              fontSize="7"
                              fontFamily="monospace"
                            >
                              Makan: {phil.eatCount}x
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Penjelasan Status Saat Ini */}
                  <div className="w-full mt-4 p-3 rounded-xl border border-white/10 bg-black/50 text-xs font-mono text-gray-300">
                    <span className="text-cyan-400 font-bold block mb-1">
                      KETERANGAN SIMULASI // COFFMAN CONDITIONS CHECK:
                    </span>
                    <p className="leading-relaxed">{diningState.explanation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Modal Info */}
      <div className="flex flex-wrap items-center justify-between border-t border-purple-500/30 bg-black/40 px-6 py-4 text-xs font-mono">
        <span className="text-gray-400 hidden sm:inline">
          Stage 4: Deadlock Avoidance, Detection & Resource Allocation Graph
        </span>
        <div className="flex items-center gap-3 ml-auto">
          {onOpenMaterial && (
            <button
              type="button"
              onClick={onOpenMaterial}
              className="px-4 py-2 rounded-xl border border-purple-400/40 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50 transition font-bold"
            >
              📖 Baca Datalog Materi
            </button>
          )}
          {onOpenQuiz && (
            <button
              type="button"
              onClick={onOpenQuiz}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold transition hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(236,72,153,0.4)]"
            >
              🔓 Buka Evaluasi Portal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

