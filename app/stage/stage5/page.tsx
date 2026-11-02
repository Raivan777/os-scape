"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DirectoryArchitectMiniGame from "@/components/DirectoryArchitectMiniGame";
import DiskMaterialModal from "@/components/DiskMaterialModal";
import DiskQuizModal from "@/components/DiskQuizModal";

export default function Stage5Page() {
  const router = useRouter();

  // ─── KONSTANTA KANVAS (16:9 Sesuai Gambar stage5bg.jpg) ────────
  const GAME_WIDTH = 1024;
  const GAME_HEIGHT = 576;
  const GROUND_Y = 536;

  // ─── DIMENSI & FISIKA KARAKTER ASTRONOT ───────────────────────
  const PLAYER_W = 44;
  const PLAYER_H = 64;
  const MOVE_SPEED = 4.2;
  const JUMP_POWER = -12.8;
  const GRAVITY = 0.58;

  // Spawn point di depan pintu masuk kiri bawah
  const SPAWN_X = 65;
  const SPAWN_Y = GROUND_Y - PLAYER_H;

  // ─── STATE PEMAIN & FISIKA ────────────────────────────────────
  const [playerX, setPlayerX] = useState(SPAWN_X);
  const [playerY, setPlayerY] = useState(SPAWN_Y);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isWalking, setIsWalking] = useState(false);
  const [isHurt, setIsHurt] = useState(false);

  // ─── STATE TOAST NOTIFIKASI ───────────────────────────────────
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAlert = (msg: string) => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setAlertMessage(msg);
    alertTimeoutRef.current = setTimeout(() => {
      setAlertMessage(null);
    }, 4000);
  };

  // ─── STATE MODAL & TERMINAL ───────────────────────────────────
  const [showMaterial, setShowMaterial] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showArchitectTerminal, setShowArchitectTerminal] = useState(false);

  // Status Kedekatan dengan Objek Interaktif di Gambar
  const [isNearTerminal, setIsNearTerminal] = useState(false);
  const [isNearArchitectStation, setIsNearArchitectStation] = useState(false);
  const [isNearPortal, setIsNearPortal] = useState(false);

  // ─── PLATFORM HORIZONTAL SESUAI GAMBAR stage5bg.jpg ──────────
  // Pijakan transparan murni untuk physics collider
  const platforms = [
    // 1. Lantai Bawah Kiri (Area Pintu Masuk)
    { x: 0, y: 536, w: 301, h: 40, label: "Lantai Kiri" },
    // 2. Jembatan Tengah di antara kolam lava & listrik
    { x: 448, y: 518, w: 110, h: 20, label: "Jembatan Tengah" },
    // 3. Lantai Bawah Kanan (Depan Tangga Bawah)
    { x: 722, y: 536, w: 302, h: 40, label: "Lantai Kanan" },
    // 4. Kotak Kargo Kecil di Kanan Bawah
    { x: 848, y: 465, w: 76, h: 71, label: "Pijakan Kotak 1" },
    // 5. Tumpukan Kotak Kargo Tinggi di Kanan Bawah
    { x: 924, y: 390, w: 68, h: 146, label: "Pijakan Kotak 2" },
    // 6. Catwalk Lantai Tengah (Meja Datalog & Jalur Utama)
    { x: 280, y: 413, w: 570, h: 20, label: "Catwalk Tengah" },
    // 7. Mezanin Kiri di atas Pintu Masuk
    { x: 0, y: 385, w: 216, h: 20, label: "Mezanin Kiri" },
    // 8. Platform Tengah Terangkat (di atas tangga tengah)
    { x: 455, y: 304, w: 110, h: 20, label: "Platform Tengah Atas" },
    // 9. Ledge Melayang Kiri (Konektor Balok Oranye)
    { x: 248, y: 311, w: 56, h: 18, label: "Ledge Kiri" },
    // 10. Ledge Melayang Kanan (Konektor Balok Biru)
    { x: 706, y: 311, w: 60, h: 18, label: "Ledge Kanan" },
    // 11. Piringan Gantung Kiri (Suspended Pod L)
    { x: 327, y: 255, w: 98, h: 18, label: "Pod Gantung Kiri" },
    // 12. Piringan Gantung Kanan (Suspended Pod R)
    { x: 595, y: 255, w: 98, h: 18, label: "Pod Gantung Kanan" },
    // 13. Catwalk Atas Kiri (Di bawah Rak Senjata)
    { x: 0, y: 105, w: 465, h: 20, label: "Catwalk Atas Kiri" },
    // 14. Catwalk Atas Kanan (Terminal Directory Architect)
    { x: 558, y: 105, w: 225, h: 20, label: "Catwalk Atas Kanan" },
    // 15. Platform Depan Pintu Keluar Portal Stage 6
    { x: 868, y: 75, w: 156, h: 20, label: "Platform Pintu Exit" },
  ];

  // ─── TANGGA REALISTIS (RAMP MENGIKUTI VISUAL GAMBAR) ─────────
  const stairs = [
    // 1. Tangga Kanan Bawah: dari (729, 536) naik ke kanan menuju (848, 413)
    { x1: 729, y1: 536, x2: 848, y2: 413 },
    // 2. Tangga Tengah: dari (329, 413) naik ke kanan menuju (455, 304)
    { x1: 329, y1: 413, x2: 455, y2: 304 },
    // 3. Tangga Mezanin Kiri: dari (216, 385) turun ke kanan menuju (280, 424)
    { x1: 216, y1: 385, x2: 280, y2: 424 },
    // 4. Tangga Atas Kanan Menuju Pintu Exit: dari (780, 145) naik ke kanan menuju (868, 75)
    { x1: 780, y1: 145, x2: 868, y2: 75 },
  ];

  // ─── TITIK INTERAKSI OBJEK (MENEMPEL PADA GAMBAR) ───────────
  // 1. Komputer Terminal Datalog Materi (Meja Tengah MFD)
  const terminalObj = { x: 630, y: 413 - 55, w: 65, h: 55 };

  // 2. Komputer Terminal Directory Architect (Catwalk Atas Kanan)
  const architectStationObj = { x: 760, y: 105 - 60, w: 75, h: 60 };

  // 3. Pintu Keluar / Portal Stage 6 (Pintu Hijau Atas Kanan)
  const portalObj = { x: 910, y: 75 - 75, w: 70, h: 75 };

  // ─── REFS GAME LOOP ──────────────────────────────────────────
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: playerX, y: playerY, vy: velocityY, jumping: isJumping });

  playerRef.current = { x: playerX, y: playerY, vy: velocityY, jumping: isJumping };

  // Reset Posisi Pemain jika Jatuh ke Kolam Hazard
  const resetPlayerToSpawn = (reason?: string) => {
    setIsHurt(true);
    setTimeout(() => setIsHurt(false), 500);

    setPlayerX(SPAWN_X);
    setPlayerY(SPAWN_Y);
    setVelocityY(0);
    setIsJumping(false);
    setIsWalking(false);
    playerRef.current = { x: SPAWN_X, y: SPAWN_Y, vy: 0, jumping: false };

    if (reason === "lava") {
      triggerAlert("🔥 Terkena Kolam Lava! Karakter dikembalikan ke pintu masuk.");
    } else if (reason === "electric") {
      triggerAlert("⚡ Terkena Kolam Listrik Plasma! Karakter dikembalikan ke pintu masuk.");
    }
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Interaksi Tombol E
      if (key === "e") {
        if (isNearArchitectStation && !showArchitectTerminal && !showMaterial && !showQuiz) {
          setShowArchitectTerminal(true);
          return;
        }
        if (isNearTerminal && !showMaterial && !showArchitectTerminal && !showQuiz) {
          setShowMaterial(true);
          return;
        }
        if (isNearPortal && !showQuiz && !showMaterial && !showArchitectTerminal) {
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
        if (!showArchitectTerminal && !showMaterial && !showQuiz) {
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
      const isPaused = showMaterial || showQuiz || showArchitectTerminal;

      if (!isPaused) {
        let p = { ...playerRef.current };
        const keys = keysPressed.current;

        // 1. Kontrol Horizontal Pemain
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

        // 2. Lompat Pemain
        const wantsJump = keys.has("w") || keys.has("arrowup") || keys.has(" ");
        if (wantsJump && !p.jumping) {
          p.vy = JUMP_POWER;
          p.jumping = true;
        }

        // Terapkan Gravitasi
        p.vy += GRAVITY;
        p.y += p.vy;

        // 3. Gerakan Horizontal dengan Batas Layar
        let nextPlayerX = p.x + moveX;
        if (nextPlayerX < 10) nextPlayerX = 10;
        if (nextPlayerX + PLAYER_W > GAME_WIDTH - 10) nextPlayerX = GAME_WIDTH - 10 - PLAYER_W;
        p.x = nextPlayerX;

        const footX = p.x + PLAYER_W * 0.5;
        const footY = p.y + PLAYER_H;
        const prevFootY = footY - p.vy;

        // 4. Deteksi Pijakan Tangga (Ramp Math Mulus)
        let onStairs = false;
        for (const st of stairs) {
          const minX = Math.min(st.x1, st.x2);
          const maxX = Math.max(st.x1, st.x2);

          if (footX >= minX && footX <= maxX) {
            const t = (footX - st.x1) / (st.x2 - st.x1);
            const rampY = st.y1 + t * (st.y2 - st.y1);

            if (footY >= rampY - 14 && footY <= rampY + 16) {
              p.y = rampY - PLAYER_H;
              p.vy = 0;
              p.jumping = false;
              onStairs = true;
              break;
            }
          }
        }

        // 5. Deteksi Pijakan Platform Horizontal (One-Way Platform Mechanics)
        if (!onStairs) {
          for (const plat of platforms) {
            if (
              footX >= plat.x &&
              footX <= plat.x + plat.w &&
              footY >= plat.y &&
              prevFootY <= plat.y + 14 &&
              p.vy >= 0
            ) {
              p.y = plat.y - PLAYER_H;
              p.vy = 0;
              p.jumping = false;
              break;
            }
          }
        }

        // 6. Rintangan Kolam Hazard di Lantai Bawah
        const inLavaPool = footX > 301 && footX < 448 && footY >= 532;
        const inElectricPool = footX > 558 && footX < 722 && footY >= 532;
        const outOfBounds = p.y > GAME_HEIGHT;

        if (inLavaPool || inElectricPool || outOfBounds) {
          resetPlayerToSpawn(inLavaPool ? "lava" : inElectricPool ? "electric" : "fall");
          return;
        }

        // 7. Deteksi Kedekatan Objek Interaktif
        const distTermX = Math.abs(p.x + PLAYER_W / 2 - (terminalObj.x + terminalObj.w / 2));
        const distTermY = Math.abs(p.y + PLAYER_H / 2 - (terminalObj.y + terminalObj.h / 2));
        setIsNearTerminal(distTermX < 65 && distTermY < 65);

        const distArchX = Math.abs(p.x + PLAYER_W / 2 - (architectStationObj.x + architectStationObj.w / 2));
        const distArchY = Math.abs(p.y + PLAYER_H / 2 - (architectStationObj.y + architectStationObj.h / 2));
        setIsNearArchitectStation(distArchX < 75 && distArchY < 75);

        const distPortalX = Math.abs(p.x + PLAYER_W / 2 - (portalObj.x + portalObj.w / 2));
        const distPortalY = Math.abs(p.y + PLAYER_H / 2 - (portalObj.y + portalObj.h / 2));
        setIsNearPortal(distPortalX < 70 && distPortalY < 75);

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
  }, [showMaterial, showQuiz, showArchitectTerminal]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-3 md:p-4 select-none">
      {/* ─── HUD INFO ATAS ────────────────────────────────────────── */}
      <div className="mb-3 flex w-full max-w-[1024px] flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-500/40 bg-[#09061c]/85 px-4 py-2 text-xs text-gray-300 backdrop-blur-md shadow-[0_0_25px_rgba(6,182,212,0.25)]">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-wider text-cyan-300 uppercase font-mono">
            STAGE 5 // DIRECTORY & STORAGE VAULT
          </span>
          <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300 font-mono">
            File System Core
          </span>
        </div>

        {/* Kontrol Cepat Modal & Navigasi */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setShowArchitectTerminal(true)}
            className="rounded-md border border-purple-400/40 bg-purple-500/20 px-2.5 py-1 font-bold text-purple-200 hover:bg-purple-500/30 transition shadow-[0_0_10px_rgba(168,85,247,0.3)]"
          >
            💻 Directory Architect
          </button>
          <button
            type="button"
            onClick={() => setShowMaterial(true)}
            className="rounded-md border border-cyan-400/40 bg-cyan-500/20 px-2.5 py-1 font-bold text-cyan-200 hover:bg-cyan-500/30 transition"
          >
            📖 Datalog
          </button>
          <button
            type="button"
            onClick={() => setShowQuiz(true)}
            className="rounded-md border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-1 font-bold text-emerald-300 hover:bg-emerald-500/30 transition"
          >
            🛡️ Firewall 5
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
          backgroundImage: "url('/stage5bg.jpg')",
          backgroundSize: "100% 100%",
        }}
      >
        {/* Overlay lembut sci-fi */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/30 pointer-events-none" />

        {/* ─── TOAST ALERT TELEMETRI ────────────────────────────────── */}
        {alertMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-all duration-300">
            <div className="flex items-center gap-2 rounded-xl border border-cyan-400/80 bg-black/90 px-4 py-2 text-xs font-mono font-bold text-cyan-200 shadow-[0_0_25px_rgba(34,211,238,0.5)]">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span>{alertMessage}</span>
            </div>
          </div>
        )}

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

        {/* ─── INTERAKSI 1: KOMPUTER TERMINAL DATALOG (MEJA TENGAH) ──── */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
          style={{
            left: `${terminalObj.x}px`,
            top: `${terminalObj.y}px`,
            width: `${terminalObj.w}px`,
            height: `${terminalObj.h}px`,
          }}
          onClick={() => setShowMaterial(true)}
        >
          {isNearTerminal && (
            <div className="absolute -top-8 whitespace-nowrap z-30 pointer-events-none animate-in fade-in duration-150">
              <span className="rounded-md border border-cyan-400/80 bg-black/90 px-2.5 py-1 text-[10px] font-mono font-bold text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                Tekan <kbd className="rounded bg-cyan-400 px-1 py-0.2 text-[9px] font-black text-black mx-0.5">E</kbd> untuk Baca Datalog Direktori &amp; Disk
              </span>
            </div>
          )}
        </div>

        {/* ─── INTERAKSI 2: STASIUN DIRECTORY ARCHITECT (ATAS KANAN) ─── */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
          style={{
            left: `${architectStationObj.x}px`,
            top: `${architectStationObj.y}px`,
            width: `${architectStationObj.w}px`,
            height: `${architectStationObj.h}px`,
          }}
          onClick={() => setShowArchitectTerminal(true)}
        >
          {isNearArchitectStation && (
            <div className="absolute -top-8 whitespace-nowrap z-30 pointer-events-none animate-in fade-in duration-150">
              <span className="rounded-md border border-purple-400/80 bg-black/90 px-2.5 py-1 text-[10px] font-mono font-bold text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                Tekan <kbd className="rounded bg-purple-400 px-1 py-0.2 text-[9px] font-black text-black mx-0.5">E</kbd> untuk Akses Terminal Directory Architect
              </span>
            </div>
          )}
        </div>

        {/* ─── INTERAKSI 3: PORTAL EXIT PINTU STAGE 6 (ATAS KANAN) ───── */}
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
            <div className="absolute -top-8 whitespace-nowrap z-30 pointer-events-none animate-in fade-in duration-150">
              <span className="rounded-md border border-emerald-400/80 bg-black/90 px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                Tekan <kbd className="rounded bg-emerald-400 px-1 py-0.2 text-[9px] font-black text-black mx-0.5">E</kbd> untuk Masuk Portal Stage 6
              </span>
            </div>
          )}
        </div>

        {/* ─── KARAKTER ASTRONOT PEMAIN ──────────────────────────────── */}
        <div
          className="absolute z-30 pointer-events-none transition-all duration-75"
          style={{
            left: `${playerX}px`,
            top: `${playerY}px`,
            width: `${PLAYER_W}px`,
            height: `${PLAYER_H}px`,
          }}
        >
          <div
            className={`h-full w-full transition-transform duration-100 ease-out ${
              isHurt ? "opacity-50 brightness-150 animate-pulse" : ""
            }`}
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
          Stage 5: Baca Datalog di Meja Tengah, Selesaikan Terminal Architect di Atas, &amp; Buka Portal Stage 6!
        </span>
        <button
          type="button"
          onClick={() => setShowArchitectTerminal(true)}
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
              onOpenMaterial={() => setShowMaterial(true)}
              onOpenQuiz={() => setShowQuiz(true)}
            />
          </div>
        </div>
      )}

      {/* ─── MODAL 2: DATALOG MATERI PEMBELAJARAN ──────────────────── */}
      <DiskMaterialModal isOpen={showMaterial} onClose={() => setShowMaterial(false)} />

      {/* ─── MODAL 3: KUIS FIREWALL PINTU 5 / PORTAL STAGE 6 ────────── */}
      <DiskQuizModal isOpen={showQuiz} onClose={() => setShowQuiz(false)} />

      {/* ─── KEYFRAME ANIMASI WADDLE ASTRONOT ──────────────────────── */}
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
