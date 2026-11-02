"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Stage2Platformer() {
  const router = useRouter();

  // Dimensi dasar arena platformer
  const GAME_WIDTH = 1000;
  const GAME_HEIGHT = 600;

  // Dimensi Karakter Pemain (Astronaut)
  const PLAYER_W = 48;
  const PLAYER_H = 68;
  const MOVE_SPEED = 4.5;
  const JUMP_POWER = -12.5;
  const GRAVITY = 0.6;

  // Titik Awal Pemain (Spawn Point) - Di Platform 3 Paling Kanan
  // Platform 3: x = 737, y = 307, w = 262 (ujung kanan = 999 px)
  const SPAWN_X = 945;
  const SPAWN_Y = 307 - PLAYER_H; // 239 px (tepat menapak di atas Platform 3)

  // 1. State Pemain & Fisika Dasar
  const [playerX, setPlayerX] = useState(SPAWN_X);
  const [playerY, setPlayerY] = useState(SPAWN_Y);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(false); // Menghadap ke kiri ke arah tengah arena
  const [isWalking, setIsWalking] = useState(false);

  // 2. Daftar Pijakan (Platform) Sementara Berwarna Hijau Transparan
  // Silakan sesuaikan koordinat x, y, w, h di bawah ini secara manual
  const platforms = [
    { id: 1, x: 40, y: 543, w: 581, h: 40, label: "Lantai Kiri" },
    { id: 2, x: 652, y: 572, w: 347, h: 26, label: "Lantai Kanan" },
    { id: 3, x: 109, y: 426, w: 108, h: 26, label: "Platform 1" },
    { id: 4, x: -5, y: 248, w: 386, h: 43, label: "Platform 2" },
    { id: 5, x: 737, y: 307, w: 262, h: 26, label: "Platform 3" },
    { id: 6, x: 809, y: 190, w: 159, h: 26, label: "Platform 4" },
  ];

  // 3. Ramp Zone (Bidang Miring antara Lantai Kiri & Lantai Kanan)
  // Menghubungkan batas kanan Lantai Kiri (x: 40 + 581 = 621, y: 543)
  // ke batas kiri Lantai Kanan (x: 652, y: 572)
  const ramp = {
    xStart: 40 + 581, // 621 px
    xEnd: 652,        // 652 px
    yStart: 543,      // Permukaan Lantai Kiri (543 px)
    yEnd: 572,        // Permukaan Lantai Kanan (572 px)
    hLeft: 40,        // Ketebalan Lantai Kiri (40 px)
    hRight: 26,       // Ketebalan Lantai Kanan (26 px)
  };

  // 4. Garis Penghalang (Barriers)
  // Mencegah pemain melompat / menyeberang di sebelah Platform 2, Platform 4, dan Platform 3
  const barriers = [
    {
      id: 1,
      label: "Penghalang Plat 2",
      x: 381, // Tepat di ujung kanan Platform 2 (x: -5 + 386 = 381)
      y: 0,
      w: 14,
      h: 295, // Menjulur dari langit-langit hingga menutup samping Platform 2
    },
    {
      id: 2,
      label: "Penghalang Plat 4",
      x: 795, // Tepat di ujung kiri Platform 4 (x: 809 - 14 = 795)
      y: 0,
      w: 14,
      h: 220, // Menjulur dari langit-langit hingga menutup samping kiri Platform 4
    },
    {
      id: 3,
      label: "Penghalang Plat 3",
      x: 723, // Tepat di sebelah kiri Platform 3 (x: 737 - 14 = 723)
      y: 70,
      w: 14,
      h: 270, // Menghalangi lompatan ke kiri dari Platform 3 (tinggi melampaui puncak lompatan)
    },
  ];

  // 5. Portal Menuju Stage Berikutnya (Stage 3) - Terletak di Platform 2 (Warna Biru Neon)
  // Platform 2: x: -5, y: 248, w: 386, h: 43
  // Diletakkan menapak di atas Platform 2 (y: 248 - 75 = 173 px)
  const nextStagePortal = {
    x: -11, // Berada di sebelah kiri Platform 2
    y: 173, // Menapak di atas Platform 2 (248 - 75 = 173 px)
    w: 56,
    h: 75,
    label: "PORTAL KE STAGE 3",
    targetUrl: "/stage/stage3",
  };

  // 6. Elemen Penanda Interaksi di Atas Layar (Trigger Placeholder)
  const markerMateri = { x: 220, y: 50, w: 140, h: 45, label: "MATERI" };
  const markerMiniGame = { x: 640, y: 50, w: 160, h: 45, label: "MINI GAME" };

  // 7. Daftar 3 Pasang Portal Teleportasi Internal (Total 6 Portal)
  // Desain: Garis lurus vertikal polos tanpa penjepit/dudukan logam.
  // Aturan Warna Pasangan:
  // - Pasangan 1: Keduanya BIRU NEON (Portal Masuk 1 & Portal Keluar 1)
  // - Pasangan 2: Keduanya UNGU NEON (Portal Masuk 2 & Portal Keluar 2)
  // - Pasangan 3: Keduanya MERAH NEON (Portal Masuk 3 & Portal Keluar 3)
  const portals = [
    // Pasangan 1 (BIRU NEON)
    {
      id: "p1-in",
      name: "portal masuk 1",
      pair: 1,
      targetId: "p1-out",
      x: 142,
      y: 364,
      w: 44,
      h: 65,
    },
    {
      id: "p1-out",
      name: "portal keluar 1",
      pair: 1,
      targetId: "p1-in",
      x: 142,
      y: 183,
      w: 44,
      h: 65,
    },
    // Pasangan 2 (UNGU NEON)
    {
      id: "p2-in",
      name: "portal masuk 2",
      pair: 2,
      targetId: "p2-out",
      x: 964,
      y: 126,
      w: 44,
      h: 65,
    },
    {
      id: "p2-out",
      name: "portal keluar 2",
      pair: 2,
      targetId: "p2-in",
      x: 964,
      y: 507,
      w: 44,
      h: 65,
    },
    // Pasangan 3 (MERAH NEON)
    {
      id: "p3-in",
      name: "portal masuk 3",
      pair: 3,
      targetId: "p3-out",
      x: 805,
      y: 242,
      w: 44,
      h: 65,
    },
    {
      id: "p3-out",
      name: "portal keluar 3",
      pair: 3,
      targetId: "p3-in",
      x: 798,
      y: 125,
      w: 45,
      h: 65,
    },
  ];

  // State Toast Notifikasi Teleportasi
  const [teleportToast, setTeleportToast] = useState<string | null>(null);

  // State Kedekatan dengan Portal Stage 3
  const [isNearNextStagePortal, setIsNearNextStagePortal] = useState(false);

  // Refs untuk Game Loop, Cooldown, dan Navigasi
  const teleportCooldownRef = useRef<number>(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: playerX, y: playerY, vy: velocityY, jumping: isJumping });
  const isNearNextPortalRef = useRef(false);
  const isTransitioningRef = useRef(false);

  playerRef.current = { x: playerX, y: playerY, vy: velocityY, jumping: isJumping };

  // Timer Toast Notifikasi Teleport
  useEffect(() => {
    if (!teleportToast) return;
    const t = setTimeout(() => setTeleportToast(null), 2400);
    return () => clearTimeout(t);
  }, [teleportToast]);

  // Fungsi Pemicu Masuk ke Stage 3
  const enterStage3 = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setTeleportToast("🚀 Memasuki Portal Menuju Stage 3...");
    setTimeout(() => {
      router.push(nextStagePortal.targetUrl);
    }, 500);
  };

  // Reset Posisi Pemain jika Jatuh ke Bawah Layar
  const resetPlayerToSpawn = () => {
    setPlayerX(SPAWN_X);
    setPlayerY(SPAWN_Y);
    setVelocityY(0);
    setIsJumping(false);
    setIsWalking(false);
    playerRef.current = { x: SPAWN_X, y: SPAWN_Y, vy: 0, jumping: false };
  };

  // Keyboard Event Listeners (A, D, W, Panah, Spasi, E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Mencegah scroll default browser saat menekan tombol panah / spasi
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        e.preventDefault();
      }

      // Tombol E untuk interaksi masuk portal stage berikutnya
      if (key === "e" && isNearNextPortalRef.current) {
        enterStage3();
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
  }, []);

  // Game Loop Fisika Karakter 60 FPS
  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      let p = { ...playerRef.current };
      const keys = keysPressed.current;

      // 1. Kontrol Horizontal (A / D / Panah Kiri / Kanan)
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

      // 2. Lompat (W / Panah Atas / Spasi)
      const wantsJump = keys.has("w") || keys.has("arrowup") || keys.has(" ");
      if (wantsJump && !p.jumping) {
        p.vy = JUMP_POWER;
        p.jumping = true;
      }

      // 3. Terapkan Pergerakan Horizontal & Collision Penghalang (Barriers)
      let nextX = Math.max(0, Math.min(p.x + moveX, GAME_WIDTH - PLAYER_W));

      for (const barrier of barriers) {
        // Cek overlap vertikal antara pemain dan penghalang
        const vOverlap =
          p.y + PLAYER_H > barrier.y + 2 &&
          p.y < barrier.y + barrier.h - 2;

        if (vOverlap) {
          // Menabrak sisi kiri penghalang saat bergerak ke kanan
          if (moveX > 0 && p.x + PLAYER_W <= barrier.x + 4 && nextX + PLAYER_W > barrier.x) {
            nextX = barrier.x - PLAYER_W;
          }
          // Menabrak sisi kanan penghalang saat bergerak ke kiri
          else if (moveX < 0 && p.x >= barrier.x + barrier.w - 4 && nextX < barrier.x + barrier.w) {
            nextX = barrier.x + barrier.w;
          }
          // Koreksi posisi jika pemain berada di dalam penghalang
          else if (p.x + PLAYER_W > barrier.x && p.x < barrier.x + barrier.w) {
            if (p.x + PLAYER_W / 2 < barrier.x + barrier.w / 2) {
              nextX = barrier.x - PLAYER_W;
            } else {
              nextX = barrier.x + barrier.w;
            }
          }
        }
      }
      p.x = nextX;

      // 4. Terapkan Gravitasi & Pergerakan Vertikal & Collision Penghalang
      p.vy += GRAVITY;
      let nextY = p.y + p.vy;

      for (const barrier of barriers) {
        // Cek overlap horizontal antara pemain dan penghalang
        const hOverlap =
          p.x + PLAYER_W > barrier.x + 2 &&
          p.x < barrier.x + barrier.w - 2;

        if (hOverlap) {
          // Mendarat di atas penghalang jika jatuh dari atas
          if (p.vy > 0 && p.y + PLAYER_H <= barrier.y + 12 && nextY + PLAYER_H >= barrier.y) {
            nextY = barrier.y - PLAYER_H;
            p.vy = 0;
            p.jumping = false;
          }
          // Membentur bagian bawah penghalang saat melompat ke atas (head-bump)
          else if (p.vy < 0 && p.y >= barrier.y + barrier.h - 12 && nextY <= barrier.y + barrier.h) {
            nextY = barrier.y + barrier.h;
            p.vy = 0;
          }
        }
      }
      p.y = nextY;

      // 5. Sistem Collision Pijakan (Platforms) & Ramp Zone
      let onRamp = false;
      const playerFootX = p.x + PLAYER_W / 2;

      // Cek apakah karakter berada di area Ramp Zone (Bidang Miring)
      if (playerFootX >= ramp.xStart && playerFootX <= ramp.xEnd) {
        const t = (playerFootX - ramp.xStart) / (ramp.xEnd - ramp.xStart);
        const rampSurfaceY = ramp.yStart + t * (ramp.yEnd - ramp.yStart);

        const isTouchingRamp = p.y + PLAYER_H >= rampSurfaceY - 6;
        const wasAboveRamp = p.y + PLAYER_H - p.vy <= rampSurfaceY + 16;
        const isWalkingDownSlope =
          !playerRef.current.jumping &&
          p.y + PLAYER_H <= rampSurfaceY + 10 &&
          p.y + PLAYER_H >= rampSurfaceY - 14;

        if ((isTouchingRamp && wasAboveRamp) || isWalkingDownSlope) {
          p.y = rampSurfaceY - PLAYER_H;
          p.vy = 0;
          p.jumping = false;
          onRamp = true;
        }
      }

      // Jika tidak menapak di ramp, terapkan collision AABB platform normal
      if (!onRamp) {
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
      }

      // 6. Deteksi Teleportasi 3 Pasang Portal Internal
      const now = Date.now();
      if (now > teleportCooldownRef.current) {
        for (const portal of portals) {
          const isTouchingPortal =
            p.x + PLAYER_W > portal.x + 8 &&
            p.x < portal.x + portal.w - 8 &&
            p.y + PLAYER_H > portal.y + 10 &&
            p.y < portal.y + portal.h;

          if (isTouchingPortal) {
            const target = portals.find((pt) => pt.id === portal.targetId);
            if (target) {
              // Teleportasikan pemain tepat di depan portal tujuan
              p.x = target.x + (target.w - PLAYER_W) / 2;
              p.y = target.y + target.h - PLAYER_H;
              p.vy = 0;
              teleportCooldownRef.current = now + 800; // Cooldown 800ms mencegah teleport bolak-balik seketika
              setTeleportToast(`⚡ Teleport: ${portal.name} ➔ ${target.name}`);
              break;
            }
          }
        }
      }

      // 7. Deteksi Kedekatan & Masuk ke Portal Stage 3 di Platform 2
      const distNextPortalX = Math.abs(p.x + PLAYER_W / 2 - (nextStagePortal.x + nextStagePortal.w / 2));
      const distNextPortalY = Math.abs(p.y + PLAYER_H / 2 - (nextStagePortal.y + nextStagePortal.h / 2));
      const nearPortal = distNextPortalX < 70 && distNextPortalY < 75;
      setIsNearNextStagePortal(nearPortal);
      isNearNextPortalRef.current = nearPortal;

      const isTouchingNextStagePortal =
        p.x + PLAYER_W > nextStagePortal.x + 10 &&
        p.x < nextStagePortal.x + nextStagePortal.w - 10 &&
        p.y + PLAYER_H > nextStagePortal.y + 12 &&
        p.y < nextStagePortal.y + nextStagePortal.h;

      if (isTouchingNextStagePortal && !isTransitioningRef.current) {
        enterStage3();
      }

      // 8. Cek Jika Jatuh ke Bawah Layar
      if (p.y > GAME_HEIGHT) {
        resetPlayerToSpawn();
        return;
      }

      // Update State React
      setPlayerX(p.x);
      setPlayerY(p.y);
      setVelocityY(p.vy);
      setIsJumping(p.jumping);

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-3 md:p-4 select-none">
      {/* HUD Info Atas */}
      <div className="mb-3 flex w-full max-w-[1000px] flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-500/30 bg-[#09061a]/80 px-4 py-2.5 text-xs text-gray-300 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-wider text-cyan-300 uppercase font-mono">
            STAGE 2 // KALIBRASI TATA LETAK, PORTAL & PENGHALANG
          </span>
        </div>
        <div className="font-mono text-[11px] text-gray-400 flex flex-wrap items-center gap-2.5">
          <span>Kontrol: <strong className="text-white">A / D</strong> (Jalan), <strong className="text-white">W / Spasi</strong> (Lompat), <strong className="text-cyan-300">E</strong> (Masuk Portal)</span>
          <span className="text-cyan-300 font-bold">● P1 & Stage 3: Biru</span>
          <span className="text-purple-400 font-bold">● P2: Ungu</span>
          <span className="text-rose-400 font-bold">● P3: Merah</span>
        </div>
      </div>

      {/* Arena Game 2D Platformer (1000px x 600px) */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/40 bg-cover bg-center bg-no-repeat shadow-[0_0_60px_rgba(6,182,212,0.25)]"
        style={{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
          // Mendukung file bernama "stage 2 bg" (.jpg / .png / format URL encoded)
          backgroundImage:
            "url('/stage2bg.jpg'), url('/stage2bg.jpg'), url('/stage%202%20bg.jpg'), url('/stage%202%20bg.png'), url('/stage2bg.png')",
          backgroundColor: "#070415",
        }}
      >
        {/* Lapisan Tipis untuk Keterbacaan Visual */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />

        {/* 1. Elemen Penanda Interaksi "MATERI" di Area Atas */}
        <div
          className="absolute z-20 flex items-center justify-center rounded-xl border-2 border-purple-300 bg-purple-500/70 shadow-[0_0_20px_rgba(168,85,247,0.6)] backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform"
          style={{
            left: `${markerMateri.x}px`,
            top: `${markerMateri.y}px`,
            width: `${markerMateri.w}px`,
            height: `${markerMateri.h}px`,
          }}
        >
          <span className="font-mono text-xs md:text-sm font-black tracking-wider text-white">
            📖 {markerMateri.label}
          </span>
        </div>

        {/* 2. Elemen Penanda Interaksi "MINI GAME" di Area Atas */}
        <div
          className="absolute z-20 flex items-center justify-center rounded-xl border-2 border-cyan-300 bg-cyan-500/70 shadow-[0_0_20px_rgba(34,211,238,0.6)] backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform"
          style={{
            left: `${markerMiniGame.x}px`,
            top: `${markerMiniGame.y}px`,
            width: `${markerMiniGame.w}px`,
            height: `${markerMiniGame.h}px`,
          }}
        >
          <span className="font-mono text-xs md:text-sm font-black tracking-wider text-white">
            🎮 {markerMiniGame.label}
          </span>
        </div>

        {/* 3. Pijakan (Platforms) Sementara Berwarna Hijau Transparan */}
        {platforms.map((plat) => (
          <div
            key={plat.id}
            className="absolute z-10 flex items-center justify-center rounded-md border-2 border-green-400 bg-green-500/50 shadow-[0_0_15px_rgba(74,222,128,0.4)] backdrop-blur-xs select-none"
            style={{
              left: `${plat.x}px`,
              top: `${plat.y}px`,
              width: `${plat.w}px`,
              height: `${plat.h}px`,
            }}
          >
            <span className="font-mono text-[10px] font-bold text-green-100 drop-shadow">
              {plat.label} ({plat.w}x{plat.h})
            </span>
          </div>
        ))}

        {/* 4. Ramp Zone (Bidang Miring Penghubung Lantai Kiri & Lantai Kanan) */}
        <div
          className="absolute z-10 pointer-events-none select-none"
          style={{
            left: `${ramp.xStart}px`,
            top: `${ramp.yStart}px`,
            width: `${ramp.xEnd - ramp.xStart}px`,
            height: `${ramp.yEnd + ramp.hRight - ramp.yStart}px`,
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${ramp.xEnd - ramp.xStart} ${ramp.yEnd + ramp.hRight - ramp.yStart}`}
            className="overflow-visible"
          >
            <polygon
              points={`0,0 ${ramp.xEnd - ramp.xStart},${ramp.yEnd - ramp.yStart} ${ramp.xEnd - ramp.xStart},${ramp.yEnd + ramp.hRight - ramp.yStart} 0,${ramp.hLeft}`}
              className="fill-green-500/50 stroke-green-400"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-mono text-[8px] font-bold text-green-100 drop-shadow -rotate-45">
              RAMP
            </span>
          </div>
        </div>

        {/* 5. Garis Penghalang (Barriers) */}
        {barriers.map((bar) => (
          <div
            key={bar.id}
            className="absolute z-15 flex flex-col items-center justify-center select-none overflow-hidden rounded-md border-2 border-rose-500 bg-rose-950/70 shadow-[0_0_20px_rgba(244,63,94,0.7)] backdrop-blur-xs"
            style={{
              left: `${bar.x}px`,
              top: `${bar.y}px`,
              width: `${bar.w}px`,
              height: `${bar.h}px`,
            }}
          >
            {/* Efek Garis Laser Berdenyut di Tengah */}
            <div className="absolute inset-y-0 w-1 bg-rose-400 shadow-[0_0_8px_#f43f5e] animate-pulse" />

            {/* Label Teks Vertikal */}
            <span
              className="z-10 font-mono text-[8px] font-black uppercase tracking-wider text-rose-200 drop-shadow whitespace-nowrap opacity-90 [writing-mode:vertical-rl]"
            >
              ⛔ {bar.label}
            </span>
          </div>
        ))}

        {/* 6. Daftar 3 Pasang Portal Teleportasi Internal (Garis Lurus Vertikal Murni Tanpa Penjepit/Dudukan) */}
        {portals.map((portal) => {
          // Aturan Warna:
          // Pasangan 1: Keduanya BIRU NEON
          // Pasangan 2: Keduanya UNGU NEON
          // Pasangan 3: Keduanya MERAH NEON
          const isBlue = portal.pair === 1;
          const isPurple = portal.pair === 2;
          const isRed = portal.pair === 3;

          const badgeClass = isRed
            ? "bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.95)]"
            : isPurple
            ? "bg-purple-400 text-black shadow-[0_0_12px_rgba(192,132,252,0.95)]"
            : "bg-cyan-400 text-black shadow-[0_0_12px_rgba(34,211,238,0.95)]";

          const bloomClass = isRed
            ? "bg-gradient-to-r from-transparent via-rose-500/40 to-transparent"
            : isPurple
            ? "bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"
            : "bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent";

          const beamClass = isRed
            ? "bg-gradient-to-b from-rose-200 via-red-500 to-rose-600 shadow-[0_0_15px_#ff0055,0_0_28px_#ef4444,0_0_42px_rgba(239,68,68,0.85)]"
            : isPurple
            ? "bg-gradient-to-b from-purple-200 via-fuchsia-500 to-indigo-600 shadow-[0_0_15px_#c084fc,0_0_28px_#a855f7,0_0_42px_rgba(168,85,247,0.85)]"
            : "bg-gradient-to-b from-cyan-200 via-cyan-400 to-blue-500 shadow-[0_0_15px_#00f0ff,0_0_28px_#06b6d4,0_0_42px_rgba(2,132,199,0.85)]";

          const pingClass = isRed
            ? "bg-rose-100 shadow-[0_0_6px_#ff0055]"
            : isPurple
            ? "bg-purple-100 shadow-[0_0_6px_#c084fc]"
            : "bg-cyan-100 shadow-[0_0_6px_#22d3ee]";

          return (
            <div
              key={portal.id}
              className="absolute z-20 flex flex-col items-center justify-end select-none pointer-events-none"
              style={{
                left: `${portal.x}px`,
                top: `${portal.y}px`,
                width: `${portal.w}px`,
                height: `${portal.h}px`,
              }}
            >
              {/* Label Nama Portal (Tetap di posisi -top-6 animate-bounce) */}
              <div className="absolute -top-6 whitespace-nowrap animate-bounce z-30">
                <span
                  className={`rounded px-1.5 py-0.5 text-[8px] font-mono font-black uppercase shadow-md ${badgeClass}`}
                >
                  {portal.name}
                </span>
              </div>

              {/* Portal Garis Lurus Vertikal Murni (Tanpa Penjepit / Dudukan Logam) */}
              <div className="relative flex h-full w-full items-center justify-center overflow-visible">
                {/* Outer Glow / Pendaran Luar Lebar */}
                <div
                  className={`absolute inset-y-0 w-8 blur-xs pointer-events-none ${bloomClass}`}
                />

                {/* Batang Berkas Cahaya Laser Vertikal Utama */}
                <div
                  className={`relative flex h-full w-2.5 items-center justify-center rounded-full ${beamClass}`}
                >
                  {/* Inti Laser Putih Terang di Tengah */}
                  <div className="h-full w-0.5 rounded-full bg-white shadow-[0_0_6px_#ffffff] opacity-95" />

                  {/* Kilatan Aliran Energi Bergerak Vertikal Naik-Turun */}
                  <div className="absolute inset-x-0 h-7 bg-gradient-to-b from-transparent via-white to-transparent opacity-90 animate-beam-flow" />
                </div>

                {/* Partikel Listrik Cincin Horisontal Berdenyut di Sekeliling Garis */}
                <div
                  className={`absolute top-1/4 h-0.5 w-5 rounded-full animate-ping ${pingClass}`}
                />
                <div
                  className={`absolute top-2/3 h-0.5 w-5 rounded-full animate-ping ${pingClass}`}
                  style={{ animationDelay: "0.5s" }}
                />
              </div>
            </div>
          );
        })}

        {/* 7. PORTAL MENUJU STAGE BERIKUTNYA (STAGE 3) DI PLATFORM 2 (Portal Tunggal: BIRU NEON) */}
        <div
          className="absolute z-25 flex flex-col items-center justify-end select-none cursor-pointer group hover:scale-105 transition-transform"
          style={{
            left: `${nextStagePortal.x}px`,
            top: `${nextStagePortal.y}px`,
            width: `${nextStagePortal.w}px`,
            height: `${nextStagePortal.h}px`,
          }}
          onClick={enterStage3}
        >
          {/* Badge Interaksi Saat Dekat dengan Karakter */}
          {isNearNextStagePortal && (
            <div className="absolute -top-8 whitespace-nowrap animate-bounce z-40 pointer-events-none">
              <span className="rounded-md border border-cyan-300 bg-black/90 px-2 py-0.5 font-mono text-[9px] font-black text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.8)]">
                [E] Masuk Stage 3 ➔
              </span>
            </div>
          )}

          {/* Label Nama Portal Stage 3 */}
          <div className="absolute -top-6 whitespace-nowrap z-30">
            <span className="rounded bg-cyan-400 px-2 py-0.5 text-[8px] font-mono font-black text-black uppercase shadow-[0_0_12px_rgba(34,211,238,0.95)]">
              {nextStagePortal.label}
            </span>
          </div>

          {/* Portal Garis Lurus Vertikal Murni untuk Stage 3 (BIRU NEON) */}
          <div className="relative flex h-full w-full items-center justify-center overflow-visible">
            {/* Outer Glow Pendaran Lebar */}
            <div className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent blur-xs pointer-events-none" />

            {/* Batang Laser Vertikal Utama (Biru Neon) */}
            <div className="relative flex h-full w-3 items-center justify-center rounded-full bg-gradient-to-b from-cyan-100 via-cyan-400 to-blue-500 shadow-[0_0_20px_#00f0ff,0_0_35px_#06b6d4,0_0_50px_rgba(2,132,199,0.85)]">
              <div className="h-full w-1 rounded-full bg-white shadow-[0_0_8px_#ffffff] opacity-95" />
              <div className="absolute inset-x-0 h-9 bg-gradient-to-b from-transparent via-white to-transparent opacity-90 animate-beam-flow" />
            </div>

            {/* Partikel Cincin Energi Berkilau */}
            <div className="absolute top-1/4 h-0.5 w-6 rounded-full bg-cyan-100 shadow-[0_0_8px_#22d3ee] animate-ping" />
            <div
              className="absolute top-2/3 h-0.5 w-6 rounded-full bg-cyan-100 shadow-[0_0_8px_#22d3ee] animate-ping"
              style={{ animationDelay: "0.4s" }}
            />
          </div>
        </div>

        {/* Notifikasi Toast Teleportasi Mengambang */}
        {teleportToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 rounded-xl border border-cyan-400/50 bg-black/85 px-4 py-1.5 font-mono text-xs font-bold text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.5)] backdrop-blur-md animate-in fade-in">
            {teleportToast}
          </div>
        )}

        {/* 8. Karakter Pemain (Astronaut) */}
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
        <Link href="/stage/stage1" className="hover:text-cyan-300 transition">
          ← Kembali ke Stage 1
        </Link>
        <span className="font-mono text-[11px] text-gray-500">
          Tip: Kamu bisa menyesuaikan nilai X, Y, Width, dan Height pada array platforms, barriers & portal di kode
        </span>
        <Link href="/stage/stage3" className="hover:text-cyan-300 transition font-bold">
          Langsung ke Stage 3 →
        </Link>
      </div>

      {/* Style Keyframe Animasi Waddle & Aliran Energi Laser */}
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

        @keyframes beamFlow {
          0% {
            transform: translateY(-100%);
            opacity: 0.2;
          }
          50% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(100%);
            opacity: 0.2;
          }
        }
        .animate-beam-flow {
          animation: beamFlow 1.6s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
