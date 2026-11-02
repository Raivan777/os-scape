"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DirectoryArchitectMiniGame from "@/components/DirectoryArchitectMiniGame";
import DiskMaterialModal from "@/components/DiskMaterialModal";

// ─── TIPE DATA ENTITAS LEVEL ─────────────────────────────────────
export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  isWall?: boolean;
}

export interface Stair {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}

export interface Laser {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export interface LevelObjects {
  material: { x: number; y: number; w: number; h: number; label: string };
  laserTerminal: { x: number; y: number; w: number; h: number; label: string };
  architect: { x: number; y: number; w: number; h: number; label: string };
  keyItem: { x: number; y: number; w: number; h: number; label: string };
  portal: { x: number; y: number; w: number; h: number; label: string };
  spawn: { x: number; y: number; w: number; h: number; label: string };
}

// ─── KONFIGURASI BAWAAN (DEFAULT LEVEL CONFIG) ───────────────────
const DEFAULT_PLATFORMS: Platform[] = [
  { x: 0, y: 536, w: 1024, h: 40, label: "GROUND FLOOR" },
  { x: 975, y: 12, w: 49, h: 525, label: "CRATE TALL", isWall: true },
  { x: 244, y: 414, w: 478, h: 26, label: "MID CATWALK" },
  { x: 0, y: 364, w: 216, h: 20, label: "MEZZANINE L" },
  { x: 461, y: 295, w: 101, h: 20, label: "CENTER RAISED" },
  { x: 250, y: 314, w: 51, h: 27, label: "FLOAT LEDGE L" },
  { x: 706, y: 317, w: 273, h: 28, label: "FLOAT LEDGE R" },
  { x: 327, y: 258, w: 94, h: 16, label: "HANGING POD L" },
  { x: 594, y: 257, w: 98, h: 19, label: "HANGING POD R" },
  { x: 142, y: 104, w: 430, h: 19, label: "TOP CATWALK L" },
  { x: 559, y: 104, w: 171, h: 20, label: "TOP CATWALK R" },
  { x: 712, y: 141, w: 169, h: 20, label: "EXIT DECK" },
  { x: 0, y: 20, w: 37, h: 343, label: "PLATFORM 13", isWall: true },
  { x: 35, y: 261, w: 114, h: 26, label: "PLATFORM 14" },
  { x: 117, y: 154, w: 16, h: 106, label: "PLATFORM 15", isWall: true },
  { x: 36, y: 151, w: 16, h: 109, label: "PLATFORM 18", isWall: true },
  { x: 902, y: 134, w: 94, h: 24, label: "PLATFORM 19" },
  { x: 717, y: 130, w: 35, h: 20, label: "PLATFORM 20" },
  { x: 711, y: 118, w: 30, h: 16, label: "PLATFORM 21" },
  { x: 130, y: 136, w: 16, h: 123, label: "PLATFORM 22", isWall: true },
  { x: 152, y: 122, w: 16, h: 140, label: "PLATFORM 23", isWall: true },
];

const DEFAULT_STAIRS: Stair[] = [
  { x1: 885, y1: 606, x2: 720, y2: 417, label: "Tangga Kanan Bawah" },
  { x1: 769, y1: 309, x2: 895, y2: 146, label: "Tangga Tengah" },
  { x1: 221, y1: 365, x2: 265, y2: 414, label: "Tangga Mezanin Kiri" },
];

const DEFAULT_LASERS: Laser[] = [
  { x: 290, y: 326, w: 433, h: 6, label: "Laser Jembatan Bawah" },
  { x: 37, y: 105, w: 118, h: 6, label: "Laser Merah 2" },
];

const DEFAULT_OBJECTS: LevelObjects = {
  material: { x: 46, y: 290, w: 75, h: 60, label: "Komputer Materi" },
  laserTerminal: { x: 580, y: 33, w: 65, h: 60, label: "Komputer Bypass Laser 2" },
  architect: { x: 769, y: 62, w: 75, h: 60, label: "Terminal Architect" },
  keyItem: { x: 73, y: 218, w: 32, h: 32, label: "Kunci Ruang 15-16" },
  portal: { x: 920, y: 46, w: 70, h: 75, label: "Portal Stage 6" },
  spawn: { x: 65, y: 472, w: 44, h: 64, label: "Titik Spawn Karakter" },
};

// ─── KOMPONEN VISUAL LASER LISTRIK BERTEGANGAN TINGGI ───────────
function ElectricLaser({
  laser,
  isDeactivated,
}: {
  laser: Laser;
  isDeactivated?: boolean;
}) {
  const isHorizontal = laser.w >= laser.h;
  const length = isHorizontal ? laser.w : laser.h;
  const thickness = isHorizontal ? laser.h : laser.w;
  const mid = thickness / 2;

  if (isDeactivated) {
    return (
      <div
        className="absolute z-25 pointer-events-none select-none transition-opacity duration-500"
        style={{
          left: `${laser.x}px`,
          top: `${laser.y}px`,
          width: `${laser.w}px`,
          height: `${laser.h}px`,
        }}
      >
        {/* Terminal elektroda yang mati saat laser 2 dinonaktifkan */}
        {isHorizontal ? (
          <>
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-4 bg-zinc-800 border border-zinc-600 rounded-sm opacity-60 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-slate-500" />
            </div>
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-4 bg-zinc-800 border border-zinc-600 rounded-sm opacity-60 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-slate-500" />
            </div>
          </>
        ) : (
          <>
            <div className="absolute left-1/2 -top-1.5 -translate-x-1/2 w-4 h-3 bg-zinc-800 border border-zinc-600 rounded-sm opacity-60 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-slate-500" />
            </div>
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-4 h-3 bg-zinc-800 border border-zinc-600 rounded-sm opacity-60 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-slate-500" />
            </div>
          </>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <span className="text-[7px] font-mono text-cyan-300 font-bold tracking-widest whitespace-nowrap bg-black/80 px-1 py-0.5 rounded border border-cyan-700/50">
            [OFFLINE]
          </span>
        </div>
      </div>
    );
  }

  // Koordinat sambaran petir / busur listrik jagged
  const pathA = isHorizontal
    ? `M 0,${mid} L ${0.08 * length},${mid - 3.5} L ${0.2 * length},${mid + 4} L ${0.32 * length},${mid - 5} L ${0.45 * length},${mid + 5.5} L ${0.58 * length},${mid - 4.5} L ${0.72 * length},${mid + 5} L ${0.85 * length},${mid - 3.5} L ${0.93 * length},${mid + 2} L ${length},${mid}`
    : `M ${mid},0 L ${mid - 3.5},${0.08 * length} L ${mid + 4},${0.2 * length} L ${mid - 5},${0.32 * length} L ${mid + 5.5},${0.45 * length} L ${mid - 4.5},${0.58 * length} L ${mid + 5},${0.72 * length} L ${mid - 3.5},${0.85 * length} L ${mid + 2},${0.93 * length} L ${mid},${length}`;

  const pathB = isHorizontal
    ? `M 0,${mid} L ${0.12 * length},${mid + 5} L ${0.26 * length},${mid - 5} L ${0.39 * length},${mid + 4.5} L ${0.52 * length},${mid - 4} L ${0.66 * length},${mid + 6} L ${0.8 * length},${mid - 5} L ${length},${mid}`
    : `M ${mid},0 L ${mid + 5},${0.12 * length} L ${mid - 5},${0.26 * length} L ${mid + 4.5},${0.39 * length} L ${mid - 4},${0.52 * length} L ${mid + 6},${0.66 * length} L ${mid - 5},${0.8 * length} L ${mid},${length}`;

  const pathC = isHorizontal
    ? `M 0,${mid} L ${0.18 * length},${mid - 3} L ${0.35 * length},${mid + 4} L ${0.55 * length},${mid - 3} L ${0.75 * length},${mid + 3} L ${length},${mid}`
    : `M ${mid},0 L ${mid - 3},${0.18 * length} L ${mid + 4},${0.35 * length} L ${mid - 3},${0.55 * length} L ${mid + 3},${0.75 * length} L ${mid},${length}`;

  const branch1 = isHorizontal
    ? `M ${0.32 * length},${mid - 5} Q ${0.35 * length},${mid - 11} ${0.38 * length},${mid - 8}`
    : `M ${mid - 5},${0.32 * length} Q ${mid - 11},${0.35 * length} ${mid - 8},${0.38 * length}`;

  const branch2 = isHorizontal
    ? `M ${0.66 * length},${mid + 6} Q ${0.7 * length},${mid + 12} ${0.74 * length},${mid + 8}`
    : `M ${mid + 6},${0.66 * length} Q ${mid + 12},${0.7 * length} ${mid + 8},${0.74 * length}`;

  return (
    <div
      className="absolute z-25 pointer-events-none select-none electric-hazard-container"
      style={{
        left: `${laser.x}px`,
        top: `${laser.y}px`,
        width: `${laser.w}px`,
        height: `${laser.h}px`,
      }}
    >
      {/* 1. Kanal Plasma Radiasi Merah */}
      <div
        className={`absolute inset-0 bg-red-600/35 blur-[3px] animate-pulse ${
          isHorizontal ? "scale-y-125" : "scale-x-125"
        }`}
      />

      {/* 2. Gelombang Arus Listrik & Busur Petir (SVG) */}
      <svg
        className="absolute inset-0 overflow-visible w-full h-full"
        style={{ filter: "drop-shadow(0 0 6px #ef4444) drop-shadow(0 0 12px #dc2626)" }}
      >
        {/* Lapisan Luar: Cahaya Plasma Merah Pekat */}
        <path
          d={pathA}
          fill="none"
          stroke="#ef4444"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="electric-arc-glow"
        />

        {/* Lapisan Tengah: Busur Petir Merah Menyala */}
        <path
          d={pathB}
          fill="none"
          stroke="#ff0055"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="electric-arc-fast"
        />

        {/* Lapisan Inti Listrik: Sambaran Putih Murni Bertegangan Tinggi */}
        <path
          d={pathA}
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="electric-arc-core"
        />

        {/* Lapisan Percikan Cepat Emas / Neon */}
        <path
          d={pathC}
          fill="none"
          stroke="#fef08a"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="electric-arc-sub"
        />

        {/* Percikan Listrik Mencabang */}
        <path
          d={branch1}
          fill="none"
          stroke="#fca5a5"
          strokeWidth="1.3"
          className="electric-spark-branch"
        />
        <path
          d={branch2}
          fill="none"
          stroke="#fca5a5"
          strokeWidth="1.3"
          className="electric-spark-branch-alt"
        />
      </svg>

      {/* 3. Terminal Elektroda Emisi Listrik di Ujung-Ujungnya */}
      {isHorizontal ? (
        <>
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-2.5 h-4 bg-zinc-950 border border-red-500 rounded-sm flex items-center justify-center shadow-[0_0_8px_#ef4444]">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
          </div>
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-2.5 h-4 bg-zinc-950 border border-red-500 rounded-sm flex items-center justify-center shadow-[0_0_8px_#ef4444]">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
          </div>
        </>
      ) : (
        <>
          <div className="absolute left-1/2 -top-2 -translate-x-1/2 w-4 h-2.5 bg-zinc-950 border border-red-500 rounded-sm flex items-center justify-center shadow-[0_0_8px_#ef4444]">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
          </div>
          <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-2.5 bg-zinc-950 border border-red-500 rounded-sm flex items-center justify-center shadow-[0_0_8px_#ef4444]">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
          </div>
        </>
      )}

      {/* 4. Butiran Percikan Listrik Meletup (Spark Particles) */}
      <div
        className="absolute w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_6px_#ffffff] electric-spark-dot-1"
        style={{
          left: isHorizontal ? `${0.25 * length}px` : `${mid}px`,
          top: isHorizontal ? `${mid}px` : `${0.25 * length}px`,
        }}
      />
      <div
        className="absolute w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-200 shadow-[0_0_6px_#facc15] electric-spark-dot-2"
        style={{
          left: isHorizontal ? `${0.7 * length}px` : `${mid}px`,
          top: isHorizontal ? `${mid}px` : `${0.7 * length}px`,
        }}
      />
    </div>
  );
}

export default function Stage5Page() {
  const router = useRouter();

  // ─── KONSTANTA KANVAS ─────────────────────────────────────────
  const GAME_WIDTH = 1024;
  const GAME_HEIGHT = 576;
  const GROUND_Y = 536;

  // ─── DIMENSI & FISIKA KARAKTER (PERSIS SEPERTI STAGE 3) ────────
  const PLAYER_W = 44;
  const PLAYER_H = 64;
  const MOVE_SPEED = 4.2;
  const JUMP_POWER = -12.5;
  const GRAVITY = 0.58;

  // ─── STATE ENTITAS LEVEL (DARI STORAGE/DEFAULT) ────────────────
  const [platforms, setPlatforms] = useState<Platform[]>(DEFAULT_PLATFORMS);
  const [stairsList, setStairsList] = useState<Stair[]>(DEFAULT_STAIRS);
  const [lasers, setLasers] = useState<Laser[]>(DEFAULT_LASERS);
  const [levelObjects, setLevelObjects] = useState<LevelObjects>(DEFAULT_OBJECTS);

  // ─── STATE ALUR QUEST & PROGRES GAMEPLAY ───────────────────────
  // 1. Harus buka/baca materi di komputer bawah kiri dahulu
  const [hasReadMaterial, setHasReadMaterial] = useState(false);
  // 2. Mematikan laser merah 2 di komputer dekat mini game
  const [isLaser2Deactivated, setIsLaser2Deactivated] = useState(false);
  // 3. Mengambil kunci di ruangan antara platform 15 dan 16
  const [hasArchitectKey, setHasArchitectKey] = useState(false);
  // 4. Status Penyelesaian Mini Game Directory Architect
  const [isMiniGameCompleted, setIsMiniGameCompleted] = useState(false);

  // Status Kedekatan dengan Objek Interaktif
  const [isNearMaterial, setIsNearMaterial] = useState(false);
  const [isNearLaserTerminal, setIsNearLaserTerminal] = useState(false);
  const [isNearArchitectStation, setIsNearArchitectStation] = useState(false);
  const [isNearKey, setIsNearKey] = useState(false);
  const [isNearPortal, setIsNearPortal] = useState(false);

  // ─── STATE PEMAIN ─────────────────────────────────────────────
  const [playerX, setPlayerX] = useState(DEFAULT_OBJECTS.spawn.x);
  const [playerY, setPlayerY] = useState(DEFAULT_OBJECTS.spawn.y);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isWalking, setIsWalking] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);

  // ─── STATE MODAL & TERMINAL ───────────────────────────────────
  const [showMaterial, setShowMaterial] = useState(false);
  const [showArchitectTerminal, setShowArchitectTerminal] = useState(false);

  // Load konfigurasi kustom dari localStorage agar platform buatan user tetap aktif
  useEffect(() => {
    try {
      const savedCompleted = localStorage.getItem("stage5_minigame_completed");
      if (savedCompleted === "true") {
        setIsMiniGameCompleted(true);
      }

      // Bersihkan data custom localStorage lama agar semua client (termasuk teman saat git pull)
      // selalu tersinkron 100% menggunakan data resmi dari file Git ini
      localStorage.removeItem("stage5_custom_platforms");
      localStorage.removeItem("stage5_custom_stairs");
      localStorage.removeItem("stage5_custom_lasers");
      localStorage.removeItem("stage5_custom_objects");
    } catch (e) {
      console.error("Gagal membaca storage custom:", e);
    }
  }, []);

  // Refs untuk fisika game loop 60fps agar selalu instan tanpa re-render lag
  const platformsRef = useRef(platforms);
  platformsRef.current = platforms;

  const stairsRef = useRef(stairsList);
  stairsRef.current = stairsList;

  const lasersRef = useRef(lasers);
  lasersRef.current = lasers;

  const levelObjectsRef = useRef(levelObjects);
  levelObjectsRef.current = levelObjects;

  const isLaser2DeactivatedRef = useRef(isLaser2Deactivated);
  isLaser2DeactivatedRef.current = isLaser2Deactivated;

  const hasArchitectKeyRef = useRef(hasArchitectKey);
  hasArchitectKeyRef.current = hasArchitectKey;

  const hasReadMaterialRef = useRef(hasReadMaterial);
  hasReadMaterialRef.current = hasReadMaterial;

  const isMiniGameCompletedRef = useRef(isMiniGameCompleted);
  isMiniGameCompletedRef.current = isMiniGameCompleted;

  // ─── TOAST NOTIFIKASI ─────────────────────────────────────────
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAlert = (msg: string) => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setAlertMessage(msg);
    alertTimeoutRef.current = setTimeout(() => {
      setAlertMessage(null);
    }, 3800);
  };

  const triggerLaserDeath = () => {
    setScreenFlash(true);
    triggerAlert("💥 TERKENA SENSOR LASER MERAH! Respawn ke Titik Awal.");
    setTimeout(() => setScreenFlash(false), 350);
  };

  // ─── REFS GAME LOOP ───────────────────────────────────────────
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: playerX, y: playerY, vy: velocityY, jumping: isJumping });
  playerRef.current = { x: playerX, y: playerY, vy: velocityY, jumping: isJumping };

  // ─── ACTION HANDLERS INTERAKSI ────────────────────────────────
  const handleOpenMaterial = () => {
    setShowMaterial(true);
    setHasReadMaterial(true);
    hasReadMaterialRef.current = true;
    triggerAlert("📖 Datalog Materi dipelajari! Protokol bypass Laser 2 kini tersimpan di memori.");
  };

  const handleBypassLaser2 = () => {
    if (!hasReadMaterialRef.current) {
      triggerAlert("⚠️ AKSES DITOLAK: Anda harus membaca Datalog Materi di Komputer Bawah Kiri terlebih dahulu!");
    } else if (isLaser2DeactivatedRef.current) {
      triggerAlert("ℹ️ Laser Merah 2 sudah berstatus DINONAKTIFKAN (Aman).");
    } else {
      setIsLaser2Deactivated(true);
      isLaser2DeactivatedRef.current = true;
      triggerAlert("⚡ KODE TERVERIFIKASI! Laser Merah 2 berhasil DINONAKTIFKAN. Ruangan kunci 15-16 kini aman!");
    }
  };

  const handleCollectKey = () => {
    if (!hasArchitectKeyRef.current) {
      setHasArchitectKey(true);
      hasArchitectKeyRef.current = true;
      triggerAlert("🔑 KUNCI AKSES DIPEROLEH! Terminal Directory Architect kini dapat dibuka.");
    }
  };

  const handleOpenArchitect = () => {
    if (!hasArchitectKeyRef.current) {
      triggerAlert("🔒 TERMINAL TERKUNCI: Anda harus mengambil Kunci Akses di ruangan platform 15-16!");
    } else {
      setShowArchitectTerminal(true);
    }
  };

  const handleMiniGameComplete = () => {
    setIsMiniGameCompleted(true);
    isMiniGameCompletedRef.current = true;
    try {
      localStorage.setItem("stage5_minigame_completed", "true");
    } catch (_) {}
    triggerAlert("🎉 MINI GAME SELESAI! Directory Architect berhasil tervalidasi. Portal Stage 6 kini TELAH TERBUKA!");
  };

  const handlePortalInteract = () => {
    if (isMiniGameCompletedRef.current) {
      triggerAlert("🚀 Berpindah ke Stage 6...");
      router.push("/stage/stage6");
    } else {
      triggerAlert("🔒 PORTAL TERKUNCI: Selesaikan Terminal Directory Architect terlebih dahulu untuk membuka Portal Stage 6!");
    }
  };

  // ─── KEYBOARD LISTENERS ───────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Interaksi tombol E
      if (key === "e") {
        // 1. Interaksi Komputer Materi (Bawah Kiri)
        if (isNearMaterial && !showMaterial && !showArchitectTerminal) {
          handleOpenMaterial();
          return;
        }

        // 2. Interaksi Komputer Bypass Laser 2 (Atas Kiri dekat Mini Game)
        if (isNearLaserTerminal && !showMaterial && !showArchitectTerminal) {
          handleBypassLaser2();
          return;
        }

        // 3. Interaksi Ambil Kunci di Ruangan Platform 15-16
        if (isNearKey && !hasArchitectKeyRef.current) {
          handleCollectKey();
          return;
        }

        // 4. Interaksi Terminal Mini Game (Directory Architect)
        if (isNearArchitectStation && !showArchitectTerminal && !showMaterial) {
          handleOpenArchitect();
          return;
        }

        // 5. Interaksi Portal Pintu Keluar Stage 6
        if (isNearPortal && !showMaterial && !showArchitectTerminal) {
          handlePortalInteract();
          return;
        }
      }

      if (key === "escape") {
        setShowMaterial(false);
        setShowArchitectTerminal(false);
        return;
      }

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        if (!showArchitectTerminal && !showMaterial) {
          e.preventDefault();
        }
      }

      keysPressed.current.add(key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    isNearMaterial,
    isNearLaserTerminal,
    isNearArchitectStation,
    isNearKey,
    isNearPortal,
    showMaterial,
    showArchitectTerminal,
    isMiniGameCompleted,
  ]);

  // ─── GAME LOOP FISIKA 60FPS ───────────────────────────────────
  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      const isPaused = showMaterial || showArchitectTerminal;

      if (!isPaused) {
        const p = { ...playerRef.current };
        const keys = keysPressed.current;

        // 1. GERAKAN HORIZONTAL PEMAIN
        let moveX = 0;
        if (keys.has("a") || keys.has("arrowleft")) {
          moveX -= MOVE_SPEED;
          setFacingRight(false);
        }
        if (keys.has("d") || keys.has("arrowright")) {
          moveX += MOVE_SPEED;
          setFacingRight(true);
        }

        setIsWalking(moveX !== 0 && !p.jumping);

        // 2. LOMPAT PEMAIN
        const wantsJump = keys.has("w") || keys.has("arrowup") || keys.has(" ");
        if (wantsJump && !p.jumping) {
          p.vy = JUMP_POWER;
          p.jumping = true;
        }

        // 3. GRAVITASI
        p.vy += GRAVITY;
        p.y += p.vy;

        let nextPlayerX = p.x + moveX;

        // ─── TABRAKAN TEMBOK / DINDING SOLID (BLOK KIRI & KANAN) ─────
        for (const plat of platformsRef.current) {
          if (plat.y >= GROUND_Y) continue;

          const isSolidWall =
            plat.isWall ||
            (plat.h >= 28 &&
              !plat.label.toUpperCase().includes("CATWALK") &&
              !plat.label.toUpperCase().includes("FLOOR")) ||
            plat.label.toLowerCase().includes("tembok") ||
            plat.label.toLowerCase().includes("wall");

          if (!isSolidWall) continue;

          const isVerticalOverlap =
            p.y + PLAYER_H > plat.y + 6 &&
            p.y < plat.y + plat.h - 4;

          if (isVerticalOverlap) {
            if (moveX > 0 && p.x + PLAYER_W <= plat.x + 8 && nextPlayerX + PLAYER_W >= plat.x) {
              nextPlayerX = plat.x - PLAYER_W;
            } else if (moveX < 0 && p.x >= plat.x + plat.w - 8 && nextPlayerX <= plat.x + plat.w) {
              nextPlayerX = plat.x + plat.w;
            } else if (nextPlayerX + PLAYER_W > plat.x && nextPlayerX < plat.x + plat.w) {
              const distFromLeft = Math.abs(nextPlayerX + PLAYER_W - plat.x);
              const distFromRight = Math.abs(nextPlayerX - (plat.x + plat.w));
              if (distFromLeft < distFromRight) {
                nextPlayerX = plat.x - PLAYER_W;
              } else {
                nextPlayerX = plat.x + plat.w;
              }
            }
          }
        }

        // 4. TABRAKAN PLAFON (LOGIKA KEJEDOT SAAT MELOMPAT KE ATAS)
        if (p.vy < 0) {
          for (const plat of platformsRef.current) {
            if (plat.y >= GROUND_Y) continue;

            const platBottom = plat.y + plat.h;
            const isUnderPlatform =
              nextPlayerX + PLAYER_W > plat.x + 4 &&
              nextPlayerX < plat.x + plat.w - 4;

            if (isUnderPlatform) {
              if (p.y <= platBottom && p.y - p.vy >= platBottom - 8) {
                p.y = platBottom;
                p.vy = 1.0;
              }
            }
          }

          if (p.y <= 8) {
            p.y = 8;
            p.vy = 1.0;
          }
        }

        // 5. TABRAKAN PLATFORM STATIS (PIJAKAN DARI ATAS)
        for (const plat of platformsRef.current) {
          const isOverPlatform =
            p.x + PLAYER_W > plat.x &&
            p.x < plat.x + plat.w &&
            p.y + PLAYER_H >= plat.y &&
            p.y + PLAYER_H - p.vy <= plat.y + 14;

          if (isOverPlatform && p.vy >= 0) {
            p.y = plat.y - PLAYER_H;
            p.vy = 0;
            p.jumping = false;
          }
        }

        // 6. TANGGA REALISTIS (RAMP MATH PERSIS SEPERTI STAGE 3)
        let stairsGroundY: number | null = null;
        const charFootX = nextPlayerX + PLAYER_W * 0.5;
        const footY = p.y + PLAYER_H;

        for (const st of stairsRef.current) {
          const minX = Math.min(st.x1, st.x2);
          const maxX = Math.max(st.x1, st.x2);

          if (charFootX >= minX && charFootX <= maxX && st.x1 !== st.x2) {
            const t = (charFootX - st.x1) / (st.x2 - st.x1);
            const rampY = st.y1 + t * (st.y2 - st.y1);

            if (footY >= rampY - 18 && footY <= rampY + 22) {
              stairsGroundY = rampY;
              break;
            }
          }
        }

        if (stairsGroundY !== null) {
          const prevFootY = footY - p.vy;
          if (!p.jumping) {
            if (Math.abs(footY - stairsGroundY) <= 16) {
              p.y = stairsGroundY - PLAYER_H;
              p.vy = 0;
            }
          } else if (p.vy >= 0) {
            if (footY >= stairsGroundY && prevFootY <= stairsGroundY + 16) {
              p.y = stairsGroundY - PLAYER_H;
              p.vy = 0;
              p.jumping = false;
            }
          }
        }

        // 7. LANTAI DASAR SOLID (FULL 1024 PX)
        if (p.y + PLAYER_H >= GROUND_Y) {
          p.y = GROUND_Y - PLAYER_H;
          p.vy = 0;
          p.jumping = false;
        }

        // 8. BATAS KANVAS
        if (nextPlayerX < 10) nextPlayerX = 10;
        if (nextPlayerX + PLAYER_W > GAME_WIDTH - 10) nextPlayerX = GAME_WIDTH - 10 - PLAYER_W;
        p.x = nextPlayerX;

        // 9. TABRAKAN LASER MERAH (MUTLAK MEMATIKAN)
        for (let i = 0; i < lasersRef.current.length; i++) {
          const l = lasersRef.current[i];
          const isThisLaser2 =
            i === 1 ||
            l.label.toLowerCase().includes("laser 2") ||
            l.label.toLowerCase().includes("laser merah 2");

          // Jika Laser 2 sudah dinonaktifkan, lewati pemeriksaan (aman untuk dilewati)
          if (isThisLaser2 && isLaser2DeactivatedRef.current) {
            continue;
          }

          const hitLaser =
            p.x + PLAYER_W > l.x + 3 &&
            p.x < l.x + l.w - 3 &&
            p.y + PLAYER_H > l.y + 3 &&
            p.y < l.y + l.h - 3;

          if (hitLaser) {
            p.x = levelObjectsRef.current.spawn.x;
            p.y = levelObjectsRef.current.spawn.y;
            p.vy = 0;
            p.jumping = false;
            triggerLaserDeath();
            break;
          }
        }

        // 10. DETEKSI AMBIL KUNCI OTOMATIS SAAT TERTABRAK
        if (!hasArchitectKeyRef.current) {
          const k = levelObjectsRef.current.keyItem;
          const touchKey =
            p.x + PLAYER_W > k.x &&
            p.x < k.x + k.w &&
            p.y + PLAYER_H > k.y &&
            p.y < k.y + k.h;

          if (touchKey) {
            handleCollectKey();
          }
        }

        // 11. DETEKSI KEDEKATAN OBJEK INTERAKTIF
        const objs = levelObjectsRef.current;

        // Komputer Materi di Kiri Bawah
        const distMatX = Math.abs(p.x + PLAYER_W / 2 - (objs.material.x + objs.material.w / 2));
        const distMatY = Math.abs(p.y + PLAYER_H / 2 - (objs.material.y + objs.material.h / 2));
        setIsNearMaterial(distMatX < 65 && distMatY < 55);

        // Komputer Kontrol / Bypass Laser 2 di Kiri Komputer Mini Game
        const distLaserTermX = Math.abs(p.x + PLAYER_W / 2 - (objs.laserTerminal.x + objs.laserTerminal.w / 2));
        const distLaserTermY = Math.abs(p.y + PLAYER_H / 2 - (objs.laserTerminal.y + objs.laserTerminal.h / 2));
        setIsNearLaserTerminal(distLaserTermX < 65 && distLaserTermY < 55);

        // Stasiun Terminal Mini Game di Kanan Atas
        const distArchX = Math.abs(p.x + PLAYER_W / 2 - (objs.architect.x + objs.architect.w / 2));
        const distArchY = Math.abs(p.y + PLAYER_H / 2 - (objs.architect.y + objs.architect.h / 2));
        setIsNearArchitectStation(distArchX < 65 && distArchY < 55);

        // Kunci di Ruangan Platform 15-16
        const distKeyX = Math.abs(p.x + PLAYER_W / 2 - (objs.keyItem.x + objs.keyItem.w / 2));
        const distKeyY = Math.abs(p.y + PLAYER_H / 2 - (objs.keyItem.y + objs.keyItem.h / 2));
        setIsNearKey(distKeyX < 55 && distKeyY < 55);

        // Portal Pintu Exit
        const distPortalX = Math.abs(p.x + PLAYER_W / 2 - (objs.portal.x + objs.portal.w / 2));
        const distPortalY = Math.abs(p.y + PLAYER_H / 2 - (objs.portal.y + objs.portal.h / 2));
        setIsNearPortal(distPortalX < 70 && distPortalY < 65);

        // Update State
        setPlayerX(p.x);
        setPlayerY(p.y);
        setVelocityY(p.vy);
        setIsJumping(p.jumping);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [showMaterial, showArchitectTerminal]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-3 md:p-4 select-none">
      {/* ─── HUD INFO ATAS (CLEAN & MINIMALIS) ──────────────────────── */}
      <div className="mb-3 flex w-full max-w-[1024px] flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-500/40 bg-[#09061c]/85 px-4 py-2 text-xs text-gray-300 backdrop-blur-md shadow-[0_0_25px_rgba(6,182,212,0.25)]">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-wider text-cyan-300 uppercase font-mono">
            STAGE 5 // DIRECTORY &amp; STORAGE VAULT
          </span>
          <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300 font-mono">
            File System Core
          </span>
          {hasArchitectKey && (
            <span className="rounded bg-yellow-500/20 border border-yellow-400/50 px-2 py-0.5 text-[10px] text-yellow-300 font-mono animate-pulse">
              🔑 Kunci Akses Terbawa
            </span>
          )}
        </div>

        {/* Kontrol & Navigasi */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <button
            type="button"
            onClick={handleOpenMaterial}
            className="rounded-md border border-cyan-400/40 bg-cyan-500/20 px-2.5 py-1 font-bold text-cyan-200 hover:bg-cyan-500/30 transition shadow-[0_0_10px_rgba(34,211,238,0.2)]"
          >
            📖 Datalog Materi [E]
          </button>
          <button
            type="button"
            onClick={handleOpenArchitect}
            className={`rounded-md border px-2.5 py-1 font-bold transition shadow-sm ${
              hasArchitectKey
                ? "border-purple-400/60 bg-purple-500/25 text-purple-200 hover:bg-purple-500/35 shadow-[0_0_10px_rgba(168,85,247,0.3)] animate-pulse"
                : "border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white"
            }`}
          >
            {hasArchitectKey ? "💻 Directory Architect [E]" : "🔒 Directory Architect [Terkunci]"}
          </button>
          <button
            type="button"
            onClick={handlePortalInteract}
            className={`rounded-md border px-2.5 py-1 font-bold transition shadow-sm ${
              isMiniGameCompleted
                ? "border-emerald-400/60 bg-emerald-500/25 text-emerald-200 hover:bg-emerald-500/35 shadow-[0_0_12px_rgba(52,211,153,0.4)] animate-pulse"
                : "border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white"
            }`}
          >
            {isMiniGameCompleted ? "🌀 Portal Stage 6 [Buka]" : "🔒 Portal Stage 6 [Terkunci]"}
          </button>
          <Link
            href="/stage/stage3"
            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-slate-400 hover:text-white hover:border-white/20 transition"
          >
            ← STAGE 03
          </Link>
        </div>
      </div>

      {/* ─── KANVAS GAME UTAMA (1024×576) ─────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/40 shadow-[0_0_60px_rgba(0,0,0,0.9)]"
        style={{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
          backgroundImage: "url('/stage5bg.jpeg')",
          backgroundSize: "100% 100%",
        }}
      >
        {/* Overlay lembut sci-fi */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/30 pointer-events-none" />

        {/* ─── SCREEN FLASH MERAH SAAT TERKENA LASER ────────────────── */}
        {screenFlash && (
          <div className="absolute inset-0 bg-red-600/40 z-50 pointer-events-none animate-pulse" />
        )}

        {/* ─── TOAST NOTIFIKASI TELEMETRI (HUD) ─────────────────────── */}
        {alertMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-all duration-300">
            <div className="flex items-center gap-2 rounded-xl border border-cyan-400/80 bg-black/95 px-4 py-2 text-xs font-mono font-bold text-cyan-200 shadow-[0_0_25px_rgba(34,211,238,0.5)]">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span>{alertMessage}</span>
            </div>
          </div>
        )}

        {/* ─── FITUR SENSOR LASER LISTRIK MERAH (MUTLAK MEMATIKAN) ───── */}
        {lasers.map((laser, idx) => {
          const isThisLaser2 =
            idx === 1 ||
            laser.label.toLowerCase().includes("laser 2") ||
            laser.label.toLowerCase().includes("laser merah 2");
          const isDeactivated = isThisLaser2 && isLaser2Deactivated;

          return (
            <ElectricLaser
              key={idx}
              laser={laser}
              isDeactivated={isDeactivated}
            />
          );
        })}

        {/* ─── PIJAKAN PLATFORM TRANSPARAN (COLLISION HITBOXES) ──────── */}
        {platforms.map((plat, idx) => (
          <div
            key={idx}
            className="absolute pointer-events-none opacity-0"
            style={{
              left: `${plat.x}px`,
              top: `${plat.y}px`,
              width: `${plat.w}px`,
              height: `${plat.h}px`,
            }}
          />
        ))}

        {/* ─── 1. INTERAKSI: KOMPUTER MATERI (BAWAH KIRI) ────────────── */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
          style={{
            left: `${levelObjects.material.x}px`,
            top: `${levelObjects.material.y}px`,
            width: `${levelObjects.material.w}px`,
            height: `${levelObjects.material.h}px`,
          }}
          onClick={handleOpenMaterial}
        >
          {isNearMaterial && (
            <div className="absolute -top-8 whitespace-nowrap z-30 pointer-events-none animate-in fade-in duration-150">
              <span className="rounded-md border border-cyan-400/80 bg-black/90 px-2.5 py-1 text-[10px] font-mono font-bold text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                Tekan <kbd className="rounded bg-cyan-400 px-1 py-0.2 text-[9px] font-black text-black mx-0.5">E</kbd> untuk Baca Datalog Direktori &amp; Disk
              </span>
            </div>
          )}
        </div>

        {/* ─── 2. INTERAKSI: AKSES BYPASS LASER 2 (SEBELAH KIRI MINI GAME) ─ */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
          style={{
            left: `${levelObjects.laserTerminal.x}px`,
            top: `${levelObjects.laserTerminal.y}px`,
            width: `${levelObjects.laserTerminal.w}px`,
            height: `${levelObjects.laserTerminal.h}px`,
          }}
          onClick={handleBypassLaser2}
        >
          {isNearLaserTerminal && (
            <div className="absolute -top-9 whitespace-nowrap z-30 pointer-events-none animate-in fade-in duration-150">
              {!hasReadMaterial ? (
                <span className="rounded-md border border-red-500/80 bg-black/95 px-2.5 py-1 text-[10px] font-mono font-bold text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                  ⚠️ Butuh Datalog Materi untuk Membuka Terminal Ini!
                </span>
              ) : isLaser2Deactivated ? (
                <span className="rounded-md border border-emerald-400/80 bg-black/95 px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                  Laser Telah Dinonaktifkan (Ruangan Terbuka)
                </span>
              ) : (
                <span className="rounded-md border border-amber-400/80 bg-black/95 px-2.5 py-1 text-[10px] font-mono font-bold text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                  Tekan <kbd className="rounded bg-amber-400 px-1 py-0.2 text-[9px] font-black text-black mx-0.5">E</kbd> untuk Matikan Laser
                </span>
              )}
            </div>
          )}
        </div>

        {/* ─── 3. INTERAKSI: KUNCI RUANGAN PLATFORM 15-16 ─────────────── */}
        {!hasArchitectKey && (
          <div
            className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
            style={{
              left: `${levelObjects.keyItem.x}px`,
              top: `${levelObjects.keyItem.y}px`,
              width: `${levelObjects.keyItem.w}px`,
              height: `${levelObjects.keyItem.h}px`,
            }}
            onClick={handleCollectKey}
          >
            {/* Visual Kunci Memantul Emas */}
            <div className="flex flex-col items-center justify-center pointer-events-none animate-bounce">
              <span className="text-2xl drop-shadow-[0_0_15px_rgba(250,204,21,1)]">🔑</span>
            </div>

            {isNearKey && (
              <div className="absolute -top-8 whitespace-nowrap z-30 pointer-events-none animate-in fade-in duration-150">
                <span className="rounded-md border border-yellow-400/80 bg-black/90 px-2.5 py-1 text-[10px] font-mono font-bold text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                  Tekan <kbd className="rounded bg-yellow-400 px-1 py-0.2 text-[9px] font-black text-black mx-0.5">E</kbd> untuk Ambil Kunci Akses
                </span>
              </div>
            )}
          </div>
        )}

        {/* ─── 4. INTERAKSI: STASIUN DIRECTORY ARCHITECT (ATAS KANAN) ─── */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
          style={{
            left: `${levelObjects.architect.x}px`,
            top: `${levelObjects.architect.y}px`,
            width: `${levelObjects.architect.w}px`,
            height: `${levelObjects.architect.h}px`,
          }}
          onClick={handleOpenArchitect}
        >
          {isNearArchitectStation && (
            <div className="absolute -top-8 whitespace-nowrap z-30 pointer-events-none animate-in fade-in duration-150">
              {!hasArchitectKey ? (
                <span className="rounded-md border border-red-500/80 bg-black/90 px-2.5 py-1 text-[10px] font-mono font-bold text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                  🔒 Terkunci (Cari Kunci)
                </span>
              ) : (
                <span className="rounded-md border border-purple-400/80 bg-black/90 px-2.5 py-1 text-[10px] font-mono font-bold text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                  Tekan <kbd className="rounded bg-purple-400 px-1 py-0.2 text-[9px] font-black text-black mx-0.5">E</kbd> untuk Buka Directory Architect
                </span>
              )}
            </div>
          )}
        </div>

        {/* ─── 5. INTERAKSI: PINTU EXIT / PORTAL STAGE 6 (ATAS KANAN) ──── */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
          style={{
            left: `${levelObjects.portal.x}px`,
            top: `${levelObjects.portal.y}px`,
            width: `${levelObjects.portal.w}px`,
            height: `${levelObjects.portal.h}px`,
          }}
          onClick={handlePortalInteract}
        >
          {/* Efek visual portal aktif ketika mini game telah diselesaikan */}
          {isMiniGameCompleted && (
            <div className="h-full w-full rounded-t-2xl rounded-b-sm border-2 border-emerald-400/90 bg-emerald-950/40 shadow-[0_0_35px_rgba(52,211,153,0.7)] flex flex-col items-center justify-center animate-pulse">
              <span className="text-xl drop-shadow-[0_0_10px_#34d399]">🌀</span>
              <span className="text-[7.5px] font-mono font-bold text-emerald-300 tracking-wider">PORTAL ON</span>
            </div>
          )}

          {isNearPortal && (
            <div className="absolute -top-8 whitespace-nowrap z-30 pointer-events-none animate-in fade-in duration-150">
              {isMiniGameCompleted ? (
                <span className="rounded-md border border-emerald-400/80 bg-black/90 px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                  Tekan <kbd className="rounded bg-emerald-400 px-1 py-0.2 text-[9px] font-black text-black mx-0.5">E</kbd> untuk Masuk Portal Stage 6 ➔
                </span>
              ) : (
                <span className="rounded-md border border-red-500/80 bg-black/90 px-2.5 py-1 text-[10px] font-mono font-bold text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                  🔒 Portal Terkunci (Selesaikan Mini Game Terlebih Dahulu)
                </span>
              )}
            </div>
          )}
        </div>

        {/* ─── KARAKTER ASTRONOT PEMAIN ──────────────────────────────── */}
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: `${playerX}px`,
            top: `${playerY}px`,
            width: `${PLAYER_W}px`,
            height: `${PLAYER_H}px`,
          }}
        >
          <div
            className="h-full w-full transition-transform duration-100 ease-out"
            style={{
              transformOrigin: "bottom center",
              transform: isJumping
                ? `${facingRight ? "scaleX(0.88)" : "scaleX(-0.88)"} scaleY(1.12)`
                : `${facingRight ? "scaleX(1)" : "scaleX(-1)"} scaleY(1)`,
            }}
          >
            <img
              src="/astronaut-front.png"
              alt="Astronaut"
              className={`h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] ${
                isWalking && !isJumping ? "animate-waddle" : ""
              }`}
            />
          </div>
        </div>
      </div>

      {/* ─── NAVIGASI BAWAH ────────────────────────────────────────── */}
      <div className="mt-3 flex w-full max-w-[1024px] items-center justify-between text-xs text-gray-400">
        <Link href="/" className="hover:text-cyan-300 transition">
          ← Kembali ke Menu Utama
        </Link>
        <span className="font-mono text-[11px] text-gray-300">
          Stage 5: Baca Datalog di Komputer Bawah Kiri ➔ Matikan Laser 2 di Komputer Atas ➔ Ambil Kunci di Ruang 15-16 ➔ Selesaikan Mini Game ➔ Masuk Portal Stage 6!
        </span>
        <button
          type="button"
          onClick={handleOpenArchitect}
          className="text-purple-300 font-bold hover:underline font-mono"
        >
          Terminal Architect ➔
        </button>
      </div>

      {/* ─── MODAL 1: DIRECTORY ARCHITECT MINI-GAME ───────────────── */}
      {showArchitectTerminal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 md:p-6 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="absolute top-3 right-3 z-30">
              <button
                type="button"
                onClick={() => setShowArchitectTerminal(false)}
                className="rounded-lg border border-white/20 bg-black/80 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-white/20 hover:text-white"
              >
                ✕ Kembali ke Stasiun (ESC)
              </button>
            </div>
            <DirectoryArchitectMiniGame
              onComplete={handleMiniGameComplete}
              onOpenMaterial={() => setShowMaterial(true)}
            />
          </div>
        </div>
      )}

      {/* ─── MODAL 2: DATALOG MATERI PEMBELAJARAN ──────────────────── */}
      <DiskMaterialModal isOpen={showMaterial} onClose={() => setShowMaterial(false)} />

      {/* ─── KEYFRAME ANIMASI WADDLE & LASER LISTRIK ───────────────── */}
      <style jsx>{`
        @keyframes waddle {
          0%,
          100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-4.5deg) translateY(-2px);
          }
          75% {
            transform: rotate(4.5deg) translateY(-2px);
          }
        }
        .animate-waddle {
          animation: waddle 0.25s ease-in-out infinite;
        }

        /* ─── ANIMASI BUSUR LISTRIK & PERCIKAN TEGANGAN TINGGI ─── */
        @keyframes electricFlicker {
          0%, 100% {
            opacity: 0.95;
            filter: drop-shadow(0 0 6px #ef4444) drop-shadow(0 0 12px rgba(239, 68, 68, 0.9));
          }
          20% {
            opacity: 0.75;
            filter: drop-shadow(0 0 4px #ef4444) drop-shadow(0 0 8px rgba(239, 68, 68, 0.7));
          }
          40% {
            opacity: 1;
            filter: drop-shadow(0 0 10px #ff0055) drop-shadow(0 0 20px rgba(255, 0, 85, 1));
          }
          60% {
            opacity: 0.85;
            filter: drop-shadow(0 0 5px #ef4444) drop-shadow(0 0 10px rgba(239, 68, 68, 0.8));
          }
          80% {
            opacity: 1;
            filter: drop-shadow(0 0 12px #ff4444) drop-shadow(0 0 22px rgba(255, 68, 68, 1));
          }
        }
        @keyframes electricJitterA {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(-1px, 1.5px) scaleY(1.2);
          }
          50% {
            transform: translate(1px, -1px) scaleY(0.85);
          }
          75% {
            transform: translate(-0.5px, -1.5px) scaleY(1.15);
          }
        }
        @keyframes electricJitterB {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          20% {
            transform: translate(1.5px, -1px) scale(0.95, 1.3);
          }
          45% {
            transform: translate(-1px, 1.5px) scale(1.1, 0.8);
          }
          70% {
            transform: translate(1px, 1px) scale(0.9, 1.2);
          }
          90% {
            transform: translate(-1.5px, -0.5px) scale(1.05, 0.9);
          }
        }
        @keyframes electricSparkPop {
          0%, 100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.4);
          }
          30%, 70% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.4);
          }
        }
        @keyframes electricBranchFlash {
          0%, 100% {
            opacity: 0;
          }
          15%, 35% {
            opacity: 0.9;
          }
          50%, 80% {
            opacity: 0;
          }
          85%, 95% {
            opacity: 1;
          }
        }
        .electric-hazard-container {
          animation: electricFlicker 0.18s infinite steps(2, start);
        }
        .electric-arc-glow {
          opacity: 0.65;
          animation: electricJitterA 0.12s infinite alternate;
        }
        .electric-arc-fast {
          animation: electricJitterB 0.08s infinite alternate;
        }
        .electric-arc-core {
          animation: electricJitterA 0.06s infinite;
        }
        .electric-arc-sub {
          animation: electricJitterB 0.1s infinite alternate-reverse;
        }
        .electric-spark-branch {
          animation: electricBranchFlash 0.22s infinite;
        }
        .electric-spark-branch-alt {
          animation: electricBranchFlash 0.31s infinite 0.1s;
        }
        .electric-spark-dot-1 {
          animation: electricSparkPop 0.15s infinite ease-in-out;
        }
        .electric-spark-dot-2 {
          animation: electricSparkPop 0.21s infinite ease-in-out 0.07s;
        }
      `}</style>
    </main>
  );
}
