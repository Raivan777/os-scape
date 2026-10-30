"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Stage2Platformer() {
  const router = useRouter();

  // Dimensi dasar game arena (sama persis dengan Stage 1)
  const GAME_WIDTH = 1000;
  const GAME_HEIGHT = 600;
  const GROUND_Y = 520; // Garis lantai dasar

  // Dimensi Karakter Pemain
  const PLAYER_W = 48;
  const PLAYER_H = 68;
  const MOVE_SPEED = 4.5;
  const JUMP_POWER = -12.5;
  const GRAVITY = 0.6;

  // Titik Awal Pemain (Sektor Pemancar / Producer Thread)
  const SPAWN_X = 60;
  const SPAWN_Y = GROUND_Y - PLAYER_H;

  // 1. State Pemain & Fisika Dasar
  const [playerX, setPlayerX] = useState(SPAWN_X);
  const [playerY, setPlayerY] = useState(SPAWN_Y);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isWalking, setIsWalking] = useState(false);

  // 2. State Khusus Mekanik Stage 2 (The Data Courier: IPC & Thread)
  const [hasDataPacket, setHasDataPacket] = useState(false);
  const [isPacketDelivered, setIsPacketDelivered] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Posisi Scanner Drone (Thread Scanner Hazard) yang bergerak horizontal
  const [droneX, setDroneX] = useState(480);
  const droneY = 440;
  const DRONE_W = 44;
  const DRONE_H = 34;

  // 3. State Interaksi & Modal
  const [showMaterial, setShowMaterial] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [isQuizCorrect, setIsQuizCorrect] = useState(false);

  // Proximity status
  const [isNearStation, setIsNearStation] = useState(false);
  const [isNearTerminal, setIsNearTerminal] = useState(false);
  const [isNearReceiver, setIsNearReceiver] = useState(false);

  // Daftar Platform Pijakan Melayang (Kanal Pipa IPC)
  const platforms = [
    { x: 0, y: GROUND_Y, w: 260, h: 80 }, // Lantai Kiri (Process A - Sender)
    { x: 350, y: GROUND_Y, w: 280, h: 80 }, // Lantai Tengah
    { x: 720, y: GROUND_Y, w: 280, h: 80 }, // Lantai Kanan
    { x: 210, y: 410, w: 140, h: 20 }, // Pijakan 1 (Pipa Input)
    { x: 420, y: 310, w: 180, h: 20 }, // Pijakan 2 (Terminal Protokol IPC)
    { x: 660, y: 220, w: 150, h: 20 }, // Pijakan 3 (Buffer Antrean Pesan)
    { x: 820, y: 150, w: 180, h: 20 }, // Pijakan 4 (Socket Receiver & Portal)
  ];

  // Rintangan Maut: Lubang Putus Sinyal (Data Disconnect Pit)
  const hazardPits = [
    { x: 260, y: 530, w: 90, h: 70 },
    { x: 630, y: 530, w: 90, h: 70 },
  ];

  // Stasiun Pemancar (Producer Process Station)
  const stationObj = { x: 130, y: GROUND_Y - 55, w: 50, h: 55 };

  // Objek Terminal Materi (di Pijakan 2)
  const terminalObj = { x: 485, y: 310 - 55, w: 45, h: 55 };

  // Objek Terminal Penerima (Socket Receiver di Pijakan 4)
  const receiverObj = { x: 835, y: 150 - 55, w: 45, h: 55 };

  // Objek Portal Akhir Stage (di Pijakan Terakhir)
  const portalObj = { x: 925, y: 150 - 90, w: 55, h: 90 };

  // Refs untuk Game Loop 60fps yang presisi
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: playerX, y: playerY, vy: velocityY, jumping: isJumping });
  const hasPacketRef = useRef(hasDataPacket);
  const deliveredRef = useRef(isPacketDelivered);
  const droneDirRef = useRef(1); // 1 = bergerak ke kanan, -1 = ke kiri
  const droneXRef = useRef(droneX);

  // Sinkronisasi ref dengan state
  playerRef.current = { x: playerX, y: playerY, vy: velocityY, jumping: isJumping };
  hasPacketRef.current = hasDataPacket;
  deliveredRef.current = isPacketDelivered;
  droneXRef.current = droneX;

  // Notifikasi Toast Otomatis Hilang
  const triggerAlert = (msg: string) => {
    setAlertMessage(msg);
  };

  useEffect(() => {
    if (!alertMessage) return;
    const t = setTimeout(() => setAlertMessage(null), 3500);
    return () => clearTimeout(t);
  }, [alertMessage]);

  // Reset Posisi Pemain jika Jatuh ke Rintangan Listrik atau tertabrak drone
  const resetPlayerToSpawn = (reason?: string) => {
    setPlayerX(SPAWN_X);
    setPlayerY(SPAWN_Y);
    setVelocityY(0);
    setIsJumping(false);
    setIsWalking(false);
    playerRef.current = { x: SPAWN_X, y: SPAWN_Y, vy: 0, jumping: false };

    // Jika membawa paket saat jatuh/terkena scanner, paket lepas dan kembali ke pemancar
    if (hasPacketRef.current && !deliveredRef.current) {
      setHasDataPacket(false);
      hasPacketRef.current = false;
      triggerAlert(reason || "⚡ Sinyal Terputus! Paket data kembali ke Pemancar.");
    } else if (reason) {
      triggerAlert(reason);
    }
  };

  // Keyboard Event Listeners (W, A, S, D, Panah, Spasi, E, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Tombol E untuk interaksi serbaguna
      if (key === "e") {
        // 1. Interaksi dengan Terminal Materi
        if (isNearTerminal && !showMaterial && !showQuiz) {
          setShowMaterial(true);
          return;
        }

        // 2. Mengambil Paket Data di Stasiun Pemancar
        if (isNearStation && !hasPacketRef.current && !deliveredRef.current) {
          setHasDataPacket(true);
          hasPacketRef.current = true;
          triggerAlert("📦 Paket Data IPC diambil! Antarkan ke Terminal Penerima (Socket) di lantai atas.");
          return;
        }

        // 3. Menyetor Paket Data di Terminal Penerima (Socket)
        if (isNearReceiver && hasPacketRef.current && !deliveredRef.current) {
          setHasDataPacket(false);
          hasPacketRef.current = false;
          setIsPacketDelivered(true);
          deliveredRef.current = true;
          triggerAlert("🟢 Kanal Socket Terhubung! Aliran data IPC aktif, Portal Stage 2 terbuka!");
          return;
        }
      }

      if (key === "escape") {
        setShowMaterial(false);
        setShowQuiz(false);
        return;
      }

      // Cegah scrolling bawaan browser saat bermain
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
  }, [isNearTerminal, isNearStation, isNearReceiver, showMaterial, showQuiz]);

  // Game Loop dengan requestAnimationFrame
  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      // Hentikan simulasi fisika jika modal materi atau modal kuis sedang terbuka
      if (!showMaterial && !showQuiz) {
        let p = { ...playerRef.current };
        const keys = keysPressed.current;

        // --- 1. KONTROL GERAK HORIZONTAL PEMAIN ---
        let moveX = 0;
        if (keys.has("a") || keys.has("arrowleft")) {
          moveX -= MOVE_SPEED;
          setFacingRight(false);
        }
        if (keys.has("d") || keys.has("arrowright")) {
          moveX += MOVE_SPEED;
          setFacingRight(true);
        }

        // Animasi jalan (waddle) hanya aktif saat bergerak di lantai
        setIsWalking(moveX !== 0 && !p.jumping);

        // --- 2. LOMPAT PEMAIN ---
        const wantsJump = keys.has("w") || keys.has("arrowup") || keys.has(" ");
        if (wantsJump && !p.jumping) {
          p.vy = JUMP_POWER;
          p.jumping = true;
        }

        // Terapkan Gravitasi ke Pemain
        p.vy += GRAVITY;
        p.y += p.vy;

        // Update Posisi X dengan Batas Layar
        p.x = Math.max(10, Math.min(p.x + moveX, GAME_WIDTH - PLAYER_W - 10));

        // --- 3. PATROLI FIREWALL SCANNER (THREAD HAZARD) ---
        let currentDroneX = droneXRef.current + droneDirRef.current * 2.2;
        if (currentDroneX >= 600) {
          currentDroneX = 600;
          droneDirRef.current = -1;
        } else if (currentDroneX <= 380) {
          currentDroneX = 380;
          droneDirRef.current = 1;
        }
        droneXRef.current = currentDroneX;
        setDroneX(currentDroneX);

        // Deteksi Tabrakan Pemain dengan Scanner Drone
        const touchDrone =
          p.x + PLAYER_W > currentDroneX + 6 &&
          p.x < currentDroneX + DRONE_W - 6 &&
          p.y + PLAYER_H > droneY + 6 &&
          p.y < droneY + DRONE_H;

        if (touchDrone) {
          resetPlayerToSpawn("🚨 Terdeteksi oleh Scanner Firewall! Paket data terlepas.");
          return;
        }

        // --- 4. TABRAKAN PEMAIN DENGAN PLATFORM MELAYANG ---
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

        // --- 5. RINTANGAN MAUT (LUBANG LISTRIK / PUTUS SINYAL) ---
        for (const pit of hazardPits) {
          const inHazard =
            p.x + PLAYER_W > pit.x + 8 &&
            p.x < pit.x + pit.w - 8 &&
            p.y + PLAYER_H >= pit.y;

          if (inHazard) {
            resetPlayerToSpawn("⚡ Terperosok ke Jalur Korup! Sinyal terputus.");
            return;
          }
        }

        // Batas bawah jika jatuh ke jurang
        if (p.y > GAME_HEIGHT) {
          resetPlayerToSpawn();
          return;
        }

        // --- 6. CEK KEDEKATAN DENGAN OBJEK INTERAKTIF ---
        // Stasiun Pemancar
        const distStatX = Math.abs(p.x + PLAYER_W / 2 - (stationObj.x + stationObj.w / 2));
        const distStatY = Math.abs(p.y + PLAYER_H / 2 - (stationObj.y + stationObj.h / 2));
        setIsNearStation(distStatX < 70 && distStatY < 65);

        // Terminal Materi
        const distTermX = Math.abs(p.x + PLAYER_W / 2 - (terminalObj.x + terminalObj.w / 2));
        const distTermY = Math.abs(p.y + PLAYER_H / 2 - (terminalObj.y + terminalObj.h / 2));
        setIsNearTerminal(distTermX < 65 && distTermY < 65);

        // Terminal Penerima (Socket)
        const distRecX = Math.abs(p.x + PLAYER_W / 2 - (receiverObj.x + receiverObj.w / 2));
        const distRecY = Math.abs(p.y + PLAYER_H / 2 - (receiverObj.y + receiverObj.h / 2));
        setIsNearReceiver(distRecX < 70 && distRecY < 65);

        // --- 7. CEK TABRAKAN DENGAN PORTAL AKHIR ---
        const touchPortal =
          p.x + PLAYER_W > portalObj.x &&
          p.x < portalObj.x + portalObj.w &&
          p.y + PLAYER_H > portalObj.y &&
          p.y < portalObj.y + portalObj.h;

        if (touchPortal) {
          if (deliveredRef.current) {
            setShowQuiz(true);
          } else {
            triggerAlert("⚠️ Portal Terkunci! Hubungkan paket data ke Terminal Socket terlebih dahulu.");
          }
        }

        // Update State React
        setPlayerX(p.x);
        setPlayerY(p.y);
        setVelocityY(p.vy);
        setIsJumping(p.jumping);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [showMaterial, showQuiz]);

  // Handle Jawaban Kuis
  const handleQuizSubmit = () => {
    if (selectedAnswer === null) return;
    const isCorrect = selectedAnswer === 1; // Jawaban B benar (Socket)
    setIsQuizCorrect(isCorrect);
    setIsQuizSubmitted(true);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4 select-none">
      {/* HUD Info Atas */}
      <div className="mb-3 flex w-full max-w-[1000px] items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs text-gray-300 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-wider text-[#ffb347] uppercase">
            Stage 2 // The Data Courier (Threads & IPC)
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            Status IPC:{" "}
            {isPacketDelivered ? (
              <strong className="text-emerald-400 font-bold">🟢 TERHUBUNG (ESTABLISHED)</strong>
            ) : hasDataPacket ? (
              <strong className="text-amber-400 font-bold">📦 MEMBAWA PAKET DATA</strong>
            ) : (
              <strong className="text-cyan-400 font-bold">⚪ AMBIL PAKET DI PEMANCAR</strong>
            )}
          </span>
          <span className="hidden md:inline text-gray-400">|</span>
          <span className="hidden md:inline">
            Kontrol: <strong className="text-white">A / D</strong> (Jalan), <strong className="text-white">W / Spasi</strong> (Lompat), <strong className="text-white">E</strong> (Interaksi)
          </span>
        </div>
      </div>

      {/* Arena Game 2D Platformer (1000px x 600px) */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-purple-500/30 bg-[#0c081e] shadow-[0_0_50px_rgba(147,51,234,0.25)]"
        style={{ width: `${GAME_WIDTH}px`, height: `${GAME_HEIGHT}px` }}
      >
        {/* Background Kosmik & Bintang Halus */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
        <div className="absolute top-10 left-20 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-20 h-44 w-44 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        {/* Visual Jalur Pipa Komunikasi (Kanal IPC Conduits) di Background */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none opacity-40" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 155 465 L 280 410 L 510 310 L 730 220 L 855 150"
            fill="none"
            stroke={isPacketDelivered ? "#34d399" : "#38bdf8"}
            strokeWidth="3"
            strokeDasharray="8 6"
            className={isPacketDelivered ? "animate-pulse" : ""}
          />
        </svg>

        {/* 1. Platform & Lantai */}
        {platforms.map((plat, idx) => (
          <div
            key={idx}
            className="absolute rounded-t-lg border-t-2 border-cyan-400/60 bg-gradient-to-b from-[#2a1e5c] to-[#140e33] shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
            style={{
              left: `${plat.x}px`,
              top: `${plat.y}px`,
              width: `${plat.w}px`,
              height: `${plat.h}px`,
            }}
          >
            {/* Tekstur Garis Platform */}
            <div className="h-1 w-full bg-cyan-400/30" />
          </div>
        ))}

        {/* 2. Rintangan Maut: Lubang Putus Sinyal (Data Disconnect Pit) */}
        {hazardPits.map((pit, idx) => (
          <div
            key={idx}
            className="absolute flex flex-col items-center justify-center rounded-lg border-2 border-rose-500/80 bg-rose-950/40 shadow-[0_0_25px_rgba(244,63,94,0.7)] animate-pulse"
            style={{
              left: `${pit.x}px`,
              top: `${pit.y}px`,
              width: `${pit.w}px`,
              height: `${pit.h}px`,
            }}
          >
            <span className="text-xs font-black tracking-widest text-rose-300">⚡ KORUP SINYAL ⚡</span>
            <span className="text-[9px] text-rose-400">Putus Sambungan</span>
          </div>
        ))}

        {/* 3. Stasiun Pemancar Data (Producer Thread Station) */}
        <div
          className="absolute z-10 flex flex-col items-center cursor-pointer"
          style={{
            left: `${stationObj.x}px`,
            top: `${stationObj.y}px`,
            width: `${stationObj.w}px`,
            height: `${stationObj.h}px`,
          }}
          onClick={() => {
            if (!hasDataPacket && !isPacketDelivered) {
              setHasDataPacket(true);
              triggerAlert("📦 Paket Data IPC diambil! Antarkan ke Terminal Penerima (Socket).");
            }
          }}
        >
          {isNearStation && !hasDataPacket && !isPacketDelivered && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce">
              <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-black text-black shadow-[0_0_10px_rgba(251,191,36,0.8)]">
                [E] Ambil Paket Data
              </span>
            </div>
          )}

          {/* Ikon Paket Mengambang jika belum diambil */}
          {!hasDataPacket && !isPacketDelivered ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/80 bg-cyan-950/70 shadow-[0_0_20px_rgba(34,211,238,0.7)] animate-bounce">
              <span className="text-2xl">📦</span>
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-600 bg-gray-900/60 opacity-60">
              <span className="text-xl">📡</span>
            </div>
          )}
          <span className="mt-1 text-[9px] font-bold tracking-wider text-cyan-300">PRODUCER</span>
        </div>

        {/* 4. Rintangan Bergerak: Firewall Thread Scanner Drone */}
        <div
          className="absolute z-20 flex flex-col items-center transition-all duration-75"
          style={{
            left: `${droneX}px`,
            top: `${droneY}px`,
            width: `${DRONE_W}px`,
            height: `${DRONE_H}px`,
          }}
        >
          <div className="flex h-8 w-11 items-center justify-center rounded-lg border-2 border-rose-500 bg-rose-950/80 shadow-[0_0_15px_rgba(244,63,94,0.9)] animate-pulse">
            <span className="text-base">🚨</span>
          </div>
          <span className="text-[8px] font-black tracking-widest text-rose-300">SCANNER</span>
          {/* Laser Scanner Beam ke Bawah */}
          <div className="h-12 w-1.5 bg-gradient-to-b from-rose-500/80 to-transparent" />
        </div>

        {/* 5. Terminal Interaktif & Checkpoint Materi (Protokol IPC & Threads) */}
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
              <span className="rounded bg-amber-400 px-2 py-0.5 text-[10px] font-black text-black shadow-[0_0_10px_rgba(251,191,36,0.8)]">
                [E] Buka Protokol IPC
              </span>
            </div>
          )}
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/80 bg-purple-950/60 shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse">
            <span className="text-xl">📑</span>
          </div>
          <div className="h-3 w-5 bg-purple-500/40 rounded-t" />
        </div>

        {/* 6. Terminal Penerima (Socket Receiver Node) */}
        <div
          className="absolute z-10 flex flex-col items-center cursor-pointer"
          style={{
            left: `${receiverObj.x}px`,
            top: `${receiverObj.y}px`,
            width: `${receiverObj.w}px`,
            height: `${receiverObj.h}px`,
          }}
          onClick={() => {
            if (hasDataPacket && !isPacketDelivered) {
              setHasDataPacket(false);
              setIsPacketDelivered(true);
              triggerAlert("🟢 Kanal Socket Terhubung! Aliran data IPC aktif, Portal Stage 2 terbuka!");
            }
          }}
        >
          {isNearReceiver && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce">
              <span className={`rounded px-2 py-0.5 text-[10px] font-black shadow-md ${
                hasDataPacket
                  ? "bg-emerald-400 text-black shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                  : "bg-gray-800 text-gray-300 border border-gray-600"
              }`}>
                {hasDataPacket ? "[E] Hubungkan Socket" : isPacketDelivered ? "Kanal Aktif" : "Menunggu Paket"}
              </span>
            </div>
          )}
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
            isPacketDelivered
              ? "border-emerald-400 bg-emerald-950/70 shadow-[0_0_25px_rgba(52,211,153,0.8)]"
              : "border-amber-400/80 bg-amber-950/50 shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-pulse"
          }`}>
            <span className="text-xl">{isPacketDelivered ? "🔌" : "⚙️"}</span>
          </div>
          <span className={`mt-1 text-[9px] font-bold tracking-wider ${isPacketDelivered ? "text-emerald-300" : "text-amber-300"}`}>
            {isPacketDelivered ? "SOCKET OK" : "RECEIVER"}
          </span>
        </div>

        {/* 7. Portal Akhir Stage */}
        <div
          className="absolute z-10 flex flex-col items-center justify-center cursor-pointer"
          style={{
            left: `${portalObj.x}px`,
            top: `${portalObj.y}px`,
            width: `${portalObj.w}px`,
            height: `${portalObj.h}px`,
          }}
          onClick={() => {
            if (isPacketDelivered) setShowQuiz(true);
            else triggerAlert("⚠️ Portal Terkunci! Hubungkan paket data ke Terminal Socket terlebih dahulu.");
          }}
        >
          {/* Cincin Energi Portal */}
          <div className={`absolute inset-0 rounded-full border-2 transition-all ${
            isPacketDelivered
              ? "border-emerald-400 bg-gradient-to-t from-emerald-600/50 via-cyan-500/30 to-blue-500/40 shadow-[0_0_35px_rgba(52,211,153,0.9)] animate-pulse"
              : "border-gray-600 bg-black/60 opacity-50"
          }`} />
          <div className="relative z-10 text-center">
            <span className={`text-2xl inline-block ${isPacketDelivered ? "animate-spin" : "opacity-40"}`} style={{ animationDuration: "8s" }}>
              🌀
            </span>
            <span className={`block text-[9px] font-black tracking-widest uppercase ${isPacketDelivered ? "text-emerald-200" : "text-gray-400"}`}>
              {isPacketDelivered ? "PORTAL 3" : "TERKUNCI"}
            </span>
          </div>
        </div>

        {/* 8. Karakter Pemain (Astronaut) dengan Animasi Visual */}
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: `${playerX}px`,
            top: `${playerY}px`,
            width: `${PLAYER_W}px`,
            height: `${PLAYER_H}px`,
          }}
        >
          {/* Balon Paket Data di atas kepala astronot saat sedang membawa paket */}
          {hasDataPacket && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-cyan-300 bg-cyan-950/90 px-2 py-0.5 text-[9px] font-black text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.9)] animate-bounce">
              <span>📦</span>
              <span>IPC DATA</span>
            </div>
          )}

          {/* Wrapper Squash & Stretch */}
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
              style={{ transformOrigin: "bottom center" }}
            />
          </div>
        </div>

        {/* Notifikasi Toast Mengambang di Arena */}
        {alertMessage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-xl border border-cyan-400/40 bg-black/85 px-4 py-2 text-xs font-semibold text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.4)] backdrop-blur-md animate-fade-in">
            {alertMessage}
          </div>
        )}
      </div>

      {/* Navigasi Cepat Bawah */}
      <div className="mt-3 flex w-full max-w-[1000px] items-center justify-between px-2 text-xs text-gray-400">
        <Link href="/stage/stage1" className="hover:text-cyan-300 transition">
          ← Kembali ke Stage 1
        </Link>
        <Link href="/" className="hover:text-cyan-300 transition">
          Menu Utama ⌂
        </Link>
      </div>

      {/* MODAL 1: CHECKPOINT MATERI SISTEM OPERASI (IPC & THREADS) */}
      {showMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-cyan-400/50 bg-[#0d091e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_50px_rgba(34,211,238,0.3)]">
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
                <h2 className="text-lg font-bold text-[#ffb347]">
                  OMNI LOG // PROTOKOL THREADS & IPC
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
                <h3 className="font-bold text-cyan-300">1. Apa itu IPC (Inter-Process Communication)?</h3>
                <p className="mt-1">
                  Dalam sistem operasi modern, setiap proses memiliki ruang alamat memori (*address space*) yang terisolasi demi keamanan. <strong>IPC</strong> adalah mekanisme yang memungkinkan proses-proses berbeda untuk bertukar data dan melakukan sinkronisasi aksi.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="font-bold text-[#ffb347]">2. Tiga Model Utama IPC</h3>
                <ul className="mt-2 space-y-2 list-disc list-inside">
                  <li>
                    <strong className="text-white">Pipe (Pipa):</strong> Kanal aliran data satu arah (unidirectional / FIFO), umumnya untuk komunikasi antar proses berelasi (parent-child).
                  </li>
                  <li>
                    <strong className="text-white">Message Queue (Antrean Pesan):</strong> Pesan disimpan dalam antrean berstruktur (FIFO) di dalam memori kernel hingga dibaca oleh proses penerima.
                  </li>
                  <li>
                    <strong className="text-white">Socket:</strong> Endpoint komunikasi dua arah (bidirectional) fleksibel yang dapat menghubungkan proses lokal maupun proses yang berada di komputer berbeda melintasi jaringan (*network*).
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="font-bold text-emerald-300">3. Process vs Thread</h3>
                <p className="mt-1">
                  <strong>Thread</strong> adalah unit eksekusi terkecil di dalam proses (sering disebut *lightweight process*). Thread-thread dalam satu proses saling berbagi ruang memori (*shared memory*), sehingga komunikasi antar-thread sangat cepat tanpa overhead berat IPC.
                </p>
              </div>

              <div className="rounded-lg border border-amber-400/30 bg-amber-950/20 p-3 text-amber-200">
                <p className="font-semibold text-amber-300">💡 Kunci Menembus Portal 2:</p>
                <p className="mt-0.5">Ingat model IPC manakah yang mampu berkomunikasi melintasi jaringan (*network*) antar mesin yang berbeda!</p>
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

      {/* MODAL 2: KUIS PORTAL AKHIR STAGE */}
      {showQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-purple-500/50 bg-[#0f0924]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_60px_rgba(168,85,247,0.3)]">
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
              <h2 className="text-lg font-bold text-purple-300">
                FIREWALL PORTAL 2 // VERIFIKASI KERNEL
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
                Metode Komunikasi Antar-Proses (IPC) manakah yang menyediakan koneksi dua arah (bidirectional) dan dapat digunakan untuk komunikasi antar-proses melintasi jaringan (network) pada komputer yang berbeda?
              </p>

              <div className="space-y-2">
                {[
                  { id: 0, text: "A. Ordinary Unidirectional Pipe" },
                  { id: 1, text: "B. Network Socket (TCP/IP / UDP)" },
                  { id: 2, text: "C. Thread Local Storage Register" },
                  { id: 3, text: "D. CPU L1 Cache Line" },
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
                      ? "Tepat sekali! Socket bertindak sebagai endpoint komunikasi jaringan (IP & Port) yang memungkinkan transfer data bidirectional melintasi jaringan. Gerbang Portal Stage 3 kini terbuka."
                      : "Jawaban belum tepat. Ingat bahwa Pipe biasanya satu arah dan hanya untuk proses lokal, sementara Socket dirancang untuk komunikasi lintas jaringan!"}
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
                  onClick={() => router.push("/stage/stage3")}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-2.5 font-bold text-black shadow-[0_0_20px_rgba(52,211,153,0.6)] transition hover:scale-105"
                >
                  Masuk ke Stage 3 🚀
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

