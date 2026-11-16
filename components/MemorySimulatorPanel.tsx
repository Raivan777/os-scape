"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Hole,
  Cargo,
  MemoryAlgorithm,
  DEFAULT_HOLES,
  DEFAULT_CARGOS,
  runScenario,
  ScenarioResult,
} from "../utils/memoryLogic";

interface MemorySimulatorPanelProps {
  onClose?: () => void;
  onOpenMaterial?: () => void;
}

export default function MemorySimulatorPanel({
  onClose,
  onOpenMaterial,
}: MemorySimulatorPanelProps) {
  // 1. State Konfigurasi Partisi & Kargo
  const [holes, setHoles] = useState<Hole[]>(DEFAULT_HOLES);
  const [cargos, setCargos] = useState<Cargo[]>(DEFAULT_CARGOS);
  const [selectedAlgo, setSelectedAlgo] = useState<MemoryAlgorithm>("Best-Fit");

  // Form input tambah hole / kargo baru
  const [newHoleSize, setNewHoleSize] = useState<string>("250");
  const [newCargoName, setNewCargoName] = useState<string>("CX");
  const [newCargoSize, setNewCargoSize] = useState<string>("150");
  const [inputError, setInputError] = useState<string | null>(null);

  // 2. State Langkah Simulasi
  const [currentStep, setCurrentStep] = useState<number>(0); // 0 = awal sebelum penempatan kargo
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hitung komparasi 3 algoritma secara reaktif
  const comparison = useMemo(() => {
    return {
      firstFit: runScenario(holes, cargos, "First-Fit"),
      bestFit: runScenario(holes, cargos, "Best-Fit"),
      worstFit: runScenario(holes, cargos, "Worst-Fit"),
    };
  }, [holes, cargos]);

  const activeResult: ScenarioResult = useMemo(() => {
    if (selectedAlgo === "First-Fit") return comparison.firstFit;
    if (selectedAlgo === "Best-Fit") return comparison.bestFit;
    return comparison.worstFit;
  }, [selectedAlgo, comparison]);

  // Total memori awal sistem
  const totalMemory = useMemo(() => {
    return holes.reduce((acc, h) => acc + h.size, 0);
  }, [holes]);

  // Reset langkah ketika algoritma atau data berubah
  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
    if (playTimerRef.current) clearInterval(playTimerRef.current);
  }, [selectedAlgo, holes, cargos]);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < cargos.length) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            if (playTimerRef.current) clearInterval(playTimerRef.current);
            return prev;
          }
        });
      }, 1400);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, cargos.length]);

  // Hitung kondisi partisi memori saat ini (pada langkah currentStep)
  const stepState = useMemo(() => {
    let currentHoles = holes.map((h) => ({ ...h }));
    const placedCargos: Array<{ cargo: Cargo; start: number; holeId: string | number }> = [];
    const activePlacement = currentStep > 0 ? activeResult.placements[currentStep - 1] : null;

    for (let i = 0; i < currentStep; i++) {
      const p = activeResult.placements[i];
      if (p && p.success && p.allocatedHoleId !== null && p.allocatedStart !== null) {
        placedCargos.push({
          cargo: p.cargo,
          start: p.allocatedStart,
          holeId: p.allocatedHoleId,
        });

        // Update list hole
        const idx = currentHoles.findIndex((h) => h.id === p.allocatedHoleId);
        if (idx !== -1) {
          const target = currentHoles[idx];
          const remaining = target.size - p.cargo.size;
          if (remaining > 0) {
            currentHoles[idx] = {
              id: target.id,
              start: target.start + p.cargo.size,
              size: remaining,
            };
          } else {
            currentHoles.splice(idx, 1);
          }
        }
      }
    }

    return {
      currentHoles,
      placedCargos,
      activePlacement,
    };
  }, [holes, activeResult, currentStep]);

  // Handler Kontrol Simulasi
  const handleNextStep = () => {
    if (currentStep < cargos.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleResetStep = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleResetToDefault = () => {
    setIsPlaying(false);
    setHoles(DEFAULT_HOLES);
    setCargos(DEFAULT_CARGOS);
    setCurrentStep(0);
    setInputError(null);
  };

  // Handler Tambah Hole Baru
  const handleAddHole = () => {
    const size = parseInt(newHoleSize, 10);
    if (isNaN(size) || size <= 0) {
      setInputError("Ukuran hole harus berupa angka positif!");
      return;
    }
    setInputError(null);
    const lastHole = holes[holes.length - 1];
    const newStart = lastHole ? lastHole.start + lastHole.size : 0;
    const newId = holes.length > 0 ? Math.max(...holes.map((h) => Number(h.id) || 0)) + 1 : 1;

    setHoles([...holes, { id: newId, start: newStart, size }]);
    setNewHoleSize("200");
  };

  // Handler Hapus Hole
  const handleRemoveHole = (id: string | number) => {
    if (holes.length <= 1) {
      setInputError("Minimal harus ada 1 hole dalam memori!");
      return;
    }
    setInputError(null);
    setHoles(holes.filter((h) => h.id !== id));
  };

  // Handler Tambah Kargo Baru
  const handleAddCargo = () => {
    const size = parseInt(newCargoSize, 10);
    if (isNaN(size) || size <= 0) {
      setInputError("Ukuran kargo harus berupa angka positif!");
      return;
    }
    if (!newCargoName.trim()) {
      setInputError("Nama kargo tidak boleh kosong!");
      return;
    }
    setInputError(null);
    const newId = `c${cargos.length + 1}`;
    setCargos([...cargos, { id: newId, name: `${newCargoName.trim()} (${size} KB)`, size }]);
    setNewCargoName(`C${cargos.length + 2}`);
    setNewCargoSize("180");
  };

  // Handler Hapus Kargo
  const handleRemoveCargo = (id: string | number) => {
    if (cargos.length <= 1) {
      setInputError("Minimal harus ada 1 kargo dalam antrean!");
      return;
    }
    setInputError(null);
    setCargos(cargos.filter((c) => c.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 text-[#e9e4ff]">
      {/* Header Panel */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/30 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
            <h2 className="text-xl font-bold tracking-wide text-[#ffb347]">
              SIMULATOR ALOKASI MEMORI KONTIGU
            </h2>
          </div>
          <p className="mt-1 text-xs text-cyan-300/80 font-mono">
            Eksperimen Interaktif: First-Fit vs Best-Fit vs Worst-Fit
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenMaterial && (
            <button
              type="button"
              onClick={onOpenMaterial}
              className="rounded-xl border border-cyan-400/40 bg-cyan-950/40 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/50 transition"
            >
              📖 Teori Alokasi
            </button>
          )}
          <button
            type="button"
            onClick={handleResetToDefault}
            className="rounded-xl border border-purple-400/40 bg-purple-950/40 px-3.5 py-1.5 text-xs font-semibold text-purple-200 hover:bg-purple-900/50 transition"
          >
            ↺ Reset Contoh Standar
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition"
            >
              ✕ Tutup
            </button>
          )}
        </div>
      </div>

      {inputError && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-950/40 p-3 text-xs text-rose-300 animate-in fade-in">
          ⚠️ {inputError}
        </div>
      )}

      {/* 1. Bar Visualisasi Memori Kontigu */}
      <section className="glass-panel rounded-2xl p-5 border border-cyan-500/30">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🧠</span>
            <h3 className="font-bold text-sm text-cyan-300 font-mono">
              Peta Ruang Alamat Memori Fisik (Total: {totalMemory} KB)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-500 inline-block" />
              <span>Terisi Kargo</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-cyan-400 bg-cyan-950/40 inline-block" />
              <span>Hole Bebas</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-amber-400 bg-amber-500/30 inline-block" />
              <span>Sedang Diperiksa</span>
            </span>
          </div>
        </div>

        {/* Visual Bar Partisi Proporsional */}
        <div className="relative flex h-14 w-full overflow-hidden rounded-xl border-2 border-cyan-500/50 bg-[#060412] p-1 shadow-inner">
          {holes.map((initialHole) => {
            const widthPct = totalMemory > 0 ? (initialHole.size / totalMemory) * 100 : 0;
            // Cari kargo yang menempati hole ini
            const placedInThisHole = stepState.placedCargos.filter((pc) => pc.holeId === initialHole.id);
            // Sisa hole bebas saat ini
            const currentHoleRemaining = stepState.currentHoles.find((ch) => ch.id === initialHole.id);

            // Apakah slot ini sedang diperiksa pada langkah aktif?
            const isInspected = stepState.activePlacement?.checkedHoles.some(
              (ch) => ch.id === initialHole.id
            );
            const isSelected = stepState.activePlacement?.allocatedHoleId === initialHole.id;

            return (
              <div
                key={initialHole.id}
                className={`relative flex h-full border-r border-dashed border-cyan-500/40 transition-all duration-300 ${
                  isSelected
                    ? "ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-10"
                    : isInspected
                    ? "ring-2 ring-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] z-10"
                    : ""
                }`}
                style={{ width: `${Math.max(widthPct, 6)}%` }}
              >
                {/* Bagian Kargo yang Terisi */}
                {placedInThisHole.map((pc, idx) => {
                  const cargoWidthPct = (pc.cargo.size / initialHole.size) * 100;
                  return (
                    <div
                      key={idx}
                      className="flex h-full items-center justify-center bg-gradient-to-r from-emerald-600 to-teal-700 px-1 text-[10px] font-bold text-white shadow-sm overflow-hidden whitespace-nowrap"
                      style={{ width: `${cargoWidthPct}%` }}
                      title={`${pc.cargo.name} (${pc.cargo.size} KB) @${pc.start}`}
                    >
                      <span>{pc.cargo.name}</span>
                    </div>
                  );
                })}

                {/* Sisa Partisi Bebas (Hole) */}
                {currentHoleRemaining && (
                  <div
                    className={`flex h-full flex-1 items-center justify-center px-1 text-[10px] font-mono font-bold transition-colors ${
                      isSelected
                        ? "bg-emerald-950/60 text-emerald-300"
                        : isInspected
                        ? "bg-amber-950/60 text-amber-200 animate-pulse"
                        : "bg-cyan-950/30 text-cyan-300"
                    }`}
                    title={`Hole #${currentHoleRemaining.id}: ${currentHoleRemaining.size} KB bebas @${currentHoleRemaining.start}`}
                  >
                    <span>
                      #{currentHoleRemaining.id}: {currentHoleRemaining.size}K
                    </span>
                  </div>
                )}

                {/* Jika hole habis terpakai sempurna */}
                {!currentHoleRemaining && placedInThisHole.length > 0 && (
                  <span className="sr-only">Hole habis</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Status Langkah Aktif */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-300">
              Langkah: <strong className="text-white">{currentStep}</strong> / {cargos.length} kargo
            </span>
            {currentStep > 0 && (
              <span
                className={`rounded px-2 py-0.5 font-bold font-mono text-[11px] ${
                  stepState.activePlacement?.success
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                }`}
              >
                {stepState.activePlacement?.success
                  ? `✅ ${stepState.activePlacement.cargo.name} DITERIMA`
                  : `❌ ${stepState.activePlacement?.cargo.name} DITOLAK (FRAGMENTASI)`}
              </span>
            )}
          </div>

          {/* Tombol Kontrol Step */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 0 || isPlaying}
              className="rounded-lg border border-white/10 px-2.5 py-1 font-mono hover:bg-white/10 disabled:opacity-40 transition"
            >
              ⏮ Mundur
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`rounded-lg px-3 py-1 font-mono font-bold transition ${
                isPlaying
                  ? "bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                  : "bg-cyan-500 text-black hover:bg-cyan-400"
              }`}
            >
              {isPlaying ? "⏸ Jeda" : "▶ Putar Otomatis"}
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              disabled={currentStep >= cargos.length || isPlaying}
              className="rounded-lg border border-white/10 px-2.5 py-1 font-mono hover:bg-white/10 disabled:opacity-40 transition"
            >
              Maju ⏭
            </button>
            <button
              type="button"
              onClick={handleResetStep}
              className="rounded-lg border border-white/10 px-2.5 py-1 font-mono text-gray-400 hover:text-white transition"
            >
              Reset ↺
            </button>
          </div>
        </div>

        {/* Log Kalimat Langkah Aktif */}
        {stepState.activePlacement && (
          <div className="mt-3 rounded-xl border border-cyan-500/30 bg-black/60 p-3 font-mono text-xs space-y-1">
            <span className="font-bold text-cyan-300 block mb-1">
              Log Penempatan Kargo #{currentStep}: {stepState.activePlacement.cargo.name} ({stepState.activePlacement.cargo.size} KB)
            </span>
            {stepState.activePlacement.logs.map((log, idx) => (
              <p
                key={idx}
                className={
                  log.isFitting
                    ? "text-emerald-300"
                    : log.inspectedHoleId === "-"
                    ? "text-rose-300 font-bold"
                    : "text-gray-400"
                }
              >
                ➔ {log.message}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* 2. Pilihan Algoritma & Konfigurasi Input */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pilihan Algoritma Aktif */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30 lg:col-span-1">
          <h3 className="font-bold text-sm text-[#ffb347] font-mono mb-3">
            PILIH ALGORITMA AKTIF
          </h3>
          <div className="flex flex-col gap-2.5">
            {(["First-Fit", "Best-Fit", "Worst-Fit"] as MemoryAlgorithm[]).map((algo) => {
              const isSel = selectedAlgo === algo;
              return (
                <button
                  key={algo}
                  type="button"
                  onClick={() => setSelectedAlgo(algo)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${
                    isSel
                      ? "border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.3)] font-bold"
                      : "border-white/10 bg-white/[0.03] text-gray-300 hover:border-cyan-400/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">{algo}</span>
                    {isSel && <span className="text-cyan-400 text-xs">● Aktif</span>}
                  </div>
                  <span className="mt-1 block text-[11px] text-gray-400">
                    {algo === "First-Fit"
                      ? "Berhenti di slot pertama yang muat (Cepat)"
                      : algo === "Best-Fit"
                      ? "Mencari partisi terkecil yang muat (Hemat Slot)"
                      : "Mencari partisi terbesar yang muat (Sisa Maksimal)"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-gray-300 leading-relaxed">
            <span className="font-bold text-cyan-300 block mb-1">Status Skenario {selectedAlgo}:</span>
            <p>
              Tertempatkan: <strong className="text-emerald-400">{activeResult.metrics.allocatedCargosCount}</strong> / {cargos.length} kargo
            </p>
            <p>
              Pemanfaatan Memori: <strong className="text-cyan-300">{activeResult.metrics.utilizationPercentage}%</strong>
            </p>
            <p>
              Sisa Fragmentasi: <strong className="text-rose-300">{activeResult.metrics.externalFragmentationSize} KB</strong>
            </p>
          </div>
        </div>

        {/* Manajemen Partisi Hole & Kargo (Input Dapat Diubah) */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30 lg:col-span-2 space-y-5">
          <h3 className="font-bold text-sm text-cyan-300 font-mono">
            PENGATURAN PARTISI MEMORI & ANTREAN KARGO
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kolom Holes */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="font-bold text-xs text-amber-300 font-mono block mb-2">
                Daftar Hole (Ruang Bebas Awal)
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {holes.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1 text-xs font-mono"
                  >
                    <span>
                      #{h.id} (@{h.start}): <strong className="text-cyan-200">{h.size} KB</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHole(h.id)}
                      className="text-rose-400 hover:text-rose-300 text-xs px-1"
                      title="Hapus slot"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Tambah Hole */}
              <div className="mt-3 flex gap-2 pt-2 border-t border-white/10">
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={newHoleSize}
                  onChange={(e) => setNewHoleSize(e.target.value)}
                  placeholder="Ukuran KB"
                  className="w-full rounded-lg border border-white/15 bg-black/60 px-2.5 py-1 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddHole}
                  className="shrink-0 rounded-lg bg-cyan-600 px-3 py-1 text-xs font-bold text-white hover:bg-cyan-500 transition"
                >
                  + Hole
                </button>
              </div>
            </div>

            {/* Kolom Cargos */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="font-bold text-xs text-purple-300 font-mono block mb-2">
                Antrean Kargo (Permintaan Proses)
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {cargos.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1 text-xs font-mono"
                  >
                    <span>
                      {c.name}: <strong className="text-purple-200">{c.size} KB</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCargo(c.id)}
                      className="text-rose-400 hover:text-rose-300 text-xs px-1"
                      title="Hapus kargo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Tambah Kargo */}
              <div className="mt-3 flex gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  value={newCargoName}
                  onChange={(e) => setNewCargoName(e.target.value)}
                  placeholder="Nama"
                  className="w-24 rounded-lg border border-white/15 bg-black/60 px-2 py-1 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                />
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={newCargoSize}
                  onChange={(e) => setNewCargoSize(e.target.value)}
                  placeholder="KB"
                  className="w-full rounded-lg border border-white/15 bg-black/60 px-2.5 py-1 text-xs font-mono text-white focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCargo}
                  className="shrink-0 rounded-lg bg-purple-600 px-3 py-1 text-xs font-bold text-white hover:bg-purple-500 transition"
                >
                  + Kargo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tabel & Bar Perbandingan Metrik Ketiga Algoritma */}
      <section className="glass-panel rounded-2xl p-5 border border-cyan-500/30">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">📊</span>
          <h3 className="font-bold text-sm text-cyan-300 font-mono">
            TABEL KOMPARASI METRIK KETIGA ALGORITMA PADA INPUT YANG SAMA
          </h3>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/60 text-cyan-300 border-b border-white/10">
              <tr>
                <th className="p-3">Algoritma</th>
                <th className="p-3">Kargo Tertempatkan</th>
                <th className="p-3">Pemanfaatan Memori (%)</th>
                <th className="p-3">Sisa Memori Bebas</th>
                <th className="p-3">Hole Terbesar</th>
                <th className="p-3">Sisa Fragmentasi Eksternal</th>
                <th className="p-3">Slot Diperiksa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-black/30">
              {[
                { name: "First-Fit", res: comparison.firstFit, badgeClass: "text-blue-300" },
                { name: "Best-Fit", res: comparison.bestFit, badgeClass: "text-amber-300" },
                { name: "Worst-Fit", res: comparison.worstFit, badgeClass: "text-purple-300" },
              ].map(({ name, res, badgeClass }) => {
                const isWinner = res.metrics.allocatedCargosCount === cargos.length;
                return (
                  <tr
                    key={name}
                    className={`transition-colors ${
                      selectedAlgo === name ? "bg-cyan-500/[0.08]" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className={`p-3 font-bold ${badgeClass}`}>
                      {name} {isWinner && <span className="text-emerald-400 ml-1">★ Menang</span>}
                    </td>
                    <td className="p-3 font-bold">
                      <span className={res.metrics.failedCargosCount === 0 ? "text-emerald-300" : "text-rose-300"}>
                        {res.metrics.allocatedCargosCount} / {cargos.length}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                            style={{ width: `${res.metrics.utilizationPercentage}%` }}
                          />
                        </div>
                        <span className="font-bold text-white">{res.metrics.utilizationPercentage}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-cyan-200">{res.metrics.totalFreeMemory} KB</td>
                    <td className="p-3 text-amber-200">{res.metrics.largestHoleSize} KB</td>
                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-0.5 font-bold ${
                          res.metrics.externalFragmentationSize === 0
                            ? "bg-emerald-950/60 text-emerald-300"
                            : "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {res.metrics.externalFragmentationSize} KB ({res.metrics.externalFragmentationPercentage}%)
                      </span>
                    </td>
                    <td className="p-3 text-gray-300">{res.metrics.totalSlotsInspected} slot</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3.5 text-xs text-gray-300 leading-relaxed">
          <strong className="text-[#ffb347]">💡 Analisis Komparasi:</strong>
          <p className="mt-1">
            <strong>Best-Fit</strong> biasanya menghasilkan pemanfaatan memori tertinggi dan menyisakan slot besar utuh, tetapi memiliki <em>slot inspection count</em> paling tinggi (overhead scan penuh). <strong>First-Fit</strong> jauh lebih cepat (slot yang diperiksa lebih sedikit), namun lebih berisiko mengalami fragmentasi eksternal pada urutan kargo tertentu.
          </p>
        </div>
      </section>
    </div>
  );
}

