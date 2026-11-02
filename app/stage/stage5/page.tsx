"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Stage5ZeroGBackground from "@/components/Stage5ZeroGBackground";
import Stage5EducationalNodes from "@/components/Stage5EducationalNodes";
import DirectoryArchitectMiniGame from "@/components/DirectoryArchitectMiniGame";
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
  const SPAWN_X = 50;
  const SPAWN_Y = GROUND_Y - PLAYER_H;

  // 1. State Pemain & Fisika
  const [playerX, setPlayerX] = useState(SPAWN_X);
  const [playerY, setPlayerY] = useState(SPAWN_Y);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isWalking, setIsWalking] = useState(false);

  // 2. State Objek Kotak Kargo Magnetik
  const [boxX, setBoxX] = useState(250);
  const [boxY, setBoxY] = useState(GROUND_Y - BOX_H);
  const [boxVelocityY, setBoxVelocityY] = useState(0);

  // 3. Rintangan Bergerak: Laser Shredder Beam Vertikal
  const [laserBeamY, setLaserBeamY] = useState(260);
  const [laserBeamDir, setLaserBeamDir] = useState<"up" | "down">("down");

  // 4. State Modal & Terminal Mini-Game
  const [showMaterial, setShowMaterial] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showArchitectTerminal, setShowArchitectTerminal] = useState(false);

  // 5. Dokumen Digital Melayang yang Dapat Dikoleksi (Collectible Levitating Documents)
  const [collectedDocs, setCollectedDocs] = useState<number[]>([]);
  const collectibleDocuments = [
    { id: 1, x: 260, y: 395, name: "core_kernel.bin", color: "cyan" },
    { id: 2, x: 440, y: 250, name: "mfd_table.dat", color: "purple" },
    { id: 3, x: 625, y: 195, name: "ufd_catalog.hex", color: "emerald" },
    { id: 4, x: 745, y: 125, name: "tree_root.idx", color: "amber" },
  ];

  // Status Kedekatan dengan Objek Interaktif
  const [isNearTerminal, setIsNearTerminal] = useState(false);
  const [isNearArchitectStation, setIsNearArchitectStation] = useState(false);
  const [isNearPortal, setIsNearPortal] = useState(false);

  // Daftar Platform: Panel Modular Melayang & Tangga Magnetik (Magnetic Stairs)
  const platforms = [
    { x: 0, y: GROUND_Y, w: 340, h: 80, isStairs: false, label: "MODULAR HULL A" }, // Lantai Kiri
    { x: 560, y: GROUND_Y, w: 440, h: 80, isStairs: false, label: "MODULAR HULL B" }, // Lantai Kanan
    // Tangga Magnetik 1 & 2 (Magnetic Stairs)
    { x: 240, y: 440, w: 85, h: 20, isStairs: true, label: "MAG_STAIR 01" },
    { x: 315, y: 375, w: 85, h: 20, isStairs: true, label: "MAG_STAIR 02" },
    // Platform Modular Tengah (Terminal Datalog & Blueprint)
    { x: 415, y: 300, w: 175, h: 22, isStairs: false, label: "BLUEPRINT DOCK" },
    // Tangga Magnetik 3
    { x: 605, y: 240, w: 80, h: 20, isStairs: true, label: "MAG_STAIR 03" },
    // Platform Melayang Tinggi (Directory Architect Terminal Station)
    { x: 695, y: 190, w: 195, h: 24, isStairs: false, label: "ARCHITECT DOCK" },
    // Tangga Magnetik Menuju Portal Akhir
    { x: 900, y: 150, w: 100, h: 22, isStairs: true, label: "PORTAL GATE" },
  ];

  // Rintangan 1: Lubang Fluks Magnetik (Hazard Pit) di antara lantai dasar
  const hazardPit = { x: 340, y: 530, w: 220, h: 70 };

  // Rintangan 2: Sinar Laser Shredder Bergerak (X: 635)
  const laserHazard = { x: 640, w: 22, h: 90 };

  // Objek Terminal Datalog Materi (Platform Tengah)
  const terminalObj = { x: 475, y: 300 - 55, w: 45, h: 55 };

  // Objek Terminal Stasiun DIRECTORY ARCHITECT (Platform Atas)
  const architectStationObj = { x: 765, y: 190 - 75, w: 80, h: 75 };

  // Objek Portal Akhir Stage (Pintu 6)
  const portalObj = { x: 930, y: 150 - 90, w: 60, h: 90 };

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
        if (isNearArchitectStation && !showArchitectTerminal) {
          setShowArchitectTerminal(true);
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
        setShowArchitectTerminal(false);
        return;
      }

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        if (!showArchitectTerminal) {
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
  }, [isNearTerminal, isNearArchitectStation, isNearPortal, showMaterial, showQuiz, showArchitectTerminal]);

  // Game Loop Platformer 60 FPS
  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      if (!showMaterial && !showQuiz && !showArchitectTerminal) {
        let p = { ...playerRef.current };
        let b = { ...boxRef.current };
        const keys = keysPressed.current;

        // 1. Pergerakan Rintangan Laser Shredder Beam
        setLaserBeamY((prevY) => {
          let nextY = prevY;
          if (laserBeamDir === "down") {
            nextY += 1.6;
            if (nextY >= 350) setLaserBeamDir("up");
          } else {
            nextY -= 1.6;
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
          b.x = 250;
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

        // 6. Tabrakan Pemain dengan Platform & Tangga Magnetik
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

        // 7. Pengambilan Dokumen Digital Melayang (Collectible Items)
        for (const doc of collectibleDocuments) {
          if (!collectedDocs.includes(doc.id)) {
            const distDoc =
              Math.hypot(p.x + PLAYER_W / 2 - doc.x, p.y + PLAYER_H / 2 - doc.y);
            if (distDoc < 35) {
              setCollectedDocs((prev) => [...prev, doc.id]);
            }
          }
        }

        // 8. Rintangan 1: Celah Fluks Magnetik (Hazard Pit)
        const inHazardPit =
          p.x + PLAYER_W > hazardPit.x + 10 &&
          p.x < hazardPit.x + hazardPit.w - 10 &&
          p.y + PLAYER_H >= hazardPit.y;

        // 9. Rintangan 2: Tabrakan dengan Sinar Laser Shredder Bergerak
        const hitLaserBeam =
          p.x + PLAYER_W > laserHazard.x &&
          p.x < laserHazard.x + laserHazard.w &&
          p.y + PLAYER_H > laserBeamY &&
          p.y < laserBeamY + laserHazard.h;

        if (inHazardPit || hitLaserBeam || p.y > GAME_HEIGHT) {
          resetPlayerToSpawn();
          return;
        }

        // 10. Deteksi Kedekatan Objek Interaktif
        const distTermX = Math.abs(p.x + PLAYER_W / 2 - (terminalObj.x + terminalObj.w / 2));
        const distTermY = Math.abs(p.y + PLAYER_H / 2 - (terminalObj.y + terminalObj.h / 2));
        setIsNearTerminal(distTermX < 65 && distTermY < 65);

        const distArchX = Math.abs(p.x + PLAYER_W / 2 - (architectStationObj.x + architectStationObj.w / 2));
        const distArchY = Math.abs(p.y + PLAYER_H / 2 - (architectStationObj.y + architectStationObj.h / 2));
        setIsNearArchitectStation(distArchX < 85 && distArchY < 85);

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
  }, [showMaterial, showQuiz, showArchitectTerminal, laserBeamDir, collectedDocs]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-3 md:p-4 select-none">
      {/* HUD Info Atas */}
      <div className="mb-3 flex w-full max-w-[1000px] flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-500/40 bg-[#09061c]/85 px-4 py-2.5 text-xs text-gray-300 backdrop-blur-md shadow-[0_0_25px_rgba(6,182,212,0.25)]">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-wider text-cyan-300 uppercase font-mono">
            STAGE 5 // ZERO-G DIRECTORY & STORAGE VAULT
          </span>
          <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300 font-mono">
            Space Station Core
          </span>
        </div>

        {/* Counter Dokumen Digital Terkoleksi */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-black/50 border border-cyan-500/30 px-2.5 py-1 text-[11px] font-mono text-cyan-200">
            <span>📄 Dokumen Terkoleksi:</span>
            <span className="font-bold text-amber-300">{collectedDocs.length}/4</span>
          </div>
          <button
            type="button"
            onClick={() => setShowArchitectTerminal(true)}
            className="rounded-lg border border-purple-400/40 bg-purple-500/20 px-2.5 py-1 text-[11px] font-bold text-purple-200 hover:bg-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.5)] transition"
          >
            💻 Directory Architect [E]
          </button>
          <button
            type="button"
            onClick={() => setShowQuiz(true)}
            className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20"
          >
            🛡️ Firewall 5
          </button>
        </div>
      </div>

      {/* Arena Game 2D Platformer Koridor Storage & Direktori (1000px x 600px) */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/50 bg-[#060412] shadow-[0_0_60px_rgba(6,182,212,0.3)]"
        style={{ width: `${GAME_WIDTH}px`, height: `${GAME_HEIGHT}px` }}
      >
        {/* 1. Latar Belakang Zero-Gravity Space Station Interior (Cartoon Sci-Fi Debris & Cables) */}
        <Stage5ZeroGBackground />

        {/* 2. Tiga Node Tampilan Holografis Edukasi Direktori Melayang (Educational Nodes) */}
        <Stage5EducationalNodes />

        {/* 3. Platform Modular & Tangga Magnetik dengan Pendorong Anti-Gravitasi & Medan Energi */}
        {platforms.map((plat, idx) => (
          <div
            key={idx}
            className={`absolute rounded-t-lg transition-all ${
              plat.isStairs
                ? "border-t-2 border-purple-400/90 bg-gradient-to-b from-[#241352] to-[#0e0724] shadow-[0_4px_18px_rgba(168,85,247,0.4)]"
                : "border-t-2 border-cyan-400/90 bg-gradient-to-b from-[#161338] via-[#0d0a24] to-[#060414] shadow-[0_4px_25px_rgba(0,0,0,0.85)]"
            }`}
            style={{
              left: `${plat.x}px`,
              top: `${plat.y}px`,
              width: `${plat.w}px`,
              height: `${plat.h}px`,
            }}
          >
            {/* Garis Aksen Modular Plat */}
            <div
              className={`h-1.5 w-full ${
                plat.isStairs
                  ? "bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400"
                  : "bg-gradient-to-r from-cyan-400/60 via-purple-500/50 to-cyan-400/60"
              }`}
            />
            <div className="px-2 py-1 flex justify-between items-center text-[8px] font-mono text-cyan-300/70">
              <span>{plat.label}</span>
              <span className="text-[7px] text-purple-400">ZERO-G</span>
            </div>

            {/* Pendorong Anti-Gravitasi (Thruster Housing & Plasma Cones) & Medan Energi di Bawah Platform */}
            <div className="absolute -bottom-8 left-0 right-0 flex justify-around pointer-events-none">
              {/* Thruster 1 (Kiri) */}
              <div className="flex flex-col items-center">
                <div className="h-2 w-5 rounded-b-md bg-slate-800 border-x border-b border-cyan-400/50" />
                {/* Plasma Jet Cone Biru-Ungu */}
                <div className="h-6 w-3 bg-gradient-to-b from-cyan-300 via-blue-500 to-transparent blur-[1px] animate-pulse" />
                {/* Gelombang Medan Energi Magnetik Repulsor */}
                <div className="h-1 w-6 rounded-full bg-cyan-400/50 blur-[2px] animate-ping" />
              </div>

              {/* Thruster 2 (Kanan) */}
              <div className="flex flex-col items-center">
                <div className="h-2 w-5 rounded-b-md bg-slate-800 border-x border-b border-purple-400/50" />
                <div
                  className="h-6 w-3 bg-gradient-to-b from-purple-300 via-purple-600 to-transparent blur-[1px] animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
                <div className="h-1 w-6 rounded-full bg-purple-400/50 blur-[2px] animate-ping" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        ))}

        {/* 4. Rintangan 1: Lubang Fluks Magnetik (Magnetic Hazard Pit) */}
        <div
          className="absolute flex flex-col items-center justify-center rounded-lg border-2 border-rose-500/90 bg-rose-950/60 shadow-[0_0_35px_rgba(244,63,94,0.8)] animate-pulse"
          style={{
            left: `${hazardPit.x}px`,
            top: `${hazardPit.y}px`,
            width: `${hazardPit.w}px`,
            height: `${hazardPit.h}px`,
          }}
        >
          <span className="text-xs md:text-sm font-black tracking-widest text-rose-300 animate-bounce">
            ⚡ BAHAYA RADIASI FLUKS ⚡
          </span>
          <span className="text-[10px] text-rose-400 font-mono">
            Anomali Medan Gravitasi - Reset Posisi
          </span>
        </div>

        {/* 5. Rintangan 2: Sinar Laser Shredder Bergerak Naik Turun */}
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

        {/* 6. Kotak Kargo Silinder Magnetik (Pushable Box) */}
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
          <span className="text-[9px] font-black text-cyan-200 tracking-wider">MODUL</span>
        </div>

        {/* 7. Dokumen Digital Melayang di Udara (Collectible Floating Documents) */}
        {collectibleDocuments.map((doc) => {
          const isCollected = collectedDocs.includes(doc.id);
          if (isCollected) return null;
          return (
            <div
              key={doc.id}
              className="absolute z-20 flex flex-col items-center pointer-events-none animate-[zeroGDrift_4s_ease-in-out_infinite]"
              style={{
                left: `${doc.x}px`,
                top: `${doc.y}px`,
                animationDelay: `${doc.id * 0.6}s`,
              }}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-300 bg-cyan-950/80 shadow-[0_0_15px_#22d3ee] animate-bounce">
                <span className="text-xs">📄</span>
              </div>
              <span className="mt-0.5 rounded bg-black/70 px-1 text-[7px] font-mono text-cyan-200 border border-cyan-500/30">
                {doc.name}
              </span>
            </div>
          );
        })}

        {/* 8. Terminal Interaktif Datalog Materi (Platform Tengah) */}
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

        {/* ========================================================
            9. [MINIGAME TERMINAL - DIRECTORY ARCHITECT]
            Stasiun terminal komputer sci-fi futuristis yang sangat detail
            terletak di atas platform modular magnetik melayang.
            Dilengkapi antarmuka holografis besar bercahaya dan banyak
            ikon dokumen digital melayang tanpa bobot di sekitarnya.
            (NO CHARACTERS ON ASSET).
           ======================================================== */}
        <div
          className="absolute z-20 flex flex-col items-center cursor-pointer group"
          style={{
            left: `${architectStationObj.x}px`,
            top: `${architectStationObj.y}px`,
            width: `${architectStationObj.w}px`,
            height: `${architectStationObj.h}px`,
          }}
          onClick={() => setShowArchitectTerminal(true)}
        >
          {/* Tooltip Interaksi [E] */}
          <div className="absolute -top-9 whitespace-nowrap animate-bounce">
            <span className="rounded bg-gradient-to-r from-purple-400 to-cyan-400 px-2.5 py-0.5 text-[10px] font-black text-black shadow-[0_0_15px_rgba(168,85,247,0.9)]">
              {isNearArchitectStation ? "[E] Directory Architect" : "Terminal Architect"}
            </span>
          </div>

          {/* Ikon-Ikon Dokumen Digital Melayang di Sekitar Konsol (Levitating Document Items) */}
          <div className="absolute -left-6 top-1 animate-[zeroGDrift_4.5s_ease-in-out_infinite]">
            <span className="rounded-md bg-cyan-950/90 border border-cyan-400/70 px-1 py-0.5 text-[7px] font-mono text-cyan-200 shadow-[0_0_10px_#22d3ee]">
              📄 sys.bin
            </span>
          </div>
          <div className="absolute -right-8 top-3 animate-[zeroGDrift_5.2s_ease-in-out_infinite]" style={{ animationDelay: "1.2s" }}>
            <span className="rounded-md bg-purple-950/90 border border-purple-400/70 px-1 py-0.5 text-[7px] font-mono text-purple-200 shadow-[0_0_10px_#c084fc]">
              📊 mfd.tab
            </span>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -top-5 animate-[zeroGDrift_6s_ease-in-out_infinite]" style={{ animationDelay: "2s" }}>
            <span className="rounded-md bg-emerald-950/90 border border-emerald-400/70 px-1 py-0.5 text-[7px] font-mono text-emerald-200 shadow-[0_0_10px_#34d399]">
              📁 tree.dir
            </span>
          </div>

          {/* Konsol Sci-Fi Futuristik Detail & Layar Holografis Raksasa */}
          <svg width="78" height="66" viewBox="0 0 78 66" className="drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]">
            {/* Basis Platform Konsol Magnetik */}
            <polygon points="14,64 64,64 72,54 6,54" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
            <rect x="24" y="44" width="30" height="12" rx="2" fill="#1e1b4b" stroke="#a855f7" strokeWidth="1.2" />

            {/* Keyboard / Input Interface Panel Bercahaya */}
            <polygon points="20,44 58,44 64,54 14,54" fill="#090524" stroke="#22d3ee" strokeWidth="1" />
            <line x1="24" y1="48" x2="54" y2="48" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="22" y1="51" x2="56" y2="51" stroke="#a855f7" strokeWidth="1" strokeDasharray="4 2" />

            {/* Holographic Projector Emitters (Kiri & Kanan) */}
            <circle cx="12" cy="46" r="3.5" fill="#22d3ee" className="animate-ping" />
            <circle cx="66" cy="46" r="3.5" fill="#a855f7" className="animate-ping" style={{ animationDelay: "0.5s" }} />

            {/* Layar Holografis Raksasa (Massive Glowing Holographic Interface) */}
            <rect x="8" y="4" width="62" height="36" rx="4" fill="#0c1736" fillOpacity="0.85" stroke="#38bdf8" strokeWidth="1.5" />

            {/* Grid Grafis & Diagram File Tree pada Layar Hologram */}
            <line x1="12" y1="12" x2="66" y2="12" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
            <circle cx="18" cy="8" r="1.5" fill="#22d3ee" />
            <circle cx="23" cy="8" r="1.5" fill="#a855f7" />
            <circle cx="28" cy="8" r="1.5" fill="#34d399" />

            {/* Mini File Tree Diagram di Layar */}
            <path d="M20,18 L30,18 L30,24 L45,24" fill="none" stroke="#22d3ee" strokeWidth="1" />
            <path d="M30,18 L30,30 L50,30" fill="none" stroke="#a855f7" strokeWidth="1" />
            <rect x="16" y="15" width="8" height="6" rx="1" fill="#0891b2" />
            <rect x="44" y="21" width="8" height="6" rx="1" fill="#7e22ce" />
            <rect x="49" y="27" width="8" height="6" rx="1" fill="#059669" />

            {/* Scanning Line Sweep Effect */}
            <line x1="8" y1="22" x2="70" y2="22" stroke="#38bdf8" strokeWidth="1" strokeDasharray="6 4" opacity="0.7" />
          </svg>
        </div>

        {/* 10. Portal Akhir Stage (Pintu Menuju Stage 6) */}
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
            <span className="block text-[8px] font-black tracking-widest text-cyan-200 uppercase font-mono">
              PORTAL 6
            </span>
          </div>
        </div>

        {/* 11. Karakter Astronot Pemain (Front Sprite & Squash Stretch) */}
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

      {/* Navigasi Bawah */}
      <div className="mt-3 flex w-full max-w-[1000px] items-center justify-between text-xs text-gray-400">
        <Link href="/" className="hover:text-cyan-300 transition">
          ← Kembali ke Menu Utama
        </Link>
        <span className="font-mono text-[11px] text-gray-300">
          Stage 5: Amati 3 Node Edukasi Direktori, Koleksi Dokumen, & Kelola File di Terminal!
        </span>
        <button
          type="button"
          onClick={() => setShowArchitectTerminal(true)}
          className="text-purple-300 font-bold hover:underline font-mono"
        >
          Buka Terminal Architect ➔
        </button>
      </div>

      {/* MODAL 1: Minigame Console Directory Architect (Sorting File & Disk Calibrator) */}
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
              onOpenMaterial={() => setShowMaterial(true)}
              onOpenQuiz={() => setShowQuiz(true)}
            />
          </div>
        </div>
      )}

      {/* MODAL 2: Datalog Materi Pembelajaran Penjadwalan Disk & Storage */}
      <DiskMaterialModal isOpen={showMaterial} onClose={() => setShowMaterial(false)} />

      {/* MODAL 3: Kuis Firewall Pintu 5 */}
      <DiskQuizModal isOpen={showQuiz} onClose={() => setShowQuiz(false)} />

      {/* Keyframe Waddle Steps */}
      <style jsx>{`
        @keyframes waddle {
          0%, 100% {
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
        @keyframes zeroGDrift {
          0% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) translateX(6px) rotate(8deg);
          }
          100% {
            transform: translateY(-4px) translateX(-5px) rotate(-6deg);
          }
        }
      `}</style>
    </main>
  );
}
