"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeadlockBackground from "@/components/DeadlockBackground";
import AlienLifeSupportMiniGame from "@/components/AlienLifeSupportMiniGame";
import DeadlockMaterialModal from "@/components/DeadlockMaterialModal";
import DeadlockQuizModal from "@/components/DeadlockQuizModal";

export default function Stage4Page() {
  const router = useRouter();

  // Dimensi Kanvas Arena Platformer 16:9
  const GAME_WIDTH = 1000;
  const GAME_HEIGHT = 600;
  const GROUND_Y = 520;

  // Dimensi Karakter Pemain Astronot
  const PLAYER_W = 48;
  const PLAYER_H = 68;
  const MOVE_SPEED = 4.5;
  const JUMP_POWER = -12.5;
  const GRAVITY = 0.6;

  // Dimensi Kotak Kargo Tabung Sumber Daya (Pushable Resource Box)
  const BOX_W = 56;
  const BOX_H = 56;

  // Titik Awal (Spawn) Pemain
  const SPAWN_X = 60;
  const SPAWN_Y = GROUND_Y - PLAYER_H;

  // 1. State Pemain & Fisika
  const [playerX, setPlayerX] = useState(SPAWN_X);
  const [playerY, setPlayerY] = useState(SPAWN_Y);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isWalking, setIsWalking] = useState(false);

  // 2. State Kotak Kargo Tabung Sumber Daya
  const [boxX, setBoxX] = useState(240);
  const [boxY, setBoxY] = useState(GROUND_Y - BOX_H);
  const [boxVelocityY, setBoxVelocityY] = useState(0);

  // 3. Rintangan Bergerak: Deadlock Laser Grid Sensor (bergerak vertikal)
  const [deadlockLaserY, setDeadlockLaserY] = useState(240);
  const [laserDir, setLaserDir] = useState<"up" | "down">("down");

  // 4. State Modal & Mini-Game
  const [showMaterial, setShowMaterial] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [isCoreEvaluated, setIsCoreEvaluated] = useState(false);

  // Status Kedekatan Pemain dengan Objek Interaktif (Proximity Triggers)
  const [isNearTerminal, setIsNearTerminal] = useState(false);
  const [isNearBankerConsole, setIsNearBankerConsole] = useState(false);
  const [isNearDiningHolo, setIsNearDiningHolo] = useState(false);
  const [isNearPortal, setIsNearPortal] = useState(false);

  // Pesan Toast Notifikasi
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3800);
  };

  // Daftar Platform Pijakan Bertema Ruang Reaktor Sumber Daya
  const platforms = [
    { x: 0, y: GROUND_Y, w: 320, h: 80, label: "CHAMBER BAY A (INPUT)" },
    { x: 520, y: GROUND_Y, w: 480, h: 80, label: "RESOURCE MATRIX CORE" },
    { x: 210, y: 395, w: 150, h: 22, label: "DINING PHILOSOPHERS DECK" },
    { x: 440, y: 310, w: 180, h: 22, label: "OMNI DATALOG CONSOLE" },
    { x: 690, y: 220, w: 180, h: 22, label: "LIFE-SUPPORT BANKER DOCK" },
    { x: 900, y: 150, w: 100, h: 22, label: "GATE PORTAL 5" },
  ];

  // Rintangan 1: Celah Kehampaan Deadlock (The Void Trap Pit)
  const hazardPit = { x: 320, y: 530, w: 200, h: 70 };

  // Rintangan 2: Deadlock Energy Beam Vertikal
  const laserHazard = { x: 635, w: 22, h: 100 };

  // Objek Interaktif:
  // 1. Terminal Materi Deadlock (di platform tengah Y: 310)
  const terminalObj = { x: 505, y: 310 - 55, w: 45, h: 55 };

  // 2. Hologram Meja Makan Dining Philosophers (di platform kiri-tengah Y: 395)
  const diningHoloObj = { x: 260, y: 395 - 55, w: 50, h: 55 };

  // 3. Stasiun Life-Support Banker Console (di platform kanan Y: 220)
  const bankerStationObj = { x: 755, y: 220 - 65, w: 60, h: 65 };

  // 4. Portal Pintu Menuju Stage 5 (di platform atas kanan Y: 150)
  const portalObj = { x: 920, y: 150 - 90, w: 60, h: 90 };

  // Refs untuk Game Loop 60 FPS
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: playerX, y: playerY, vy: velocityY, jumping: isJumping });
  const boxRef = useRef({ x: boxX, y: boxY, vy: boxVelocityY });

  playerRef.current = { x: playerX, y: playerY, vy: velocityY, jumping: isJumping };
  boxRef.current = { x: boxX, y: boxY, vy: boxVelocityY };

  // Reset Posisi Pemain jika Jatuh ke Celah Kehampaan
  const resetPlayerToSpawn = () => {
    setPlayerX(SPAWN_X);
    setPlayerY(SPAWN_Y);
    setVelocityY(0);
    setIsJumping(false);
    setIsWalking(false);
    playerRef.current = { x: SPAWN_X, y: SPAWN_Y, vy: 0, jumping: false };
    showToast("⚠️ Terjebak dalam Void Trap! Posisi dikembalikan ke titik awal.");
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Interaksi Tombol E
      if (key === "e") {
        if (isNearBankerConsole && !showMiniGame) {
          setShowMiniGame(true);
          return;
        }
        if (isNearDiningHolo && !showMiniGame) {
          setShowMiniGame(true);
          return;
        }
        if (isNearTerminal && !showMaterial) {
          setShowMaterial(true);
          return;
        }
        if (isNearPortal && !showQuiz) {
          setShowQuiz(true);
          return;
        }
      }

      // Tombol Escape untuk menutup modal
      if (key === "escape") {
        setShowMaterial(false);
        setShowQuiz(false);
        setShowMiniGame(false);
        return;
      }

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        if (!showMiniGame) {
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
    isNearTerminal,
    isNearBankerConsole,
    isNearDiningHolo,
    isNearPortal,
    showMaterial,
    showQuiz,
    showMiniGame,
  ]);

  // Platformer Physics Game Loop 60 FPS
  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      if (!showMaterial && !showQuiz && !showMiniGame) {
        let p = { ...playerRef.current };
        let b = { ...boxRef.current };
        const keys = keysPressed.current;

        // 1. Gerakan Rintangan Deadlock Laser Grid Sensor (Naik-Turun)
        setDeadlockLaserY((prevY) => {
          let nextY = prevY;
          if (laserDir === "down") {
            nextY += 1.6;
            if (nextY >= 350) setLaserDir("up");
          } else {
            nextY -= 1.6;
            if (nextY <= 180) setLaserDir("down");
          }
          return nextY;
        });

        // 2. Input Horizontal Pemain
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

        // 3. Lompatan Pemain
        const wantsJump = keys.has("w") || keys.has("arrowup") || keys.has(" ");
        if (wantsJump && !p.jumping) {
          p.vy = JUMP_POWER;
          p.jumping = true;
        }

        // Terapkan Gravitasi
        p.vy += GRAVITY;
        p.y += p.vy;

        b.vy += GRAVITY;
        b.y += b.vy;

        // 4. Tabrakan Kotak Tabung Sumber Daya dengan Platform
        for (const plat of platforms) {
          if (
            b.x + BOX_W > plat.x &&
            b.x < plat.x + plat.w &&
            b.y + BOX_H >= plat.y &&
            b.y + BOX_H - b.vy <= plat.y + 10
          ) {
            b.y = plat.y - BOX_H;
            b.vy = 0;
          }
        }

        // Jika Kotak Kargo jatuh ke Hazard Pit
        if (
          b.x + BOX_W > hazardPit.x &&
          b.x < hazardPit.x + hazardPit.w &&
          b.y + BOX_H > hazardPit.y
        ) {
          b.x = 240;
          b.y = GROUND_Y - BOX_H;
          b.vy = 0;
        }

        // 5. Interaksi Dorong Kotak Kargo oleh Pemain (Push Mechanics)
        const proposedPlayerX = p.x + moveX;

        const isCollidingWithBox =
          proposedPlayerX + PLAYER_W > b.x &&
          proposedPlayerX < b.x + BOX_W &&
          p.y + PLAYER_H > b.y + 6 &&
          p.y < b.y + BOX_H;

        if (isCollidingWithBox) {
          if (moveX > 0) {
            // Mendorong ke kanan
            const pushDistance = proposedPlayerX + PLAYER_W - b.x;
            b.x += pushDistance;
            p.x = b.x - PLAYER_W;
          } else if (moveX < 0) {
            // Mendorong ke kiri
            const pushDistance = b.x + BOX_W - proposedPlayerX;
            b.x -= pushDistance;
            p.x = b.x + BOX_W;
          }
        } else {
          p.x = proposedPlayerX;
        }

        // Batas Layar Kiri & Kanan
        p.x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_W, p.x));
        b.x = Math.max(0, Math.min(GAME_WIDTH - BOX_W, b.x));

        // 6. Tabrakan Pemain Berpijak di Atas Kotak Kargo
        const isStandingOnBox =
          p.x + PLAYER_W - 8 > b.x &&
          p.x + 8 < b.x + BOX_W &&
          p.y + PLAYER_H >= b.y &&
          p.y + PLAYER_H - p.vy <= b.y + 12;

        if (isStandingOnBox) {
          p.y = b.y - PLAYER_H;
          p.vy = 0;
          p.jumping = false;
        } else {
          // Tabrakan Pemain dengan Platform
          let onPlatform = false;
          for (const plat of platforms) {
            const isHorizontallyOver =
              p.x + PLAYER_W - 8 > plat.x && p.x + 8 < plat.x + plat.w;
            const isVerticallyAtSurface =
              p.y + PLAYER_H >= plat.y && p.y + PLAYER_H - p.vy <= plat.y + 12;

            if (isHorizontallyOver && isVerticallyAtSurface) {
              p.y = plat.y - PLAYER_H;
              p.vy = 0;
              p.jumping = false;
              onPlatform = true;
              break;
            }
          }

          if (!onPlatform && p.vy !== 0) {
            p.jumping = true;
          }
        }

        // 7. Rintangan Lubang Void Trap
        if (
          p.x + PLAYER_W > hazardPit.x + 10 &&
          p.x < hazardPit.x + hazardPit.w - 10 &&
          p.y + PLAYER_H >= hazardPit.y
        ) {
          resetPlayerToSpawn();
          return;
        }

        // 8. Rintangan Laser Grid Deadlock Sensor
        const isHitLaser =
          p.x + PLAYER_W > laserHazard.x &&
          p.x < laserHazard.x + laserHazard.w &&
          p.y + PLAYER_H > deadlockLaserY &&
          p.y < deadlockLaserY + laserHazard.h;

        if (isHitLaser) {
          resetPlayerToSpawn();
          showToast("⚡ Tersengat Deadlock Laser Grid! Resonansi memutus pergerakan.");
          return;
        }

        // Batas Bawah Layar
        if (p.y > GAME_HEIGHT) {
          resetPlayerToSpawn();
          return;
        }

        // 9. Deteksi Jarak Dekat Objek Interaktif (Proximity Check)
        const checkProximity = (obj: { x: number; y: number; w: number; h: number }, range = 50) => {
          const centerX = p.x + PLAYER_W / 2;
          const centerY = p.y + PLAYER_H / 2;
          const objCenterX = obj.x + obj.w / 2;
          const objCenterY = obj.y + obj.h / 2;
          return (
            Math.abs(centerX - objCenterX) < obj.w / 2 + range &&
            Math.abs(centerY - objCenterY) < obj.h / 2 + range
          );
        };

        setIsNearTerminal(checkProximity(terminalObj));
        setIsNearDiningHolo(checkProximity(diningHoloObj));
        setIsNearBankerConsole(checkProximity(bankerStationObj));
        setIsNearPortal(checkProximity(portalObj));

        // Update State
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
  }, [showMaterial, showQuiz, showMiniGame, laserDir]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-3 md:p-4 select-none">
      {/* HUD Info Atas */}
      <div className="mb-3 flex w-full max-w-[1000px] flex-wrap items-center justify-between gap-2 rounded-xl border border-purple-500/40 bg-[#09061a]/85 px-4 py-2.5 text-xs text-gray-300 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.25)]">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-ping" />
          <span className="font-bold tracking-wider text-purple-300 uppercase font-mono">
            STAGE 4 // DEADLOCK DAN PENANGANANNYA
          </span>
          <span className="rounded bg-pink-500/20 px-2 py-0.5 text-[10px] text-pink-300 font-mono">
            The Void Trap &amp; Life-Support Core
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowMaterial(true)}
            className="rounded-lg border border-purple-400/40 bg-purple-500/15 px-2.5 py-1 text-[11px] font-bold text-purple-200 hover:bg-purple-500/30 transition"
          >
            📖 Materi Deadlock [E]
          </button>
          <button
            type="button"
            onClick={() => setShowMiniGame(true)}
            className="rounded-lg border border-cyan-400/40 bg-cyan-500/20 px-2.5 py-1 text-[11px] font-bold text-cyan-200 hover:bg-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.4)] transition"
          >
            🎮 Banker Life-Support [E]
          </button>
          <button
            type="button"
            onClick={() => setShowQuiz(true)}
            className="rounded-lg border border-pink-400/40 bg-pink-500/20 px-2.5 py-1 text-[11px] font-bold text-pink-200 hover:bg-pink-500/30 transition"
          >
            🔓 Portal Pintu 5 [E]
          </button>
        </div>
      </div>

      {/* Arena Game 2D Platformer Koridor Life-Support Core (1000px x 600px) */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-purple-500/50 bg-[#070415] shadow-[0_0_60px_rgba(168,85,247,0.3)]"
        style={{ width: `${GAME_WIDTH}px`, height: `${GAME_HEIGHT}px` }}
      >
        {/* Latar Belakang Animasi Deadlock Reactor */}
        <DeadlockBackground />

        {/* 1. Platform Pijakan Bertema Reaktor Sumber Daya */}
        {platforms.map((plat, idx) => (
          <div
            key={idx}
            className="absolute rounded-t-lg border-t-2 border-purple-400/80 bg-gradient-to-b from-[#1b103e] via-[#0f0a25] to-[#070514] shadow-[0_4px_25px_rgba(0,0,0,0.9)]"
            style={{
              left: `${plat.x}px`,
              top: `${plat.y}px`,
              width: `${plat.w}px`,
              height: `${plat.h}px`,
            }}
          >
            {/* Tekstur Pipa Aliran Neon */}
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-400/50 via-cyan-400/40 to-pink-500/50" />
            <div className="p-1.5 flex justify-between items-center text-[9px] font-mono text-purple-300/70">
              <span>{plat.label}</span>
              <span className="text-[8px] text-gray-500">RES-GRID</span>
            </div>
          </div>
        ))}

        {/* 2. Rintangan 1: Celah Kehampaan Deadlock (The Void Trap Pit) */}
        <div
          className="absolute flex flex-col items-center justify-center rounded-lg border-2 border-red-500/80 bg-red-950/60 shadow-[0_0_35px_rgba(239,68,68,0.7)] animate-pulse"
          style={{
            left: `${hazardPit.x}px`,
            top: `${hazardPit.y}px`,
            width: `${hazardPit.w}px`,
            height: `${hazardPit.h}px`,
          }}
        >
          <span className="text-xs md:text-sm font-black tracking-widest text-red-300 animate-bounce">
            ⚡ DEADLOCK VOID TRAP ⚡
          </span>
          <span className="text-[10px] text-red-400 font-mono">
            Circular Wait Abyss - Jatuh Menyebabkan Respawn
          </span>
        </div>

        {/* 3. Rintangan 2: Deadlock Energy Beam Sensor Vertikal */}
        <div
          className="absolute flex flex-col items-center justify-between"
          style={{
            left: `${laserHazard.x}px`,
            top: `${deadlockLaserY}px`,
            width: `${laserHazard.w}px`,
            height: `${laserHazard.h}px`,
          }}
        >
          <div className="h-2 w-full rounded bg-purple-400 shadow-[0_0_10px_#c084fc]" />
          <div className="h-full w-1.5 bg-gradient-to-b from-pink-500 via-purple-400 to-red-500 shadow-[0_0_20px_#ec4899] animate-pulse" />
          <div className="h-2 w-full rounded bg-purple-400 shadow-[0_0_10px_#c084fc]" />
        </div>

        {/* 4. Kotak Kargo Tabung Sumber Daya (Pushable Resource Capsule Box) */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center rounded-xl border-2 border-purple-400/90 bg-gradient-to-br from-purple-800 via-indigo-900 to-[#120a30] shadow-[0_0_25px_rgba(168,85,247,0.6)] cursor-grab active:cursor-grabbing"
          style={{
            left: `${boxX}px`,
            top: `${boxY}px`,
            width: `${BOX_W}px`,
            height: `${BOX_H}px`,
          }}
        >
          <span className="text-xl">🧪</span>
          <span className="text-[8px] font-black text-purple-200 tracking-wider">POD-CAPSULE</span>
        </div>

        {/* 5. Terminal Interaktif Datalog Materi Deadlock */}
        <div
          className="absolute z-10 flex flex-col items-center cursor-pointer"
          style={{
            left: `${terminalObj.x}px`,
            top: `${terminalObj.y}px`,
            width: `${terminalObj.w}px`,
            height: `${terminalObj.h}px`,
          }}
          onClick={() => setShowMaterial(true)}
        >
          {isNearTerminal && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce">
              <span className="rounded bg-purple-400 px-2 py-0.5 text-[10px] font-black text-black shadow-[0_0_12px_rgba(168,85,247,0.8)]">
                [E] Datalog Deadlock
              </span>
            </div>
          )}
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/80 bg-purple-950/70 shadow-[0_0_25px_rgba(168,85,247,0.7)] animate-pulse">
            <span className="text-xl">📜</span>
          </div>
          <div className="h-3 w-5 bg-pink-500/50 rounded-t" />
        </div>

        {/* 6. Meja Hologram Dining Philosophers */}
        <div
          className="absolute z-10 flex flex-col items-center cursor-pointer"
          style={{
            left: `${diningHoloObj.x}px`,
            top: `${diningHoloObj.y}px`,
            width: `${diningHoloObj.w}px`,
            height: `${diningHoloObj.h}px`,
          }}
          onClick={() => setShowMiniGame(true)}
        >
          {isNearDiningHolo && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce">
              <span className="rounded bg-pink-400 px-2 py-0.5 text-[10px] font-black text-black shadow-[0_0_12px_rgba(244,114,182,0.8)]">
                [E] Dining Philosophers
              </span>
            </div>
          )}
          <div className="flex h-11 w-12 items-center justify-center rounded-xl border border-pink-400/80 bg-pink-950/70 shadow-[0_0_25px_rgba(236,72,153,0.7)]">
            <span className="text-xl animate-spin" style={{ animationDuration: "10s" }}>
              🍝
            </span>
          </div>
          <div className="h-3 w-6 bg-purple-500/50 rounded-t" />
        </div>

        {/* 7. Stasiun Konsol Banker Life-Support (Mini-Game Launcher) */}
        <div
          className="absolute z-10 flex flex-col items-center cursor-pointer"
          style={{
            left: `${bankerStationObj.x}px`,
            top: `${bankerStationObj.y}px`,
            width: `${bankerStationObj.w}px`,
            height: `${bankerStationObj.h}px`,
          }}
          onClick={() => setShowMiniGame(true)}
        >
          <div className="absolute -top-7 whitespace-nowrap animate-bounce">
            <span className="rounded bg-cyan-400 px-2 py-0.5 text-[10px] font-black text-black shadow-[0_0_12px_rgba(34,211,238,0.8)]">
              {isNearBankerConsole ? "[E] Life-Support Banker" : "Banker Core"}
            </span>
          </div>
          <div className="flex h-12 w-14 items-center justify-center rounded-xl border-2 border-cyan-400 bg-cyan-950/80 shadow-[0_0_30px_rgba(34,211,238,0.7)]">
            <span className="text-2xl animate-pulse">🏦</span>
          </div>
          <div className="h-3 w-6 bg-purple-400/60 rounded-t" />
        </div>

        {/* 8. Portal Menuju Stage 5 (The Void Trap / Penjadwalan Disk) */}
        <div
          className="absolute z-10 flex flex-col items-center justify-center cursor-pointer"
          style={{
            left: `${portalObj.x}px`,
            top: `${portalObj.y}px`,
            width: `${portalObj.w}px`,
            height: `${portalObj.h}px`,
          }}
          onClick={() => setShowQuiz(true)}
        >
          {isNearPortal && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce">
              <span className="rounded bg-emerald-400 px-2 py-0.5 text-[10px] font-black text-black shadow-[0_0_12px_rgba(52,211,153,0.8)]">
                [E] Masuk Portal 5
              </span>
            </div>
          )}
          <div className="absolute inset-0 rounded-full border-2 border-purple-400 bg-gradient-to-t from-purple-800/60 via-pink-600/40 to-cyan-400/40 shadow-[0_0_40px_rgba(168,85,247,0.9)] animate-pulse" />
          <div className="relative z-10 text-center">
            <span className="text-2xl animate-spin inline-block" style={{ animationDuration: "8s" }}>
              🌀
            </span>
            <span className="block text-[8px] font-black tracking-widest text-purple-200 uppercase">
              PORTAL 5
            </span>
          </div>
        </div>

        {/* 9. Karakter Astronot */}
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
              className="h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            />
          </div>
        </div>
      </div>

      {/* Navigasi Cepat Bawah & Notifikasi */}
      <div className="mt-3 flex w-full max-w-[1000px] flex-wrap items-center justify-between gap-2 text-xs text-gray-400 font-mono">
        <div className="flex items-center gap-4">
          <Link href="/stage/stage3" className="hover:text-purple-300 transition">
            ← Kembali ke Stage 3
          </Link>
          <span className="text-gray-600">|</span>
          <Link href="/stage/stage5" className="hover:text-cyan-300 transition">
            Lanjut ke Stage 5 (Storage Core) →
          </Link>
          <span className="text-gray-600">|</span>
          <Link href="/" className="hover:text-purple-300 transition">
            Menu Utama
          </Link>
        </div>

        <div className="text-gray-400">
          Kontrol: <span className="text-purple-300 font-bold">[A/D]</span> Gerak •{" "}
          <span className="text-purple-300 font-bold">[W / Spasi]</span> Lompat •{" "}
          <span className="text-purple-300 font-bold">[E]</span> Interaksi
        </div>
      </div>

      {/* Notifikasi Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 z-50 rounded-xl border border-purple-500/40 bg-[#09061a]/95 px-5 py-2.5 text-xs text-purple-200 shadow-[0_0_25px_rgba(168,85,247,0.4)] backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}

      {/* MODAL 1: DATALOG MATERI DEADLOCK */}
      <DeadlockMaterialModal
        isOpen={showMaterial}
        onClose={() => setShowMaterial(false)}
        onOpenMiniGame={() => setShowMiniGame(true)}
      />

      {/* MODAL 2: MINI-GAME ALIEN LIFE-SUPPORT BANKER & ALGORITHM LAB */}
      {showMiniGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-h-[94vh] w-full max-w-5xl overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowMiniGame(false)}
              className="absolute top-4 right-4 z-50 rounded-lg border border-white/20 bg-black/60 px-3 py-1 text-xs text-gray-300 hover:bg-white/10 hover:text-white"
            >
              ✕ Tutup (ESC)
            </button>
            <AlienLifeSupportMiniGame
              onGameComplete={() => {
                setIsCoreEvaluated(true);
                showToast("🏆 Mini-Game Selesai! Kamu telah membuktikan evaluasi alokasi yang aman.");
              }}
              onOpenMaterial={() => {
                setShowMiniGame(false);
                setShowMaterial(true);
              }}
              onOpenQuiz={() => {
                setShowMiniGame(false);
                setShowQuiz(true);
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL 3: KUIS EVALUASI GERBANG PORTAL STAGE 5 */}
      <DeadlockQuizModal
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
        onComplete={() => {
          setIsCoreEvaluated(true);
          showToast("🔓 Gerbang Portal Stage 5 Telah Terbuka Penuh!");
        }}
      />
    </main>
  );
}

