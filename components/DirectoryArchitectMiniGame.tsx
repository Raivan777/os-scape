"use client";

import React, { useState } from "react";
import LaserHeadMiniGame from "./LaserHeadMiniGame";

interface DirectoryArchitectMiniGameProps {
  onComplete?: () => void;
  onOpenMaterial?: () => void;
  onOpenQuiz?: () => void;
}

interface FileItem {
  id: string;
  name: string;
  type: "system" | "config" | "user" | "log";
  targetDir: string;
  assignedDir?: string;
  desc: string;
}

export default function DirectoryArchitectMiniGame({
  onComplete,
  onOpenMaterial,
  onOpenQuiz,
}: DirectoryArchitectMiniGameProps) {
  // Tab pilihan sub-modul: "directory" (Arsitektur Direktori) atau "disk" (Laser Head Disk Scheduling)
  const [activeTab, setActiveTab] = useState<"directory" | "disk">("directory");

  // Level Arsitektur: 1 = Single-Level, 2 = Two-Level (MFD/UFD), 3 = Hierarchical Tree
  const [currentLevel, setCurrentLevel] = useState<number>(1);

  // Status Level 1 (Single-Level Directory Collision)
  const [singleFiles, setSingleFiles] = useState<{ name: string; owner: string }[]>([
    { name: "telemetry.dat", owner: "User_Alpha" },
    { name: "nav_system.sys", owner: "System" },
  ]);
  const [singleCollisionDetected, setSingleCollisionDetected] = useState(false);
  const [singleSolved, setSingleSolved] = useState(false);

  // Status Level 2 (Two-Level Directory Routing MFD -> UFD)
  const [mfdQueue, setMfdQueue] = useState<
    { id: string; name: string; targetUfd: "UFD_ALPHA" | "UFD_BETA" }[]
  >([
    { id: "1", name: "flight_log.txt", targetUfd: "UFD_ALPHA" },
    { id: "2", name: "flight_log.txt", targetUfd: "UFD_BETA" }, // Nama sama tapi beda user!
    { id: "3", name: "keys.pem", targetUfd: "UFD_ALPHA" },
    { id: "4", name: "sensor_data.bin", targetUfd: "UFD_BETA" },
  ]);
  const [ufdAlpha, setUfdAlpha] = useState<string[]>([]);
  const [ufdBeta, setUfdBeta] = useState<string[]>([]);
  const [level2Success, setLevel2Success] = useState(false);

  // Status Level 3 (Hierarchical Tree Organization)
  const initialTreeFiles: FileItem[] = [
    {
      id: "f1",
      name: "warp_drive.bin",
      type: "system",
      targetDir: "/bin",
      desc: "Eksekutabel sistem penggerak warp",
    },
    {
      id: "f2",
      name: "life_support.cfg",
      type: "config",
      targetDir: "/etc",
      desc: "Konfigurasi subsistem oksigen",
    },
    {
      id: "f3",
      name: "pilot_diary.txt",
      type: "user",
      targetDir: "/home/pilot",
      desc: "Dokumen catatan pribadi astronot",
    },
    {
      id: "f4",
      name: "core_dump.log",
      type: "log",
      targetDir: "/var/log",
      desc: "Laporan crash reaktor kapal",
    },
  ];

  const [unplacedFiles, setUnplacedFiles] = useState<FileItem[]>(initialTreeFiles);
  const [placedFiles, setPlacedFiles] = useState<Record<string, FileItem[]>>({
    "/bin": [],
    "/etc": [],
    "/home/pilot": [],
    "/var/log": [],
  });
  const [level3Success, setLevel3Success] = useState(false);
  const [statusMsg, setStatusMsg] = useState(
    "Selamat datang di Terminal Directory Architect. Mulai sorting file ke direktori yang tepat!"
  );

  // Handler Level 1: Percobaan menambah file nama sama ke Single-Level Directory
  const handleAddDuplicateSingle = () => {
    setSingleCollisionDetected(true);
    setStatusMsg(
      "⚠️ ERROR 409 NAME COLLISION! Single-Level Directory menolak file dengan nama 'telemetry.dat' yang sudah ada!"
    );
  };

  const handleResolveSingle = (action: "rename" | "upgrade") => {
    if (action === "rename") {
      setSingleFiles((prev) => [...prev, { name: "telemetry_userB.dat", owner: "User_Beta" }]);
      setSingleSolved(true);
      setSingleCollisionDetected(false);
      setStatusMsg(
        "✅ Tabrakan nama diatasi dengan mengubah nama file menjadi 'telemetry_userB.dat'. Namun, ini tidak praktis untuk sistem besar!"
      );
    } else {
      setCurrentLevel(2);
      setStatusMsg(
        "🚀 Beralih ke Two-Level Directory! MFD sekarang mengisolasi UFD tiap user sehingga nama file sama dapat berdampingan."
      );
    }
  };

  // Handler Level 2: Routing file MFD ke UFD
  const handleRouteToUfd = (fileId: string, destination: "UFD_ALPHA" | "UFD_BETA") => {
    const file = mfdQueue.find((f) => f.id === fileId);
    if (!file) return;

    if (file.targetUfd === destination) {
      if (destination === "UFD_ALPHA") {
        setUfdAlpha((prev) => [...prev, file.name]);
      } else {
        setUfdBeta((prev) => [...prev, file.name]);
      }

      const nextQueue = mfdQueue.filter((f) => f.id !== fileId);
      setMfdQueue(nextQueue);
      setStatusMsg(`✨ File '${file.name}' sukses dialokasikan ke ${destination}.`);

      if (nextQueue.length === 0) {
        setLevel2Success(true);
        setStatusMsg(
          "🎉 SEMPURNA! Kedua user memiliki file 'flight_log.txt' yang terisolasi aman di UFD masing-masing!"
        );
      }
    } else {
      setStatusMsg(
        `❌ SALAH ROUTING! File ini milik ${file.targetUfd}, bukan ${destination}!`
      );
    }
  };

  // Handler Level 3: Menempatkan file ke direktori hierarki pohon
  const handlePlaceTreeFile = (file: FileItem, targetPath: string) => {
    if (file.targetDir === targetPath) {
      setPlacedFiles((prev) => ({
        ...prev,
        [targetPath]: [...prev[targetPath], file],
      }));

      const rem = unplacedFiles.filter((f) => f.id !== file.id);
      setUnplacedFiles(rem);
      setStatusMsg(`✅ File '${file.name}' ditempatkan di path absolut '${targetPath}/${file.name}'.`);

      if (rem.length === 0) {
        setLevel3Success(true);
        setStatusMsg("🏆 ARSITEKTUR DIREKTORI POHON SELESAI DENGAN INTEGRITAS 100%!");
        if (onComplete) onComplete();
      }
    } else {
      setStatusMsg(
        `❌ Path tidak tepat. File '${file.name}' (${file.desc}) harus ditempatkan di '${file.targetDir}'.`
      );
    }
  };

  return (
    <div className="relative w-full rounded-2xl border border-cyan-500/50 bg-[#09061c]/95 p-4 md:p-6 text-white shadow-[0_0_60px_rgba(6,182,212,0.3)] select-none backdrop-blur-md">
      {/* 1. Header Terminal Console */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400 bg-cyan-950/70 shadow-[0_0_20px_rgba(34,211,238,0.5)]">
            <span className="text-2xl animate-pulse">📁</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold tracking-wider text-cyan-300 font-mono">
                OMNI TERMINAL // DIRECTORY ARCHITECT
              </h2>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                SYSTEM CORE 5
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Zero-G File System Organizing & Storage Head Calibrator
            </p>
          </div>
        </div>

        {/* Tab Switcher: Directory Architect vs Disk Head Scheduler */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-black/50 p-1 border border-white/10 text-xs font-bold font-mono">
            <button
              type="button"
              onClick={() => setActiveTab("directory")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "directory"
                  ? "bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              📂 Directory Architect
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("disk")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "disk"
                  ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              💽 Disk Head Calibrator
            </button>
          </div>

          {onOpenQuiz && (
            <button
              type="button"
              onClick={onOpenQuiz}
              className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
            >
              🛡️ Kuis Firewall 5
            </button>
          )}
        </div>
      </div>

      {/* Konten Tab 1: Directory Architect */}
      {activeTab === "directory" ? (
        <div className="mt-4 space-y-4">
          {/* Status Bar */}
          <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-black/50 px-4 py-2.5 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-200">{statusMsg}</span>
            </div>
            {/* Level Stepper Indicator */}
            <div className="flex gap-1.5">
              {[1, 2, 3].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setCurrentLevel(lvl)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    currentLevel === lvl
                      ? "bg-cyan-400 text-black shadow-[0_0_8px_#22d3ee]"
                      : "bg-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  Lvl {lvl}: {lvl === 1 ? "Single" : lvl === 2 ? "Two-Level" : "Tree"}
                </button>
              ))}
            </div>
          </div>

          {/* ================= LEVEL 1: SINGLE-LEVEL DIRECTORY ================= */}
          {currentLevel === 1 && (
            <div className="rounded-xl border border-cyan-500/30 bg-black/40 p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <div>
                  <h3 className="font-mono text-sm font-bold text-cyan-300">
                    TANTANGAN 1: SINGLE-LEVEL DIRECTORY & NAME COLLISION
                  </h3>
                  <p className="text-xs text-gray-400">
                    Semua file berada dalam 1 direktori datar (<code className="text-cyan-200">ROOT</code>). Amati apa yang terjadi jika dua pengguna ingin menyimpan file dengan nama sama!
                  </p>
                </div>
                {singleSolved && (
                  <button
                    type="button"
                    onClick={() => setCurrentLevel(2)}
                    className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-black shadow-[0_0_12px_#22d3ee] animate-bounce"
                  >
                    Lanjut ke Level 2 (Two-Level) ➔
                  </button>
                )}
              </div>

              {/* Tampilan Visual Folder Tunggal */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between rounded-xl bg-[#0d0926] p-4 border border-cyan-500/20">
                <div className="flex-1 w-full">
                  <span className="text-xs font-mono text-gray-400 block mb-2">
                    ISI DIREKTORI TUNGGAL (ROOT_DIR):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {singleFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg bg-cyan-950/60 border border-cyan-400/40 px-3 py-1.5 text-xs font-mono text-cyan-200"
                      >
                        <span>📄</span>
                        <span className="font-bold">{f.name}</span>
                        <span className="text-[10px] text-gray-400">({f.owner})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tombol Aksi Simulasi */}
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  {!singleCollisionDetected && !singleSolved ? (
                    <button
                      type="button"
                      onClick={handleAddDuplicateSingle}
                      className="rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:scale-105"
                    >
                      ➕ User_Beta: Simpan &quot;telemetry.dat&quot;
                    </button>
                  ) : singleCollisionDetected ? (
                    <div className="space-y-2 animate-in fade-in">
                      <span className="text-xs text-rose-300 font-mono font-bold block">
                        Solusi Penanganan Tabrakan Nama:
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleResolveSingle("rename")}
                          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-amber-400"
                        >
                          Paksa Ganti Nama File
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveSingle("upgrade")}
                          className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-cyan-400"
                        >
                          Upgrade ke Two-Level DIR ➔
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-400 font-mono">
                      ✅ Tantangan 1 Terselesaikan.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= LEVEL 2: TWO-LEVEL DIRECTORY ================= */}
          {currentLevel === 2 && (
            <div className="rounded-xl border border-cyan-500/30 bg-black/40 p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <div>
                  <h3 className="font-mono text-sm font-bold text-cyan-300">
                    TANTANGAN 2: TWO-LEVEL DIRECTORY ROUTER (MFD & UFD)
                  </h3>
                  <p className="text-xs text-gray-400">
                    Master File Directory mendistribusikan file ke direktori tiap user. Klik file antrean untuk memasukkannya ke UFD yang berhak!
                  </p>
                </div>
                {level2Success && (
                  <button
                    type="button"
                    onClick={() => setCurrentLevel(3)}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-black shadow-[0_0_12px_#34d399] animate-bounce"
                  >
                    Lanjut ke Level 3 (Hierarchical Tree) ➔
                  </button>
                )}
              </div>

              {/* Antrean MFD File Router */}
              <div className="rounded-xl bg-[#0b102b] p-3 border border-cyan-500/30">
                <span className="text-xs font-mono text-cyan-300 font-bold block mb-2">
                  ANTREAN FILE PADA MFD (KLIK UNTUK ROUTING):
                </span>
                <div className="flex flex-wrap gap-2">
                  {mfdQueue.length > 0 ? (
                    mfdQueue.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 rounded-lg bg-black/60 border border-white/20 p-2 text-xs font-mono"
                      >
                        <span>📄 {item.name}</span>
                        <span className="text-[10px] text-gray-400">({item.targetUfd})</span>
                        <div className="flex gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => handleRouteToUfd(item.id, "UFD_ALPHA")}
                            className="rounded bg-cyan-600 px-2 py-0.5 text-[9px] font-bold text-white hover:bg-cyan-500"
                          >
                            Ke Alpha
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRouteToUfd(item.id, "UFD_BETA")}
                            className="rounded bg-purple-600 px-2 py-0.5 text-[9px] font-bold text-white hover:bg-purple-500"
                          >
                            Ke Beta
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-400 font-mono">
                      🎉 Semua file telah teralokasi ke UFD masing-masing!
                    </span>
                  )}
                </div>
              </div>

              {/* 2 Kotak UFD (User Alpha & User Beta) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* UFD Alpha */}
                <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/20 p-4">
                  <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2 mb-2">
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      📂 UFD: USER_ALPHA (/UserAlpha/)
                    </span>
                    <span className="text-[10px] text-gray-400">{ufdAlpha.length} File</span>
                  </div>
                  <div className="space-y-1.5 min-h-[60px]">
                    {ufdAlpha.map((name, idx) => (
                      <div
                        key={idx}
                        className="rounded bg-black/40 px-2 py-1 text-xs font-mono text-cyan-200 border border-cyan-500/20"
                      >
                        📄 {name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* UFD Beta */}
                <div className="rounded-xl border border-purple-500/40 bg-purple-950/20 p-4">
                  <div className="flex items-center justify-between border-b border-purple-500/30 pb-2 mb-2">
                    <span className="font-mono text-xs font-bold text-purple-300">
                      📂 UFD: USER_BETA (/UserBeta/)
                    </span>
                    <span className="text-[10px] text-gray-400">{ufdBeta.length} File</span>
                  </div>
                  <div className="space-y-1.5 min-h-[60px]">
                    {ufdBeta.map((name, idx) => (
                      <div
                        key={idx}
                        className="rounded bg-black/40 px-2 py-1 text-xs font-mono text-purple-200 border border-purple-500/20"
                      >
                        📄 {name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= LEVEL 3: TREE-STRUCTURED DIRECTORY ================= */}
          {currentLevel === 3 && (
            <div className="rounded-xl border border-purple-500/40 bg-black/40 p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <div>
                  <h3 className="font-mono text-sm font-bold text-purple-300">
                    TANTANGAN 3: ARSITEK DIREKTORI POHON HIERARKIS (TREE-STRUCTURED)
                  </h3>
                  <p className="text-xs text-gray-400">
                    Letakkan file sistem ke subdirektori hierarkis yang sesuai berdasarkan fungsinya.
                  </p>
                </div>
                {level3Success && (
                  <span className="rounded bg-emerald-500/20 px-3 py-1 text-xs font-mono font-bold text-emerald-300 border border-emerald-400">
                    🏆 SISTEM STASIUN TERALOKASI PENUH
                  </span>
                )}
              </div>

              {/* File yang Belum Ditempatkan */}
              <div className="rounded-xl bg-[#140b2e] p-3 border border-purple-500/30">
                <span className="text-xs font-mono text-purple-200 font-bold block mb-2">
                  DOKUMEN DIGITAL MELAYANG (PILIH DIREKTORI TUJUAN):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {unplacedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex flex-col gap-1.5 rounded-lg bg-black/50 border border-purple-500/30 p-2.5 text-xs font-mono"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-cyan-300">📄 {file.name}</span>
                        <span className="text-[10px] text-gray-400">{file.desc}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {["/bin", "/etc", "/home/pilot", "/var/log"].map((path) => (
                          <button
                            key={path}
                            type="button"
                            onClick={() => handlePlaceTreeFile(file, path)}
                            className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-gray-300 hover:bg-cyan-500 hover:text-black transition"
                          >
                            Pindah ke {path}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {unplacedFiles.length === 0 && (
                    <div className="col-span-2 text-center py-2 text-xs text-emerald-400 font-mono">
                      ✨ Semua berkas telah berada pada jalur hierarki absolut yang benar!
                    </div>
                  )}
                </div>
              </div>

              {/* Tampilan Visual Tree Hierarchy */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                {Object.entries(placedFiles).map(([path, files]) => (
                  <div
                    key={path}
                    className="rounded-xl border border-white/10 bg-black/60 p-3 min-h-[90px]"
                  >
                    <span className="font-bold text-purple-300 block mb-1">📁 {path}</span>
                    <div className="space-y-1">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="rounded bg-purple-950/40 px-1.5 py-0.5 text-[11px] text-cyan-200 border border-purple-500/20"
                        >
                          └ {f.name}
                        </div>
                      ))}
                      {files.length === 0 && (
                        <span className="text-[10px] text-gray-600 italic">(kosong)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Konten Tab 2: Laser Head Disk Scheduling */
        <div className="mt-4">
          <LaserHeadMiniGame
            onCalibrationComplete={onComplete}
            onOpenMaterial={onOpenMaterial}
            onOpenQuiz={onOpenQuiz}
          />
        </div>
      )}
    </div>
  );
}

