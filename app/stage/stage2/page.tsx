"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function Stage2Platformer() {
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

  // 5. Elemen Penanda Interaksi di Atas Layar (Trigger Placeholder)
  const markerMateri = { x: 220, y: 50, w: 140, h: 45, label: "MATERI" };
  const markerMiniGame = { x: 640, y: 50, w: 160, h: 45, label: "MINI GAME" };

  // 6. Daftar 3 Pasang Portal Teleportasi (Total 6 Portal)
  // Pasangan 1 (Cyan), Pasangan 2 (Ungu), Pasangan 3 (Oranye)
  const portals = [
    // Pasangan 1 (Warna Cyan)
    {
      id: "p1-in",
      name: "portal masuk 1",
      pair: 1,
      targetId: "p1-out",
      x: 142,
      y: 364,
      w: 44,
      h: 65,
      color: "cyan",
      borderColor: "border-cyan-400",
      bgColor: "bg-cyan-950/60",
      glowColor: "shadow-[0_0_20px_rgba(34,211,238,0.7)]",
      badgeBg: "bg-cyan-400 text-black",
      vortexColor: "text-cyan-300",
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
      color: "cyan",
      borderColor: "border-cyan-400",
      bgColor: "bg-cyan-950/60",
      glowColor: "shadow-[0_0_20px_rgba(34,211,238,0.7)]",
      badgeBg: "bg-cyan-400 text-black",
      vortexColor: "text-cyan-300",
    },
    // Pasangan 2 (Warna Ungu)
    {
      id: "p2-in",
      name: "portal masuk 2",
      pair: 2,
      targetId: "p2-out",
      x: 991,
      y: 126,
      w: 44,
      h: 65,
      color: "purple",
      borderColor: "border-purple-400",
      bgColor: "bg-purple-950/60",
      glowColor: "shadow-[0_0_20px_rgba(192,132,252,0.7)]",
      badgeBg: "bg-purple-400 text-black",
      vortexColor: "text-purple-300",
    },
    {
      id: "p2-out",
      name: "portal keluar 2",
      pair: 2,
      targetId: "p2-in",
      x: 991,
      y: 507,
      w: 44,
      h: 65,
      color: "purple",
      borderColor: "border-purple-400",
      bgColor: "bg-purple-950/60",
      glowColor: "shadow-[0_0_20px_rgba(192,132,252,0.7)]",
      badgeBg: "bg-purple-400 text-black",
      vortexColor: "text-purple-300",
    },
    // Pasangan 3 (Warna Oranye)
    {
      id: "p3-in",
      name: "portal masuk 3",
      pair: 3,
      targetId: "p3-out",
      x: 817,
      y: 242,
      w: 44,
      h: 65,
      color: "orange",
      borderColor: "border-amber-400",
      bgColor: "bg-amber-950/60",
      glowColor: "shadow-[0_0_20px_rgba(251,191,36,0.7)]",
      badgeBg: "bg-amber-400 text-black",
      vortexColor: "text-amber-300",
    },
    {
      id: "p3-out",
      name: "portal keluar 3",
      pair: 3,
      targetId: "p3-in",
      x: 812,
      y: 125,
      w: 45,
      h: 65,
      color: "orange",
      borderColor: "border-amber-400",
      bgColor: "bg-amber-950/60",
      glowColor: "shadow-[0_0_20px_rgba(251,191,36,0.7)]",
      badgeBg: "bg-amber-400 text-black",
      vortexColor: "text-amber-300",
    },
  ];

  // State Toast Notifikasi Teleportasi
  const [teleportToast, setTeleportToast] = useState<string | null>(null);

  // Refs untuk Game Loop & Cooldown Teleport
  const teleportCooldownRef = useRef<number>(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: playerX, y: playerY, vy: velocityY, jumping: isJumping });

  playerRef.current = { x: playerX, y: playerY, vy: velocityY, jumping: isJumping };

  // Timer Toast Notifikasi Teleport
  useEffect(() => {
    if (!teleportToast) return;
    const t = setTimeout(() => setTeleportToast(null), 2200);
    return () => clearTimeout(t);
  }, [teleportToast]);

  // Reset Posisi Pemain jika Jatuh ke Bawah Layar
  const resetPlayerToSpawn = () => {
    setPlayerX(SPAWN_X);
    setPlayerY(SPAWN_Y);
    setVelocityY(0);
    setIsJumping(false);
    setIsWalking(false);
    playerRef.current = { x: SPAWN_X, y: SPAWN_Y, vy: 0, jumping: false };
  };

  // Keyboard Event Listeners (A, D, W, Panah, Spasi)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Mencegah scroll default browser saat menekan tombol panah / spasi
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
          // Koreksi posisi jika pemain entah bagaimana berada di dalam penghalang
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

      // 6. Deteksi Teleportasi 3 Pasang Portal
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

      // 7. Cek Jika Jatuh ke Bawah Layar
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
        <div className="font-mono text-[11px] text-gray-400">
          Kontrol: <strong className="text-white">A / D</strong> (Jalan), <strong className="text-white">W / Spasi</strong> (Lompat)
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

        {/* 6. Daftar 3 Pasang Portal Teleportasi (Total 6 Portal) */}
        {portals.map((portal) => (
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
            {/* Label Nama Portal */}
            <div className="absolute -top-6 whitespace-nowrap animate-bounce">
              <span
                className={`rounded px-1.5 py-0.5 text-[8px] font-mono font-black uppercase shadow-md ${portal.badgeBg}`}
              >
                {portal.name}
              </span>
            </div>

            {/* Gerbang Portal Berbentuk Arch */}
            <div
              className={`relative flex h-full w-full items-center justify-center rounded-t-full border-2 ${portal.borderColor} ${portal.bgColor} ${portal.glowColor} backdrop-blur-xs`}
            >
              {/* Animasi Vortex Energi Berputar */}
              <span
                className={`text-xl ${portal.vortexColor} inline-block animate-spin select-none`}
                style={{ animationDuration: "6s" }}
              >
                🌀
              </span>
              {/* Garis Vertikal Partikel Energi */}
              <div
                className={`absolute inset-x-2 bottom-0 top-3 border-x border-dashed ${portal.borderColor} opacity-40`}
              />
            </div>
          </div>
        ))}

        {/* Notifikasi Toast Teleportasi Mengambang */}
        {teleportToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 rounded-xl border border-cyan-400/50 bg-black/85 px-4 py-1.5 font-mono text-xs font-bold text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.5)] backdrop-blur-md animate-in fade-in">
            {teleportToast}
          </div>
        )}

        {/* 7. Karakter Pemain (Astronaut) */}
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
          Tip: Kamu bisa menyesuaikan nilai X, Y, Width, dan Height pada array platforms & barriers di kode
        </span>
        <Link href="/" className="hover:text-cyan-300 transition">
          Menu Utama ⌂
        </Link>
      </div>

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
