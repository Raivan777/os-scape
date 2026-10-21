"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Stage1InteractiveRoom() {
  const router = useRouter();

  // Dimensi layar & karakter
  const PLAYER_WIDTH = 90; // ~w-22
  const PLAYER_HEIGHT = 120;
  const MOVE_SPEED = 7; // piksel per frame

  // Dimensi portal di kanan layar
  const PORTAL_WIDTH = 130;
  const PORTAL_HEIGHT = 200;

  const [windowSize, setWindowSize] = useState({ width: 1280, height: 720 });
  const [pos, setPos] = useState({ x: 80, y: 350 });
  const [facingRight, setFacingRight] = useState(true);
  const [isNearPortal, setIsNearPortal] = useState(false);
  const [enteringPortal, setEnteringPortal] = useState(false);

  // Simpan tombol yang sedang ditekan untuk pergerakan mulus (60fps)
  const keysPressed = useRef<Set<string>>(new Set());
  const posRef = useRef(pos);
  posRef.current = pos;

  // Inisialisasi ukuran layar & posisi awal karakter di sebelah kiri
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setWindowSize({ width: w, height: h });
    };

    handleResize();
    // Taruh astronot di sebelah kiri lantai ruangan
    setPos({
      x: 80,
      y: Math.max(100, Math.floor(window.innerHeight * 0.55)),
    });

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Koordinat portal di sisi kanan
  const portalX = Math.max(100, windowSize.width - PORTAL_WIDTH - 90);
  const portalY = Math.max(50, Math.floor(windowSize.height * 0.52 - PORTAL_HEIGHT / 2));

  // Fungsi masuk ke materi stage 1
  const handleEnterStage1 = () => {
    if (enteringPortal) return;
    setEnteringPortal(true);
    setTimeout(() => {
      router.push("/stage/stage1/materi");
    }, 600);
  };

  // Keyboard Event Listener untuk deteksi tombol tekan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Tombol E untuk interaksi portal
      if ((key === "e" || e.key === "Enter") && isNearPortal) {
        e.preventDefault();
        handleEnterStage1();
        return;
      }

      // Cegah default scrolling untuk tombol panah & spasi
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
  }, [isNearPortal, enteringPortal]);

  // Game Loop dengan requestAnimationFrame untuk pergerakan mulus tanpa delay
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = () => {
      if (!enteringPortal) {
        let dx = 0;
        let dy = 0;

        const keys = keysPressed.current;

        // Gerak vertikal (W / S / Panah Atas / Panah Bawah)
        if (keys.has("w") || keys.has("arrowup")) dy -= MOVE_SPEED;
        if (keys.has("s") || keys.has("arrowdown")) dy += MOVE_SPEED;

        // Gerak horizontal (A / D / Panah Kiri / Panah Kanan)
        if (keys.has("a") || keys.has("arrowleft")) {
          dx -= MOVE_SPEED;
          setFacingRight(false);
        }
        if (keys.has("d") || keys.has("arrowright")) {
          dx += MOVE_SPEED;
          setFacingRight(true);
        }

        if (dx !== 0 || dy !== 0) {
          // Normalisasi kecepatan jika gerak diagonal
          if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
          }

          setPos((prev) => {
            // Boundary Collision: batas dinding ruangan
            const minX = 20;
            const maxX = Math.max(minX, windowSize.width - PLAYER_WIDTH - 20);
            const minY = Math.max(20, Math.floor(windowSize.height * 0.15)); // batas atas plafon ruangan
            const maxY = Math.max(minY, windowSize.height - PLAYER_HEIGHT - 30); // batas bawah lantai

            const newX = Math.min(Math.max(prev.x + dx, minX), maxX);
            const newY = Math.min(Math.max(prev.y + dy, minY), maxY);

            return { x: newX, y: newY };
          });
        }

        // Collision Detection dengan Portal (AABB overlap)
        const currentX = posRef.current.x;
        const currentY = posRef.current.y;

        // Area hit box portal dengan toleransi empuk
        const near =
          currentX + PLAYER_WIDTH >= portalX - 40 &&
          currentX <= portalX + PORTAL_WIDTH + 40 &&
          currentY + PLAYER_HEIGHT >= portalY - 20 &&
          currentY <= portalY + PORTAL_HEIGHT + 20;

        setIsNearPortal(near);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [windowSize, portalX, portalY, enteringPortal]);

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden select-none bg-black bg-cover bg-center"
      style={{
        backgroundImage: "url('/alien-room.png')",
      }}
    >
      {/* Overlay Gelap Kosmik Lembut untuk Suasana Alien */}
      <div className="pointer-events-none absolute inset-0 bg-black/25" />

      {/* Mini HUD Info di Pojok Kiri Atas */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-2 rounded-xl border border-white/15 bg-black/60 px-5 py-3.5 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400" />
          <h2 className="text-sm font-bold tracking-wider text-[#ffb347] uppercase">
            OMNI Cell 7 • Ruang Pelarian
          </h2>
        </div>
        <p className="text-xs text-gray-300">
          Gunakan tombol <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-white font-mono">W</kbd>{" "}
          <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-white font-mono">A</kbd>{" "}
          <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-white font-mono">S</kbd>{" "}
          <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-white font-mono">D</kbd> atau{" "}
          <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-white font-mono">Arah Panah</kbd> untuk berjalan menuju portal.
        </p>
      </div>

      {/* Visual Portal Pintu Stage 1 di Sebelah Kanan */}
      <div
        className="absolute z-10 flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105"
        style={{
          left: `${portalX}px`,
          top: `${portalY}px`,
          width: `${PORTAL_WIDTH}px`,
          height: `${PORTAL_HEIGHT}px`,
        }}
        onClick={handleEnterStage1}
      >
        {/* Glow & Aura Portal */}
        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/80 bg-gradient-to-t from-purple-700/60 via-cyan-500/40 to-blue-600/50 shadow-[0_0_60px_rgba(34,211,238,0.7)] animate-pulse" />

        {/* Cincin Partikel Warp Berputar */}
        <div className="absolute inset-2 rounded-full border border-dashed border-cyan-200/60 animate-spin" style={{ animationDuration: "12s" }} />

        {/* Inti Energi Portal */}
        <div className="relative flex flex-col items-center text-center p-2">
          <span className="text-2xl animate-bounce">⚡</span>
          <span className="mt-1 text-xs font-black tracking-widest text-cyan-200 uppercase drop-shadow-[0_0_8px_rgba(201,242,255,0.9)]">
            PORTAL 1
          </span>
          <span className="text-[10px] text-purple-200 font-mono">PROSES & THREAD</span>
        </div>

        {/* Lantai Cahaya di Bawah Portal */}
        <div className="absolute -bottom-6 h-6 w-36 rounded-full bg-cyan-400/40 blur-md" />
      </div>

      {/* Karakter Pemain (Astronaut) dengan GPU transform translate */}
      <div
        className="pointer-events-none absolute z-30 transition-opacity duration-300"
        style={{
          width: `${PLAYER_WIDTH}px`,
          height: `${PLAYER_HEIGHT}px`,
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          willChange: "transform",
          opacity: enteringPortal ? 0 : 1,
        }}
      >
        {/* Bayangan Karakter di Lantai */}
        <div className="absolute bottom-1 left-1/2 h-3 w-16 -translate-x-1/2 rounded-full bg-black/60 blur-xs" />

        {/* Sprite Astronaut */}
        <img
          src="/astronaut-front.png"
          alt="Astronaut"
          className="h-full w-full object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] transition-transform duration-150"
          style={{
            transform: facingRight ? "scaleX(1)" : "scaleX(-1)",
          }}
        />

        {/* Tombol Melayang di Atas Karakter saat Berada di Dekat Portal */}
        {isNearPortal && (
          <div className="pointer-events-auto absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap animate-bounce">
            <button
              type="button"
              onClick={handleEnterStage1}
              className="group flex items-center gap-2 rounded-full border-2 border-cyan-300 bg-gradient-to-r from-[#ffb347] to-[#ffc774] px-4 py-2 text-xs font-black text-[#140b2e] shadow-[0_0_25px_rgba(255,179,71,0.9)] transition-all hover:scale-110 active:scale-95"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#140b2e] text-[11px] font-bold text-white shadow-inner">
                E
              </span>
              <span>Tekan 'E' atau Klik untuk Masuk Stage 1</span>
              <span className="text-sm transition-transform group-hover:translate-x-1">➔</span>
            </button>
          </div>
        )}
      </div>

      {/* Efek Layar Flash saat Masuk ke Portal */}
      {enteringPortal && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-cyan-300/40 backdrop-blur-sm transition-opacity duration-500 animate-pulse">
          <p className="text-2xl font-black tracking-widest text-white drop-shadow-[0_0_20px_rgba(201,242,255,1)]">
            MEMASUKI STAGE 1...
          </p>
        </div>
      )}
    </main>
  );
}
