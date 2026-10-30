"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type PageSizeMode,
  type FrameItem,
  type TranslationResult,
  PROCESSES,
  TRANSLATION_CHALLENGES,
  generatePagesForProcesses,
  initializeFrames,
  calculateExpectedPhysicalAddress,
  getAllPagingMetrics,
  autoMapPagesToFrames,
} from "@/utils/pagingLogic";

// ──────────────────────────────────────────────────────────────
// OS-SCAPE Stage 3: The Memory Vault - Paging System
// 2D Platformer Mechanics (Kanvas Tetap 1024×576 16:9)
// ──────────────────────────────────────────────────────────────

export default function Stage3Page() {
  const router = useRouter();

  // ─── KONSTANTA KANVAS (16:9 Fixed Sesuai Stage 1 & 2) ────────
  const GAME_WIDTH = 1024;
  const GAME_HEIGHT = 576;
  const GROUND_Y = 510; // Ketinggian lantai dasar

  // ─── KONSTANTA PEMAIN ────────────────────────────────────────
  const PLAYER_W = 44;
  const PLAYER_H = 64;
  const MOVE_SPEED = 4.5;
  const JUMP_POWER = -12.5;
  const GRAVITY = 0.6;

  // ─── KONSTANTA KOTAK KARGO (CACHE MEMORY BLOCK) ──────────────
  const BOX_W = 46;
  const BOX_H = 46;

  // ─── TITIK AWAL PEMAIN (SPAWN POINT) ─────────────────────────
  const SPAWN_X = 60;
  const SPAWN_Y = GROUND_Y - PLAYER_H;

  // ─── STATE PEMAIN & FISIKA ───────────────────────────────────
  const [playerX, setPlayerX] = useState(SPAWN_X);
  const [playerY, setPlayerY] = useState(SPAWN_Y);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isWalking, setIsWalking] = useState(false);
  const [isHurt, setIsHurt] = useState(false);

  // ─── STATE KOTAK KARGO CACHE ─────────────────────────────────
  const [boxX, setBoxX] = useState(210);
  const [boxY, setBoxY] = useState(GROUND_Y - BOX_H);
  const [boxVelocityY, setBoxVelocityY] = useState(0);

  // ─── STATE SCANNER DRONE HAZARD (BERGERAK HORIZONTAL) ────────
  const [droneX, setDroneX] = useState(520);
  const droneY = 410;
  const DRONE_W = 48;
  const DRONE_H = 34;
  const droneDirRef = useRef(1); // 1 = kanan, -1 = kiri
  const droneXRef = useRef(droneX);

  // ─── STATE TOAST NOTIFIKASI ──────────────────────────────────
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const triggerAlert = (msg: string) => {
    setAlertMessage(msg);
  };

  useEffect(() => {
    if (!alertMessage) return;
    const t = setTimeout(() => setAlertMessage(null), 3500);
    return () => clearTimeout(t);
  }, [alertMessage]);

  // ─── HITBOX DEFINITIONS (PLATFORM & RINTANGAN) ───────────────
  // 1. Lantai Dasar Kiri & Kanan dengan Lubang Memory Leak di Tengah
  const groundLeft = { x: 0, y: GROUND_Y, w: 320, h: GAME_HEIGHT - GROUND_Y };
  const hazardPit = { x: 320, y: 518, w: 140, h: GAME_HEIGHT - 518 };
  const groundRight = { x: 460, y: GROUND_Y, w: GAME_WIDTH - 460, h: GAME_HEIGHT - GROUND_Y };

  // 2. Pijakan Melayang (Catwalks & Docks)
  const platConsole = { x: 60, y: 390, w: 160, h: 18, label: "DATA-LOG CONSOLE" };
  const platMidLeft = { x: 260, y: 320, w: 120, h: 18, label: "CACHE STEP" };
  const platTerminal = { x: 430, y: 240, w: 200, h: 20, label: "PAGE-MAPPER TERMINAL" };
  const platMidRight = { x: 680, y: 310, w: 130, h: 18, label: "MMU CONNECTOR" };
  const platGate = { x: 850, y: 200, w: 174, h: 20, label: "FIREWALL GATE 4" };

  const allPlatforms = [
    platConsole,
    platMidLeft,
    platTerminal,
    platMidRight,
    platGate,
  ];

  // 3. Objek Interaktif Ruangan
  const consoleObj = { x: 110, y: 390 - 48, w: 46, h: 48 };
  const terminalObj = { x: 505, y: 240 - 54, w: 54, h: 54 };
  const laserDoor = { x: 845, y: 0, w: 14, h: 200 };
  const portalObj = { x: 935, y: 200 - 80, w: 60, h: 80 };

  // Status Kedekatan Pemain dengan Objek Interaktif
  const [isNearConsole, setIsNearConsole] = useState(false);
  const [isNearTerminal, setIsNearTerminal] = useState(false);
  const [isNearPortal, setIsNearPortal] = useState(false);

  // ============================================================================
  // LOGIKA PAGING & STATE MINI-GAME
  // ============================================================================

  // Mode ukuran page aktif: 2 KB (Kecil) | 4 KB (Sedang) | 8 KB (Besar)
  const [activeMode, setActiveMode] = useState<PageSizeMode>(4);

  // Status penyelesaian verifikasi per mode
  const [completedModes, setCompletedModes] = useState<Record<PageSizeMode, boolean>>({
    2: false,
    4: false,
    8: false,
  });

  // State penyimpanan frame memory per mode agar data pemetaan tidak hilang saat berganti tab
  const [framesPerMode, setFramesPerMode] = useState<Record<PageSizeMode, FrameItem[]>>(() => ({
    2: initializeFrames(2),
    4: initializeFrames(4),
    8: initializeFrames(8),
  }));

  // Page yang sedang dipilih pemain untuk ditempatkan ke Frame
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // Input alamat fisik untuk formulir tantangan per mode
  const [challengeInputs, setChallengeInputs] = useState<Record<PageSizeMode, string>>({
    2: "",
    4: "",
    8: "",
  });

  // Hasil verifikasi tantangan per mode
  const [challengeResults, setChallengeResults] = useState<Record<PageSizeMode, TranslationResult | null>>({
    2: null,
    4: null,
    8: null,
  });

  // State Modal Popup
  const [showMapperModal, setShowMapperModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [hasAutoOpenedMetrics, setHasAutoOpenedMetrics] = useState(false);

  // Cek apakah seluruh 3 mode telah selesai
  const isAllModesCompleted = useMemo(() => {
    return completedModes[2] && completedModes[4] && completedModes[8];
  }, [completedModes]);

  // Buka otomatis modal metrik begitu ketiga mode selesai
  useEffect(() => {
    if (isAllModesCompleted && !hasAutoOpenedMetrics) {
      setHasAutoOpenedMetrics(true);
      setShowMapperModal(false);
      setShowMetricsModal(true);
    }
  }, [isAllModesCompleted, hasAutoOpenedMetrics]);

  // Data turunan untuk mode aktif
  const currentPages = useMemo(() => {
    return generatePagesForProcesses(PROCESSES, activeMode);
  }, [activeMode]);

  const currentFrames = useMemo(() => {
    return framesPerMode[activeMode];
  }, [framesPerMode, activeMode]);

  const mappedPageIds = useMemo(() => {
    const ids = new Set<string>();
    for (const frame of currentFrames) {
      if (frame.mappedPage) {
        ids.add(frame.mappedPage.id);
      }
    }
    return ids;
  }, [currentFrames]);

  const unmappedPages = useMemo(() => {
    return currentPages.filter((page) => !mappedPageIds.has(page.id));
  }, [currentPages, mappedPageIds]);

  const isAllPagesMapped = useMemo(() => {
    return unmappedPages.length === 0;
  }, [unmappedPages]);

  const activeSelectedPage = useMemo(() => {
    if (!selectedPageId) return null;
    return currentPages.find((p) => p.id === selectedPageId) || null;
  }, [selectedPageId, currentPages]);

  const activeChallenge = useMemo(() => {
    return TRANSLATION_CHALLENGES[activeMode];
  }, [activeMode]);

  const allMetrics = useMemo(() => {
    return getAllPagingMetrics();
  }, []);

  const completedCount = useMemo(() => {
    return [completedModes[2], completedModes[4], completedModes[8]].filter(Boolean).length;
  }, [completedModes]);

  // ─── HANDLERS INTERAKSI PEMETAAN PAGING ─────────────────────
  const handleSelectPage = (pageId: string) => {
    setSelectedPageId((prev) => (prev === pageId ? null : pageId));
  };

  const handleFrameClick = (frameIndex: number) => {
    const frame = currentFrames[frameIndex];
    if (frame.isReserved) return;

    if (frame.mappedPage) {
      const updated = currentFrames.map((f, idx) =>
        idx === frameIndex ? { ...f, mappedPage: null } : f
      );
      setFramesPerMode((prev) => ({
        ...prev,
        [activeMode]: updated,
      }));
      if (challengeResults[activeMode]) {
        setChallengeResults((prev) => ({ ...prev, [activeMode]: null }));
      }
      return;
    }

    if (activeSelectedPage) {
      const updated = currentFrames.map((f, idx) =>
        idx === frameIndex ? { ...f, mappedPage: { ...activeSelectedPage } } : f
      );
      setFramesPerMode((prev) => ({
        ...prev,
        [activeMode]: updated,
      }));
      setSelectedPageId(null);
      if (challengeResults[activeMode]) {
        setChallengeResults((prev) => ({ ...prev, [activeMode]: null }));
      }
    }
  };

  const handleAutoMap = () => {
    const mapped = autoMapPagesToFrames(currentPages, currentFrames);
    setFramesPerMode((prev) => ({
      ...prev,
      [activeMode]: mapped,
    }));
    setSelectedPageId(null);
    if (challengeResults[activeMode]) {
      setChallengeResults((prev) => ({ ...prev, [activeMode]: null }));
    }
  };

  const handleResetMode = () => {
    setFramesPerMode((prev) => ({
      ...prev,
      [activeMode]: initializeFrames(activeMode),
    }));
    setSelectedPageId(null);
    setChallengeResults((prev) => ({ ...prev, [activeMode]: null }));
    setChallengeInputs((prev) => ({ ...prev, [activeMode]: "" }));
  };

  const handleVerifyTranslation = () => {
    const rawInput = challengeInputs[activeMode].trim();
    const userVal = Number(rawInput);

    if (rawInput === "" || isNaN(userVal)) {
      setChallengeResults((prev) => ({
        ...prev,
        [activeMode]: {
          isValid: false,
          pageIndex: 0,
          offsetKB: 0,
          frameIndex: null,
          expectedPhysicalAddressKB: null,
          userAddressKB: 0,
          isCorrect: false,
          message: "Masukkan angka bilangan bulat hasil kalkulasi Physical Address (KB).",
        },
      }));
      return;
    }

    const res = calculateExpectedPhysicalAddress(
      activeMode,
      currentFrames,
      activeChallenge,
      userVal
    );

    setChallengeResults((prev) => ({
      ...prev,
      [activeMode]: res,
    }));

    if (res.isCorrect) {
      setCompletedModes((prev) => ({
        ...prev,
        [activeMode]: true,
      }));
      triggerAlert(`🎉 Mode Page ${activeMode} KB Berhasil Diverifikasi!`);
    }
  };

  // ─── REFS GAME LOOP ──────────────────────────────────────────
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: playerX, y: playerY, vy: velocityY, jumping: isJumping });
  const boxRef = useRef({ x: boxX, y: boxY, vy: boxVelocityY });
  const laserOpenRef = useRef(isAllModesCompleted);

  playerRef.current = { x: playerX, y: playerY, vy: velocityY, jumping: isJumping };
  boxRef.current = { x: boxX, y: boxY, vy: boxVelocityY };
  laserOpenRef.current = isAllModesCompleted;

  // ─── RESET PEMAIN JIKA TERKENA RINTANGAN ──────────────────────
  const resetPlayerToSpawn = (reason?: string) => {
    setIsHurt(true);
    setTimeout(() => setIsHurt(false), 500);

    setPlayerX(SPAWN_X);
    setPlayerY(SPAWN_Y);
    setVelocityY(0);
    setIsJumping(false);
    setIsWalking(false);
    playerRef.current = { x: SPAWN_X, y: SPAWN_Y, vy: 0, jumping: false };

    if (reason) triggerAlert(reason);
  };

  // ─── KEYBOARD EVENT LISTENERS ────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Interaksi tombol E
      if (key === "e") {
        if (isNearConsole && !showManualModal && !showMapperModal && !showMetricsModal) {
          setShowManualModal(true);
          return;
        }
        if (isNearTerminal && !showManualModal && !showMapperModal && !showMetricsModal) {
          setShowMapperModal(true);
          return;
        }
        if (isNearPortal && !showManualModal && !showMapperModal && !showMetricsModal) {
          if (isAllModesCompleted) {
            router.push("/stage/stage4");
          } else {
            triggerAlert("⚠️ Firewall Aktif! Selesaikan 3 mode Paging di Terminal Utama.");
          }
          return;
        }
      }

      // Tombol ESC menutup modal
      if (key === "escape") {
        setShowManualModal(false);
        setShowMapperModal(false);
        setShowMetricsModal(false);
        return;
      }

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        e.preventDefault();
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
  }, [isNearConsole, isNearTerminal, isNearPortal, showManualModal, showMapperModal, showMetricsModal, isAllModesCompleted, router]);

  // ─── GAME LOOP FISIKA 60FPS ──────────────────────────────────
  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      // Jeda fisika jika modal sedang terbuka
      const isPaused = showManualModal || showMapperModal || showMetricsModal;

      if (!isPaused) {
        const p = { ...playerRef.current };
        const b = { ...boxRef.current };
        const keys = keysPressed.current;
        const laserOpen = laserOpenRef.current;

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

        b.vy += GRAVITY;
        b.y += b.vy;

        // 4. FISIKA KOTAK KARGO (CACHE MEMORY BLOCK)
        // Jatuh ke lantai dasar kiri/kanan atau terbenam di hazard pit
        if (b.x + BOX_W <= hazardPit.x) {
          if (b.y + BOX_H >= groundLeft.y) {
            b.y = groundLeft.y - BOX_H;
            b.vy = 0;
          }
        } else if (b.x >= hazardPit.x + hazardPit.w) {
          if (b.y + BOX_H >= groundRight.y) {
            b.y = groundRight.y - BOX_H;
            b.vy = 0;
          }
        } else {
          // Kotak berada di zona lubang Memory Leak: terbenam sebagai jembatan pijakan
          if (b.y + BOX_H >= hazardPit.y + 36) {
            b.y = hazardPit.y + 36;
            b.vy = 0;
          }
        }

        // 5. INTERAKSI DORONG KOTAK KARGO
        let nextPlayerX = p.x + moveX;
        const playerBoxOverlapY = p.y + PLAYER_H > b.y + 4 && p.y < b.y + BOX_H - 4;

        if (playerBoxOverlapY) {
          // Dorong ke kanan
          if (p.x + PLAYER_W <= b.x && nextPlayerX + PLAYER_W > b.x) {
            const nextBoxX = b.x + moveX;
            if (nextBoxX + BOX_W <= GAME_WIDTH - 12) {
              b.x = nextBoxX;
              nextPlayerX = b.x - PLAYER_W;
            } else {
              nextPlayerX = b.x - PLAYER_W;
            }
          }
          // Dorong ke kiri
          if (p.x >= b.x + BOX_W && nextPlayerX < b.x + BOX_W) {
            const nextBoxX = b.x + moveX;
            if (nextBoxX >= 12) {
              b.x = nextBoxX;
              nextPlayerX = b.x + BOX_W;
            } else {
              nextPlayerX = b.x + BOX_W;
            }
          }
        }

        // 6. PIJAKAN DI ATAS KOTAK
        const isOverBox =
          p.x + PLAYER_W > b.x &&
          p.x < b.x + BOX_W &&
          p.y + PLAYER_H >= b.y &&
          p.y + PLAYER_H - p.vy <= b.y + 14;

        if (isOverBox && p.vy >= 0) {
          p.y = b.y - PLAYER_H;
          p.vy = 0;
          p.jumping = false;
        }

        // 7. TABRAKAN PLATFORM MELAYANG
        for (const plat of allPlatforms) {
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

        // 8. LANTAI DASAR & RINTANGAN HAZARD PIT
        if (p.x + PLAYER_W <= hazardPit.x) {
          // Berada di lantai dasar kiri
          if (p.y + PLAYER_H >= groundLeft.y) {
            p.y = groundLeft.y - PLAYER_H;
            p.vy = 0;
            p.jumping = false;
          }
        } else if (p.x >= hazardPit.x + hazardPit.w) {
          // Berada di lantai dasar kanan
          if (p.y + PLAYER_H >= groundRight.y) {
            p.y = groundRight.y - PLAYER_H;
            p.vy = 0;
            p.jumping = false;
          }
        } else {
          // Pemain berada di atas zona lubang Memory Leak
          if (p.y + PLAYER_H >= hazardPit.y) {
            // Cek apakah pemain mendarat di atas kotak kargo yang berada di dalam pit
            const landingOnBoxInPit =
              p.x + PLAYER_W > b.x &&
              p.x < b.x + BOX_W &&
              p.y + PLAYER_H >= b.y &&
              p.y + PLAYER_H - p.vy <= b.y + 14;

            if (!landingOnBoxInPit) {
              resetPlayerToSpawn("⚠️ Korsleting Memori! Jatuh ke dalam Memory Leak Pit.");
              animId = requestAnimationFrame(gameLoop);
              return;
            }
          }
        }

        // 9. PINTU LASER FIREWALL (PENGHALANG VERTICAL MENUJU STAGE 4)
        if (!laserOpen) {
          const inLaserYRange = p.y + PLAYER_H > laserDoor.y && p.y < laserDoor.y + laserDoor.h;
          if (inLaserYRange) {
            if (p.x + PLAYER_W <= laserDoor.x && nextPlayerX + PLAYER_W > laserDoor.x) {
              nextPlayerX = laserDoor.x - PLAYER_W;
            } else if (p.x >= laserDoor.x + laserDoor.w && nextPlayerX < laserDoor.x + laserDoor.w) {
              nextPlayerX = laserDoor.x + laserDoor.w;
            }
          }
        }

        // 10. BATAS KANVAS KIRI & KANAN
        if (nextPlayerX < 10) nextPlayerX = 10;
        if (nextPlayerX + PLAYER_W > GAME_WIDTH - 10) nextPlayerX = GAME_WIDTH - 10 - PLAYER_W;
        p.x = nextPlayerX;

        // 11. PATROLI SCANNER DRONE HAZARD
        let dx = droneXRef.current + 1.8 * droneDirRef.current;
        if (dx > 760) {
          dx = 760;
          droneDirRef.current = -1;
        } else if (dx < 480) {
          dx = 480;
          droneDirRef.current = 1;
        }
        droneXRef.current = dx;
        setDroneX(dx);

        // Deteksi tabrakan dengan Drone
        const hitDrone =
          p.x + PLAYER_W > dx + 6 &&
          p.x < dx + DRONE_W - 6 &&
          p.y + PLAYER_H > droneY + 6 &&
          p.y < droneY + DRONE_H - 6;

        if (hitDrone) {
          resetPlayerToSpawn("⚡ Terdeteksi oleh OMNI Security Drone! Karakter di-reset.");
          animId = requestAnimationFrame(gameLoop);
          return;
        }

        // 12. DETEKSI KEDEKATAN OBJEK INTERAKTIF
        const distConsoleX = Math.abs(p.x + PLAYER_W / 2 - (consoleObj.x + consoleObj.w / 2));
        const distConsoleY = Math.abs(p.y + PLAYER_H / 2 - (consoleObj.y + consoleObj.h / 2));
        setIsNearConsole(distConsoleX < 65 && distConsoleY < 65);

        const distTermX = Math.abs(p.x + PLAYER_W / 2 - (terminalObj.x + terminalObj.w / 2));
        const distTermY = Math.abs(p.y + PLAYER_H / 2 - (terminalObj.y + terminalObj.h / 2));
        setIsNearTerminal(distTermX < 75 && distTermY < 75);

        const distPortalX = Math.abs(p.x + PLAYER_W / 2 - (portalObj.x + portalObj.w / 2));
        const distPortalY = Math.abs(p.y + PLAYER_H / 2 - (portalObj.y + portalObj.h / 2));
        setIsNearPortal(distPortalX < 65 && distPortalY < 65);

        // Sinkronisasi state React
        setPlayerX(p.x);
        setPlayerY(p.y);
        setVelocityY(p.vy);
        setIsJumping(p.jumping);

        setBoxX(b.x);
        setBoxY(b.y);
        setBoxVelocityY(b.vy);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [showManualModal, showMapperModal, showMetricsModal, isAllModesCompleted]);

  // ============================================================================
  // RENDER UTAMA
  // ============================================================================

  return (
    <main className="min-h-screen bg-black text-[#e9e4ff] select-none flex flex-col items-center justify-center p-2">
      
      {/* ─── HUD INFO ATAS ────────────────────────────────────────── */}
      <div className="flex w-[1024px] max-w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2 text-xs text-gray-300 backdrop-blur-md mb-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-wider text-[#ffb347] uppercase text-[11px] font-mono">
            Stage 3 // The Memory Vault - Paging System
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="hidden sm:inline">
            <strong className="text-white font-mono">A / D</strong>: Jalan • <strong className="text-white font-mono">W / Spasi</strong>: Lompat • <strong className="text-white font-mono">E</strong>: Interaksi
          </span>

          {/* Status 3 Mode Paging */}
          <div className="flex items-center gap-1.5 font-mono">
            {([2, 4, 8] as PageSizeMode[]).map((mode) => (
              <span
                key={mode}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  completedModes[mode]
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {mode}K: {completedModes[mode] ? "✓" : "○"}
              </span>
            ))}
          </div>

          <span
            className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
              isAllModesCompleted
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
            }`}
          >
            {isAllModesCompleted ? "FIREWALL: BYPASSED" : "FIREWALL: AKTIF"}
          </span>

          {isAllModesCompleted && (
            <button
              type="button"
              onClick={() => setShowMetricsModal(true)}
              className="font-mono font-bold px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition"
            >
              📊 METRIK
            </button>
          )}

          <Link
            href="/stage/stage2"
            className="rounded border border-white/20 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-gray-300 hover:text-white"
          >
            ← Stage 2
          </Link>
        </div>
      </div>

      {/* ─── CONTAINER KANVAS UTAMA 1024×576 (16:9) ────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/30 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
        style={{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
          backgroundImage: "url('/stage3bg.jpeg')",
          backgroundSize: "100% 100%",
        }}
      >
        {/* Overlay atmosfer sci-fi */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

        {/* ─── TOAST NOTIFIKASI DI LAYAR GAME ──────────────────────── */}
        {alertMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 animate-bounce pointer-events-none">
            <div className="rounded-xl border border-amber-400/80 bg-black/90 px-4 py-2 text-xs font-mono font-bold text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.6)] backdrop-blur-md">
              {alertMessage}
            </div>
          </div>
        )}

        {/* ─── 1. LANTAI DASAR KIRI (PHYSICAL RAM SECTOR A) ────────── */}
        <div
          className="absolute z-10 border-t-2 border-cyan-400/70 bg-[#060c14]/90 shadow-[0_-4px_20px_rgba(0,0,0,0.8)]"
          style={{
            left: `${groundLeft.x}px`,
            top: `${groundLeft.y}px`,
            width: `${groundLeft.w}px`,
            height: `${groundLeft.h}px`,
          }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 opacity-60" />
          <div className="p-2 text-[8px] font-mono text-cyan-400/60 flex items-center justify-between">
            <span>RAM SECTOR A [0x0000 - 0x3FFF]</span>
            <span className="text-[7px] text-cyan-300/40">32 KB BASE</span>
          </div>
        </div>

        {/* ─── 2. RINTANGAN HAZARD PIT (MEMORY LEAK PIT) ────────────── */}
        <div
          className="absolute z-10 border-t-2 border-rose-500/80 bg-rose-950/40 shadow-[0_0_25px_rgba(244,63,94,0.6)] flex flex-col items-center justify-center overflow-hidden"
          style={{
            left: `${hazardPit.x}px`,
            top: `${hazardPit.y}px`,
            width: `${hazardPit.w}px`,
            height: `${hazardPit.h}px`,
          }}
        >
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(244,63,94,0.15),rgba(244,63,94,0.15)_8px,transparent_8px,transparent_16px)] animate-pulse" />
          <span className="relative z-10 text-[9px] font-mono font-black text-rose-400 tracking-wider animate-bounce">
            ⚠️ MEMORY LEAK PIT
          </span>
          <span className="relative z-10 text-[7px] font-mono text-rose-300/80">
            [CORRUPT FLUX ZONE]
          </span>
        </div>

        {/* ─── 3. LANTAI DASAR KANAN (PHYSICAL RAM SECTOR B) ────────── */}
        <div
          className="absolute z-10 border-t-2 border-cyan-400/70 bg-[#060c14]/90 shadow-[0_-4px_20px_rgba(0,0,0,0.8)]"
          style={{
            left: `${groundRight.x}px`,
            top: `${groundRight.y}px`,
            width: `${groundRight.w}px`,
            height: `${groundRight.h}px`,
          }}
        >
          <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 opacity-60" />
          <div className="p-2 text-[8px] font-mono text-cyan-400/60 flex items-center justify-between">
            <span>RAM SECTOR B [0x4000 - 0x7FFF]</span>
            <span className="text-[7px] text-cyan-300/40">MMU READY</span>
          </div>
        </div>

        {/* ─── 4. PIJAKAN MELAYANG (CATWALKS & DOCKS) ───────────────── */}
        {allPlatforms.map((plat, idx) => (
          <div
            key={idx}
            className="absolute z-10 rounded-md border border-cyan-500/50 bg-[#091522]/85 shadow-[0_4px_20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(34,211,238,0.5)] backdrop-blur-xs flex items-center justify-between px-2 overflow-hidden"
            style={{
              left: `${plat.x}px`,
              top: `${plat.y}px`,
              width: `${plat.w}px`,
              height: `${plat.h}px`,
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400" />
            <span className="text-[7px] font-mono tracking-widest text-cyan-300/80 select-none">
              {plat.label}
            </span>
            <span className="text-[6px] font-mono text-cyan-400/40 select-none">
              BLK-{idx + 1}
            </span>
          </div>
        ))}

        {/* ─── 5. KONSOL KIRI (MANUAL OMNI / LOG ALIEN) ─────────────── */}
        <div
          className="absolute z-20 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
          style={{
            left: `${consoleObj.x}px`,
            top: `${consoleObj.y}px`,
            width: `${consoleObj.w}px`,
            height: `${consoleObj.h}px`,
          }}
          onClick={() => setShowManualModal(true)}
        >
          {isNearConsole && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce z-30 pointer-events-none">
              <span className="rounded bg-cyan-400 px-2 py-0.5 text-[9px] font-black text-black shadow-md">
                [E] Baca Manual OMNI
              </span>
            </div>
          )}
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/80 bg-cyan-950/70 shadow-[0_0_20px_rgba(34,211,238,0.7)] animate-pulse">
            <span className="text-lg">📖</span>
          </div>
          <span className="text-[7px] font-mono font-bold text-cyan-300 bg-black/70 px-1 rounded mt-0.5">
            MANUAL
          </span>
        </div>

        {/* ─── 6. TERMINAL UTAMA (PAGE FRAME MAPPER) ────────────────── */}
        <div
          className="absolute z-20 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
          style={{
            left: `${terminalObj.x}px`,
            top: `${terminalObj.y}px`,
            width: `${terminalObj.w}px`,
            height: `${terminalObj.h}px`,
          }}
          onClick={() => setShowMapperModal(true)}
        >
          {isNearTerminal && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce z-30 pointer-events-none">
              <span className="rounded bg-amber-400 px-2 py-0.5 text-[9px] font-black text-black shadow-md">
                [E] Terminal Page Mapper
              </span>
            </div>
          )}
          <div className="relative flex h-12 w-14 items-center justify-center rounded-xl border-2 border-cyan-400 bg-gradient-to-b from-cyan-950 to-blue-950 shadow-[0_0_25px_rgba(34,211,238,0.9)] animate-pulse">
            <span className="text-xl">🖥️</span>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
          </div>
          <span className="text-[8px] font-mono font-black text-cyan-200 bg-black/80 px-1.5 py-0.2 rounded border border-cyan-400/40 mt-1">
            PAGE MAPPER
          </span>
        </div>

        {/* ─── 7. PINTU FIREWALL LASER (PENGHALANG VERTICAL) ────────── */}
        <div
          className={`absolute z-20 transition-all duration-500 flex flex-col items-center justify-center ${
            isAllModesCompleted
              ? "opacity-20 pointer-events-none"
              : "opacity-100 shadow-[0_0_25px_rgba(244,63,94,0.9)]"
          }`}
          style={{
            left: `${laserDoor.x}px`,
            top: `${laserDoor.y}px`,
            width: `${laserDoor.w}px`,
            height: `${laserDoor.h}px`,
          }}
        >
          <div
            className={`h-full w-full rounded border-2 flex items-center justify-center ${
              isAllModesCompleted
                ? "border-emerald-400 bg-emerald-500/20"
                : "border-rose-500 bg-rose-600/60 animate-pulse"
            }`}
          >
            <span className="text-[7px] font-mono font-black text-white -rotate-90 whitespace-nowrap">
              {isAllModesCompleted ? "BYPASSED" : "FIREWALL"}
            </span>
          </div>
        </div>

        {/* ─── 8. PORTAL AKHIR (MENUJU STAGE 4) ─────────────────────── */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform"
          style={{
            left: `${portalObj.x}px`,
            top: `${portalObj.y}px`,
            width: `${portalObj.w}px`,
            height: `${portalObj.h}px`,
          }}
          onClick={() => {
            if (isAllModesCompleted) {
              router.push("/stage/stage4");
            } else {
              triggerAlert("⚠️ Portal Terkunci! Selesaikan 3 mode Paging di Terminal Utama.");
            }
          }}
        >
          {isNearPortal && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce z-30 pointer-events-none">
              <span
                className={`rounded px-2 py-0.5 text-[9px] font-black shadow-md ${
                  isAllModesCompleted
                    ? "bg-emerald-400 text-black"
                    : "bg-rose-500 text-white"
                }`}
              >
                {isAllModesCompleted ? "[E] Masuk Stage 4 ➔" : "🔒 Terkunci"}
              </span>
            </div>
          )}
          <div
            className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
              isAllModesCompleted
                ? "border-emerald-400 bg-emerald-600/40 shadow-[0_0_35px_rgba(52,211,153,0.9)] animate-pulse"
                : "border-purple-500 bg-purple-900/30 shadow-[0_0_20px_rgba(168,85,247,0.5)] opacity-70"
            }`}
          />
          <div className="relative z-10 text-center pointer-events-none">
            <span className="text-2xl animate-spin inline-block" style={{ animationDuration: "8s" }}>
              🌀
            </span>
            <span
              className={`block text-[8px] font-black tracking-widest uppercase ${
                isAllModesCompleted ? "text-emerald-300" : "text-purple-300"
              }`}
            >
              {isAllModesCompleted ? "GATE 4 ON" : "GATE 4"}
            </span>
          </div>
        </div>

        {/* ─── 9. KOTAK KARGO CACHE (BISA DIDORONG) ─────────────────── */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center rounded-lg border-2 border-cyan-300 bg-cyan-900/90 shadow-[0_4px_16px_rgba(0,0,0,0.9),0_0_12px_rgba(34,211,238,0.4)] cursor-grab active:cursor-grabbing transition-transform"
          style={{
            left: `${boxX}px`,
            top: `${boxY}px`,
            width: `${BOX_W}px`,
            height: `${BOX_H}px`,
          }}
        >
          <span className="text-sm">💾</span>
          <span className="text-[7px] font-mono font-black text-cyan-200 tracking-wider">
            CACHE
          </span>
        </div>

        {/* ─── 10. SCANNER DRONE HAZARD (PATROLI HORIZONTAL) ────────── */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center transition-transform pointer-events-none"
          style={{
            left: `${droneX}px`,
            top: `${droneY}px`,
            width: `${DRONE_W}px`,
            height: `${DRONE_H}px`,
            transform: droneDirRef.current > 0 ? "scaleX(1)" : "scaleX(-1)",
          }}
        >
          <div className="relative flex items-center justify-center rounded-xl border border-rose-400/80 bg-rose-950/80 px-2 py-1 shadow-[0_0_15px_rgba(244,63,94,0.7)] animate-pulse">
            <span className="text-xs">🛸</span>
            <span className="ml-1 text-[7px] font-mono font-bold text-rose-200">
              SCAN
            </span>
          </div>
          <div className="w-10 h-10 bg-gradient-to-b from-rose-500/30 to-transparent pointer-events-none blur-[2px]" />
        </div>

        {/* ─── 11. KARAKTER ASTRONOT (SPRITE & ANIMASI SAMA SEPERTI STAGE 1 & 2) ─── */}
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: `${playerX}px`,
            top: `${playerY}px`,
            width: `${PLAYER_W}px`,
            height: `${PLAYER_H}px`,
          }}
        >
          {/* Bayangan di bawah kaki astronot */}
          <div className="absolute -bottom-1 left-1/2 h-2.5 w-8 -translate-x-1/2 rounded-full bg-black/70 blur-[1px]" />

          <div
            className="h-full w-full transition-transform duration-150 ease-out"
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
              className={`h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] transition-all ${
                isWalking && !isJumping ? "animate-waddle" : ""
              } ${
                isHurt ? "brightness-150 contrast-125 sepia hue-rotate-[300deg] animate-pulse" : ""
              }`}
              style={{
                transformOrigin: "bottom center",
              }}
            />
          </div>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: TERMINAL PAGE FRAME MAPPER (MINI-GAME UTAMA)                 */}
      {/* ===================================================================== */}
      {showMapperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 md:p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950/90 text-[#e9e4ff] shadow-[0_0_60px_rgba(34,211,238,0.3)]">
            
            {/* Header Modal Mini-Game */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/30 px-5 md:px-6 py-3.5 bg-[#0b081e]/90">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
                <h2 className="font-mono text-sm md:text-base font-black text-cyan-200 tracking-wider">
                  TERMINAL PAGE FRAME MAPPER // 32 KB RAM
                </h2>
              </div>

              {/* Tabs Ukuran Page (2 KB, 4 KB, 8 KB) */}
              <div className="flex items-center gap-2">
                {([2, 4, 8] as PageSizeMode[]).map((mode) => {
                  const isCompleted = completedModes[mode];
                  const isActive = activeMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setActiveMode(mode);
                        setSelectedPageId(null);
                      }}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-mono font-bold transition-all ${
                        isActive
                          ? "border-2 border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-105"
                          : "border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span>Page {mode} KB</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                          isCompleted
                            ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/50"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {isCompleted ? "✓" : "○"}
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowMapperModal(false)}
                  className="ml-2 rounded-xl border border-white/10 px-3 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition"
                >
                  ✕ Tutup
                </button>
              </div>
            </div>

            {/* Body 3 Kolom Interaktif */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
              
              {/* Petunjuk Aksi Dinamis */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-4 py-2 text-xs font-mono text-cyan-200">
                <div className="flex items-center gap-2">
                  <span className="text-base">💡</span>
                  <span>
                    {selectedPageId
                      ? `Page [${selectedPageId}] dipilih! Klik salah satu Frame KOSONG di kolom kanan untuk menempatkannya.`
                      : isAllPagesMapped
                      ? "Seluruh Page telah terpetakan! Selesaikan Tantangan Translasi Alamat di bawah ini."
                      : "Klik Page pada kolom kiri untuk memilih, lalu klik Frame kosong di kolom kanan."}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoMap}
                    disabled={isAllPagesMapped}
                    className="rounded-lg bg-cyan-500/30 border border-cyan-400/50 px-2.5 py-1 text-[11px] font-bold text-cyan-200 hover:bg-cyan-500/50 disabled:opacity-30 disabled:pointer-events-none transition"
                  >
                    ⚡ Auto-Map
                  </button>
                  <button
                    type="button"
                    onClick={handleResetMode}
                    className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-gray-300 hover:bg-white/15 transition"
                  >
                    ↺ Reset
                  </button>
                </div>
              </div>

              {/* Tampilan 3 Kolom */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                
                {/* 1. KOLOM KIRI: LOGICAL PAGES */}
                <div className="lg:col-span-4 rounded-xl border border-white/10 bg-[#0a071c]/80 p-3.5 flex flex-col min-h-[380px]">
                  <div className="border-b border-white/10 pb-2 mb-2.5 flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase">
                      1. LOGICAL PAGES
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">
                      {unmappedPages.length} tersisa
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {unmappedPages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-emerald-500/40 bg-emerald-950/20">
                        <span className="text-3xl mb-1">🎉</span>
                        <p className="text-xs font-bold text-emerald-300 font-mono">
                          Semua Page Terpetakan!
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Page Table terisi penuh. Silakan verifikasi Alamat Fisik di bawah.
                        </p>
                      </div>
                    ) : (
                      unmappedPages.map((page) => {
                        const isSelected = selectedPageId === page.id;
                        const isCyan = page.color === "cyan";

                        return (
                          <div
                            key={page.id}
                            onClick={() => handleSelectPage(page.id)}
                            className={`group relative cursor-pointer rounded-xl border p-2.5 transition-all duration-150 ${
                              isSelected
                                ? "border-amber-400 bg-amber-950/50 shadow-[0_0_15px_rgba(251,191,36,0.4)] ring-2 ring-amber-400"
                                : isCyan
                                ? "border-cyan-500/40 bg-cyan-950/30 hover:border-cyan-300 hover:bg-cyan-950/50"
                                : "border-purple-500/40 bg-purple-950/30 hover:border-purple-300 hover:bg-purple-950/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                                  isCyan
                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                                    : "bg-purple-500/20 text-purple-300 border border-purple-400/40"
                                }`}
                              >
                                {page.processName} ({page.processId})
                              </span>
                              <span className="font-mono text-xs font-bold text-white">
                                {page.id}
                              </span>
                            </div>

                            {/* Kapasitas bar terpakai vs fragmentasi internal */}
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-gray-300">
                                  Terpakai: <strong className="text-white">{page.usedKB} KB</strong> / {activeMode} KB
                                </span>
                                {page.internalFragKB > 0 && (
                                  <span className="text-rose-400 font-bold">
                                    Frag: {page.internalFragKB} KB
                                  </span>
                                )}
                              </div>

                              <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-white/10">
                                <div
                                  className={`h-full ${isCyan ? "bg-cyan-400" : "bg-purple-400"}`}
                                  style={{
                                    width: `${(page.usedKB / activeMode) * 100}%`,
                                  }}
                                />
                                {page.internalFragKB > 0 && (
                                  <div
                                    className="h-full bg-[repeating-linear-gradient(45deg,#f43f5e,#f43f5e_3px,#9f1239_3px,#9f1239_6px)]"
                                    style={{
                                      width: `${(page.internalFragKB / activeMode) * 100}%`,
                                    }}
                                    title={`Fragmentasi Internal: ${page.internalFragKB} KB`}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2. KOLOM TENGAH: REAL-TIME PAGE TABLE */}
                <div className="lg:col-span-4 rounded-xl border border-white/10 bg-[#0a071c]/80 p-3.5 flex flex-col min-h-[380px]">
                  <div className="border-b border-white/10 pb-2 mb-2.5 flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold tracking-wider text-purple-300 uppercase">
                      2. PAGE TABLE (REAL-TIME)
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">
                      {currentPages.length} Baris Entri
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 text-[10px]">
                          <th className="py-1.5 px-1">Proses</th>
                          <th className="py-1.5 px-1 text-center">Page #</th>
                          <th className="py-1.5 px-1 text-center">Frame #</th>
                          <th className="py-1.5 px-1 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {currentPages.map((page) => {
                          const mappedFrame = currentFrames.find(
                            (f) => f.mappedPage?.id === page.id
                          );
                          const isMapped = Boolean(mappedFrame);

                          return (
                            <tr
                              key={page.id}
                              className={`transition ${
                                isMapped ? "bg-white/[0.02]" : "opacity-60"
                              }`}
                            >
                              <td className="py-1.5 px-1">
                                <span
                                  className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                    page.processId === "A"
                                      ? "text-cyan-300 bg-cyan-950/60"
                                      : "text-purple-300 bg-purple-950/60"
                                  }`}
                                >
                                  Proc {page.processId}
                                </span>
                              </td>
                              <td className="py-1.5 px-1 text-center font-bold text-white">
                                P{page.pageIndex}
                              </td>
                              <td className="py-1.5 px-1 text-center">
                                {isMapped ? (
                                  <span className="rounded bg-emerald-950/80 border border-emerald-400/50 px-2 py-0.2 font-bold text-emerald-300">
                                    Frame {mappedFrame!.frameIndex}
                                  </span>
                                ) : (
                                  <span className="text-gray-600">—</span>
                                )}
                              </td>
                              <td className="py-1.5 px-1 text-right">
                                {isMapped ? (
                                  <span className="text-[9px] text-emerald-400">Mapped</span>
                                ) : (
                                  <span className="text-[9px] text-amber-400">Wait</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2.5 rounded-lg border border-white/10 bg-black/40 p-2 text-[10px] font-mono text-gray-300 flex justify-between">
                    <span>Overhead Page Table:</span>
                    <strong
                      className={
                        activeMode === 2
                          ? "text-rose-400"
                          : activeMode === 4
                          ? "text-amber-300"
                          : "text-emerald-300"
                      }
                    >
                      {activeMode === 2 ? "Tinggi (8 Baris)" : activeMode === 4 ? "Sedang (5 Baris)" : "Rendah (3 Baris)"}
                    </strong>
                  </div>
                </div>

                {/* 3. KOLOM KANAN: PHYSICAL RAM FRAMES */}
                <div className="lg:col-span-4 rounded-xl border border-white/10 bg-[#0a071c]/80 p-3.5 flex flex-col min-h-[380px]">
                  <div className="border-b border-white/10 pb-2 mb-2.5 flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold tracking-wider text-emerald-300 uppercase">
                      3. PHYSICAL RAM (32 KB)
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">
                      {currentFrames.length} Frames
                    </span>
                  </div>

                  <div
                    className={`flex-1 overflow-y-auto pr-1 grid gap-2 ${
                      activeMode === 2
                        ? "grid-cols-2"
                        : activeMode === 4
                        ? "grid-cols-2"
                        : "grid-cols-1"
                    }`}
                  >
                    {currentFrames.map((frame) => {
                      const isReserved = frame.isReserved;
                      const hasPage = Boolean(frame.mappedPage);
                      const page = frame.mappedPage;

                      if (isReserved) {
                        return (
                          <div
                            key={frame.frameIndex}
                            className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-2 flex flex-col justify-between opacity-80 cursor-not-allowed select-none min-h-[64px]"
                          >
                            <div className="flex items-center justify-between text-[9px] font-mono">
                              <span className="font-bold text-rose-300">
                                Frame {frame.frameIndex}
                              </span>
                              <span className="rounded bg-rose-500/30 px-1 py-0.2 text-[8px] font-black text-rose-200">
                                🔒 SYS
                              </span>
                            </div>
                            <div className="text-center my-0.5">
                              <span className="text-[11px] font-mono font-bold text-rose-400">
                                OMNI_SYS
                              </span>
                              <span className="block text-[8px] text-rose-300/70">
                                {frame.frameIndex * activeMode}K - {(frame.frameIndex + 1) * activeMode}K
                              </span>
                            </div>
                          </div>
                        );
                      }

                      if (hasPage && page) {
                        const isCyan = page.color === "cyan";
                        return (
                          <div
                            key={frame.frameIndex}
                            onClick={() => handleFrameClick(frame.frameIndex)}
                            className={`group relative cursor-pointer rounded-lg border p-2 flex flex-col justify-between transition-all min-h-[64px] ${
                              isCyan
                                ? "border-cyan-400 bg-cyan-950/40 hover:border-cyan-300 hover:shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                                : "border-purple-400 bg-purple-950/40 hover:border-purple-300 hover:shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                            }`}
                            title="Klik untuk melepas page ini dari frame"
                          >
                            <div className="flex items-center justify-between text-[9px] font-mono">
                              <span className="font-bold text-white">
                                Frame {frame.frameIndex}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.2 text-[8px] font-bold ${
                                  isCyan
                                    ? "bg-cyan-500/30 text-cyan-200"
                                    : "bg-purple-500/30 text-purple-200"
                                }`}
                              >
                                {page.id}
                              </span>
                            </div>

                            <div className="my-0.5 flex justify-between items-center text-[9px] font-mono text-gray-300">
                              <span>{page.processName}</span>
                              <span className="text-white font-bold">{page.usedKB} KB</span>
                            </div>

                            <div className="text-right">
                              <span className="text-[8px] font-mono text-rose-400 group-hover:underline">
                                ✕ Klik Lepas
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Frame Kosong
                      return (
                        <div
                          key={frame.frameIndex}
                          onClick={() => handleFrameClick(frame.frameIndex)}
                          className={`rounded-lg border border-dashed p-2 flex flex-col justify-between transition-all min-h-[64px] ${
                            activeSelectedPage
                              ? "border-amber-400/80 bg-amber-950/25 cursor-pointer hover:border-amber-300 hover:scale-102 animate-pulse"
                              : "border-slate-700 bg-slate-900/30 hover:border-slate-500"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono text-gray-500">
                            <span>Frame {frame.frameIndex}</span>
                            <span>{frame.frameIndex * activeMode}K</span>
                          </div>
                          <div className="text-center my-0.5">
                            <span
                              className={`text-[10px] font-mono font-bold ${
                                activeSelectedPage ? "text-amber-300" : "text-gray-600"
                              }`}
                            >
                              {activeSelectedPage ? `+ Pasang ${activeSelectedPage.id}` : "[ KOSONG ]"}
                            </span>
                          </div>
                          <span className="text-[8px] font-mono text-gray-500 text-right">
                            Slot {activeMode} KB
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* TANTANGAN VERIFIKASI TRANSLASI ALAMAT (BYPASS FIREWALL) */}
              <div
                className={`rounded-xl border p-4 transition-all ${
                  isAllPagesMapped
                    ? "border-amber-400/70 bg-gradient-to-b from-[#1c1206]/90 to-[#0b0602]/95 shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                    : "border-slate-800 bg-slate-950/50 opacity-60"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{isAllPagesMapped ? "⚡" : "🔒"}</span>
                    <div>
                      <h3 className="text-xs md:text-sm font-bold font-mono text-amber-300">
                        TANTANGAN KUNCI FIREWALL: TRANSLASI ALAMAT FISIK (MODE {activeMode} KB)
                      </h3>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {isAllPagesMapped
                          ? "Gunakan Page Table di atas untuk menghitung Physical Address yang tepat."
                          : "Petakan seluruh page ke frame fisik terlebih dahulu untuk membuka formulir ini."}
                      </p>
                    </div>
                  </div>

                  {completedModes[activeMode] && (
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-400/50 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-300">
                      ✓ MODE {activeMode} KB SELESAI
                    </span>
                  )}
                </div>

                {isAllPagesMapped ? (
                  <div className="mt-3 space-y-3">
                    <div className="rounded-lg border border-white/10 bg-black/50 p-3 text-xs font-mono">
                      <div className="text-cyan-300 font-bold mb-1">
                        🎯 TARGET TRANSLASI: {activeChallenge.description}
                      </div>
                      <p className="text-gray-300 text-[11px]">
                        Rumus Hardware MMU: <br />
                        1. Page Number = floor({activeChallenge.logicalAddressKB} / {activeMode}) = <strong className="text-cyan-300">Page {activeChallenge.targetPageIndex}</strong><br />
                        2. Offset = {activeChallenge.logicalAddressKB} % {activeMode} = <strong className="text-amber-300">{activeChallenge.offsetKB} KB</strong><br />
                        3. Physical Address = (Nomor Frame Page {activeChallenge.targetPageIndex} × {activeMode}) + {activeChallenge.offsetKB} KB
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <input
                          type="number"
                          value={challengeInputs[activeMode]}
                          onChange={(e) =>
                            setChallengeInputs((prev) => ({
                              ...prev,
                              [activeMode]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleVerifyTranslation();
                          }}
                          placeholder="Masukkan Physical Address (KB)..."
                          className="w-full rounded-lg border border-white/20 bg-black/60 px-3.5 py-2 font-mono text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyTranslation}
                        className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 font-mono font-bold text-xs text-black shadow-lg transition hover:scale-105 active:scale-95"
                      >
                        [ VERIFIKASI ALAMAT ]
                      </button>
                    </div>

                    {challengeResults[activeMode] && (
                      <div
                        className={`rounded-lg border p-3 text-xs font-mono leading-relaxed ${
                          challengeResults[activeMode]?.isCorrect
                            ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-300"
                            : "border-rose-500/60 bg-rose-950/40 text-rose-300"
                        }`}
                      >
                        <p className="font-bold mb-0.5">
                          {challengeResults[activeMode]?.isCorrect
                            ? "✅ OTENTIKASI BERHASIL!"
                            : "❌ VERIFIKASI GAGAL!"}
                        </p>
                        <p className="text-[11px]">{challengeResults[activeMode]?.message}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs font-mono text-gray-500">
                    [Tantangan akan terbuka setelah semua page ditempatkan ke Frame Fisik]
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: MANUAL OMNI (PANDUAN RUMUS RINGKAS)                           */}
      {/* ===================================================================== */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cyan-400/50 bg-[#0c081e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_60px_rgba(34,211,238,0.3)] space-y-4">
            
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
                <h3 className="font-mono text-base font-bold text-cyan-300">
                  OMNI DATALOG // PANDUAN PAGING &amp; TRANSLASI ALAMAT
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-400 hover:text-white"
              >
                ✕ Tutup (ESC)
              </button>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-gray-200 leading-relaxed font-sans">
              <section className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
                <h4 className="font-bold text-cyan-300 font-mono mb-1">
                  1. Mengapa Menggunakan Paging?
                </h4>
                <p className="text-gray-300 text-xs">
                  Paging membagi memori logis proses menjadi blok berukuran seragam bernama <strong className="text-white">Page</strong>, dan memori fisik RAM menjadi <strong className="text-white">Frame</strong> berukuran persis sama. Hal ini sepenuhnya menghilangkan <strong className="text-rose-300">Fragmentasi Eksternal</strong> karena proses dapat ditempatkan di frame mana pun yang bebas secara terpisah (*non-contiguous*).
                </p>
              </section>

              <section className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
                <h4 className="font-bold text-amber-300 font-mono mb-1">
                  2. Fragmentasi Internal (Internal Fragmentation)
                </h4>
                <p className="text-gray-300 text-xs">
                  Karena ukuran page bersifat tetap, sisa memori pada <strong className="text-white">page terakhir proses</strong> yang tidak terpakai habis akan terbuang sia-sia.
                  <br />
                  <span className="font-mono text-amber-200 text-[11px]">
                    Rumus: Fragmentasi Internal = Ukuran Page - Memori Terpakai Aktual
                  </span>
                </p>
              </section>

              <section className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-4">
                <h4 className="font-bold text-purple-300 font-mono mb-1">
                  3. Rumus Translasi Alamat Fisik (MMU Hardware)
                </h4>
                <div className="font-mono text-xs space-y-1 bg-black/50 p-3 rounded-lg border border-purple-500/30 text-purple-200">
                  <p>&bull; Page Number = floor(Logical Address / Page Size)</p>
                  <p>&bull; Offset = Logical Address % Page Size</p>
                  <p className="pt-1 text-white font-bold">
                    &bull; Physical Address = (Frame Number × Page Size) + Offset
                  </p>
                </div>
              </section>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="rounded-xl bg-cyan-500 px-5 py-2 font-mono text-xs font-bold text-black shadow-lg hover:bg-cyan-400"
              >
                Mengerti &amp; Tutup ➔
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: LAPORAN KINERJA ALGORITMA (EVALUASI AKADEMIK AKHIR)          */}
      {/* ===================================================================== */}
      {showMetricsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-amber-400/50 bg-[#0c081e]/98 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_80px_rgba(251,191,36,0.3)] space-y-5">
            
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-amber-400 animate-ping" />
                <div>
                  <h3 className="font-mono text-base md:text-lg font-black text-amber-300 tracking-wider">
                    LAPORAN METRIK KINERJA: EVALUASI TRADE-OFF PAGING
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    Perbandingan Fragmentasi Internal vs Overhead Ukuran Page Table (RAM 32 KB)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMetricsModal(false)}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-400 hover:text-white"
              >
                ✕ Tutup
              </button>
            </div>

            {/* GRAFIK 1: TOTAL FRAGMENTASI INTERNAL (KB) */}
            <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-cyan-300">
                  📊 GRAFIK 1: TOTAL FRAGMENTASI INTERNAL (KB)
                </span>
                <span className="text-[10px] text-gray-400">
                  (Makin Rendah = Pemborosan Memori Makin Sedikit)
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                {allMetrics.map((item) => {
                  const barWidth = (item.totalInternalFragKB / 10) * 100;
                  return (
                    <div key={item.pageSizeKB} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-gray-300">
                          Mode <strong className="text-white">Page {item.pageSizeKB} KB</strong>
                          {item.pageSizeKB === 4 && (
                            <span className="ml-1.5 rounded bg-amber-500/20 text-amber-300 px-1 py-0.2 text-[9px] border border-amber-400/40">
                              Sweet Spot
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-white">
                          {item.totalInternalFragKB} KB Terbuang
                        </span>
                      </div>

                      <div className="h-5 w-full rounded-lg bg-slate-900 border border-white/10 overflow-hidden flex items-center p-0.5">
                        <div
                          className={`h-full rounded transition-all duration-700 flex items-center justify-end pr-2 text-[9px] font-mono font-bold text-black ${
                            item.pageSizeKB === 2
                              ? "bg-emerald-400"
                              : item.pageSizeKB === 4
                              ? "bg-amber-400"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.max(barWidth, 14)}%` }}
                        >
                          {item.totalInternalFragKB} KB
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GRAFIK 2: OVERHEAD ENTRI PAGE TABLE */}
            <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-purple-300">
                  📈 GRAFIK 2: OVERHEAD ENTRI PAGE TABLE (JUMLAH BARIS TABEL)
                </span>
                <span className="text-[10px] text-gray-400">
                  (Makin Sedikit = Struktur Data Kernel Makin Ringan)
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                {allMetrics.map((item) => {
                  const barWidth = (item.totalPages / 8) * 100;
                  return (
                    <div key={item.pageSizeKB} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-gray-300">
                          Mode <strong className="text-white">Page {item.pageSizeKB} KB</strong>
                        </span>
                        <span className="font-bold text-white">
                          {item.totalPages} Entri Baris Tabel
                        </span>
                      </div>

                      <div className="h-5 w-full rounded-lg bg-slate-900 border border-white/10 overflow-hidden flex items-center p-0.5">
                        <div
                          className={`h-full rounded transition-all duration-700 flex items-center justify-end pr-2 text-[9px] font-mono font-bold text-black ${
                            item.pageSizeKB === 2
                              ? "bg-rose-500"
                              : item.pageSizeKB === 4
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                          }`}
                          style={{ width: `${Math.max(barWidth, 14)}%` }}
                        >
                          {item.totalPages} Entri
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* KESIMPULAN AKADEMIS SISTEM OPERASI */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-xs text-gray-200 leading-relaxed space-y-1.5 font-sans">
              <h4 className="font-bold text-emerald-300 font-mono text-sm flex items-center gap-1.5">
                <span>💡 KESIMPULAN ARSITEKTUR: MENGAPA PAGE SIZE 4 KB MENJADI STANDAR MODERN?</span>
              </h4>
              <p className="text-gray-300 text-[11px]">
                Dalam desain sistem operasi dan prosesor modern (seperti arsitektur x86 dan ARM64), ukuran <strong className="text-white">Page 4 KB</strong> dipilih sebagai standar utama karena menghasilkan kompromi (*trade-off*) paling seimbang:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-[11px] pt-1">
                <li>
                  <strong className="text-white">Page 2 KB (Kecil):</strong> Fragmentasi internal minim (hanya 2 KB), namun memicu <strong className="text-rose-300">8 baris entri tabel</strong> (overhead memori kernel membengkak).
                </li>
                <li>
                  <strong className="text-white">Page 8 KB (Besar):</strong> Tabel sangat ringkas (hanya 3 entri), tetapi menyebabkan <strong className="text-rose-400">10 KB fragmentasi internal</strong> (~41.7% alokasi memori terbuang sia-sia).
                </li>
                <li>
                  <strong className="text-amber-300">Page 4 KB (Sedang):</strong> Merupakan titik temu paling efisien (*sweet spot*) antara efisiensi pemanfaatan ruang fisik dan ukuran Page Table di kernel.
                </li>
              </ul>
            </div>

            {/* Tombol Aksi Modal */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-500/30 pt-3">
              <button
                type="button"
                onClick={() => setShowMetricsModal(false)}
                className="rounded-xl border border-white/20 px-4 py-2 text-xs font-mono font-semibold text-gray-300 hover:bg-white/10"
              >
                Kembali ke Ruangan
              </button>

              <button
                type="button"
                onClick={() => router.push("/stage/stage4")}
                className="rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-2.5 font-mono text-xs md:text-sm font-black text-black shadow-[0_0_25px_rgba(52,211,153,0.6)] transition hover:scale-105 active:scale-95"
              >
                Masuk ke Stage 4 🚀
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── KEYFRAME ANIMASI WADDLE (PERSIS SEPERTI STAGE 1 & 2) ─── */}
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
      `}</style>

    </main>
  );
}
