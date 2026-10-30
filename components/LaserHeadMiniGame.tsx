"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  calculateFCFS,
  calculateSSTF,
  calculateSCAN,
  DiskAlgorithmResult,
} from "../utils/diskAlgorithms";

interface LaserHeadMiniGameProps {
  onCalibrationComplete?: () => void;
  onOpenQuiz?: () => void;
  onOpenMaterial?: () => void;
}

export default function LaserHeadMiniGame({
  onCalibrationComplete,
  onOpenQuiz,
  onOpenMaterial,
}: LaserHeadMiniGameProps) {
  // Rentang silinder disk 0 s.d 199
  const DISK_SIZE = 200;
  const DEFAULT_INITIAL_HEAD = 53;
  const DEFAULT_REQUESTS = [98, 183, 37, 122, 14, 124, 65, 67];

  // State Utama Game
  const [initialHead, setInitialHead] = useState<number>(DEFAULT_INITIAL_HEAD);
  const [requestQueue, setRequestQueue] = useState<number[]>(DEFAULT_REQUESTS);
  const [currentHeadPos, setCurrentHeadPos] = useState<number>(DEFAULT_INITIAL_HEAD);
  const [targetHeadPos, setTargetHeadPos] = useState<number>(DEFAULT_INITIAL_HEAD);

  // Mode: "manual" (Pemain mengendalikan laser) atau "algo" (Simulasi otomatis FCFS/SSTF/SCAN)
  const [gameMode, setGameMode] = useState<"manual" | "algo">("manual");
  const [selectedAlgo, setSelectedAlgo] = useState<"FCFS" | "SSTF" | "SCAN">("FCFS");

  // State Integritas Kalibrasi & Rintangan
  const [integrity, setIntegrity] = useState<number>(100);
  const [laserFiring, setLaserFiring] = useState<boolean>(false);
  const [calibrationSuccessCount, setCalibrationSuccessCount] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(
    "Arahkan Laser Head ke silinder target dalam antrean!"
  );

  // Rintangan: Bad Sectors (silinder yang rusak dan harus dihindari tembakan laser salah sasaran)
  const [badSectors, setBadSectors] = useState<number[]>([45, 80, 150]);
  const [magneticFluxActive, setMagneticFluxActive] = useState<boolean>(false);
  const [glitchActive, setGlitchActive] = useState<boolean>(false);

  // State Simulasi Algoritma Otomatis
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationIndex, setSimulationIndex] = useState<number>(0);
  const [currentResult, setCurrentResult] = useState<DiskAlgorithmResult | null>(null);

  // Animasi rotasi piringan platter
  const [diskRotation, setDiskRotation] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hitung hasil ketiga algoritma untuk komparasi metrik
  const algoComparison = useMemo(() => {
    return {
      fcfs: calculateFCFS(requestQueue, initialHead),
      sstf: calculateSSTF(requestQueue, initialHead),
      scan: calculateSCAN(requestQueue, initialHead, DISK_SIZE, "up"),
    };
  }, [requestQueue, initialHead]);

  // Game Loop rotasi platter disk & siklus rintangan Magnetic Flux
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Piringan berputar 72 derajat per detik
      setDiskRotation((prev) => (prev + dt * 72) % 360);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    // Rintangan: Siklus gelombang Magnetic Flux Surge setiap 7 detik
    const fluxInterval = setInterval(() => {
      setMagneticFluxActive(true);
      setTimeout(() => {
        setMagneticFluxActive(false);
      }, 2500);
    }, 7000);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      clearInterval(fluxInterval);
    };
  }, []);

  // Animasi pergerakan halus laser head arm menuju targetHeadPos
  useEffect(() => {
    if (Math.abs(currentHeadPos - targetHeadPos) < 1) {
      setCurrentHeadPos(targetHeadPos);
      return;
    }

    const timer = setTimeout(() => {
      const step = (targetHeadPos - currentHeadPos) * 0.25;
      setCurrentHeadPos((prev) => Math.round(prev + step));
    }, 24);

    return () => clearTimeout(timer);
  }, [currentHeadPos, targetHeadPos]);

  // Handle Kontrol Manual: Menggeser silinder
  const handleMoveHead = (delta: number) => {
    if (isSimulating) return;
    setTargetHeadPos((prev) => {
      const next = Math.max(0, Math.min(DISK_SIZE - 1, prev + delta));
      return next;
    });
  };

  // Handle Kontrol Manual: Menembakkan Laser Kalibrasi
  const handleFireLaser = () => {
    if (isSimulating || laserFiring) return;
    setLaserFiring(true);

    const hitCylinder = targetHeadPos;

    // Cek apakah mengenai Rintangan Bad Sector
    if (badSectors.includes(hitCylinder)) {
      setGlitchActive(true);
      setIntegrity((prev) => Math.max(0, prev - 25));
      setStatusMessage(`⚠️ CRITICAL ERROR! Laser menembus Bad Sector #${hitCylinder}! Integritas Berkurang!`);
      setTimeout(() => {
        setGlitchActive(false);
        setLaserFiring(false);
      }, 700);
      return;
    }

    // Cek apakah ada Magnetic Flux Surge aktif
    if (magneticFluxActive) {
      setGlitchActive(true);
      setIntegrity((prev) => Math.max(0, prev - 15));
      setStatusMessage("⚡ INTERFERENSI FLUKUS! Medan magnet mengaburkan fokus laser head!");
      setTimeout(() => {
        setGlitchActive(false);
        setLaserFiring(false);
      }, 600);
      return;
    }

    // Cek apakah mengenai silinder sasaran berikutnya dalam antrean
    const nextTarget = requestQueue[0];
    if (hitCylinder === nextTarget) {
      const newQueue = requestQueue.slice(1);
      setRequestQueue(newQueue);
      setCalibrationSuccessCount((prev) => prev + 1);
      setStatusMessage(`✨ Silinder #${hitCylinder} sukses terkalibrasi dan dibaca!`);

      if (newQueue.length === 0) {
        setStatusMessage("🎉 SEMUA SILINDER DISK BERHASIL DIKALIBRASI! Storage Core Aktif!");
        if (onCalibrationComplete) onCalibrationComplete();
      }
    } else if (requestQueue.includes(hitCylinder)) {
      // Mengenai silinder antrean tapi bukan yang urutan pertama
      const newQueue = requestQueue.filter((c) => c !== hitCylinder);
      setRequestQueue(newQueue);
      setCalibrationSuccessCount((prev) => prev + 1);
      setStatusMessage(`⚡ Silinder #${hitCylinder} terbaca di luar urutan antrean.`);
      if (newQueue.length === 0) {
        setStatusMessage("🎉 SEMUA SILINDER DISK BERHASIL DIKALIBRASI!");
        if (onCalibrationComplete) onCalibrationComplete();
      }
    } else {
      setStatusMessage(`Tidak ada data antrean di Silinder #${hitCylinder}. Target: #${nextTarget ?? "-"}`);
    }

    setTimeout(() => {
      setLaserFiring(false);
    }, 400);
  };

  // Menjalankan simulasi otomatis algoritma yang dipilih
  const handleRunAlgorithm = (algo: "FCFS" | "SSTF" | "SCAN") => {
    setSelectedAlgo(algo);
    setGameMode("algo");
    if (simTimerRef.current) clearInterval(simTimerRef.current);

    let res: DiskAlgorithmResult;
    if (algo === "FCFS") res = algoComparison.fcfs;
    else if (algo === "SSTF") res = algoComparison.sstf;
    else res = algoComparison.scan;

    setCurrentResult(res);
    setIsSimulating(true);
    setSimulationIndex(0);
    setStatusMessage(`Memulai eksekusi ${res.algorithm}...`);

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < res.sequence.length) {
        const cyl = res.sequence[stepIdx];
        setTargetHeadPos(cyl);
        setLaserFiring(true);
        setTimeout(() => setLaserFiring(false), 200);

        setSimulationIndex(stepIdx);
        setStatusMessage(
          `Langkah ${stepIdx + 1}/${res.sequence.length}: Head bergerak ke Silinder #${cyl}`
        );
        stepIdx++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        setStatusMessage(
          `✅ Selesai! ${res.algorithm} menuntaskan ${res.steps.length} operasi seek dengan total jarak ${res.totalSeekDistance} silinder.`
        );
      }
    }, 750);

    simTimerRef.current = interval;
  };

  // Reset Antrean Silinder & Status
  const handleResetGame = () => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    setIsSimulating(false);
    setRequestQueue(DEFAULT_REQUESTS);
    setInitialHead(DEFAULT_INITIAL_HEAD);
    setTargetHeadPos(DEFAULT_INITIAL_HEAD);
    setCurrentHeadPos(DEFAULT_INITIAL_HEAD);
    setIntegrity(100);
    setCalibrationSuccessCount(0);
    setCurrentResult(null);
    setStatusMessage("Sistem kalibrasi disk di-reset ke nilai default.");
  };

  // Randomize Antrean Silinder
  const handleRandomizeQueue = () => {
    if (isSimulating) return;
    const count = 7;
    const randoms: number[] = [];
    while (randoms.length < count) {
      const val = Math.floor(Math.random() * 190) + 5;
      if (!randoms.includes(val)) randoms.push(val);
    }
    const newHead = Math.floor(Math.random() * 180) + 10;
    setInitialHead(newHead);
    setTargetHeadPos(newHead);
    setCurrentHeadPos(newHead);
    setRequestQueue(randoms);
    setStatusMessage(`Antrean silinder baru diacak! Head awal: #${newHead}`);
  };

  // Keyboard shortcut saat bermain manual
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSimulating) return;
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        handleMoveHead(-5);
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        handleMoveHead(5);
      } else if (e.key === " ") {
        e.preventDefault();
        handleFireLaser();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSimulating, targetHeadPos, requestQueue, badSectors, magneticFluxActive]);

  // Kalkulasi posisi laser pada radius SVG piringan (Radius platter: 60px s.d 210px)
  const minRadius = 55;
  const maxRadius = 215;
  const currentRadius = minRadius + (currentHeadPos / (DISK_SIZE - 1)) * (maxRadius - minRadius);

  return (
    <div
      className={`relative w-full rounded-2xl border border-cyan-500/40 bg-[#090618]/95 p-4 md:p-6 text-white shadow-[0_0_50px_rgba(6,182,212,0.25)] select-none backdrop-blur-md transition-all ${
        glitchActive ? "border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.6)]" : ""
      }`}
    >
      {/* 1. Header Bar Mini-game */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400 bg-cyan-950/60 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <span className="text-xl">💽</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold tracking-wider text-cyan-300">
                LASER HEAD CALIBRATOR // DISK SCHEDULER
              </h2>
              <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-mono text-purple-300">
                STAGE 5
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Disk Platter: 200 Cylinders (0 - 199) • Spindle: 15,000 RPM
            </p>
          </div>
        </div>

        {/* Quick Nav Buttons */}
        <div className="flex items-center gap-2 text-xs">
          {onOpenMaterial && (
            <button
              type="button"
              onClick={onOpenMaterial}
              className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 font-bold text-amber-300 transition hover:bg-amber-500/20 hover:scale-105"
            >
              📖 Buka Materi Disk
            </button>
          )}
          {onOpenQuiz && (
            <button
              type="button"
              onClick={onOpenQuiz}
              className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 font-bold text-emerald-300 transition hover:bg-emerald-500/20 hover:scale-105"
            >
              🛡️ Kuis Firewall 5
            </button>
          )}
        </div>
      </div>

      {/* 2. Status Alerts & Warning Indicators */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
        {/* Indikator Posisi Head Sekarang */}
        <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-4 py-2.5">
          <span className="text-gray-400">POSISI HEAD:</span>
          <span className="text-base font-bold text-cyan-300 tracking-wider">
            SILINDER #{Math.round(currentHeadPos)}
          </span>
        </div>

        {/* Indikator Integritas Kalibrasi (Health) */}
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <span className="text-gray-400">INTEGRITAS KALIBRASI:</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-20 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  integrity > 50
                    ? "bg-emerald-400"
                    : integrity > 25
                    ? "bg-amber-400"
                    : "bg-rose-500 animate-pulse"
                }`}
                style={{ width: `${integrity}%` }}
              />
            </div>
            <span
              className={`font-bold ${
                integrity > 50
                  ? "text-emerald-400"
                  : integrity > 25
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {integrity}%
            </span>
          </div>
        </div>

        {/* Indikator Rintangan Aktif */}
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-2.5 transition-colors ${
            magneticFluxActive
              ? "border-rose-500/80 bg-rose-950/40 text-rose-300 animate-pulse"
              : "border-purple-500/30 bg-purple-950/20 text-purple-300"
          }`}
        >
          <span>STATUS RINTANGAN:</span>
          <span className="font-bold">
            {magneticFluxActive ? "⚡ FLUKUS MAGNETIK (BAHAYA)" : "🛡️ KONDISI STABIL"}
          </span>
        </div>
      </div>

      {/* 3. Status Bar Teks */}
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-xs font-mono">
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-cyan-200">{statusMessage}</span>
      </div>

      {/* 4. Area Visual Utama: Platter Disk 2D SVG & Actuator Laser Arm */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Kolom Visual Platter Disk (7 Kolom) */}
        <div className="lg:col-span-7 relative flex items-center justify-center rounded-2xl border border-cyan-500/20 bg-black/60 p-4 overflow-hidden h-[380px]">
          {/* Efek Garis Bahaya Flukus Magnetik jika aktif */}
          {magneticFluxActive && (
            <div className="absolute inset-0 z-20 pointer-events-none bg-rose-500/10 backdrop-blur-[1px] animate-pulse">
              <div className="absolute top-2 left-2 text-[10px] font-mono text-rose-400 uppercase tracking-widest">
                [PERINGATAN: INTERFERENSI ANOMALI ELEKTROMAGNETIK MENYAPU DISK]
              </div>
            </div>
          )}

          {/* SVG Piringan Platter Berputar */}
          <svg width="360" height="360" viewBox="0 0 460 460" className="relative z-10">
            <defs>
              <radialGradient id="platterSurface" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#08041a" />
                <stop offset="45%" stopColor="#140b33" />
                <stop offset="85%" stopColor="#0a1e36" />
                <stop offset="100%" stopColor="#1a0f3d" />
              </radialGradient>
              <filter id="laserGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Rotated Group untuk Sektor & Pola Platter */}
            <g
              transform={`rotate(${diskRotation} 230 230)`}
              style={{ transformOrigin: "230px 230px" }}
            >
              {/* Piringan Luar */}
              <circle
                cx="230"
                cy="230"
                r="220"
                fill="url(#platterSurface)"
                stroke="#06b6d4"
                strokeWidth="2"
              />

              {/* Garis-Garis Sektor (Spokes) */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 360) / 12;
                const rad = (angle * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1="230"
                    y1="230"
                    x2={230 + 215 * Math.cos(rad)}
                    y2={230 + 215 * Math.sin(rad)}
                    stroke="#22d3ee"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                    opacity="0.25"
                  />
                );
              })}

              {/* Rintangan: Bad Sectors Berbahaya (Zona Merah) */}
              {badSectors.map((badCyl) => {
                const r = minRadius + (badCyl / (DISK_SIZE - 1)) * (maxRadius - minRadius);
                return (
                  <circle
                    key={`bad-${badCyl}`}
                    cx="230"
                    cy="230"
                    r={r}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="8"
                    strokeDasharray="18 40"
                    opacity="0.8"
                  />
                );
              })}

              {/* Trek Silinder Antrean Target (Menyala Hijau/Emas) */}
              {requestQueue.map((cyl, idx) => {
                const r = minRadius + (cyl / (DISK_SIZE - 1)) * (maxRadius - minRadius);
                const isNext = idx === 0;
                return (
                  <circle
                    key={`req-${cyl}`}
                    cx="230"
                    cy="230"
                    r={r}
                    fill="none"
                    stroke={isNext ? "#10b981" : "#f59e0b"}
                    strokeWidth={isNext ? "3" : "1.5"}
                    strokeDasharray={isNext ? "6 4" : "3 3"}
                    opacity={isNext ? 0.9 : 0.6}
                  />
                );
              })}

              {/* Spindel Pusat Motor */}
              <circle cx="230" cy="230" r="45" fill="#0d0922" stroke="#a855f7" strokeWidth="3" />
              <circle cx="230" cy="230" r="22" fill="#22d3ee" opacity="0.4" />
            </g>

            {/* Trek Silinder Aktif Sekarang (Statis) */}
            <circle
              cx="230"
              cy="230"
              r={currentRadius}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="2 4"
              opacity="0.8"
            />

            {/* Actuator Arm Mekanik (Pivot di Kanan Atas) */}
            <g>
              {/* Poros Pivot Aktuator */}
              <circle cx="410" cy="50" r="30" fill="#110d2e" stroke="#22d3ee" strokeWidth="3" />
              <circle cx="410" cy="50" r="14" fill="#a855f7" />

              {/* Batang Lengan Arm mengarah ke titik silinder laser */}
              <line
                x1="410"
                y1="50"
                x2={230}
                y2={230 - currentRadius}
                stroke="#64748b"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <line
                x1="410"
                y1="50"
                x2={230}
                y2={230 - currentRadius}
                stroke="#38bdf8"
                strokeWidth="2"
              />

              {/* Kepala Lensa Laser Head (Slider) */}
              <circle
                cx={230}
                cy={230 - currentRadius}
                r="10"
                fill="#0284c7"
                stroke="#38bdf8"
                strokeWidth="2"
              />

              {/* Sinar Laser (Menyala saat Firing) */}
              {laserFiring && (
                <>
                  <circle
                    cx={230}
                    cy={230 - currentRadius}
                    r="16"
                    fill="#f43f5e"
                    fillOpacity="0.4"
                    filter="url(#laserGlow)"
                    className="animate-ping"
                  />
                  <line
                    x1={230}
                    y1={230 - currentRadius - 8}
                    x2={230}
                    y2={230 - currentRadius + 8}
                    stroke="#f43f5e"
                    strokeWidth="4"
                  />
                  <line
                    x1={230 - 8}
                    y1={230 - currentRadius}
                    x2={230 + 8}
                    y2={230 - currentRadius}
                    stroke="#f43f5e"
                    strokeWidth="4"
                  />
                </>
              )}
            </g>

            {/* Label Silinder Saat Ini di Atas Head */}
            <text
              x={230}
              y={230 - currentRadius - 16}
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="11"
              fontFamily="monospace"
              fontWeight="bold"
            >
              Cyl #{Math.round(currentHeadPos)}
            </text>
          </svg>

          {/* Overlay Legenda Sektor */}
          <div className="absolute bottom-3 left-4 flex flex-wrap gap-2 text-[10px] font-mono text-gray-300 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Target Terdekat
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Antrean
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Bad Sector (Awas!)
            </span>
          </div>
        </div>

        {/* Kolom Panel Kontrol & Simulasi Algoritma (5 Kolom) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Tab Pemilihan Mode */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/40 p-1 border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setIsSimulating(false);
                setGameMode("manual");
              }}
              className={`rounded-lg py-2 transition ${
                gameMode === "manual"
                  ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🎮 Kalibrasi Manual
            </button>
            <button
              type="button"
              onClick={() => {
                setGameMode("algo");
              }}
              className={`rounded-lg py-2 transition ${
                gameMode === "algo"
                  ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              ⚙️ Simulasi 3 Algoritma
            </button>
          </div>

          {/* Konten Tab Manual */}
          {gameMode === "manual" ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div className="text-xs text-gray-300 font-mono">
                <span className="text-amber-400 font-bold block mb-1">MISI KALIBRASI:</span>
                Gerakkan laser head ke trek silinder target antrean. Hindari Bad Sector merah (#45, #80, #150)!
              </div>

              {/* Slider Penyesuaian Silinder */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">Silinder 0 (Dalam)</span>
                  <span className="text-cyan-300 font-bold">Target #{targetHeadPos}</span>
                  <span className="text-gray-400">Silinder 199 (Luar)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={DISK_SIZE - 1}
                  value={targetHeadPos}
                  onChange={(e) => setTargetHeadPos(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-gray-700 rounded-lg"
                />
              </div>

              {/* Tombol Panah Langkah Cepat */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleMoveHead(-10)}
                  className="flex-1 rounded-lg border border-cyan-500/30 bg-cyan-950/40 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50"
                >
                  ◀ -10
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveHead(-1)}
                  className="flex-1 rounded-lg border border-cyan-500/30 bg-cyan-950/40 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveHead(1)}
                  className="flex-1 rounded-lg border border-cyan-500/30 bg-cyan-950/40 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveHead(10)}
                  className="flex-1 rounded-lg border border-cyan-500/30 bg-cyan-950/40 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900/50"
                >
                  +10 ▶
                </button>
              </div>

              {/* Tombol Tembak Laser Kalibrasi */}
              <button
                type="button"
                onClick={handleFireLaser}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 py-3 text-sm font-black text-black shadow-[0_0_25px_rgba(6,182,212,0.5)] transition hover:scale-102 active:scale-98"
              >
                🔴 KUNCI & TEMBAK LASER [SPACE]
              </button>

              <div className="text-[11px] text-gray-400 text-center font-mono">
                Keyboard: <strong className="text-white">A / D</strong> atau <strong className="text-white">Panah</strong> untuk gerak, <strong className="text-white">Spasi</strong> untuk tembak laser.
              </div>
            </div>
          ) : (
            /* Konten Tab Simulasi 3 Algoritma */
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <span className="text-xs font-mono text-purple-300 font-bold block">
                PILIH ALGORITMA PENJADWALAN DISK:
              </span>

              {/* Tombol 3 Algoritma */}
              <div className="grid grid-cols-3 gap-2 text-xs font-bold font-mono">
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleRunAlgorithm("FCFS")}
                  className={`rounded-lg py-2.5 transition border ${
                    selectedAlgo === "FCFS"
                      ? "border-blue-400 bg-blue-950/60 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                      : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  1. FCFS
                </button>
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleRunAlgorithm("SSTF")}
                  className={`rounded-lg py-2.5 transition border ${
                    selectedAlgo === "SSTF"
                      ? "border-amber-400 bg-amber-950/60 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                      : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  2. SSTF
                </button>
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => handleRunAlgorithm("SCAN")}
                  className={`rounded-lg py-2.5 transition border ${
                    selectedAlgo === "SCAN"
                      ? "border-emerald-400 bg-emerald-950/60 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  3. SCAN
                </button>
              </div>

              {/* Panel Metrik Perbandingan */}
              <div className="space-y-1.5 font-mono text-[11px] rounded-lg bg-black/50 p-3 border border-white/10">
                <div className="flex justify-between items-center text-blue-300">
                  <span>• FCFS Total Seek:</span>
                  <span className="font-bold">{algoComparison.fcfs.totalSeekDistance} silinder</span>
                </div>
                <div className="flex justify-between items-center text-amber-300">
                  <span>• SSTF Total Seek:</span>
                  <span className="font-bold">{algoComparison.sstf.totalSeekDistance} silinder</span>
                </div>
                <div className="flex justify-between items-center text-emerald-300">
                  <span>• SCAN Elevator Total Seek:</span>
                  <span className="font-bold">{algoComparison.scan.totalSeekDistance} silinder</span>
                </div>
              </div>

              {/* Deskripsi Algoritma yang sedang aktif */}
              {currentResult && (
                <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-2.5 text-xs text-gray-300">
                  <div className="font-bold text-purple-200 mb-1">
                    {currentResult.algorithm}:
                  </div>
                  <p className="text-[11px] leading-relaxed text-gray-400">
                    {currentResult.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Antrean Silinder Data (Queue Chips) */}
          <div className="rounded-xl border border-white/10 bg-black/40 p-3">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-gray-400">ANTREAN SILINDER (REQUESTS):</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRandomizeQueue}
                  disabled={isSimulating}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  🎲 Acak Antrean
                </button>
                <button
                  type="button"
                  onClick={handleResetGame}
                  className="text-[10px] text-gray-400 hover:text-white"
                >
                  ↺ Reset
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {requestQueue.length > 0 ? (
                requestQueue.map((cyl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!isSimulating) setTargetHeadPos(cyl);
                    }}
                    className={`rounded-md px-2 py-1 text-xs font-mono font-bold transition ${
                      idx === 0
                        ? "bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"
                        : "bg-white/10 text-gray-200 hover:bg-cyan-500/20 hover:text-cyan-300"
                    }`}
                  >
                    #{cyl}
                  </button>
                ))
              ) : (
                <span className="text-xs text-emerald-400 font-mono">
                  🎉 Semua silinder selesai dibaca!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Grafik Seek Chart Visualizer (Jalur Gerakan Head Disk) */}
      <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-4">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="text-cyan-300 font-bold">
            📈 GRAFIK PERPINDAHAN HEAD SILINDER ({selectedAlgo}):
          </span>
          <span className="text-gray-400">
            Jalur Silinder: {(currentResult?.sequence ?? [initialHead, ...requestQueue]).join(" ➔ ")}
          </span>
        </div>

        {/* Visualizer Garis Perpindahan Head */}
        <div className="relative h-20 w-full rounded-lg bg-[#08051a] border border-cyan-500/20 p-2 overflow-hidden">
          {/* Garis Grid Silinder 0, 50, 100, 150, 199 */}
          {[0, 50, 100, 150, 199].map((pos) => {
            const leftPct = (pos / 199) * 100;
            return (
              <div
                key={pos}
                className="absolute top-0 bottom-0 border-l border-white/10"
                style={{ left: `${leftPct}%` }}
              >
                <span className="text-[9px] font-mono text-gray-400 pl-1">{pos}</span>
              </div>
            );
          })}

          {/* SVG Jalur Garis Seek Path */}
          <svg className="absolute inset-0 h-full w-full">
            {(() => {
              const seq = currentResult?.sequence ?? [initialHead, ...requestQueue];
              if (seq.length < 2) return null;

              const points = seq.map((cyl, i) => {
                const xPct = (cyl / 199) * 100;
                const yPct = 25 + (i / Math.max(1, seq.length - 1)) * 50;
                return `${xPct}%,${yPct}%`;
              });

              return (
                <>
                  <polyline
                    points={points.join(" ")}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  {seq.map((cyl, i) => {
                    const xPct = (cyl / 199) * 100;
                    const yPct = 25 + (i / Math.max(1, seq.length - 1)) * 50;
                    const isActive = simulationIndex === i;
                    return (
                      <circle
                        key={i}
                        cx={`${xPct}%`}
                        cy={`${yPct}%`}
                        r={isActive ? 6 : 4}
                        fill={isActive ? "#f43f5e" : "#22d3ee"}
                        className={isActive ? "animate-ping" : ""}
                      />
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
}

