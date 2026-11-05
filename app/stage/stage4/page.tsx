"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeadlockBackground from "@/components/DeadlockBackground";
import AlienLifeSupportMiniGame from "@/components/AlienLifeSupportMiniGame";
import DeadlockQuizModal from "@/components/DeadlockQuizModal";

export default function Stage4Page() {
  const router = useRouter();

  const GAME_WIDTH = 1024;
  const GAME_HEIGHT = 543;

  const PLAYER_W = 44;
  const PLAYER_H = 58;
  const MOVE_SPEED = 4.5;
  const JUMP_POWER = -12.0;
  const GRAVITY = 0.55;

  const SPAWN_X = 85;
  const SPAWN_Y = 495 - PLAYER_H;

  const [playerX, setPlayerX] = useState(SPAWN_X);
  const [playerY, setPlayerY] = useState(SPAWN_Y);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isWalking, setIsWalking] = useState(false);

  // State Modal
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showMiniGameModal, setShowMiniGameModal] = useState(false);

  // State Rintangan Menuju Modul Kuis
  const [droneX, setDroneX] = useState(330);
  const [droneDir, setDroneDir] = useState<"left" | "right">("right");
  const [isSparkActive, setIsSparkActive] = useState(true);

  // State Misi & Skor
  const [quizPassed, setQuizPassed] = useState(false);
  const [unlockedLocks, setUnlockedLocks] = useState({
    green: false,
    blue: false,
    purple: false,
  });
  const [portalUsed, setPortalUsed] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  const platforms = [
    { x: 0, y: 495, w: 1024, h: 48 },
    { x: 30, y: 382, w: 290, h: 22 },
    { x: 245, y: 318, w: 640, h: 22 },
    { x: 760, y: 395, w: 200, h: 20 },
    { x: 730, y: 195, w: 240, h: 20 },
  ];

  // Koordinat Objek Interaktif
  const hologramObj = { x: 485, y: 245, w: 70, h: 70 };
  const miniGameStationObj = { x: 480, y: 435, w: 70, h: 60 };
  const portalObj = { x: 825, y: 240, w: 65, h: 80 };

  // Koordinat Rintangan
  const DRONE_Y = 278;
  const DRONE_W = 34;
  const DRONE_H = 26;
  const SPARK_TRAP = { x: 370, y: 306, w: 38, h: 14 };

  const [isNearHologram, setIsNearHologram] = useState(false);
  const [isNearStation, setIsNearStation] = useState(false);
  const [isNearPortal, setIsNearPortal] = useState(false);

  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: playerX, y: playerY, vy: velocityY, jumping: isJumping });
  playerRef.current = { x: playerX, y: playerY, vy: velocityY, jumping: isJumping };

  const currentScore =
    (quizPassed ? 100 : 0) +
    (unlockedLocks.green ? 100 : 0) +
    (unlockedLocks.blue ? 100 : 0) +
    (unlockedLocks.purple ? 100 : 0) +
    (portalUsed ? 100 : 0);

  const allLocksUnlocked = unlockedLocks.green && unlockedLocks.blue && unlockedLocks.purple;
  const isPortalReady = quizPassed && allLocksUnlocked;

  const handleUnlockLock = (lockType: "green" | "blue" | "purple") => {
    setUnlockedLocks((prev) => {
      if (prev[lockType]) return prev;
      const next = { ...prev, [lockType]: true };
      const lockName =
        lockType === "green"
          ? "Gembok Hijau (Safety Check)"
          : lockType === "blue"
          ? "Gembok Biru (Resource-Request)"
          : "Gembok Ungu (Deadlock Detection)";
      showToast(`🔓 ${lockName} Berhasil Dibuka! (+100 poin)`);
      return next;
    });
  };

  const handlePassQuiz = () => {
    if (!quizPassed) {
      setQuizPassed(true);
      showToast("🎉 Kuis Lulus! Memperoleh +100 poin.");
    }
  };

  const handleEnterPortal = () => {
    if (!isPortalReady) {
      showToast("⚠️ Selesaikan kuis dan buka ketiga gembok mini-game terlebih dahulu.");
      return;
    }
    setPortalUsed(true);
    showToast("🌀 Memasuki Portal Level 5 (+100 poin)...");
    setTimeout(() => {
      router.push("/stage/stage5");
    }, 1200);
  };

  // Timer siklus semburan listrik (aktif 2.2 detik, padam 2.2 detik)
  useEffect(() => {
    const sparkTimer = setInterval(() => {
      setIsSparkActive((prev) => !prev);
    }, 2200);

    return () => clearInterval(sparkTimer);
  }, []);

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === "e") {
        if (isNearHologram && !showQuizModal) {
          setShowQuizModal(true);
          return;
        }
        if (isNearStation && !showMiniGameModal) {
          setShowMiniGameModal(true);
          return;
        }
        if (isNearPortal) {
          handleEnterPortal();
          return;
        }
      }

      if (key === "escape") {
        setShowQuizModal(false);
        setShowMiniGameModal(false);
        return;
      }

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        if (!showQuizModal && !showMiniGameModal) {
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
  }, [isNearHologram, isNearStation, isNearPortal, showQuizModal, showMiniGameModal, isPortalReady]);

  // Game Loop Fisika 60 FPS
  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      if (!showQuizModal && !showMiniGameModal) {
        const p = { ...playerRef.current };
        const keys = keysPressed.current;

        // 1. Pergerakan Patrol Drone Rintangan
        setDroneX((prevX) => {
          let nextX = prevX + (droneDir === "right" ? 1.7 : -1.7);
          if (nextX >= 450) setDroneDir("left");
          if (nextX <= 300) setDroneDir("right");
          return nextX;
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

        // 3. Lompat & Gravitasi
        const wantsJump = keys.has("w") || keys.has("arrowup") || keys.has(" ");
        if (wantsJump && !p.jumping) {
          p.vy = JUMP_POWER;
          p.jumping = true;
        }

        p.vy += GRAVITY;
        p.y += p.vy;
        p.x += moveX;

        p.x = Math.max(0, Math.min(GAME_WIDTH - PLAYER_W, p.x));

        // 4. Tabrakan dengan Platform
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

        // 5. Rintangan 1: Drone Patroli Pengawas
        const isHitDrone =
          p.x + PLAYER_W > droneX &&
          p.x < droneX + DRONE_W &&
          p.y + PLAYER_H > DRONE_Y &&
          p.y < DRONE_Y + DRONE_H;

        if (isHitDrone) {
          p.x = SPAWN_X;
          p.y = SPAWN_Y;
          p.vy = 0;
          p.jumping = false;
          setFacingRight(true);
          showToast("⚡ Tersengat Drone Keamanan! Respawn di pintu masuk.");
        }

        // 6. Rintangan 2: Fluks Listrik Statis di Meja
        const isHitSpark =
          isSparkActive &&
          p.x + PLAYER_W > SPARK_TRAP.x &&
          p.x < SPARK_TRAP.x + SPARK_TRAP.w &&
          p.y + PLAYER_H >= SPARK_TRAP.y &&
          p.y + PLAYER_H <= SPARK_TRAP.y + 16;

        if (isHitSpark) {
          p.x = SPAWN_X;
          p.y = SPAWN_Y;
          p.vy = 0;
          p.jumping = false;
          setFacingRight(true);
          showToast("⚡ Terkena Semburan Listrik Statis! Respawn di pintu masuk.");
        }

        // Batas Bawah Layar
        if (p.y > GAME_HEIGHT) {
          p.x = SPAWN_X;
          p.y = SPAWN_Y;
          p.vy = 0;
          p.jumping = false;
        }

        const checkNear = (obj: { x: number; y: number; w: number; h: number }, range = 45) => {
          const px = p.x + PLAYER_W / 2;
          const py = p.y + PLAYER_H / 2;
          const ox = obj.x + obj.w / 2;
          const oy = obj.y + obj.h / 2;
          return Math.abs(px - ox) < obj.w / 2 + range && Math.abs(py - oy) < obj.h / 2 + range;
        };

        setIsNearHologram(checkNear(hologramObj));
        setIsNearStation(checkNear(miniGameStationObj));
        setIsNearPortal(checkNear(portalObj, 50));

        setPlayerX(p.x);
        setPlayerY(p.y);
        setVelocityY(p.vy);
        setIsJumping(p.jumping);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [showQuizModal, showMiniGameModal, droneDir, isSparkActive]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-2 md:p-4 select-none">
      {/* Top HUD */}
      <div className="mb-2 flex w-full max-w-[1024px] flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-500/30 bg-[#071324]/90 px-4 py-2 text-xs text-gray-200 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold tracking-wide text-cyan-300 font-mono">STAGE 4</span>
          <span className="text-gray-400">| Deadlock &amp; Penanganannya</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <span className="text-gray-300">
            Kuis:{" "}
            <strong className={quizPassed ? "text-emerald-400" : "text-amber-400"}>
              {quizPassed ? "LULUS (100)" : "Belum (0)"}
            </strong>
          </span>

          <span className="text-gray-300">
            Gembok:{" "}
            <strong className={allLocksUnlocked ? "text-emerald-400" : "text-amber-400"}>
              {[unlockedLocks.green, unlockedLocks.blue, unlockedLocks.purple].filter(Boolean).length}/3
            </strong>
          </span>

          <span className="text-gray-300">
            Total Skor: <strong className="text-cyan-300 text-sm">{currentScore} PTS</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQuizModal(true)}
            className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20"
          >
            MODUL: STAGE 4 [E]
          </button>
          <button
            type="button"
            onClick={() => setShowMiniGameModal(true)}
            className="rounded-lg border border-purple-400/40 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-200 hover:bg-purple-500/20"
          >
            Banker Mini-Game [E]
          </button>
        </div>
      </div>

      {/* Arena Platformer 1024 x 543 */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/40 shadow-2xl"
        style={{ width: `${GAME_WIDTH}px`, height: `${GAME_HEIGHT}px` }}
      >
        <DeadlockBackground />

        {/* Indikator Pintu Masuk */}
        <div
          className="absolute z-10 pointer-events-none flex flex-col items-center"
          style={{
            left: `${SPAWN_X - 18}px`,
            top: `${SPAWN_Y - 32}px`,
            width: "80px",
          }}
        >
          <span className="flex items-center gap-1 rounded bg-black/70 border border-cyan-400/40 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            PINTU MASUK
          </span>
          <div className="mt-1 h-20 w-16 rounded-t-lg border border-dashed border-cyan-500/20 bg-gradient-to-t from-cyan-500/10 to-transparent" />
        </div>

        {/* ─── RINTANGAN 1: FLUKSI LISTRIK STATIS DI ATAS MEJA ────────── */}
        <div
          className="absolute z-20 flex flex-col items-center pointer-events-none"
          style={{
            left: `${SPARK_TRAP.x}px`,
            top: `${SPARK_TRAP.y}px`,
            width: `${SPARK_TRAP.w}px`,
            height: `${SPARK_TRAP.h}px`,
          }}
        >
          <div
            className={`w-full h-full rounded transition-all duration-200 flex items-center justify-center ${
              isSparkActive
                ? "border border-amber-400 bg-amber-400/40 shadow-[0_0_15px_#fbbf24] animate-pulse"
                : "border border-gray-600/40 bg-gray-900/30 opacity-40"
            }`}
          >
            {isSparkActive && <span className="text-[10px] font-bold text-amber-200">⚡</span>}
          </div>
        </div>

        {/* ─── RINTANGAN 2: DRONE PATROLI KEAMANAN MINI ───────────────── */}
        <div
          className="absolute z-20 pointer-events-none transition-transform duration-75"
          style={{
            left: `${droneX}px`,
            top: `${DRONE_Y}px`,
            width: `${DRONE_W}px`,
            height: `${DRONE_H}px`,
          }}
        >
          <div className="relative w-full h-full flex flex-col items-center">
            {/* Lampu Scanner Sensor ke Bawah */}
            <div className="absolute top-5 w-6 h-8 bg-gradient-to-b from-rose-500/40 to-transparent blur-[1px] animate-pulse" />
            <div className="w-8 h-5 rounded-md border border-rose-400/80 bg-rose-950/80 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.7)]">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
            </div>
            <div className="flex justify-between w-7 -mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            </div>
          </div>
        </div>

        {/* Hologram MODUL: STAGE 4 */}
        <div
          className="absolute z-20 flex flex-col items-center cursor-pointer"
          style={{
            left: `${hologramObj.x}px`,
            top: `${hologramObj.y}px`,
            width: `${hologramObj.w}px`,
            height: `${hologramObj.h}px`,
          }}
          onClick={() => setShowQuizModal(true)}
        >
          {isNearHologram && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce">
              <span className="rounded bg-cyan-400 px-2 py-0.5 text-[10px] font-black text-black shadow-md">
                [E] MODUL: STAGE 4
              </span>
            </div>
          )}
          <div className="flex h-12 w-14 items-center justify-center rounded-xl border border-cyan-400/80 bg-cyan-950/60 shadow-[0_0_20px_rgba(34,211,238,0.7)] animate-pulse">
            <span className="text-xl">📜</span>
          </div>
          <span className="mt-1 text-[9px] font-mono font-bold tracking-wider text-cyan-300 bg-black/60 px-1.5 py-0.5 rounded border border-cyan-400/30">
            MODUL: STAGE 4
          </span>
        </div>

        {/* Stasiun Mini-Game Banker */}
        <div
          className="absolute z-20 flex flex-col items-center cursor-pointer"
          style={{
            left: `${miniGameStationObj.x}px`,
            top: `${miniGameStationObj.y}px`,
            width: `${miniGameStationObj.w}px`,
            height: `${miniGameStationObj.h}px`,
          }}
          onClick={() => setShowMiniGameModal(true)}
        >
          {isNearStation && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce">
              <span className="rounded bg-purple-400 px-2 py-0.5 text-[10px] font-black text-black shadow-md">
                [E] Life-Support Banker
              </span>
            </div>
          )}
          <div className="flex h-11 w-12 items-center justify-center rounded-xl border border-purple-400/80 bg-purple-950/70 shadow-[0_0_20px_rgba(168,85,247,0.7)]">
            <span className="text-lg">🧪</span>
          </div>
          <span className="mt-1 text-[9px] font-mono font-bold text-purple-300 bg-black/60 px-1 rounded border border-purple-400/30">
            BANKER CORE
          </span>
        </div>

        {/* Portal ke Level 5 */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
          style={{
            left: `${portalObj.x}px`,
            top: `${portalObj.y}px`,
            width: `${portalObj.w}px`,
            height: `${portalObj.h}px`,
          }}
          onClick={handleEnterPortal}
        >
          {isNearPortal && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce">
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-black shadow-md ${
                  isPortalReady ? "bg-emerald-400 text-black" : "bg-gray-700 text-gray-300"
                }`}
              >
                {isPortalReady ? "[E] Masuk Level 5" : "Portal Terkunci"}
              </span>
            </div>
          )}
          <div
            className={`absolute inset-0 rounded-full border-2 transition-all ${
              isPortalReady
                ? "border-emerald-400 bg-emerald-500/30 shadow-[0_0_30px_rgba(52,211,153,0.8)] animate-pulse"
                : "border-gray-600 bg-gray-900/60 opacity-60"
            }`}
          />
          <div className="relative z-10 text-center">
            <span className="text-2xl inline-block">{isPortalReady ? "🌀" : "🔒"}</span>
            <span className="block text-[8px] font-mono font-black tracking-widest text-white uppercase mt-0.5">
              LEVEL 5
            </span>
          </div>
        </div>

        {/* Karakter Astronot Pemain */}
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
                ? `${facingRight ? "scaleX(0.9)" : "scaleX(-0.9)"} scaleY(1.1)`
                : `${facingRight ? "scaleX(1)" : "scaleX(-1)"} scaleY(1)`,
            }}
          >
            <img
              src="/astronaut-front.png"
              alt="Player Character"
              className="h-full w-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
            />
          </div>
        </div>
      </div>

      {/* Navigasi & Info Bawah */}
      <div className="mt-2 flex w-full max-w-[1024px] flex-wrap items-center justify-between gap-2 text-xs text-gray-400 font-mono">
        <div className="flex items-center gap-4">
          <Link href="/stage/stage3" className="hover:text-cyan-300 transition">
            ← Kembali ke Stage 3
          </Link>
          <span className="text-gray-600">|</span>
          <Link href="/stage/stage5" className="hover:text-cyan-300 transition">
            Lanjut ke Level 5 →
          </Link>
          <span className="text-gray-600">|</span>
          <Link href="/" className="hover:text-cyan-300 transition">
            Menu Utama
          </Link>
        </div>

        <div className="text-gray-400">
          Kontrol: <span className="text-cyan-300 font-bold">[A/D]</span> Jalan •{" "}
          <span className="text-cyan-300 font-bold">[W/Spasi]</span> Lompat •{" "}
          <span className="text-cyan-300 font-bold">[E]</span> Interaksi
        </div>
      </div>

      {/* Notifikasi Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 z-50 rounded-xl border border-cyan-500/40 bg-[#071324]/95 px-5 py-2.5 text-xs text-cyan-200 shadow-xl backdrop-blur-md">
          {toastMessage}
        </div>
      )}

      {/* Modal Kuis & Briefing */}
      <DeadlockQuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onPass={handlePassQuiz}
        isAlreadyPassed={quizPassed}
      />

      {/* Modal Mini-Game Alien Life-Support Banker */}
      {showMiniGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 md:p-6 backdrop-blur-md">
          <div className="relative max-h-[94vh] w-full max-w-3xl overflow-y-auto">
            <AlienLifeSupportMiniGame
              unlockedLocks={unlockedLocks}
              onUnlockLock={handleUnlockLock}
              onClose={() => setShowMiniGameModal(false)}
              onOpenQuiz={() => {
                setShowMiniGameModal(false);
                setShowQuizModal(true);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
