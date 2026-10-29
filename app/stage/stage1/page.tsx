"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ──────────────────────────────────────────────────────────────
// OS-SCAPE Stage 1 — 2D Platformer (Kanvas Tetap 1024×576 16:9)
// ──────────────────────────────────────────────────────────────

export default function Stage1Platformer() {
  const router = useRouter();

  // ─── KONSTANTA KANVAS (16:9 Fixed) ─────────────────────────
  const GAME_WIDTH = 1024;
  const GAME_HEIGHT = 576;
  const GROUND_Y = 540; // Lantai dasar di paling bawah

  // ─── KONSTANTA PEMAIN ──────────────────────────────────────
  const PLAYER_W = 44;
  const PLAYER_H = 54;
  const MOVE_SPEED = 4.5;
  const JUMP_POWER = -12;
  const GRAVITY = 0.55;

  // ─── KONSTANTA KOTAK KARGO ─────────────────────────────────
  const BOX_W = 45;
  const BOX_H = 45;

  // ─── STATE PEMAIN & FISIKA ─────────────────────────────────
  const [playerX, setPlayerX] = useState(60);
  const [playerY, setPlayerY] = useState(GROUND_Y - PLAYER_H);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isWalking, setIsWalking] = useState(false);

  // ─── STATE PEMICU ──────────────────────────────────────────
  const [isLaserDoorOpen, setIsLaserDoorOpen] = useState(false);

  // ─── STATE KOTAK KARGO ─────────────────────────────────────
  const [boxX, setBoxX] = useState(460);
  const [boxY, setBoxY] = useState(GROUND_Y - BOX_H);
  const [boxVelocityY, setBoxVelocityY] = useState(0);

  // ─── STATE MODAL & EDUKASI ─────────────────────────────────
  const [showMaterial, setShowMaterial] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [isQuizCorrect, setIsQuizCorrect] = useState(false);
  const [isNearTerminal, setIsNearTerminal] = useState(false);
  const [isNearLever, setIsNearLever] = useState(false);
  const [showMiniGame, setShowMiniGame] = useState(false);

  // ──────────────────────────────────────────────────────────
  // HITBOX DEFINITIONS (Relatif terhadap kanvas 1024×576)
  // Semua posisi dikalibrasi terhadap stage1bg.jpg 16:9
  // ──────────────────────────────────────────────────────────

  // 1. Lantai dasar — platform panjang di bagian paling bawah
  const groundPlatform = { x: 0, y: GROUND_Y, w: GAME_WIDTH, h: GAME_HEIGHT - GROUND_Y };

  // 2. Kotak Garis Polisi (Kanan Bawah) — kotak kuning-hitam
  const policeBox = { x: 726, y: 435, w: 98, h: 106 };

  // Solid body ramp bawah (mencegah pemain masuk ke dalam ramp)
  const rampBody = { x: 240, y: 465, w: 490, h: GROUND_Y - 465 };


  // 4. Cahaya/Simbol Neon (Kiri Tengah) — trigger materi
  // Dua dinding kecil di sisi kiri & kanan area cahaya
  const materialTrigger = { x: 30, y: 340, w: 120, h: 90 };
  const materialWallLeft = { x: 39, y: 135, w: 25, h: 151 };
  const materialWallRight = { x: 115, y: 135, w: 25, h: 151 };

  // Platform kecil di depan area cahaya (rak/pijakan di kiri)
  const leftShelfPlatform = { x: 43, y: 257, w: 90, h: 17 };

  // 5. Tuas/Lever Hijau (Kanan Atas) — trigger mini-game
  // Meja konsol dengan monitor hologram
  const leverTrigger = { x: 679, y: 78, w: 66, h: 50 };
  // Platform di bawah lever (meja konsol)
  const leverPlatform = { x: 672, y: 132, w: 134, h: 19 };

  // Platform tambahan di atas area kiri (lantai level 2 kiri)
  const upperLeftPlatform = { x: 215, y: 258, w: 386, h: 18 };

  // Platform tambahan di tengah area kiri (lantai level 2 kiri)
  const midLeftPlatform = { x: 651, y: 313, w: 56, h: 16 };

  // Platform tambahan di tengah area kiri (lantai level 2 kiri)
  const lowerLeftPlatform = { x: 693, y: 389, w: 102, h: 18 };

  // Dinding kanan atas (panel dinding)
  const rightWall = { x: 990, y: 0, w: 34, h: 460 };

  // Pintu laser (penghalang vertikal tengah-bawah)
  const laserDoor = { x: 500, y: GROUND_Y - 120, w: 16, h: 120 };

  // Tombol lantai (kiri bawah, dekat area spawn)
  const floorButton = { x: 150, y: GROUND_Y - 8, w: 50, h: 8 };

  // Terminal komputer (di atas upper left platform)
  const terminalObj = { x: 65, y: 200, w: 45, h: 46 };

  // Portal akhir (di pojok kanan atas, dekat lever)
  const portalObj = { x: 910, y: 44, w: 60, h: 80 };

  // Semua platform statis untuk collision
  const allPlatforms = [
    leftShelfPlatform,
    upperLeftPlatform,
    midLeftPlatform,
    lowerLeftPlatform,
    leverPlatform,
    { x: policeBox.x, y: policeBox.y, w: policeBox.w, h: 18 }, // pijakan atas kotak polisi
  ];

  // Semua dinding statis untuk collision
  const allWalls = [
    materialWallLeft,
    materialWallRight,
    rightWall,
    { x: policeBox.x, y: policeBox.y, w: 10, h: policeBox.h }, // sisi kiri kotak polisi
    { x: policeBox.x + policeBox.w - 10, y: policeBox.y, w: 10, h: policeBox.h }, // sisi kanan kotak polisi
  ];

  // ─── REFS GAME LOOP ────────────────────────────────────────
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: playerX, y: playerY, vy: velocityY, jumping: isJumping });
  const boxRef = useRef({ x: boxX, y: boxY, vy: boxVelocityY });
  const laserOpenRef = useRef(isLaserDoorOpen);

  playerRef.current = { x: playerX, y: playerY, vy: velocityY, jumping: isJumping };
  boxRef.current = { x: boxX, y: boxY, vy: boxVelocityY };
  laserOpenRef.current = isLaserDoorOpen;

  // ─── KEYBOARD EVENTS ──────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === "e") {
        if (isNearTerminal && !showMaterial && !showQuiz && !showMiniGame) {
          setShowMaterial(true);
          return;
        }
        if (isNearLever && !showMaterial && !showQuiz && !showMiniGame) {
          setShowMiniGame(true);
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
  }, [isNearTerminal, isNearLever, showMaterial, showQuiz, showMiniGame]);

  // ─── GAME LOOP ─────────────────────────────────────────────
  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      if (!showMaterial && !showQuiz && !showMiniGame) {
        const p = { ...playerRef.current };
        const b = { ...boxRef.current };
        const keys = keysPressed.current;
        const laserOpen = laserOpenRef.current;

        // 1. GERAKAN HORIZONTAL
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

        // 2. LOMPAT
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

        // 4. LANTAI DASAR
        if (p.y + PLAYER_H >= GROUND_Y) {
          p.y = GROUND_Y - PLAYER_H;
          p.vy = 0;
          p.jumping = false;
        }

        if (b.y + BOX_H >= GROUND_Y) {
          b.y = GROUND_Y - BOX_H;
          b.vy = 0;
        }

        // 5. TABRAKAN PLATFORM (pijakan dari atas)
        let nextPlayerX = p.x + moveX;

        for (const plat of allPlatforms) {
          // Lewati platform kontainer besi karena ditangani secara terpadu oleh Double Ramp Zone
          if (plat === upperLeftPlatform || plat === midLeftPlatform || plat === lowerLeftPlatform) {
            continue;
          }

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

        // ─── DOUBLE RAMP ZONE & PIJAKAN KONTAINER BESI ─────────────
        // Menggunakan titik tumpu kaki karakter (charFootX) agar lereng presisi dengan batas visual
        // 1. Pijakan Atas (Datar):         charFootX <= 601          (top: 258)
        // 2. Ramp Zone 2 (Tengah ke Atas): charFootX: 601 s.d 651    (lerp 258 ke 313)
        // 3. Pijakan Tengah (Datar):       charFootX: 651 s.d 707    (top: 313)
        // 4. Ramp Zone 1 (Bawah ke Tengah): charFootX: 707 s.d 785   (lerp 313 ke 389)
        // 5. Pijakan Bawah (Datar):        charFootX: 785 s.d 800    (top: 389)
        let containerGroundY: number | null = null;
        const charFootX = nextPlayerX + PLAYER_W * 0.5;

        if (charFootX >= 215 && charFootX <= 601) {
          // Pijakan Atas (Datar)
          containerGroundY = 258;
        } else if (charFootX > 601 && charFootX < 651) {
          // Ramp Zone 2 (Dari Tengah ke Atas: lerp 258px ke 313px)
          const t2 = (charFootX - 601) / (651 - 601);
          containerGroundY = 258 + t2 * (313 - 258);
        } else if (charFootX >= 651 && charFootX <= 707) {
          // Pijakan Tengah (Datar)
          containerGroundY = 313;
        } else if (charFootX > 707 && charFootX < 785) {
          // Ramp Zone 1 (Dari Bawah ke Tengah: lerp 313px ke 389px)
          const t1 = (charFootX - 707) / (785 - 707);
          containerGroundY = 313 + t1 * (389 - 313);
        } else if (charFootX >= 785 && charFootX <= 800) {
          // Pijakan Bawah (Datar)
          containerGroundY = 389;
        }

        // Terapkan batas groundY dinamis HANYA jika karakter memang berada di permukaan kontainer
        // (Mencegah bug tersedot/ketarik ke bawah saat berada di minigame lever platform di atas)
        if (containerGroundY !== null) {
          const footY = p.y + PLAYER_H;
          const prevFootY = footY - p.vy;

          if (!p.jumping) {
            // Berjalan menanjak/menurun mulus (hanya jika kaki memang menempel di permukaan kontainer)
            if (Math.abs(footY - containerGroundY) <= 14) {
              p.y = containerGroundY - PLAYER_H;
              p.vy = 0;
            }
          } else if (p.vy >= 0) {
            // Mendarat saat jatuh dari lompatan ke kontainer
            if (footY >= containerGroundY && prevFootY <= containerGroundY + 14) {
              p.y = containerGroundY - PLAYER_H;
              p.vy = 0;
              p.jumping = false;
            }
          }
        }

        
        // 6. TABRAKAN DINDING
        for (const wall of allWalls) {
          const inYRange = p.y + PLAYER_H > wall.y && p.y < wall.y + wall.h;
          if (inYRange) {
            // Datang dari kiri
            if (p.x + PLAYER_W <= wall.x && nextPlayerX + PLAYER_W > wall.x) {
              nextPlayerX = wall.x - PLAYER_W;
            }
            // Datang dari kanan
            if (p.x >= wall.x + wall.w && nextPlayerX < wall.x + wall.w) {
              nextPlayerX = wall.x + wall.w;
            }
          }
        }

        // 7. PINTU LASER (dinding penghalang)
        if (!laserOpen) {
          const inLaserYRange = p.y + PLAYER_H > laserDoor.y && p.y < laserDoor.y + laserDoor.h;
          if (inLaserYRange) {
            if (p.x + PLAYER_W <= laserDoor.x && nextPlayerX + PLAYER_W > laserDoor.x) {
              nextPlayerX = laserDoor.x - PLAYER_W;
            } else if (p.x >= laserDoor.x + laserDoor.w && nextPlayerX < laserDoor.x + laserDoor.w) {
              nextPlayerX = laserDoor.x + laserDoor.w;
            }
          }

          // Kotak juga tidak bisa menembus laser
          if (b.y + BOX_H > laserDoor.y && b.y < laserDoor.y + laserDoor.h) {
            if (b.x < laserDoor.x + laserDoor.w && b.x + BOX_W > laserDoor.x) {
              b.x = laserDoor.x + laserDoor.w;
            }
          }
        }

        // 8. MEKANIK MENDORONG KOTAK (Box Pushing)
        const isTouchingBoxSide =
          nextPlayerX < b.x + BOX_W &&
          nextPlayerX + PLAYER_W > b.x &&
          p.y + PLAYER_H > b.y + 6 &&
          p.y < b.y + BOX_H;

        if (isTouchingBoxSide) {
          if (moveX > 0) {
            const pushDist = nextPlayerX + PLAYER_W - b.x;
            const newBoxX = b.x + pushDist;
            if (newBoxX + BOX_W <= GAME_WIDTH - 10) {
              b.x = newBoxX;
              p.x = b.x - PLAYER_W;
            } else {
              p.x = b.x - PLAYER_W;
            }
          } else if (moveX < 0) {
            const pushDist = b.x + BOX_W - nextPlayerX;
            const newBoxX = b.x - pushDist;
            const minAllowedBoxX = !laserOpen ? laserDoor.x + laserDoor.w : 10;
            if (newBoxX >= minAllowedBoxX) {
              b.x = newBoxX;
              p.x = b.x + BOX_W;
            } else {
              b.x = minAllowedBoxX;
              p.x = b.x + BOX_W;
            }
          }
        } else {
          p.x = Math.max(5, Math.min(nextPlayerX, GAME_WIDTH - PLAYER_W - 5));
        }

        // Pijakan di atas kotak kargo
        const isStandingOnBox =
          p.x + PLAYER_W > b.x + 4 &&
          p.x < b.x + BOX_W - 4 &&
          p.y + PLAYER_H >= b.y &&
          p.y + PLAYER_H - p.vy <= b.y + 12;

        if (isStandingOnBox && p.vy >= 0) {
          p.y = b.y - PLAYER_H;
          p.vy = 0;
          p.jumping = false;
        }

        // 9. TOMBOL LANTAI (injak = buka laser)
        const playerSteppedOnButton =
          p.x + PLAYER_W > floorButton.x &&
          p.x < floorButton.x + floorButton.w &&
          p.y + PLAYER_H >= floorButton.y;

        const boxOnButton =
          b.x + BOX_W > floorButton.x &&
          b.x < floorButton.x + floorButton.w &&
          b.y + BOX_H >= floorButton.y;

        if ((playerSteppedOnButton || boxOnButton) && !laserOpen) {
          setIsLaserDoorOpen(true);
        }

        // 10. CEK KEDEKATAN TERMINAL
        const distTermX = Math.abs(p.x + PLAYER_W / 2 - (terminalObj.x + terminalObj.w / 2));
        const distTermY = Math.abs(p.y + PLAYER_H / 2 - (terminalObj.y + terminalObj.h / 2));
        setIsNearTerminal(distTermX < 60 && distTermY < 60);

        // 11. CEK KEDEKATAN LEVER
        const distLevX = Math.abs(p.x + PLAYER_W / 2 - (leverTrigger.x + leverTrigger.w / 2));
        const distLevY = Math.abs(p.y + PLAYER_H / 2 - (leverTrigger.y + leverTrigger.h / 2));
        setIsNearLever(distLevX < 65 && distLevY < 65);

        // 12. CEK PORTAL AKHIR
        const touchPortal =
          p.x + PLAYER_W > portalObj.x &&
          p.x < portalObj.x + portalObj.w &&
          p.y + PLAYER_H > portalObj.y &&
          p.y < portalObj.y + portalObj.h;

        if (touchPortal) {
          setShowQuiz(true);
        }

        // UPDATE STATES
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
  }, [showMaterial, showQuiz, showMiniGame]);

  // ─── QUIZ HANDLER ──────────────────────────────────────────
  const handleQuizSubmit = () => {
    if (selectedAnswer === null) return;
    const isCorrect = selectedAnswer === 1;
    setIsQuizCorrect(isCorrect);
    setIsQuizSubmitted(true);
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-black text-[#e9e4ff] select-none flex flex-col items-center justify-center">
      {/* HUD Info Atas */}
      <div className="flex w-[1024px] items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2 text-xs text-gray-300 backdrop-blur-md mb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-wider text-[#ffb347] uppercase text-[11px]">
            Stage 1 // Kanvas 1024×576 [Debug Hitbox Aktif]
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span>
            <strong className="text-white">A / D</strong>: Jalan • <strong className="text-white">W / Spasi</strong>: Lompat • <strong className="text-white">E</strong>: Interaksi
          </span>
          <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${isLaserDoorOpen ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"}`}>
            {isLaserDoorOpen ? "LASER: TERBUKA" : "LASER: AKTIF"}
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CONTAINER KANVAS UTAMA: 1024×576 (16:9)
          ═══════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/30 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
        style={{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
          backgroundImage: "url('/stage1bg.jpg')",
          backgroundSize: "100% 100%",
        }}
      >
        {/* ─── DEBUG: Garis Lantai Dasar ─────────────────────── */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-emerald-400/50 pointer-events-none z-10"
          style={{ top: `${GROUND_Y}px` }}
        >
          <span className="absolute left-2 -top-4 text-[9px] font-mono text-emerald-400 bg-black/60 px-1 rounded">
            Ground (y: {GROUND_Y})
          </span>
        </div>

        {/* ─── 1. LANTAI DASAR (Ground) ──────────────────────── */}
        <div
          className="absolute bg-green-500/30 border-t-2 border-green-400 pointer-events-none z-10"
          style={{
            left: `${groundPlatform.x}px`,
            top: `${groundPlatform.y}px`,
            width: `${groundPlatform.w}px`,
            height: `${groundPlatform.h}px`,
          }}
        >
          <span className="absolute left-1/2 -translate-x-1/2 top-0 text-[8px] font-mono text-green-300 bg-black/60 px-1 rounded">
            GROUND
          </span>
        </div>

        {/* ─── 2. KOTAK GARIS POLISI (Kanan Bawah) ───────────── */}
        <div
          className="absolute bg-yellow-500/40 border-2 border-yellow-400 pointer-events-none z-10 flex items-center justify-center"
          style={{
            left: `${policeBox.x}px`,
            top: `${policeBox.y}px`,
            width: `${policeBox.w}px`,
            height: `${policeBox.h}px`,
          }}
        >
          <span className="text-[8px] font-mono font-bold text-yellow-200 bg-black/60 px-1 rounded">
            POLICE BOX
          </span>
        </div>

        {/* ─── 3. KONTAINER BESI MIRING — Stair Steps ────────── */}
        {/* Ramp body (solid bawah) */}
        <div
          className="absolute bg-red-500/15 border border-red-400/30 pointer-events-none z-5"
          style={{
            left: `${rampBody.x}px`,
            top: `${rampBody.y}px`,
            width: `${rampBody.w}px`,
            height: `${rampBody.h}px`,
          }}
        >
          <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-red-300 bg-black/60 px-1 rounded">
            RAMP BODY
          </span>
        </div>

        {/* ─── 4. CAHAYA NEON KIRI (Material Trigger) ─────────── */}
        <div
          className="absolute bg-pink-500/30 border-2 border-pink-400 pointer-events-none z-10 flex items-center justify-center"
          style={{
            left: `${materialTrigger.x}px`,
            top: `${materialTrigger.y}px`,
            width: `${materialTrigger.w}px`,
            height: `${materialTrigger.h}px`,
          }}
        >
          <span className="text-[8px] font-mono font-bold text-pink-200 bg-black/60 px-1 rounded">
            MATERI [E]
          </span>
        </div>

        {/* Dinding kiri area materi */}
        <div
          className="absolute bg-gray-500/40 border border-gray-400 pointer-events-none z-10"
          style={{
            left: `${materialWallLeft.x}px`,
            top: `${materialWallLeft.y}px`,
            width: `${materialWallLeft.w}px`,
            height: `${materialWallLeft.h}px`,
          }}
        >
          <span className="text-[6px] font-mono text-gray-200 -rotate-90 whitespace-nowrap absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            WALL L
          </span>
        </div>

        {/* Dinding kanan area materi */}
        <div
          className="absolute bg-gray-500/40 border border-gray-400 pointer-events-none z-10"
          style={{
            left: `${materialWallRight.x}px`,
            top: `${materialWallRight.y}px`,
            width: `${materialWallRight.w}px`,
            height: `${materialWallRight.h}px`,
          }}
        >
          <span className="text-[6px] font-mono text-gray-200 -rotate-90 whitespace-nowrap absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            WALL R
          </span>
        </div>

        {/* Platform pijakan kiri (rak) */}
        <div
          className="absolute bg-orange-500/40 border border-orange-400 pointer-events-none z-10 flex items-center justify-center"
          style={{
            left: `${leftShelfPlatform.x}px`,
            top: `${leftShelfPlatform.y}px`,
            width: `${leftShelfPlatform.w}px`,
            height: `${leftShelfPlatform.h}px`,
          }}
        >
          <span className="text-[7px] font-mono text-orange-200 bg-black/60 px-1 rounded">
            LEFT SHELF
          </span>
        </div>

        {/* ─── 5. TUAS/LEVER (Kanan Atas) — Mini-game Trigger ── */}
        <div
          className="absolute bg-emerald-500/40 border-2 border-emerald-400 z-10 flex items-center justify-center"
          style={{
            left: `${leverTrigger.x}px`,
            top: `${leverTrigger.y}px`,
            width: `${leverTrigger.w}px`,
            height: `${leverTrigger.h}px`,
          }}
        >
          {isNearLever && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce z-30">
              <span className="rounded bg-emerald-400 px-2 py-0.5 text-[9px] font-black text-black shadow-md">
                [E] Mini-Game
              </span>
            </div>
          )}
          <span className="text-[8px] font-mono font-bold text-emerald-200 bg-black/60 px-1 rounded">
            LEVER
          </span>
        </div>

        {/* Platform di bawah lever */}
        <div
          className="absolute bg-emerald-500/30 border border-emerald-400 pointer-events-none z-10 flex items-center justify-center"
          style={{
            left: `${leverPlatform.x}px`,
            top: `${leverPlatform.y}px`,
            width: `${leverPlatform.w}px`,
            height: `${leverPlatform.h}px`,
          }}
        >
          <span className="text-[7px] font-mono text-emerald-200 bg-black/60 px-1 rounded">
            LEVER PLAT
          </span>
        </div>

        {/* Platform atas kiri */}
        <div
          className="absolute bg-red-500/40 border border-red-400 pointer-events-none z-10 flex items-center justify-center"
          style={{
            left: `${upperLeftPlatform.x}px`,
            top: `${upperLeftPlatform.y}px`,
            width: `${upperLeftPlatform.w}px`,
            height: `${upperLeftPlatform.h}px`,
          }}
        >
          <span className="text-[8px] font-mono text-red-200 bg-black/60 px-1 rounded">
            UPPER LEFT PLATFORM
          </span>
        </div>

        {/* Platform tengah kiri */}
        <div
          className="absolute bg-purple-500/40 border border-purple-400 pointer-events-none z-10 flex items-center justify-center"
          style={{
            left: `${midLeftPlatform.x}px`,
            top: `${midLeftPlatform.y}px`,
            width: `${midLeftPlatform.w}px`,
            height: `${midLeftPlatform.h}px`,
          }}
        >
          <span className="text-[8px] font-mono text-purple-200 bg-black/60 px-1 rounded">
            MID LEFT PLATFORM
          </span>
        </div>

        {/* Platform bawah kiri */}
        <div
          className="absolute bg-blue-500/40 border border-blue-400 pointer-events-none z-10 flex items-center justify-center"
          style={{
            left: `${lowerLeftPlatform.x}px`,
            top: `${lowerLeftPlatform.y}px`,
            width: `${lowerLeftPlatform.w}px`,
            height: `${lowerLeftPlatform.h}px`,
          }}
        >
          <span className="text-[8px] font-mono text-blue-200 bg-black/60 px-1 rounded">
            LOWER LEFT PLATFORM
          </span>
        </div>

        {/* Dinding kanan */}
        <div
          className="absolute bg-gray-500/30 border border-gray-400 pointer-events-none z-10"
          style={{
            left: `${rightWall.x}px`,
            top: `${rightWall.y}px`,
            width: `${rightWall.w}px`,
            height: `${rightWall.h}px`,
          }}
        >
          <span className="text-[6px] font-mono text-gray-200 -rotate-90 whitespace-nowrap absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            WALL R
          </span>
        </div>

        {/* ─── TOMBOL LANTAI ──────────────────────────────────── */}
        <div
          className={`absolute flex items-center justify-center rounded-t border transition-all z-10 ${
            isLaserDoorOpen
              ? "bg-yellow-500/80 border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.9)]"
              : "bg-yellow-500/50 border-yellow-400 animate-pulse"
          }`}
          style={{
            left: `${floorButton.x}px`,
            top: `${floorButton.y}px`,
            width: `${floorButton.w}px`,
            height: `${floorButton.h}px`,
          }}
        >
          <span className="text-[7px] font-black text-black uppercase tracking-tighter">
            {isLaserDoorOpen ? "ON" : "BTN"}
          </span>
        </div>

        {/* ─── PINTU LASER ────────────────────────────────────── */}
        <div
          className={`absolute flex flex-col items-center justify-center transition-opacity duration-300 ${
            isLaserDoorOpen
              ? "opacity-20 pointer-events-none"
              : "opacity-100 z-20"
          }`}
          style={{
            left: `${laserDoor.x}px`,
            top: `${laserDoor.y}px`,
            width: `${laserDoor.w}px`,
            height: `${laserDoor.h}px`,
          }}
        >
          <div className="h-full w-full bg-blue-500/50 border-2 border-blue-400 rounded flex items-center justify-center">
            <span className="text-[7px] font-mono font-bold text-white -rotate-90 whitespace-nowrap">
              LASER
            </span>
          </div>
        </div>

        {/* ─── KOTAK KARGO (Bisa Didorong) ─────────────────────── */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center rounded-lg border-2 border-amber-300 bg-amber-600/90 shadow-[0_4px_12px_rgba(0,0,0,0.8)] cursor-grab active:cursor-grabbing"
          style={{
            left: `${boxX}px`,
            top: `${boxY}px`,
            width: `${BOX_W}px`,
            height: `${BOX_H}px`,
          }}
        >
          <span className="text-base">📦</span>
          <span className="text-[7px] font-black text-amber-100 uppercase">KOTAK</span>
        </div>

        {/* ─── TERMINAL KOMPUTER ────────────────────────────────── */}
        <div
          className="absolute z-20 flex flex-col items-center cursor-pointer"
          style={{
            left: `${terminalObj.x}px`,
            top: `${terminalObj.y}px`,
            width: `${terminalObj.w}px`,
            height: `${terminalObj.h}px`,
          }}
          onClick={() => setShowMaterial(true)}
        >
          {isNearTerminal && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce z-30">
              <span className="rounded bg-amber-400 px-2 py-0.5 text-[9px] font-black text-black shadow-md">
                [E] Log OS
              </span>
            </div>
          )}
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-400 bg-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse">
            <span className="text-lg">🖥️</span>
          </div>
        </div>

        {/* ─── PORTAL AKHIR STAGE ──────────────────────────────── */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
          style={{
            left: `${portalObj.x}px`,
            top: `${portalObj.y}px`,
            width: `${portalObj.w}px`,
            height: `${portalObj.h}px`,
          }}
          onClick={() => setShowQuiz(true)}
        >
          <div className="absolute inset-0 rounded-full border-2 border-purple-400 bg-purple-600/40 shadow-[0_0_25px_rgba(168,85,247,0.8)] animate-pulse" />
          <div className="relative z-10 text-center">
            <span className="text-2xl animate-spin inline-block" style={{ animationDuration: "8s" }}>🌀</span>
            <span className="block text-[8px] font-black tracking-widest text-cyan-200 uppercase">PORTAL 2</span>
          </div>
        </div>

        {/* ─── KARAKTER ASTRONOT ──────────────────────────────── */}
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
              className={`h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] ${
                isWalking && !isJumping ? "animate-waddle" : ""
              }`}
              style={{
                transformOrigin: "bottom center",
              }}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODAL 1: MATERI SISTEM OPERASI
          ═══════════════════════════════════════════════════════ */}
      {showMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-cyan-400/50 bg-[#0d091e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_50px_rgba(34,211,238,0.3)]">
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
                <h2 className="text-lg font-bold text-[#ffb347]">
                  OMNI LOG // KONSEP CPU SCHEDULER
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowMaterial(false)}
                className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-gray-400 hover:text-white"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs md:text-sm text-gray-300 leading-relaxed">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="font-bold text-cyan-300">1. Apa itu CPU Scheduler?</h3>
                <p className="mt-1">
                  <strong>CPU Scheduler (Short-Term Scheduler)</strong> adalah modul inti sistem operasi yang bertugas memilih proses mana yang siap dieksekusi dari <em>Ready Queue</em> dan mengalokasikan CPU untuk proses tersebut.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="font-bold text-[#ffb347]">2. Mengapa Dibutuhkan?</h3>
                <p className="mt-1">
                  Untuk memaksimalkan utilisasi CPU dan memastikan tidak ada proses penting yang mengalami penundaan ekstrim (starvation). Scheduler menerapkan algoritma seperti <strong>Round Robin (RR)</strong>, <strong>FCFS</strong>, atau <strong>SJF</strong>.
                </p>
              </div>

              <div className="rounded-lg border border-amber-400/30 bg-amber-950/20 p-3 text-amber-200">
                <p className="font-semibold text-amber-300">💡 Kunci Menembus Portal:</p>
                <p className="mt-0.5">Ingat peran utama <strong>CPU Scheduler</strong> saat menghadapi firewall portal di ujung kanan!</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMaterial(false)}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 text-xs md:text-sm font-bold text-white shadow-lg transition hover:scale-105"
              >
                Lanjutkan Misi ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL 2: KUIS PORTAL AKHIR STAGE
          ═══════════════════════════════════════════════════════ */}
      {showQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-purple-500/50 bg-[#0f0924]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_60px_rgba(168,85,247,0.3)]">
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
              <h2 className="text-lg font-bold text-purple-300">
                FIREWALL PORTAL 1 // VERIFIKASI KERNEL
              </h2>
              <button
                type="button"
                onClick={() => setShowQuiz(false)}
                className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-gray-400 hover:text-white"
              >
                ✕ Batal
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs md:text-sm">
              <p className="font-semibold text-white">
                Komponen sistem operasi manakah yang bertanggung jawab memilih proses mana dari antrean siap (Ready Queue) untuk dialokasikan ke CPU?
              </p>

              <div className="space-y-2">
                {[
                  { id: 0, text: "A. File System Manager" },
                  { id: 1, text: "B. CPU Scheduler (Short-term Scheduler)" },
                  { id: 2, text: "C. Virtual Memory Paging Unit" },
                  { id: 3, text: "D. Network Protocol Driver" },
                ].map((opt) => {
                  const isSelected = selectedAnswer === opt.id;
                  let btnClass = "border-white/10 bg-white/[0.04] text-gray-200 hover:border-cyan-400/50";

                  if (isQuizSubmitted) {
                    if (opt.id === 1) btnClass = "border-emerald-500 bg-emerald-950/60 text-emerald-200 font-bold";
                    else if (isSelected) btnClass = "border-rose-500 bg-rose-950/60 text-rose-200";
                  } else if (isSelected) {
                    btnClass = "border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.4)]";
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isQuizSubmitted}
                      onClick={() => setSelectedAnswer(opt.id)}
                      className={`w-full text-left rounded-xl border p-3 transition-all ${btnClass}`}
                    >
                      {opt.text}
                    </button>
                  );
                })}
              </div>

              {isQuizSubmitted && (
                <div className={`rounded-xl border p-3.5 leading-relaxed ${isQuizCorrect ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300" : "border-rose-500/50 bg-rose-950/40 text-rose-300"}`}>
                  <p className="font-bold">
                    {isQuizCorrect ? "✅ OTENTIKASI BERHASIL!" : "❌ KODE SALAH!"}
                  </p>
                  <p className="mt-1">
                    {isQuizCorrect
                      ? "Tepat sekali! CPU Scheduler memilih proses dari Ready Queue dan mengalokasikan CPU core kepadanya. Gerbang Portal Stage 2 kini terbuka."
                      : "Jawaban belum tepat. Pelajari kembali materi di terminal untuk mengetahui komponen penjadwal CPU!"}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-purple-500/30 pt-4">
              {!isQuizSubmitted ? (
                <button
                  type="button"
                  disabled={selectedAnswer === null}
                  onClick={handleQuizSubmit}
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-6 py-2.5 font-bold text-white shadow-lg transition hover:scale-105 disabled:opacity-50"
                >
                  Konfirmasi Jawaban ➔
                </button>
              ) : isQuizCorrect ? (
                <button
                  type="button"
                  onClick={() => router.push("/stage/stage2")}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 font-bold text-black shadow-[0_0_20px_rgba(52,211,153,0.6)] transition hover:scale-105"
                >
                  Masuk ke Stage 2 🚀
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsQuizSubmitted(false);
                    setSelectedAnswer(null);
                  }}
                  className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-white transition hover:bg-rose-500"
                >
                  Coba Lagi ↺
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL 3: MINI-GAME (Lever Trigger)
          ═══════════════════════════════════════════════════════ */}
      {showMiniGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-emerald-500/50 bg-[#0d1e0e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_60px_rgba(52,211,153,0.3)]">
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
              <h2 className="text-lg font-bold text-emerald-300">
                🕹️ KONSOL KONTROL ALIEN
              </h2>
              <button
                type="button"
                onClick={() => setShowMiniGame(false)}
                className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-gray-400 hover:text-white"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs md:text-sm text-gray-300">
              <p>
                Kamu menemukan konsol kontrol utama alien. Panel ini menampilkan sekuens perintah yang harus kamu pecahkan untuk mengaktifkan sistem navigasi.
              </p>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 font-mono text-emerald-300 text-xs">
                <p className="text-gray-500">// TODO: Mini-game puzzle akan ditambahkan di sini</p>
                <p className="mt-2 text-emerald-400">{'>'} System.activate(navigation_core);</p>
                <p className="text-emerald-400">{'>'} Status: STANDBY</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMiniGame(false)}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2 text-xs md:text-sm font-bold text-white shadow-lg transition hover:scale-105"
              >
                Kembali ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe Animasi Waddle */}
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
