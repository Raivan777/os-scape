"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DiskBackground from "@/components/DiskBackground";
import LaserHeadMiniGame from "@/components/LaserHeadMiniGame";
import DiskMaterialModal from "@/components/DiskMaterialModal";
import DiskQuizModal from "@/components/DiskQuizModal";

export default function Stage5Page() {
  const router = useRouter();

  // Dimensi dasar arena platformer
  const GAME_WIDTH = 1000;
  const GAME_HEIGHT = 600;
  const GROUND_Y = 520;

  // Dimensi Karakter Pemain
  const PLAYER_W = 48;
  const PLAYER_H = 68;
  const MOVE_SPEED = 4.5;
  const JUMP_POWER = -12.5;
  const GRAVITY = 0.6;

  // Dimensi Batu Kargo Silinder Magnetik (Pushable Box)
  const BOX_W = 56;
  const BOX_H = 56;

  // Titik Awal Pemain
  const SPAWN_X = 60;
  const SPAWN_Y = GROUND_Y - PLAYER_H;

  // 1. State Pemain & Fisika
  const [playerX, setPlayerX] = useState(SPAWN_X);
  const [playerY, setPlayerY] = useState(SPAWN_Y);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isWalking, setIsWalking] = useState(false);

  // 2. State Objek Kotak Kargo Magnetik
  const [boxX, setBoxX] = useState(260);
  const [boxY, setBoxY] = useState(GROUND_Y - BOX_H);
  const [boxVelocityY, setBoxVelocityY] = useState(0);

  // 3. Rintangan Bergerak: Laser Shredder Beam Vertikal
  const [laserBeamY, setLaserBeamY] = useState(250);
  const [laserBeamDir, setLaserBeamDir] = useState<"up" | "down">("down");

  // 4. State Modal & Mini-Game
  const [showMaterial, setShowMaterial] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [isCalibrationDone, setIsCalibrationDone] = useState(false);

  // Status Kedekatan dengan Objek Interaktif
  const [isNearTerminal, setIsNearTerminal] = useState(false);
  const [isNearCalibrator, setIsNearCalibrator] = useState(false);
  const [isNearPortal, setIsNearPortal] = useState(false);

  // Daftar Platform Pijakan Bertema Sektor Disk
  const platforms = [
    { x: 0, y: GROUND_Y, w: 360, h: 80, label: "PLATTER-SECTOR A" }, // Lantai Kiri
    { x: 560, y: GROUND_Y, w: 440, h: 80, label: "PLATTER-SECTOR B" }, // Lantai Kanan
    { x: 230, y: 390, w: 140, h: 22, label: "TRACK 50" }, // Pijakan 1
    { x: 440, y: 300, w: 180, h: 22, label: "TERMINAL TRACK" }, // Pijakan 2 (Terminal Datalog)
    { x: 690, y: 220, w: 180, h: 22, label: "CALIBRATION DOCK" }, // Pijakan 3 (Station Mini-game)
    { x: 910, y: 150, w: 90, h: 22, label: "GATE PORTAL 6" }, // Pijakan Portal
  ];

  // Rintangan 1: Lubang Fluks Magnetik (Magnetic Flux Hazard Pit)
  const hazardPit = { x: 360, y: 530, w: 200, h: 70 };

  // Rintangan 2: Rintangan Laser Shredder Bergerak (X: 640)
  const laserHazard = { x: 645, w: 24, h: 100 };

  // Rintangan 3: Platform Bad Sector yang Berkedip Glitch
  const badSectorPlatform = { x: 120, y: 280, w: 90, h: 18 };

  // Objek Terminal Datalog Materi
  const terminalObj = { x: 510, y: 300 - 55, w: 45, h: 55 };

  // Objek Stasiun Kalibrasi Laser Head (Mini-Game Launcher)
  const calibratorStationObj = { x: 760, y: 220 - 65, w: 60, h: 65 };

  // Objek Portal Akhir Stage (Pintu 6)
  const portalObj = { x: 925, y: 150 - 90, w: 60, h: 90 };

  // Refs untuk Game Loop
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: playerX, y: playerY, vy: velocityY, jumping: isJumping });
  const boxRef = useRef({ x: boxX, y: boxY, vy: boxVelocityY });

  playerRef.current = { x: playerX, y: playerY, vy: velocityY, jumping: isJumping };
  boxRef.current = { x: boxX, y: boxY, vy: boxVelocityY };

  // Reset Posisi Pemain jika Jatuh ke Rintangan
  const resetPlayerToSpawn = () => {
    setPlayerX(SPAWN_X);
    setPlayerY(SPAWN_Y);
    setVelocityY(0);
    setIsJumping(false);
    setIsWalking(false);
    playerRef.current = { x: SPAWN_X, y: SPAWN_Y, vy: 0, jumping: false };
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Interaksi Tombol E
      if (key === "e") {
        if (isNearCalibrator && !showMiniGame) {
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
  }, [isNearTerminal, isNearCalibrator, isNearPortal, showMaterial, showQuiz, showMiniGame]);

  // Game Loop Platformer 60 FPS
  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      // Hentikan fisika jika ada modal yang sedang terbuka
      if (!showMaterial && !showQuiz && !showMiniGame) {
        let p = { ...playerRef.current };
        let b = { ...boxRef.current };
        const keys = keysPressed.current;

        // 1. Pergerakan Rintangan Laser Shredder Beam
        setLaserBeamY((prevY) => {
          let nextY = prevY;
          if (laserBeamDir === "down") {
            nextY += 1.8;
            if (nextY >= 360) setLaserBeamDir("up");
          } else {
            nextY -= 1.8;
            if (nextY <= 170) setLaserBeamDir("down");
          }
          return nextY;
        });

        // 2. Kontrol Horizontal Pemain
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

        // 3. Lompat Pemain
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

        // 4. Tabrakan Kotak Magnetik dengan Platform
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

        if (b.y > GAME_HEIGHT) {
          b.x = 260;
          b.y = GROUND_Y - BOX_H;
          b.vy = 0;
        }

        // 5. Dorongan Pemain terhadap Kotak Magnetik
        const nextPlayerX = p.x + moveX;
        const isTouchingBox =
          nextPlayerX < b.x + BOX_W &&
          nextPlayerX + PLAYER_W > b.x &&
          p.y + PLAYER_H > b.y + 8 &&
          p.y < b.y + BOX_H;

        if (isTouchingBox) {
          if (moveX > 0) {
            const newBoxX = b.x + (nextPlayerX + PLAYER_W - b.x);
            if (newBoxX + BOX_W <= GAME_WIDTH - 10) {
              b.x = newBoxX;
              p.x = b.x - PLAYER_W;
            } else {
              p.x = b.x - PLAYER_W;
            }
          } else if (moveX < 0) {
            const newBoxX = b.x - (b.x + BOX_W - nextPlayerX);
            if (newBoxX >= 10) {
              b.x = newBoxX;
              p.x = b.x + BOX_W;
            } else {
              p.x = b.x + BOX_W;
            }
          }
        } else {
          p.x = Math.max(10, Math.min(nextPlayerX, GAME_WIDTH - PLAYER_W - 10));
        }

        // Pijakan di atas Kotak
        if (
          p.x + PLAYER_W > b.x + 6 &&
          p.x < b.x + BOX_W - 6 &&
          p.y + PLAYER_H >= b.y &&
          p.y + PLAYER_H - p.vy <= b.y + 12
        ) {
          p.y = b.y - PLAYER_H;
          p.vy = 0;
          p.jumping = false;
        }

        // 6. Tabrakan Pemain dengan Platform Normal & Platform Bad Sector
        for (const plat of platforms) {
          if (
            p.x + PLAYER_W > plat.x &&
            p.x < plat.x + plat.w &&
            p.y + PLAYER_H >= plat.y &&
            p.y + PLAYER_H - p.vy <= plat.y + 14
          ) {
            p.y = plat.y - PLAYER_H;
            p.vy = 0;
            p.jumping = false;
          }
        }

        // Platform Bad Sector
        if (
          p.x + PLAYER_W > badSectorPlatform.x &&
          p.x < badSectorPlatform.x + badSectorPlatform.w &&
          p.y + PLAYER_H >= badSectorPlatform.y &&
          p.y + PLAYER_H - p.vy <= badSectorPlatform.y + 14
        ) {
          p.y = badSectorPlatform.y - PLAYER_H;
          p.vy = 0;
          p.jumping = false;
        }

        // 7. Rintangan 1: Celah Flukus Magnetik (Hazard Pit)
        const inHazardPit =
          p.x + PLAYER_W > hazardPit.x + 10 &&
          p.x < hazardPit.x + hazardPit.w - 10 &&
          p.y + PLAYER_H >= hazardPit.y;

        // 8. Rintangan 2: Tabrakan dengan Sinar Laser Shredder Bergerak
        const hitLaserBeam =
          p.x + PLAYER_W > laserHazard.x &&
          p.x < laserHazard.x + laserHazard.w &&
          p.y + PLAYER_H > laserBeamY &&
          p.y < laserBeamY + laserHazard.h;

        if (inHazardPit || hitLaserBeam || p.y > GAME_HEIGHT) {
          resetPlayerToSpawn();
          return;
        }

        // 9. Deteksi Kedekatan Objek
        const distTermX = Math.abs(p.x + PLAYER_W / 2 - (terminalObj.x + terminalObj.w / 2));
        const distTermY = Math.abs(p.y + PLAYER_H / 2 - (terminalObj.y + terminalObj.h / 2));
        setIsNearTerminal(distTermX < 65 && distTermY < 65);

        const distCalibX = Math.abs(p.x + PLAYER_W / 2 - (calibratorStationObj.x + calibratorStationObj.w / 2));
        const distCalibY = Math.abs(p.y + PLAYER_H / 2 - (calibratorStationObj.y + calibratorStationObj.h / 2));
        setIsNearCalibrator(distCalibX < 75 && distCalibY < 75);

        const distPortalX = Math.abs(p.x + PLAYER_W / 2 - (portalObj.x + portalObj.w / 2));
        const distPortalY = Math.abs(p.y + PLAYER_H / 2 - (portalObj.y + portalObj.h / 2));
        setIsNearPortal(distPortalX < 70 && distPortalY < 80);

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
  }, [showMaterial, showQuiz, showMiniGame, laserBeamDir]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-3 md:p-4 select-none">
      {/* HUD Info Atas */}
      <div className="mb-3 flex w-full max-w-[1000px] flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-500/30 bg-[#09061a]/80 px-4 py-2.5 text-xs text-gray-300 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-wider text-cyan-300 uppercase font-mono">
            STAGE 5 // PENJADWALAN HEAD DISK
          </span>
          <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300 font-mono">
            Storage Core Vault
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMaterial(true)}
            className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/20"
          >
            📖 Materi Disk [E]
          </button>
          <button
            type="button"
            onClick={() => setShowMiniGame(true)}
            className="rounded-lg border border-purple-400/40 bg-purple-500/20 px-2.5 py-1 text-[11px] font-bold text-purple-200 hover:bg-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
          >
            💽 Kalibrasi Laser Head
          </button>
          <button
            type="button"
            onClick={() => setShowQuiz(true)}
            className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20"
          >
            🛡️ Kuis Pintu 5
          </button>
        </div>
      </div>

      {/* Arena Game 2D Platformer Koridor Storage (1000px x 600px) */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/40 bg-[#070415] shadow-[0_0_60px_rgba(6,182,212,0.25)]"
        style={{ width: `${GAME_WIDTH}px`, height: `${GAME_HEIGHT}px` }}
      >
        {/* Background Visual Kaya Bertema Hard Disk & Storage Core */}
        <DiskBackground />

        {/* 1. Platform Pijakan Bertema Sektor & Silinder Disk */}
        {platforms.map((plat, idx) => (
          <div
            key={idx}
            className="absolute rounded-t-lg border-t-2 border-cyan-400/80 bg-gradient-to-b from-[#1c1242] via-[#0f0927] to-[#080518] shadow-[0_4px_25px_rgba(0,0,0,0.9)]"
            style={{
              left: `${plat.x}px`,
              top: `${plat.y}px`,
              width: `${plat.w}px`,
              height: `${plat.h}px`,
            }}
          >
            {/* Tekstur Sektor & Label Track */}
            <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400/50 via-purple-500/40 to-cyan-400/50" />
            <div className="p-1.5 flex justify-between items-center text-[9px] font-mono text-cyan-300/60">
              <span>{plat.label}</span>
              <span className="text-[8px] text-gray-500">15K RPM</span>
            </div>
          </div>
        ))}

        {/* 2. Rintangan 3: Platform Bad Sector yang Glitchy */}
        <div
          className="absolute rounded-md border-t-2 border-rose-500/90 bg-gradient-to-b from-rose-950/60 to-black p-1 text-[8px] font-mono font-bold text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse"
          style={{
            left: `${badSectorPlatform.x}px`,
            top: `${badSectorPlatform.y}px`,
            width: `${badSectorPlatform.w}px`,
            height: `${badSectorPlatform.h}px`,
          }}
        >
          ⚠️ BAD_SECTOR
        </div>

        {/* 3. Rintangan 1: Lubang Fluks Magnetik (Magnetic Flux Hazard Pit) */}
        <div
          className="absolute flex flex-col items-center justify-center rounded-lg border-2 border-rose-500/90 bg-rose-950/50 shadow-[0_0_35px_rgba(244,63,94,0.8)] animate-pulse"
          style={{
            left: `${hazardPit.x}px`,
            top: `${hazardPit.y}px`,
            width: `${hazardPit.w}px`,
            height: `${hazardPit.h}px`,
          }}
        >
          <span className="text-xs md:text-sm font-black tracking-widest text-rose-300 animate-bounce">
            ⚡ BAHAYA FLUKS MAGNETIK ⚡
          </span>
          <span className="text-[10px] text-rose-400 font-mono">
            Distorsi Medan Spindel - Terpental ke Titik Awal
          </span>
        </div>

        {/* 4. Rintangan 2: Sinar Laser Shredder Bergerak Naik Turun */}
        <div
          className="absolute flex flex-col items-center justify-between"
          style={{
            left: `${laserHazard.x}px`,
            top: `${laserBeamY}px`,
            width: `${laserHazard.w}px`,
            height: `${laserHazard.h}px`,
          }}
        >
          <div className="h-2 w-full rounded bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          <div className="h-full w-1.5 bg-gradient-to-b from-rose-500 via-rose-400 to-rose-600 shadow-[0_0_20px_#f43f5e] animate-pulse" />
          <div className="h-2 w-full rounded bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
        </div>

        {/* 5. Kotak Kargo Silinder Magnetik (Pushable Box) */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center rounded-xl border-2 border-cyan-400/90 bg-gradient-to-br from-cyan-800 via-purple-900 to-[#120a30] shadow-[0_0_25px_rgba(6,182,212,0.6)] cursor-grab active:cursor-grabbing"
          style={{
            left: `${boxX}px`,
            top: `${boxY}px`,
            width: `${BOX_W}px`,
            height: `${BOX_H}px`,
          }}
        >
          <span className="text-xl">🧲</span>
          <span className="text-[9px] font-black text-cyan-200 tracking-wider">PLATTER</span>
        </div>

        {/* 6. Terminal Interaktif Datalog Materi Disk */}
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
              <span className="rounded bg-cyan-400 px-2 py-0.5 text-[10px] font-black text-black shadow-[0_0_12px_rgba(6,182,212,0.8)]">
                [E] Datalog Disk
              </span>
            </div>
          )}
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/80 bg-cyan-950/70 shadow-[0_0_25px_rgba(34,211,238,0.7)] animate-pulse">
            <span className="text-xl">💾</span>
          </div>
          <div className="h-3 w-5 bg-purple-500/50 rounded-t" />
        </div>

        {/* 7. Stasiun Kalibrasi Laser Head (Mini-Game Launcher Terminal) */}
        <div
          className="absolute z-10 flex flex-col items-center cursor-pointer"
          style={{
            left: `${calibratorStationObj.x}px`,
            top: `${calibratorStationObj.y}px`,
            width: `${calibratorStationObj.w}px`,
            height: `${calibratorStationObj.h}px`,
          }}
          onClick={() => setShowMiniGame(true)}
        >
          <div className="absolute -top-7 whitespace-nowrap animate-bounce">
            <span className="rounded bg-purple-400 px-2 py-0.5 text-[10px] font-black text-black shadow-[0_0_12px_rgba(168,85,247,0.8)]">
              {isNearCalibrator ? "[E] Kalibrasi Head" : "Laser Calibrator"}
            </span>
          </div>
          <div className="flex h-12 w-14 items-center justify-center rounded-xl border-2 border-purple-400 bg-purple-950/80 shadow-[0_0_30px_rgba(168,85,247,0.7)]">
            <span className="text-2xl animate-spin" style={{ animationDuration: "6s" }}>
              🎯
            </span>
          </div>
          <div className="h-3 w-6 bg-cyan-400/60 rounded-t" />
        </div>

        {/* 8. Portal Menuju Stage 6 (The RAM Tetris) */}
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
                [E] Masuk Portal 6
              </span>
            </div>
          )}
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400 bg-gradient-to-t from-purple-700/60 via-cyan-500/40 to-emerald-400/40 shadow-[0_0_40px_rgba(34,211,238,0.9)] animate-pulse" />
          <div className="relative z-10 text-center">
            <span className="text-2xl animate-spin inline-block" style={{ animationDuration: "8s" }}>
              🌀
            </span>
            <span className="block text-[8px] font-black tracking-widest text-cyan-200 uppercase">
              PORTAL 6
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
              className={`h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] ${
                isWalking && !isJumping ? "animate-waddle" : ""
              }`}
            />
          </div>
        </div>
      </div>

      {/* Navigasi Cepat Bawah */}
      <div className="mt-3 flex w-full max-w-[1000px] items-center justify-between text-xs text-gray-400">
        <Link href="/" className="hover:text-cyan-300 transition">
          ← Kembali ke Menu Utama
        </Link>
        <span className="font-mono text-[11px]">
          Target Stage 5: Kalibrasikan Head Silinder Disk & Taklukkan Algoritma FCFS, SSTF, SCAN!
        </span>
        <button
          type="button"
          onClick={() => setShowMiniGame(true)}
          className="text-purple-300 font-bold hover:underline"
        >
          Buka Mini-game Layar Penuh ➔
        </button>
      </div>

      {/* MODAL 1: Mini-Game Laser Head Calibration */}
      {showMiniGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 md:p-6 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="absolute top-3 right-3 z-30">
              <button
                type="button"
                onClick={() => setShowMiniGame(false)}
                className="rounded-lg border border-white/20 bg-black/80 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-white/20 hover:text-white"
              >
                ✕ Kembali ke Arena (ESC)
              </button>
            </div>
            <LaserHeadMiniGame
              onCalibrationComplete={() => {
                setIsCalibrationDone(true);
              }}
              onOpenMaterial={() => {
                setShowMaterial(true);
              }}
              onOpenQuiz={() => {
                setShowQuiz(true);
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL 2: Datalog Materi Penjadwalan Disk */}
      <DiskMaterialModal isOpen={showMaterial} onClose={() => setShowMaterial(false)} />

      {/* MODAL 3: Kuis Firewall Pintu 5 */}
      <DiskQuizModal isOpen={showQuiz} onClose={() => setShowQuiz(false)} />

      {/* Style Keyframe Animasi Waddle */}
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

