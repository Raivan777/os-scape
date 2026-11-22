"use client";

import React, { useState, useMemo } from "react";
import {
  ProcessInput,
  generatePagesForProcessesCustom,
  initializeFramesCustom,
  buildMappingSteps,
  getPagingMetricsFor,
  translateAddress,
} from "@/utils/pagingLogic";

interface PagingLabPanelProps {
  onClose: () => void;
}

type LabTab = "alokasi" | "translasi" | "komparasi";

export default function PagingLabPanel({ onClose }: PagingLabPanelProps) {
  // ─── TAB AKTIF ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<LabTab>("alokasi");

  // ─── INPUT YANG DAPAT DIUBAH PENGGUNA ─────────────────────────
  const [totalMemoryKB, setTotalMemoryKB] = useState<number>(32);
  const [pageSizeKB, setPageSizeKB] = useState<number>(4);
  const [procASizeKB, setProcASizeKB] = useState<number>(9);
  const [procBSizeKB, setProcBSizeKB] = useState<number>(5);

  // Alamat Logis untuk Tab Translasi
  const [testLogicalAddress, setTestLogicalAddress] = useState<number>(5);
  const [testProcess, setTestProcess] = useState<"A" | "B">("A");

  // Langkah Simulasi (Step-by-step) untuk Tab Alokasi
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Proses Aktif
  const processes: ProcessInput[] = useMemo(() => [
    {
      id: "A",
      name: "Modul Navigasi",
      sizeKB: Math.max(1, procASizeKB),
      color: "cyan",
      badgeClass: "border-cyan-400 text-cyan-300 bg-cyan-950/60",
    },
    {
      id: "B",
      name: "Sistem Perisai",
      sizeKB: Math.max(1, procBSizeKB),
      color: "purple",
      badgeClass: "border-purple-400 text-purple-300 bg-purple-950/60",
    },
  ], [procASizeKB, procBSizeKB]);

  // Kalkulasi Pages & Frames
  const pages = useMemo(() => {
    return generatePagesForProcessesCustom(processes, pageSizeKB);
  }, [processes, pageSizeKB]);

  const initialFrames = useMemo(() => {
    return initializeFramesCustom(totalMemoryKB, pageSizeKB);
  }, [totalMemoryKB, pageSizeKB]);

  const mappingSteps = useMemo(() => {
    return buildMappingSteps(pages, initialFrames);
  }, [pages, initialFrames]);

  // Frame pada langkah aktif saat ini
  const activeFrames = useMemo(() => {
    if (currentStep === 0) return initialFrames;
    const target = mappingSteps[Math.min(currentStep - 1, mappingSteps.length - 1)];
    return target ? target.framesSnapshot : initialFrames;
  }, [currentStep, initialFrames, mappingSteps]);

  // Page Table aktif
  const pageTable = useMemo(() => {
    const table: Record<string, Record<number, number | null>> = { A: {}, B: {} };
    for (const p of pages) {
      if (!table[p.processId]) table[p.processId] = {};
      table[p.processId][p.pageIndex] = null;
    }
    for (const frame of activeFrames) {
      if (frame.mappedPage) {
        table[frame.mappedPage.processId][frame.mappedPage.pageIndex] = frame.frameIndex;
      }
    }
    return table;
  }, [pages, activeFrames]);

  // Translasi Alamat Aktif
  const selectedProc = processes.find((p) => p.id === testProcess) ?? processes[0];
  const translation = useMemo(() => {
    return translateAddress(
      testLogicalAddress,
      selectedProc.sizeKB,
      pageSizeKB,
      pageTable[selectedProc.id] ?? {}
    );
  }, [testLogicalAddress, selectedProc, pageSizeKB, pageTable]);

  // Metrik Perbandingan 3 Ukuran Page (2, 4, 8 KB)
  const metrics = useMemo(() => {
    return getPagingMetricsFor(processes, totalMemoryKB, [2, 4, 8]);
  }, [processes, totalMemoryKB]);

  // Total Fragmentasi Internal pada ukuran page aktif
  const totalInternalFrag = useMemo(() => {
    return pages.reduce((sum, p) => sum + p.internalFragKB, 0);
  }, [pages]);

  // Reset alur saat parameter berubah
  const handlePageSizeChange = (newSize: number) => {
    setPageSizeKB(newSize);
    setCurrentStep(0);
  };

  const handleResetToDefault = () => {
    setTotalMemoryKB(32);
    setPageSizeKB(4);
    setProcASizeKB(9);
    setProcBSizeKB(5);
    setTestLogicalAddress(5);
    setTestProcess("A");
    setCurrentStep(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-cyan-400/50 bg-[#0c081e]/98 text-[#e9e4ff] shadow-[0_0_60px_rgba(34,211,238,0.3)] overflow-hidden">
        
        {/* ─── HEADER PANEL ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between border-b border-cyan-500/30 bg-[#080516] px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🧪</span>
            <div>
              <h2 className="font-mono text-sm md:text-base font-bold text-cyan-300">
                LAB PAGING: SIMULATOR &amp; EKSPERIMEN MEMORI
              </h2>
              <p className="text-[11px] font-mono text-gray-400">
                Ubah angka ukuran proses &amp; ukuran page untuk melihat cara kerja sistem operasi secara langsung.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="rounded-lg border border-white/20 bg-white/5 px-2.5 py-1 text-xs font-mono text-gray-300 hover:bg-white/10 transition"
              title="Reset ke angka awal"
            >
              ↺ Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-1 text-xs font-mono font-bold text-rose-300 hover:bg-rose-900/50 transition"
            >
              ✕ Tutup
            </button>
          </div>
        </div>

        {/* ─── INPUT UTAMA YANG BISA DIUBAH (SELALU TERLIHAT) ─────── */}
        <div className="border-b border-white/10 bg-[#060412] px-5 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-xs font-mono">
            
            {/* Input Ukuran Program A */}
            <div className="flex items-center justify-between rounded-lg border border-cyan-500/40 bg-cyan-950/20 px-3 py-2">
              <span className="text-cyan-300 font-bold">Proses A:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={procASizeKB}
                  onChange={(e) => {
                    setProcASizeKB(parseInt(e.target.value, 10) || 1);
                    setCurrentStep(0);
                  }}
                  className="w-14 rounded border border-cyan-400/50 bg-black px-2 py-0.5 text-center font-bold text-white focus:outline-none"
                />
                <span className="text-gray-400">KB</span>
              </div>
            </div>

            {/* Input Ukuran Program B */}
            <div className="flex items-center justify-between rounded-lg border border-purple-500/40 bg-purple-950/20 px-3 py-2">
              <span className="text-purple-300 font-bold">Proses B:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={procBSizeKB}
                  onChange={(e) => {
                    setProcBSizeKB(parseInt(e.target.value, 10) || 1);
                    setCurrentStep(0);
                  }}
                  className="w-14 rounded border border-purple-400/50 bg-black px-2 py-0.5 text-center font-bold text-white focus:outline-none"
                />
                <span className="text-gray-400">KB</span>
              </div>
            </div>

            {/* Pilihan Ukuran Page (Ukuran Kotak) */}
            <div className="flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-950/20 px-3 py-1.5">
              <span className="text-amber-300 font-bold">Ukuran Page:</span>
              <div className="flex items-center gap-1">
                {[2, 4, 8].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handlePageSizeChange(size)}
                    className={`rounded px-2.5 py-1 font-bold transition text-xs ${
                      pageSizeKB === size
                        ? "bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                        : "bg-black/60 text-gray-400 hover:text-white"
                    }`}
                  >
                    {size} KB
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ─── NAVIGASI 3 TAB UTAMA (SATU KONSEP PER TAB) ──────────── */}
        <div className="flex border-b border-white/10 bg-[#090618] px-5 pt-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("alokasi")}
            className={`border-b-2 px-4 py-2 font-bold transition ${
              activeTab === "alokasi"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            1. 📦 Alokasi ke RAM ({pages.length} Page)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("translasi")}
            className={`border-b-2 px-4 py-2 font-bold transition ${
              activeTab === "translasi"
                ? "border-amber-400 text-amber-300 bg-amber-950/20"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            2. 🔍 Cari Alamat Fisik (MMU)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("komparasi")}
            className={`border-b-2 px-4 py-2 font-bold transition ${
              activeTab === "komparasi"
                ? "border-emerald-400 text-emerald-300 bg-emerald-950/20"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            3. ⚖️ Bandingkan Ukuran Page (2K vs 4K vs 8K)
          </button>
        </div>

        {/* ─── ISI TAB ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ═══════════════════════════════════════════════════════
              TAB 1: ALOKASI PAGE KE FRAME RAM (LANGKAH DEMI LANGKAH)
              ═══════════════════════════════════════════════════════ */}
          {activeTab === "alokasi" && (
            <div className="space-y-4">
              
              {/* Penjelasan Singkat */}
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs text-gray-300 flex items-start gap-2.5">
                <span className="text-cyan-300 text-base">💡</span>
                <p className="leading-relaxed">
                  Program dipotong menjadi bagian-bagian kecil berukuran sama bernama <strong className="text-cyan-300">Page</strong>. 
                  Memori RAM dibagi menjadi slot bernama <strong className="text-emerald-300">Frame</strong>. 
                  Setiap Page bisa ditaruh di sembarang Frame kosong.
                </p>
              </div>

              {/* Kontrol Langkah */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 font-mono text-xs">
                <div className="text-gray-300">
                  <span className="text-gray-400">Status Alokasi: </span>
                  <strong className="text-white">
                    {currentStep} / {mappingSteps.length} Page Terpasang
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                    disabled={currentStep === 0}
                    className="rounded-lg border border-white/20 bg-white/5 px-2.5 py-1 text-gray-300 hover:bg-white/10 disabled:opacity-30 transition"
                  >
                    ◀ Mundur 1 Langkah
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => Math.min(mappingSteps.length, prev + 1))}
                    disabled={currentStep >= mappingSteps.length}
                    className="rounded-lg border border-emerald-400/50 bg-emerald-950/40 px-3 py-1 font-bold text-emerald-300 hover:bg-emerald-900/50 disabled:opacity-30 transition shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                  >
                    Langkah Berikutnya ▶
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(mappingSteps.length)}
                    disabled={currentStep >= mappingSteps.length}
                    className="rounded-lg border border-cyan-400/40 bg-cyan-950/30 px-2.5 py-1 text-cyan-300 hover:bg-cyan-900/40 disabled:opacity-30 transition"
                  >
                    Isi Semua Otomatis
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(0)}
                    disabled={currentStep === 0}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-gray-400 hover:text-white disabled:opacity-30 transition"
                  >
                    Ulangi
                  </button>
                </div>
              </div>

              {/* Grid Frame RAM Fisik */}
              <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                  <span className="font-bold text-emerald-300">RAM FISIK ({totalMemoryKB} KB)</span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm bg-rose-500 inline-block" />
                      <span>Sistem OMNI (Terkunci)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm bg-cyan-400 inline-block" />
                      <span>Proses A</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm bg-purple-400 inline-block" />
                      <span>Proses B</span>
                    </span>
                  </div>
                </div>

                <div className={`grid gap-2 pt-1 ${
                  pageSizeKB === 2 ? "grid-cols-4 sm:grid-cols-8" : "grid-cols-2 sm:grid-cols-4"
                }`}>
                  {activeFrames.map((frame) => {
                    if (frame.isReserved) {
                      return (
                        <div
                          key={frame.frameIndex}
                          className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-2 text-center text-xs font-mono"
                        >
                          <div className="text-[9px] text-rose-300">Frame {frame.frameIndex}</div>
                          <div className="font-bold text-rose-400 my-1">SISTEM</div>
                          <div className="text-[9px] text-rose-300/60">Terkunci</div>
                        </div>
                      );
                    }

                    if (frame.mappedPage) {
                      const isCyan = frame.mappedPage.color === "cyan";
                      return (
                        <div
                          key={frame.frameIndex}
                          className={`rounded-lg border p-2 text-center text-xs font-mono animate-in fade-in ${
                            isCyan
                              ? "border-cyan-400 bg-cyan-950/40 text-cyan-200"
                              : "border-purple-400 bg-purple-950/40 text-purple-200"
                          }`}
                        >
                          <div className="text-[9px] text-gray-300">Frame {frame.frameIndex}</div>
                          <div className="font-bold text-white my-1">{frame.mappedPage.id}</div>
                          <div className="text-[9px] text-gray-300">{frame.mappedPage.usedKB} KB terisi</div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={frame.frameIndex}
                        className="rounded-lg border border-dashed border-gray-700 bg-black/30 p-2 text-center text-xs font-mono text-gray-600"
                      >
                        <div className="text-[9px]">Frame {frame.frameIndex}</div>
                        <div className="my-1 text-[10px] font-bold">[ Kosong ]</div>
                        <div className="text-[9px]">{pageSizeKB} KB</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Page Table Ringkas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {processes.map((proc) => {
                  const procPages = pages.filter((p) => p.processId === proc.id);
                  return (
                    <div key={proc.id} className="rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                        <span className="font-bold text-white">Page Table {proc.name} ({proc.id})</span>
                        <span className="text-[10px] text-gray-400">{procPages.length} Halaman</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {procPages.map((p) => {
                          const frameNum = pageTable[proc.id]?.[p.pageIndex];
                          return (
                            <div key={p.id} className="flex justify-between items-center bg-white/5 rounded px-2 py-1">
                              <span className="text-gray-300">Page {p.pageIndex}:</span>
                              {frameNum !== null && frameNum !== undefined ? (
                                <strong className="text-emerald-400">Frame {frameNum}</strong>
                              ) : (
                                <span className="text-gray-600">—</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info Fragmentasi Internal */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs font-mono flex items-center justify-between text-amber-200">
                <span>
                  Ruang Terbuang (Fragmentasi Internal): <strong className="text-white">{totalInternalFrag} KB</strong>
                </span>
                <span className="text-[11px] text-gray-400">
                  (Terjadi jika potongan terakhir program tidak memenuhi 1 slot Page penuh)
                </span>
              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 2: TRANSLASI ALAMAT MMU (CARA MENCARI ALAMAT FISIK)
              ═══════════════════════════════════════════════════════ */}
          {activeTab === "translasi" && (
            <div className="space-y-4">
              
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-gray-300 flex items-start gap-2.5">
                <span className="text-amber-300 text-base">🧭</span>
                <p className="leading-relaxed">
                  Program hanya mengetahui <strong className="text-amber-300">Alamat Logis</strong> (dari 0 KB sampai ukuran program). 
                  Komponen hardware <strong className="text-white">MMU</strong> bertugas mengubahnya menjadi <strong className="text-emerald-300">Alamat Fisik di RAM</strong> melalui 3 langkah mudah.
                </p>
              </div>

              {/* Input Uji Coba */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/50 p-3.5 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">Pilih Program:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTestProcess("A")}
                      className={`rounded px-2.5 py-1 font-bold ${
                        testProcess === "A"
                          ? "bg-cyan-500 text-black"
                          : "bg-white/5 text-gray-400"
                      }`}
                    >
                      Proses A ({procASizeKB} KB)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestProcess("B")}
                      className={`rounded px-2.5 py-1 font-bold ${
                        testProcess === "B"
                          ? "bg-purple-500 text-black"
                          : "bg-white/5 text-gray-400"
                      }`}
                    >
                      Proses B ({procBSizeKB} KB)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-300">Cari Alamat Logis:</span>
                  <input
                    type="number"
                    min={0}
                    max={selectedProc.sizeKB - 1}
                    value={testLogicalAddress}
                    onChange={(e) => setTestLogicalAddress(parseInt(e.target.value, 10) || 0)}
                    className="w-16 rounded border border-amber-400 bg-black px-2 py-1 text-center font-bold text-white focus:outline-none"
                  />
                  <span className="text-gray-400">KB</span>
                </div>
              </div>

              {/* 3 Langkah Translasi (Format Kartu Jelas) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                
                {/* Langkah 1 */}
                <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-4 space-y-1.5">
                  <div className="text-[10px] font-bold text-cyan-400 uppercase">
                    Langkah 1: Ada di Page Mana?
                  </div>
                  <div className="text-xl font-bold text-white">
                    Page = ⌊{testLogicalAddress} ÷ {pageSizeKB}⌋ = <span className="text-cyan-300">{translation.pageIndex}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Alamat logis ({testLogicalAddress} KB) dibagi ukuran page ({pageSizeKB} KB), dibulatkan ke bawah.
                  </p>
                </div>

                {/* Langkah 2 */}
                <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-4 space-y-1.5">
                  <div className="text-[10px] font-bold text-purple-400 uppercase">
                    Langkah 2: Sisa Jarak (Offset)?
                  </div>
                  <div className="text-xl font-bold text-white">
                    Offset = {testLogicalAddress} % {pageSizeKB} = <span className="text-purple-300">{translation.offsetKB} KB</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Sisa pembagian adalah jarak posisi data di dalam page tersebut.
                  </p>
                </div>

                {/* Langkah 3 */}
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-1.5">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase">
                    Langkah 3: Cek Page Table
                  </div>
                  <div className="text-xl font-bold text-white">
                    {translation.frameIndex !== null ? (
                      <>Ada di <span className="text-emerald-300">Frame {translation.frameIndex}</span></>
                    ) : (
                      <span className="text-amber-400">Belum di-load ke RAM</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    MMU membuka Page Table untuk melihat Page {translation.pageIndex} disimpan di mana.
                  </p>
                </div>

              </div>

              {/* Kesimpulan Hasil Akhir */}
              <div className={`rounded-xl border p-4 font-mono text-xs ${
                !translation.isValidAddress
                  ? "border-rose-500 bg-rose-950/40 text-rose-300"
                  : translation.physicalAddressKB !== null
                  ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-200"
                  : "border-amber-500/50 bg-amber-950/30 text-amber-200"
              }`}>
                {!translation.isValidAddress ? (
                  <div>
                    <strong className="block text-sm text-rose-400 mb-1">⚠️ SEGMENTATION FAULT (TRAP)!</strong>
                    Alamat {testLogicalAddress} KB berada di luar batas ukuran {selectedProc.name} ({selectedProc.sizeKB} KB).
                  </div>
                ) : translation.physicalAddressKB !== null ? (
                  <div>
                    <span className="text-[10px] uppercase text-emerald-400 font-bold block mb-1">
                      HASIL TRANSLASI ALAMAT FISIK DI RAM:
                    </span>
                    <div className="text-base text-white font-bold">
                      Physical Address = (Nomor Frame × Ukuran Page) + Offset
                    </div>
                    <div className="text-sm text-emerald-300 mt-1">
                      = ({translation.frameIndex} × {pageSizeKB} KB) + {translation.offsetKB} KB = <strong className="text-white text-lg">{translation.physicalAddressKB} KB</strong>
                    </div>
                  </div>
                ) : (
                  <div>
                    <strong className="block text-sm text-amber-300 mb-1">PAGE FAULT</strong>
                    Page {translation.pageIndex} belum ditaruh di frame RAM fisik. Buka Tab 1 dan klik &apos;Isi Semua Otomatis&apos;.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 3: PERBANDINGAN TRADE-OFF 3 UKURAN PAGE
              ═══════════════════════════════════════════════════════ */}
          {activeTab === "komparasi" && (
            <div className="space-y-4">
              
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-gray-300 flex items-start gap-2.5">
                <span className="text-emerald-300 text-base">⚖️</span>
                <p className="leading-relaxed">
                  Mengapa ukuran page ada yang 2 KB, 4 KB, dan 8 KB? Ini adalah kompromi (*trade-off*) antara <strong className="text-amber-300">ruang memori yang terbuang</strong> dan <strong className="text-cyan-300">panjang buku catatan (Page Table)</strong>.
                </p>
              </div>

              {/* 3 Kartu Komparasi Mudah */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                
                {/* 2 KB */}
                <div className={`rounded-xl border p-4 space-y-2 ${
                  pageSizeKB === 2 ? "border-cyan-400 bg-cyan-950/30 ring-1 ring-cyan-400" : "border-white/10 bg-black/40"
                }`}>
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-white">Mode 2 KB</strong>
                    <span className="text-[10px] text-gray-400">Page Kecil</span>
                  </div>
                  <div className="space-y-1 text-[11px] pt-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ruang Terbuang:</span>
                      <strong className="text-emerald-400">{metrics[0]?.totalInternalFragKB} KB (Sedikit)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Entri Page Table:</span>
                      <strong className="text-rose-400">{metrics[0]?.totalPages} Baris (Banyak)</strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 pt-1 border-t border-white/5">
                    Hemat memori, tapi sistem operasi harus menyimpan tabel yang sangat panjang.
                  </p>
                </div>

                {/* 4 KB */}
                <div className={`rounded-xl border p-4 space-y-2 ${
                  pageSizeKB === 4 ? "border-amber-400 bg-amber-950/30 ring-2 ring-amber-400" : "border-amber-500/40 bg-black/40"
                }`}>
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-amber-300">Mode 4 KB</strong>
                    <span className="rounded bg-amber-400/20 border border-amber-400/40 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                      Standar Modern
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] pt-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ruang Terbuang:</span>
                      <strong className="text-amber-300">{metrics[1]?.totalInternalFragKB} KB (Sedang)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Entri Page Table:</span>
                      <strong className="text-amber-300">{metrics[1]?.totalPages} Baris (Seimbang)</strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-200/80 pt-1 border-t border-amber-500/20">
                    Titik temu paling ideal (*sweet spot*) antara efisiensi memori dan ukuran tabel.
                  </p>
                </div>

                {/* 8 KB */}
                <div className={`rounded-xl border p-4 space-y-2 ${
                  pageSizeKB === 8 ? "border-purple-400 bg-purple-950/30 ring-1 ring-purple-400" : "border-white/10 bg-black/40"
                }`}>
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-white">Mode 8 KB</strong>
                    <span className="text-[10px] text-gray-400">Page Besar</span>
                  </div>
                  <div className="space-y-1 text-[11px] pt-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ruang Terbuang:</span>
                      <strong className="text-rose-400">{metrics[2]?.totalInternalFragKB} KB (Banyak)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Entri Page Table:</span>
                      <strong className="text-emerald-400">{metrics[2]?.totalPages} Baris (Ringkas)</strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 pt-1 border-t border-white/5">
                    Tabel sangat ringkas, namun banyak memori terbuang jika program berukuran ganjil.
                  </p>
                </div>

              </div>

              {/* Tabel Ringkas Angka Nyata */}
              <div className="rounded-xl border border-white/10 bg-black/50 p-4">
                <h4 className="text-xs font-mono font-bold text-gray-300 mb-2">
                  TABEL DATA PERBANDINGAN:
                </h4>
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase">
                      <th className="pb-1.5">Ukuran Page</th>
                      <th className="pb-1.5">Total Baris Tabel</th>
                      <th className="pb-1.5">Ruang Terbuang (Frag)</th>
                      <th className="pb-1.5">Efisiensi</th>
                      <th className="pb-1.5">Kapasitas RAM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {metrics.map((m) => (
                      <tr key={m.pageSizeKB}>
                        <td className="py-2 font-bold text-white">Page {m.pageSizeKB} KB</td>
                        <td className="py-2 text-gray-300">{m.totalPages} Baris</td>
                        <td className="py-2 font-bold text-amber-300">{m.totalInternalFragKB} KB</td>
                        <td className="py-2 text-emerald-400">{m.efficiencyPercentage}%</td>
                        <td className="py-2">
                          {m.isOutOfMemory ? (
                            <span className="text-rose-400 font-bold">⚠️ Tidak Muat</span>
                          ) : (
                            <span className="text-emerald-400">✓ Cukup</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* ─── FOOTER MODAL ─────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-cyan-500/30 bg-[#080516] px-5 py-2.5 text-xs font-mono">
          <span className="text-gray-400 text-[11px]">
            Input aktif: Proses A = {procASizeKB} KB, Proses B = {procBSizeKB} KB | Page = {pageSizeKB} KB
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-cyan-400/50 bg-cyan-950/60 px-5 py-1.5 font-bold text-cyan-300 hover:bg-cyan-900/60 transition shadow-[0_0_12px_rgba(34,211,238,0.3)]"
          >
            Tutup Lab ➔
          </button>
        </div>

      </div>
    </div>
  );
}
