"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Stage1Platformer() {
  const router = useRouter();

  // Dimensi dasar game arena
  const GAME_WIDTH = 1000;
  const GAME_HEIGHT = 600;
  const GROUND_Y = 520; // Garis lantai dasar

  // Dimensi Karakter Pemain
  const PLAYER_W = 48;
  const PLAYER_H = 68;
  const MOVE_SPEED = 4.5;
  const JUMP_POWER = -12.5;
  const GRAVITY = 0.6;

  // Dimensi Batu Kargo (Pushable Box)
  const BOX_W = 56;
  const BOX_H = 56;

  // Titik Awal Pemain
  const SPAWN_X = 60;
  const SPAWN_Y = GROUND_Y - PLAYER_H;

  // 1. State Pemain & Fisika Dasar
  const [playerX, setPlayerX] = useState(SPAWN_X);
  const [playerY, setPlayerY] = useState(SPAWN_Y);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isWalking, setIsWalking] = useState(false);

  // 2. State Objek Batu Kargo (Pushable Box)
  const [boxX, setBoxX] = useState(250);
  const [boxY, setBoxY] = useState(GROUND_Y - BOX_H);
  const [boxVelocityY, setBoxVelocityY] = useState(0);

  // 3. State Interaksi & Modal
  const [showMaterial, setShowMaterial] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [isQuizCorrect, setIsQuizCorrect] = useState(false);
  const [isNearTerminal, setIsNearTerminal] = useState(false);

  // Daftar Platform Pijakan Melayang
  const platforms = [
    { x: 0, y: GROUND_Y, w: 380, h: 80 }, // Lantai Kiri
    { x: 540, y: GROUND_Y, w: 460, h: 80 }, // Lantai Kanan
    { x: 260, y: 390, w: 150, h: 20 }, // Pijakan 1
    { x: 480, y: 290, w: 180, h: 20 }, // Pijakan 2 (Ada Terminal)
    { x: 740, y: 200, w: 180, h: 20 }, // Pijakan 3 (Arah Portal)
    { x: 920, y: 150, w: 80, h: 20 }, // Pijakan Portal
  ];

  // Rintangan Maut: Lubang Listrik (Electric Hazard Pit)
  const hazardPit = { x: 380, y: 530, w: 160, h: 70 };

  // Objek Terminal Materi (di atas Platform 2)
  const terminalObj = { x: 550, y: 290 - 55, w: 45, h: 55 };

  // Objek Portal Akhir Stage (di Pijakan Terakhir)
  const portalObj = { x: 935, y: 150 - 90, w: 55, h: 90 };

  // Refs untuk Game Loop 60fps yang presisi
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: playerX, y: playerY, vy: velocityY, jumping: isJumping });
  const boxRef = useRef({ x: boxX, y: boxY, vy: boxVelocityY });

  // Sinkronisasi ref dengan state
  playerRef.current = { x: playerX, y: playerY, vy: velocityY, jumping: isJumping };
  boxRef.current = { x: boxX, y: boxY, vy: boxVelocityY };

  // Reset Posisi Pemain jika Jatuh ke Rintangan Maut
  const resetPlayerToSpawn = () => {
    setPlayerX(SPAWN_X);
    setPlayerY(SPAWN_Y);
    setVelocityY(0);
    setIsJumping(false);
    setIsWalking(false);
    playerRef.current = { x: SPAWN_X, y: SPAWN_Y, vy: 0, jumping: false };
  };

  // Keyboard Event Listeners (W, A, S, D, Panah, Spasi, E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Tombol E untuk membuka materi saat berada di dekat terminal
      if (key === "e") {
        if (isNearTerminal && !showMaterial && !showQuiz) {
          setShowMaterial(true);
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
  }, [isNearTerminal, showMaterial, showQuiz]);

  // Game Loop dengan requestAnimationFrame
  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      // Hentikan simulasi fisika jika modal materi atau modal kuis sedang terbuka
      if (!showMaterial && !showQuiz) {
        let p = { ...playerRef.current };
        let b = { ...boxRef.current };
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

        // Terapkan Gravitasi ke Batu Kargo
        b.vy += GRAVITY;
        b.y += b.vy;

        // --- 3. TABRAKAN BATU DENGAN PLATFORM / LANTAI ---
        for (const plat of platforms) {
          // Cek apakah batu menimpa platform dari atas
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

        // Batas bawah batu jika jatuh ke lubang
        if (b.y > GAME_HEIGHT) {
          b.x = 250;
          b.y = GROUND_Y - BOX_H;
          b.vy = 0;
        }

        // --- 4. MEKANIK MENDORONG BATU (BOX PUSHING) & COLLISION ---
        // Prediksi posisi X pemain berikutnya
        const nextPlayerX = p.x + moveX;

        // AABB Collision antara Pemain dan Batu
        const isHorizontallyTouching =
          nextPlayerX < b.x + BOX_W &&
          nextPlayerX + PLAYER_W > b.x &&
          p.y + PLAYER_H > b.y + 8 &&
          p.y < b.y + BOX_H;

        if (isHorizontallyTouching) {
          if (moveX > 0) {
            // Mendorong batu ke kanan
            const pushDist = nextPlayerX + PLAYER_W - b.x;
            const newBoxX = b.x + pushDist;

            // Batasi batu tidak tembus batas kanan game
            if (newBoxX + BOX_W <= GAME_WIDTH - 10) {
              b.x = newBoxX;
              p.x = b.x - PLAYER_W;
            } else {
              p.x = b.x - PLAYER_W;
            }
          } else if (moveX < 0) {
            // Mendorong batu ke kiri
            const pushDist = b.x + BOX_W - nextPlayerX;
            const newBoxX = b.x - pushDist;

            // Batasi batu tidak tembus batas kiri game
            if (newBoxX >= 10) {
              b.x = newBoxX;
              p.x = b.x + BOX_W;
            } else {
              p.x = b.x + BOX_W;
            }
          }
        } else {
          // Jika tidak bertabrakan dengan batu, gerakkan pemain secara normal
          p.x = Math.max(10, Math.min(nextPlayerX, GAME_WIDTH - PLAYER_W - 10));
        }

        // Pijakan di atas batu: Pemain bisa berdiri dan melompat di atas batu
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

        // --- 5. TABRAKAN PEMAIN DENGAN PLATFORM MELAYANG ---
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

        // --- 6. RINTANGAN MAUT (LUBANG LISTRIK) ---
        const inHazard =
          p.x + PLAYER_W > hazardPit.x + 10 &&
          p.x < hazardPit.x + hazardPit.w - 10 &&
          p.y + PLAYER_H >= hazardPit.y;

        if (inHazard || p.y > GAME_HEIGHT) {
          // Pemain jatuh ke rintangan listrik -> reset posisi
          resetPlayerToSpawn();
          return;
        }

        // --- 7. CEK KEDEKATAN DENGAN TERMINAL MATERI ---
        const distTermX = Math.abs(p.x + PLAYER_W / 2 - (terminalObj.x + terminalObj.w / 2));
        const distTermY = Math.abs(p.y + PLAYER_H / 2 - (terminalObj.y + terminalObj.h / 2));
        setIsNearTerminal(distTermX < 65 && distTermY < 65);

        // --- 8. CEK TABRAKAN DENGAN PORTAL AKHIR ---
        const touchPortal =
          p.x + PLAYER_W > portalObj.x &&
          p.x < portalObj.x + portalObj.w &&
          p.y + PLAYER_H > portalObj.y &&
          p.y < portalObj.y + portalObj.h;

        if (touchPortal) {
          setShowQuiz(true);
        }

        // Update State React
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
  }, [showMaterial, showQuiz]);

  // Handle Jawaban Kuis
  const handleQuizSubmit = () => {
    if (selectedAnswer === null) return;
    const isCorrect = selectedAnswer === 1; // Jawaban B benar
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
            Stage 1 // 2D Platformer Koridor OMNI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Kontrol: <strong className="text-white">A / D</strong> (Jalan), <strong className="text-white">W / Spasi</strong> (Lompat), <strong className="text-white">E</strong> (Interaksi)</span>
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

        {/* 2. Rintangan Maut: Lubang Listrik (Electric Hazard Pit) */}
        <div
          className="absolute flex flex-col items-center justify-center rounded-lg border-2 border-rose-500/80 bg-rose-950/40 shadow-[0_0_25px_rgba(244,63,94,0.7)] animate-pulse"
          style={{
            left: `${hazardPit.x}px`,
            top: `${hazardPit.y}px`,
            width: `${hazardPit.w}px`,
            height: `${hazardPit.h}px`,
          }}
        >
          <span className="text-sm font-black tracking-widest text-rose-300">⚡ BAHAYA LISTRIK ⚡</span>
          <span className="text-[10px] text-rose-400">Jatuh = Reset ke Titik Awal</span>
        </div>

        {/* 3. Batu Kargo (Pushable Box) yang Tunduk pada Gravitasi & Dorongan */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center rounded-xl border-2 border-amber-400/90 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 shadow-[0_0_20px_rgba(251,191,36,0.5)] cursor-grab active:cursor-grabbing"
          style={{
            left: `${boxX}px`,
            top: `${boxY}px`,
            width: `${BOX_W}px`,
            height: `${BOX_H}px`,
          }}
        >
          <span className="text-xl">📦</span>
          <span className="text-[9px] font-black text-amber-200 tracking-wider">DORONG</span>
        </div>

        {/* 4. Terminal Interaktif & Checkpoint Materi */}
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
                [E] Buka Materi
              </span>
            </div>
          )}
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/80 bg-cyan-950/60 shadow-[0_0_20px_rgba(34,211,238,0.6)] animate-pulse">
            <span className="text-xl">🖥️</span>
          </div>
          <div className="h-3 w-5 bg-purple-500/40 rounded-t" />
        </div>

        {/* 5. Portal Akhir Stage */}
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
          {/* Cincin Energi Portal */}
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400 bg-gradient-to-t from-purple-600/50 via-cyan-500/30 to-blue-500/40 shadow-[0_0_35px_rgba(34,211,238,0.8)] animate-pulse" />
          <div className="relative z-10 text-center">
            <span className="text-2xl animate-spin inline-block" style={{ animationDuration: "8s" }}>🌀</span>
            <span className="block text-[9px] font-black tracking-widest text-cyan-200 uppercase">PORTAL 2</span>
          </div>
        </div>

        {/* 6. Karakter Pemain (Astronaut) dengan Animasi Visual (Flip, Waddle, Squash & Stretch) */}
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: `${playerX}px`,
            top: `${playerY}px`,
            width: `${PLAYER_W}px`,
            height: `${PLAYER_H}px`,
          }}
        >
          {/* Wrapper Squash & Stretch: Memanjang ke atas & menyempit saat berada di udara (melompat) */}
          <div
            className="h-full w-full transition-transform duration-150 ease-out"
            style={{
              transformOrigin: "bottom center",
              transform: isJumping
                ? `${facingRight ? "scaleX(0.88)" : "scaleX(-0.88)"} scaleY(1.12)`
                : `${facingRight ? "scaleX(1)" : "scaleX(-1)"} scaleY(1)`,
            }}
          >
            {/* Elemen Gambar: Animasi waddle (ayunan langkah) aktif saat berjalan di tanah */}
            <img
              src="/astronaut-front.png"
              alt="Astronaut"
              className={`h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] ${
                isWalking && !isJumping ? "animate-waddle" : ""
              }`}
              style={{
                transformOrigin: "bottom center",
              }}
            />
          </div>
        </div>
      </div>

      {/* MODAL 1: CHECKPOINT MATERI SISTEM OPERASI */}
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

      {/* MODAL 2: KUIS PORTAL AKHIR STAGE */}
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
      {/* Keyframe Animasi Waddle (Ayunan Langkah Kaki Astronot) */}
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
