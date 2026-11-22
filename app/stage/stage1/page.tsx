"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";


export default function Stage1Platformer() {
  const router = useRouter();

  // ─── KONSTANTA KANVAS (16:9 Fixed) ─────────────────────────
  const GAME_WIDTH = 1024;
  const GAME_HEIGHT = 576;
  const GROUND_Y = 540; // Lantai dasar di paling bawah

  // ─── KONSTANTA PEMAIN & SPRITE ────────────────────────────
  // Dimensi visual karakter (sedikit diperbesar proporsional 2:3)
  const VISUAL_W = 54;
  const VISUAL_H = 82;

  // Dimensi Hitbox Fisika
  const PLAYER_W = 44;
  const PLAYER_H = 76;
  const MOVE_SPEED = 3.6;
  const JUMP_POWER = -8.9; // Lompatan pertama lebih terukur / tidak melayang tinggi
  const DOUBLE_JUMP_POWER = -9.5; // Double jump terukur
  const GRAVITY = 0.6;

  // ─── KONSTANTA KOTAK KARGO ─────────────────────────────────
  const BOX_W = 45;
  const BOX_H = 45;

  // ─── STATE PEMAIN & FISIKA ─────────────────────────────────
  const [playerX, setPlayerX] = useState(60);
  const [playerY, setPlayerY] = useState(GROUND_Y - PLAYER_H);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isWalking, setIsWalking] = useState(false);

  // ─── STATE ANIMASI SPRITE (File PNG Tunggal per Frame) ────
  const [playerSprite, setPlayerSprite] = useState<string>("/idle.png");

  // ─── STATE SISTEM LASER & RINTANGAN ───────────────────────
  const [isLaser1Active, setIsLaser1Active] = useState(true);
  const [isLaser2Active, setIsLaser2Active] = useState(true);
  const [isLaser3Active, setIsLaser3Active] = useState(true);
  const [isLaser4Active, setIsLaser4Active] = useState(true);
  const [isLaser5Active, setIsLaser5Active] = useState(true);
  const [isLaser6Active, setIsLaser6Active] = useState(true);

  // State Tugas 1: Materi (Terminal) & Laser 4
  const [isMateriRead, setIsMateriRead] = useState(false);
  const [materialModalTab, setMaterialModalTab] = useState<"material" | "quiz">("material");
  const [fcfsQuizAnswers, setFcfsQuizAnswers] = useState<(number | null)[]>([null, null, null]);

  // State Tugas 2: Materi 2 (SJF) & Laser 5
  const [isTes1Done, setIsTes1Done] = useState(false);
  const [showTes1Modal, setShowTes1Modal] = useState(false);
  const [isNearTes1, setIsNearTes1] = useState(false);
  const [tes1ModalTab, setTes1ModalTab] = useState<"material" | "quiz">("material");
  const [sjfQuizAnswers, setSjfQuizAnswers] = useState<(number | null)[]>([null, null, null]);

  // State Tugas 3: Materi 3 (Round Robin) & Laser 6
  const [isTes2Done, setIsTes2Done] = useState(false);
  const [showTes2Modal, setShowTes2Modal] = useState(false);
  const [isNearTes2, setIsNearTes2] = useState(false);
  const [tes2ModalTab, setTes2ModalTab] = useState<"material" | "quiz">("material");
  const [rrQuizAnswers, setRrQuizAnswers] = useState<(number | null)[]>([null, null, null]);

  // ─── STATE KOTAK KARGO ─────────────────────────────────────
  const [boxX, setBoxX] = useState(460);
  const [boxY, setBoxY] = useState(GROUND_Y - BOX_H);
  const [boxVelocityY, setBoxVelocityY] = useState(0);

  // ─── STATE MODAL & EDUKASI ─────────────────────────────────
  const [showMaterial, setShowMaterial] = useState(false);
  const [isNearTerminal, setIsNearTerminal] = useState(false);
  const [isNearLever, setIsNearLever] = useState(false);

  // ─── STATE MINI-GAME: ALIEN REACTOR POWER DISTRIBUTOR ───────
  const [isMiniGameOpen, setIsMiniGameOpen] = useState(false);
  const [isPortalActive, setIsPortalActive] = useState(false);

  interface ReactorProcess {
    id: string;
    name: string;
    arrivalTime: number;
    burstTime: number;
    remainingTime: number;
    badgeColor: string;
    borderColor: string;
    textColor: string;
    ganttBg: string;
  }

  interface GanttHistoryItem {
    id: string;
    name: string;
    start: number;
    duration: number;
    ganttBg: string;
  }

  const [reactorLevel, setReactorLevel] = useState<1 | 2 | 3>(1);
  const [levelTimer, setLevelTimer] = useState<number>(30);
  const [readyQueue, setReadyQueue] = useState<ReactorProcess[]>([]);
  const [activeCoreProcess, setActiveCoreProcess] = useState<(ReactorProcess & { allocTime: number }) | null>(null);
  const [executionProgress, setExecutionProgress] = useState<number>(0);
  const [ganttHistory, setGanttHistory] = useState<GanttHistoryItem[]>([]);
  const [reactorStatus, setReactorStatus] = useState<"playing" | "failed" | "won_level" | "victory">("playing");
  const [reactorFeedback, setReactorFeedback] = useState<{ text: string; type: "error" | "success" | "info" } | null>(null);
  const [isCpuBusy, setIsCpuBusy] = useState<boolean>(false);
  const cpuExecutionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper Generator Data Proses Acak per Level
  const generateLevelProcesses = (level: 1 | 2 | 3): { processes: ReactorProcess[]; timer: number } => {
    const processStyles = [
      { id: "P1", name: "Proses P1", badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40", borderColor: "border-cyan-400/60", textColor: "text-cyan-300", ganttBg: "bg-cyan-500 text-black" },
      { id: "P2", name: "Proses P2", badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/40", borderColor: "border-amber-400/60", textColor: "text-amber-300", ganttBg: "bg-amber-500 text-black" },
      { id: "P3", name: "Proses P3", badgeColor: "bg-purple-500/20 text-purple-300 border-purple-400/40", borderColor: "border-purple-400/60", textColor: "text-purple-300", ganttBg: "bg-purple-500 text-black" },
      { id: "P4", name: "Proses P4", badgeColor: "bg-rose-500/20 text-rose-300 border-rose-400/40", borderColor: "border-rose-400/60", textColor: "text-rose-300", ganttBg: "bg-rose-500 text-black" },
    ];

    if (level === 1) {
      // LEVEL 1: FCFS (3 Proses: P1, P2, P3)
      // 3 angka Arrival Time unik antara 0s s.d 6s
      const arrivalPool = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
      const arrivals = arrivalPool.slice(0, 3);

      const procs: ReactorProcess[] = [0, 1, 2].map((idx) => {
        const b = Math.floor(Math.random() * 4) + 2; // Burst 2s s.d 5s
        return {
          ...processStyles[idx],
          arrivalTime: arrivals[idx],
          burstTime: b,
          remainingTime: b,
        };
      });

      // Tampilkan dalam urutan teracak di layar
      const shuffled = [...procs].sort(() => Math.random() - 0.5);
      return { processes: shuffled, timer: 30 };
    } else if (level === 2) {
      // LEVEL 2: SJF (4 Proses: P1, P2, P3, P4)
      // Semua Arrival Time = 0s. 4 angka Burst Time unik antara 1s s.d 6s
      const burstPool = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
      const bursts = burstPool.slice(0, 4);

      const procs: ReactorProcess[] = [0, 1, 2, 3].map((idx) => ({
        ...processStyles[idx],
        arrivalTime: 0,
        burstTime: bursts[idx],
        remainingTime: bursts[idx],
      }));

      // Tampilkan dalam urutan teracak di layar
      const shuffled = [...procs].sort(() => Math.random() - 0.5);
      return { processes: shuffled, timer: 30 };
    } else {
      // LEVEL 3: Round Robin (q = 2s, 3 Proses: P1, P2, P3)
      // Arrival = 0s, tersusun berurutan di Ready Queue
      // Burst antara 3s s.d 6s (semua > 2s untuk memastikan rotasi)
      const procs: ReactorProcess[] = [0, 1, 2].map((idx) => {
        const b = Math.floor(Math.random() * 4) + 3; // 3s s.d 6s
        return {
          ...processStyles[idx],
          arrivalTime: 0,
          burstTime: b,
          remainingTime: b,
        };
      });

      return { processes: procs, timer: 35 };
    }
  };

  const startReactorLevel = (level: 1 | 2 | 3) => {
    if (cpuExecutionTimerRef.current) {
      clearInterval(cpuExecutionTimerRef.current);
      cpuExecutionTimerRef.current = null;
    }
    const { processes, timer } = generateLevelProcesses(level);
    setReactorLevel(level);
    setReadyQueue(processes);
    setLevelTimer(timer);
    setActiveCoreProcess(null);
    setExecutionProgress(0);
    setGanttHistory([]);
    setReactorStatus("playing");
    setReactorFeedback(null);
    setIsCpuBusy(false);
  };

  const openReactorGame = () => {
    startReactorLevel(1);
    setIsMiniGameOpen(true);
  };
  const openSJFGame = openReactorGame;

  // Countdown Timer Mini-Game
  useEffect(() => {
    if (!isMiniGameOpen || reactorStatus !== "playing") return;

    const timer = setInterval(() => {
      setLevelTimer((prev) => {
        if (prev <= 1) {
          setReactorStatus("failed");
          setReactorFeedback({
            text: "⚠️ Reactor Overload! Batas waktu habis.",
            type: "error",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMiniGameOpen, reactorStatus]);

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
  const materialWallLeft = { x: 39, y: 135, w: 25, h: 130 };
  const materialWallRight = { x: 115, y: 135, w: 25, h: 130 };


  
  // Platform kecil di depan area cahaya (rak/pijakan di kiri)
  const leftShelfPlatform = { x: 43, y: 257, w: 70, h: 17 };

  // 5. Tuas/Lever Hijau (Kanan Atas) — trigger mini-game
  // Meja konsol dengan monitor hologram
  const leverTrigger = { x: 679, y: 78, w: 66, h: 50 };
  // Platform di bawah lever (meja konsol)
  const leverPlatform = { x: 672, y: 132, w: 134, h: 19 };

  // Platform tambahan di atas area kiri (lantai level 2 kiri)
  const upperLeftPlatform = { x: 215, y: 259, w: 379, h: 18 };

  // Platform tambahan di tengah area kiri (lantai level 2 kiri)
  const midLeftPlatform = { x: 651, y: 313, w: 56, h: 16 };

  // Platform tambahan di tengah area kiri (lantai level 2 kiri)
  const lowerLeftPlatform = { x: 693, y: 389, w: 102, h: 18 };

  // Dinding kanan atas (panel dinding)
  const rightWall = { x: 981, y: -3, w: 39, h: 545 };

  // ─── 5 PASANG LASER & TOMBOL / TRIGGER ───────────────────
  // Pasang 1: Pintu Laser & Tombol Lantai (Tekanan Kotak / Biru)
  const laserDoor = { x: 652, y: 412, w: 18, h: 120 };
  const floorButton = { x: 150, y: GROUND_Y - 8, w: 50, h: 8 };

  // Pasang 2: Laser & Tombol Kuning (Toggle Karakter)
  const laser2 = { x: 674, y: 234, w: 16, h: 79 };
  const button2 = { x: 913, y: 354, w: 42, h: 8 };

  // Pasang 3: Laser & Tombol Hijau (Toggle Karakter)
  const laser3 = { x: 527, y: 168, w: 16, h: 92 };
  const button3 = { x: 926, y: 531, w: 42, h: 8 };

  // Pasang 4: Laser Ungu (Arah Horizontal) — Mati setelah Baca Materi di Terminal
  const laser4 = { x: 134, y: 260, w: 85, h: 16 };

  // Pasang 5: Laser 5 (Merah Horizontal) — Mati setelah Lulus Tes 1 (PG Tunggal)
  const laser5 = { x: 548, y: 158, w: 109, h: 14 };
  // Hitbox Trigger Tes 1 (Area Tengah: X: 600 - 900)
  const tes1TriggerObj = { x: 49, y: 303, w: 45, h: 45 };

  // Pasang 6: Laser 6 (Biru Tua Vertical) — Mati setelah Lulus Tes 2 (PG Multi-Jawaban)
  const laser6 = { x: 901, y: 28, w: 13, h: 111 };
  // Hitbox Trigger Tes 2 (Area Tengah: X: 600 - 900)
  const tes2TriggerObj = { x: 233, y: 303, w: 45, h: 45 };

  // Terminal komputer (di atas upper left platform)
  const terminalObj = { x: 65, y: 200, w: 45, h: 46 };

  // Portal akhir (di pojok kanan atas, dekat lever)
  const portalObj = { x: 910, y: 44, w: 60, h: 80 };

  // 3 Platform Baru Sementara di Tengah (Bisa disesuaikan manual)
  const newPlatform1 = { x: 37, y: 359, w: 256, h: 20 };
  const newPlatform2 = { x: 615, y: 186, w: 60, h: 20 };
  const newPlatform3 = { x: 901, y: 133, w: 80, h: 20 };

  // 5 Platform Baru Berwarna Putih (newPlat 1-5, bisa disesuaikan manual)
  const newPlat1 = { x: 0, y: 0, w: 40, h: 542 };
  const newPlat2 = { x: 290, y: 276, w: 19, h: 86 };
  const newPlat3 = { x: 900, y: 361, w: 80, h: 18 };
  const newPlat4 = { x: 20, y: 394, w: 658, h: 18 };
  const newPlat5 = { x: 673, y: 173, w: 25, h: 64 };

  // 2 Platform Baru Berwarna Kuning (newp 1-2, solid 4 arah, bisa disesuaikan manual)
  const newp1 = { x: 515, y: 4, w: 42, h: 166 };
  const newp2 = { x: 651, y: 312, w: 28, h: 86 };

  // Semua platform statis untuk collision
  const allPlatforms = [
    leftShelfPlatform,
    upperLeftPlatform,
    midLeftPlatform,
    lowerLeftPlatform,
    leverPlatform,
    newPlatform1,
    newPlatform2,
    newPlatform3,
    newPlat1,
    newPlat2,
    newPlat3,
    newPlat4,
    newPlat5,
    newp1,
    newp2,
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

  // ─── REFS GAME LOOP & ANIMASI ─────────────────────────────
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: playerX, y: playerY, vy: velocityY, jumping: isJumping, canDoubleJump: false });
  const boxRef = useRef({ x: boxX, y: boxY, vy: boxVelocityY });
  const laser1ActiveRef = useRef(isLaser1Active);
  const laser2ActiveRef = useRef(isLaser2Active);
  const laser3ActiveRef = useRef(isLaser3Active);
  const laser4ActiveRef = useRef(isLaser4Active);
  const laser5ActiveRef = useRef(isLaser5Active);
  const laser6ActiveRef = useRef(isLaser6Active);

  // Ref pelacak animasi pemain (File PNG Tunggal per Frame)
  const animRef = useRef({
    action: "idle",
    frame: 1,
    lastFrameTime: 0,
    isDoubleJumping: false,
    facing: "right" as "right" | "left",
  });

  const lastBtn2StepRef = useRef(false);
  const lastBtn3StepRef = useRef(false);

  playerRef.current = { ...playerRef.current, x: playerX, y: playerY, vy: velocityY, jumping: isJumping };
  boxRef.current = { x: boxX, y: boxY, vy: boxVelocityY };
  laser1ActiveRef.current = isLaser1Active;
  laser2ActiveRef.current = isLaser2Active;
  laser3ActiveRef.current = isLaser3Active;
  laser4ActiveRef.current = isLaser4Active;
  laser5ActiveRef.current = isLaser5Active;
  laser6ActiveRef.current = isLaser6Active;

  // ─── KEYBOARD EVENTS ──────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === "e") {
        if (isNearTerminal && !showMaterial && !isMiniGameOpen && !showTes1Modal && !showTes2Modal) {
          setShowMaterial(true);
          return;
        }
        if (isNearLever && !showMaterial && !isMiniGameOpen && !showTes1Modal && !showTes2Modal) {
          openSJFGame();
          return;
        }

        // Interaksi Trigger Tes 1, Tes 2
        if (isNearTes1 && !showTes1Modal) {
          setShowTes1Modal(true);
          return;
        }
        if (isNearTes2 && !showTes2Modal) {
          setShowTes2Modal(true);
          return;
        }

        // Interaksi 'E' untuk Toggle Tombol 2, 3 jika pemain berada dekat tombol
        const p = playerRef.current;
        const isNearBtn = (btn: { x: number; y: number; w: number; h: number }) =>
          Math.abs(p.x + PLAYER_W / 2 - (btn.x + btn.w / 2)) < 45 &&
          Math.abs(p.y + PLAYER_H / 2 - (btn.y + btn.h / 2)) < 45;

        if (isNearBtn(button2)) {
          const nextVal = !laser2ActiveRef.current;
          laser2ActiveRef.current = nextVal;
          setIsLaser2Active(nextVal);
          return;
        }
        if (isNearBtn(button3)) {
          const nextVal = !laser3ActiveRef.current;
          laser3ActiveRef.current = nextVal;
          setIsLaser3Active(nextVal);
          return;
        }
      }

      if (key === "escape") {
        if (showMaterial) {
          setShowMaterial(false);
        }
        if (cpuExecutionTimerRef.current) {
          clearInterval(cpuExecutionTimerRef.current);
          cpuExecutionTimerRef.current = null;
        }
        setIsCpuBusy(false);
        setActiveCoreProcess(null);
        setIsMiniGameOpen(false);
        setShowTes1Modal(false);
        setShowTes2Modal(false);
        return;
      }

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        e.preventDefault();
      }

      // Handler Lompatan (Lompatan Pertama & Double Jump)
      if (key === "w" || key === "arrowup" || key === " ") {
        if (!showMaterial && !isMiniGameOpen && !showTes1Modal && !showTes2Modal) {
          const p = playerRef.current;
          if (!p.jumping) {
            // Kondisi 1: Lompatan Pertama dari tanah/platform
            p.vy = JUMP_POWER;
            p.jumping = true;
            p.canDoubleJump = true;
            animRef.current.isDoubleJumping = false;
          } else if (p.canDoubleJump) {
            // Kondisi 2: Double Jump saat di udara
            p.vy = DOUBLE_JUMP_POWER;
            p.canDoubleJump = false;
            animRef.current.isDoubleJumping = true;
          }
        }
      }

      if (key === "a" || key === "arrowleft") {
        setFacingLeft(true);
        setFacingRight(false);
        setIsWalking(true);
        animRef.current.facing = "left";
      } else if (key === "d" || key === "arrowright") {
        setFacingLeft(false);
        setFacingRight(true);
        setIsWalking(true);
        animRef.current.facing = "right";
      }

      keysPressed.current.add(key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);

      const stillHasA = keysPressed.current.has("a") || keysPressed.current.has("arrowleft");
      const stillHasD = keysPressed.current.has("d") || keysPressed.current.has("arrowright");

      if (stillHasA) {
        setFacingLeft(true);
        setFacingRight(false);
        setIsWalking(true);
        animRef.current.facing = "left";
      } else if (stillHasD) {
        setFacingLeft(false);
        setFacingRight(true);
        setIsWalking(true);
        animRef.current.facing = "right";
      } else if (key === "a" || key === "arrowleft" || key === "d" || key === "arrowright") {
        setIsWalking(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isNearTerminal, isNearLever, showMaterial, isMiniGameOpen, isNearTes1, isNearTes2, showTes1Modal, showTes2Modal]);

  // ─── GAME LOOP ─────────────────────────────────────────────
  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      if (!showMaterial && !isMiniGameOpen && !showTes1Modal && !showTes2Modal) {
        const p = { ...playerRef.current };
        const b = { ...boxRef.current };
        const keys = keysPressed.current;

        // 1. GERAKAN HORIZONTAL
        let moveX = 0;
        if (keys.has("a") || keys.has("arrowleft")) {
          moveX -= MOVE_SPEED;
          setFacingLeft(true);
          setFacingRight(false);
          animRef.current.facing = "left";
        }
        if (keys.has("d") || keys.has("arrowright")) {
          moveX += MOVE_SPEED;
          setFacingLeft(false);
          setFacingRight(true);
          animRef.current.facing = "right";
        }

        setIsWalking(moveX !== 0);

        // 2. LOMPAT
        // Catatan: Inisiasi lompatan & double jump ditangani di event listener onKeyDown agar single-press per lompatan
        const wantsJump = keys.has("w") || keys.has("arrowup") || keys.has(" ");
        if (wantsJump && !p.jumping) {
          p.vy = JUMP_POWER;
          p.jumping = true;
          p.canDoubleJump = true;
          animRef.current.isDoubleJumping = false;
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
          p.canDoubleJump = false;
          animRef.current.isDoubleJumping = false;
        }

        if (b.y + BOX_H >= GROUND_Y) {
          b.y = GROUND_Y - BOX_H;
          b.vy = 0;
        }

        // 5. TABRAKAN VERTIKAL PLATFORM (Atas & Bawah)
        let nextPlayerX = p.x + moveX;

        for (const plat of allPlatforms) {
          // Lewati platform kontainer besi & tanjakan tuas untuk pendaratan atas karena ditangani secara terpadu oleh Ramp Zone
          const isRampPlat =
            plat === upperLeftPlatform ||
            plat === midLeftPlatform ||
            plat === newPlatform2 ||
            plat === newPlat5;

          const horizontallyOver =
            p.x + PLAYER_W > plat.x + 3 &&
            p.x < plat.x + plat.w - 3;

          if (!horizontallyOver) continue;

          // A. Pijakan / Mendarat dari ATAS
          if (!isRampPlat && p.vy >= 0) {
            const footY = p.y + PLAYER_H;
            const prevFootY = footY - p.vy;
            if (footY >= plat.y && prevFootY <= plat.y + 14) {
              p.y = plat.y - PLAYER_H;
              p.vy = 0;
              p.jumping = false;
              p.canDoubleJump = false;
              animRef.current.isDoubleJumping = false;
            }
          }

          // B. Membentur dari BAWAH (Langit-langit Platform)
          // Platform lereng/ramp atau pijakan tuas tidak membentur dari bawah
          if (
            p.vy < 0 &&
            plat !== lowerLeftPlatform &&
            plat !== upperLeftPlatform &&
            plat !== newPlatform2 &&
            plat !== leverPlatform &&
            plat !== newPlat5
          ) {
            const headY = p.y;
            const prevHeadY = headY - p.vy;
            const platBottom = plat.y + plat.h;
            if (headY <= platBottom && prevHeadY >= platBottom - 14) {
              p.y = platBottom;
              p.vy = 0;
            }
          }
        }

        // ─── DOUBLE RAMP ZONE & PIJAKAN KONTAINER BESI ─────────────
        // Menggunakan titik tumpu kaki karakter (charFootX) agar lereng presisi dengan batas visual
        // 1. Pijakan Atas (Datar):         charFootX <= 601          (top: upperLeftPlatform.y = 265)
        // 2. Ramp Zone 2 (Tengah ke Atas): charFootX: 601 s.d 651    (lerp upperLeftPlatform.y ke 313)
        // 3. Pijakan Tengah (Datar):       charFootX: 651 s.d 707    (top: 313)
        // 4. Ramp Zone 1 (Bawah ke Tengah): charFootX: 707 s.d 785   (lerp 313 ke 389)
        // 5. Pijakan Bawah (Datar):        charFootX: 785 s.d 800    (top: 389)
        let containerGroundY: number | null = null;
        const charFootX = nextPlayerX + PLAYER_W * 0.5;

        const upperPlatRightX = upperLeftPlatform.x + upperLeftPlatform.w; // 601
        const upperPlatY = upperLeftPlatform.y; // 265

        if (charFootX >= upperLeftPlatform.x && charFootX <= upperPlatRightX) {
          // Pijakan Atas (Datar) pas dengan permukaan UPPER LEFT PLATFORM
          containerGroundY = upperPlatY;
        } else if (charFootX > upperPlatRightX && charFootX < 651) {
          // Ramp Zone 2 (Dari Tengah ke Atas: lerp batas kanan UPPER LEFT PLATFORM ke 313px)
          const t2 = (charFootX - upperPlatRightX) / (651 - upperPlatRightX);
          containerGroundY = upperPlatY + t2 * (313 - upperPlatY);
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
            // Berjalan menanjak/menurun mulus (toleransi 24px agar menyerap kemiringan lereng tanpa terlepas)
            if (Math.abs(footY - containerGroundY) <= 24) {
              p.y = containerGroundY - PLAYER_H;
              p.vy = 0;
              p.canDoubleJump = false;
              animRef.current.isDoubleJumping = false;
            }
          } else if (p.vy >= 0) {
            // Mendarat saat jatuh dari lompatan ke kontainer
            if (footY >= containerGroundY && prevFootY <= containerGroundY + Math.max(16, p.vy + 4)) {
              p.y = containerGroundY - PLAYER_H;
              p.vy = 0;
              p.jumping = false;
              p.canDoubleJump = false;
              animRef.current.isDoubleJumping = false;
            }
          }
        }

        // ─── RAMP ZONE BARU (NEW_PLAT_2 ➔ LEVER_PLAT) ─────────────
        // Titik A: sisi paling kiri NEW_PLAT_2 (X & Y)
        const rampA_X = newPlatform2.x;
        const rampA_Y = newPlatform2.y;

        // Titik B: ujung LEVER_PLAT yang mengarah ke NEW_PLAT_2 (X & Y)
        const rampB_X = newPlatform2.x < leverPlatform.x ? leverPlatform.x : leverPlatform.x + leverPlatform.w;
        const rampB_Y = leverPlatform.y;

        const rampStartX = Math.min(rampA_X, rampB_X);
        const rampEndX = Math.max(rampA_X, rampB_X);

        if (charFootX >= rampStartX && charFootX <= rampEndX && rampEndX > rampStartX) {
          // Interpolasi Linear (Lerp) antara Titik A dan Titik B
          const t = (charFootX - rampA_X) / (rampB_X - rampA_X);
          const leverRampGroundY = rampA_Y + t * (rampB_Y - rampA_Y);

          const footY = p.y + PLAYER_H;
          const prevFootY = footY - p.vy;

          if (!p.jumping) {
            // Berjalan menanjak/menurun mulus tanpa melompat (toleransi 26px untuk menyerap sudut lereng curam)
            if (Math.abs(footY - leverRampGroundY) <= 26) {
              p.y = leverRampGroundY - PLAYER_H;
              p.vy = 0;
              p.canDoubleJump = false;
              animRef.current.isDoubleJumping = false;
            }
          } else if (p.vy >= 0) {
            // Mendarat saat jatuh dari lompatan ke tanjakan
            if (footY >= leverRampGroundY && prevFootY <= leverRampGroundY + Math.max(16, p.vy + 4)) {
              p.y = leverRampGroundY - PLAYER_H;
              p.vy = 0;
              p.jumping = false;
              p.canDoubleJump = false;
              animRef.current.isDoubleJumping = false;
            }
          }
        }

        
        // 6. TABRAKAN HORIZONTAL (Dinding Statis & Sisi Kiri/Kanan Platform)
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

        // Tabrakan sisi kiri & kanan platform (solid horizontal)
        for (const plat of allPlatforms) {
          // Lewati platform kontainer lereng/ramp, leverPlatform, serta newPlatform2 dan newPlat5
          // agar pergerakan karakter saat menanjak/menurun berjalan mulus tanpa terbentur dinding samping
          if (
            plat === upperLeftPlatform ||
            plat === midLeftPlatform ||
            plat === lowerLeftPlatform ||
            plat === newPlatform2 ||
            plat === leverPlatform ||
            plat === newPlat5
          ) {
            continue;
          }

          const inYRange = p.y + PLAYER_H > plat.y + 4 && p.y < plat.y + plat.h - 4;
          if (inYRange) {
            // Menabrak sisi KIRI platform (bergerak ke kanan)
            if (p.x + PLAYER_W <= plat.x + 6 && nextPlayerX + PLAYER_W > plat.x) {
              nextPlayerX = plat.x - PLAYER_W;
            }
            // Menabrak sisi KANAN platform (bergerak ke kiri)
            else if (p.x >= plat.x + plat.w - 6 && nextPlayerX < plat.x + plat.w) {
              nextPlayerX = plat.x + plat.w;
            }
            // Koreksi pencegahan overlap jika berada di dalam hitbox
            else if (nextPlayerX + PLAYER_W > plat.x && nextPlayerX < plat.x + plat.w) {
              const toLeft = (nextPlayerX + PLAYER_W) - plat.x;
              const toRight = (plat.x + plat.w) - nextPlayerX;
              if (toLeft < toRight) {
                nextPlayerX = plat.x - PLAYER_W;
              } else {
                nextPlayerX = plat.x + plat.w;
              }
            }
          }
        }

        // 7. TABRAKAN SISTEM LASER (6 PASANG / RINTANGAN)
        const allLaserObstacles = [
          { id: 1, ...laserDoor, active: laser1ActiveRef.current, isHorizontal: false },
          { id: 2, ...laser2, active: laser2ActiveRef.current, isHorizontal: false },
          { id: 3, ...laser3, active: laser3ActiveRef.current, isHorizontal: false },
          { id: 4, ...laser4, active: laser4ActiveRef.current, isHorizontal: true },
          { id: 5, ...laser5, active: laser5ActiveRef.current, isHorizontal: true },
          { id: 6, ...laser6, active: laser6ActiveRef.current, isHorizontal: false },
        ];

        for (const laser of allLaserObstacles) {
          if (!laser.active) continue;

          // A. Barrier Collision (Karakter tidak bisa lewat menembus laser)
          const inLaserYRange = p.y + PLAYER_H > laser.y && p.y < laser.y + laser.h;
          if (inLaserYRange) {
            if (p.x + PLAYER_W <= laser.x && nextPlayerX + PLAYER_W > laser.x) {
              nextPlayerX = laser.x - PLAYER_W;
            } else if (p.x >= laser.x + laser.w && nextPlayerX < laser.x + laser.w) {
              nextPlayerX = laser.x + laser.w;
            }
          }

          // B. Jika menyentuh langsung koordinat laser aktif (mati & kembali ke spawn)
          const isTouchingActiveLaser =
            nextPlayerX + PLAYER_W > laser.x + 2 &&
            nextPlayerX < laser.x + laser.w - 2 &&
            p.y + PLAYER_H > laser.y + 2 &&
            p.y < laser.y + laser.h - 2;

          if (isTouchingActiveLaser) {
            nextPlayerX = 60;
            p.y = GROUND_Y - PLAYER_H;
            p.vy = 0;
            p.jumping = false;
            p.canDoubleJump = false;
            animRef.current.isDoubleJumping = false;
          }

          // Kotak kargo juga tidak bisa menembus Laser 1
          if (laser.id === 1 && b.y + BOX_H > laserDoor.y && b.y < laserDoor.y + laserDoor.h) {
            if (b.x < laserDoor.x + laserDoor.w && b.x + BOX_W > laserDoor.x) {
              if (b.x + BOX_W / 2 < laserDoor.x + laserDoor.w / 2) {
                b.x = laserDoor.x - BOX_W;
              } else {
                b.x = laserDoor.x + laserDoor.w;
              }
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
            let maxAllowedBoxX = GAME_WIDTH - BOX_W - 10;
            // Jika Laser 1 aktif dan kotak berada di sisi kiri laser, batas kanan adalah Laser 1
            if (laser1ActiveRef.current && b.x + BOX_W <= laserDoor.x + 4) {
              maxAllowedBoxX = Math.min(maxAllowedBoxX, laserDoor.x - BOX_W);
            }
            if (newBoxX <= maxAllowedBoxX) {
              b.x = newBoxX;
              p.x = b.x - PLAYER_W;
            } else {
              b.x = maxAllowedBoxX;
              p.x = b.x - PLAYER_W;
            }
          } else if (moveX < 0) {
            const pushDist = b.x + BOX_W - nextPlayerX;
            const newBoxX = b.x - pushDist;
            let minAllowedBoxX = 10;
            // Jika Laser 1 aktif dan kotak berada di sisi kanan laser, batas kiri adalah Laser 1
            if (laser1ActiveRef.current && b.x >= laserDoor.x + laserDoor.w - 4) {
              minAllowedBoxX = laserDoor.x + laserDoor.w;
            }
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
          p.canDoubleJump = false;
          animRef.current.isDoubleJumping = false;
        }

        // 9. DETEKSI TOMBOL 1 S/D 4
        // Tombol 1: Tekanan Kotak Kargo (AABB Collision antara Box & Button 1)
        const isBoxOnBtn1 =
          b.x + BOX_W > floorButton.x &&
          b.x < floorButton.x + floorButton.w &&
          b.y + BOX_H >= floorButton.y &&
          b.y <= floorButton.y + floorButton.h + 16;

        const shouldLaser1Active = !isBoxOnBtn1;
        if (laser1ActiveRef.current !== shouldLaser1Active) {
          laser1ActiveRef.current = shouldLaser1Active;
          setIsLaser1Active(shouldLaser1Active);
        }

        // Tombol 2, 3, 4: Toggle Normal oleh Karakter saat menginjak
        const checkPlayerStepBtn = (btn: { x: number; y: number; w: number; h: number }) =>
          p.x + PLAYER_W > btn.x &&
          p.x < btn.x + btn.w &&
          p.y + PLAYER_H >= btn.y &&
          p.y + PLAYER_H <= btn.y + btn.h + 12;

        const onBtn2 = checkPlayerStepBtn(button2);
        if (onBtn2 && !lastBtn2StepRef.current) {
          const nextVal = !laser2ActiveRef.current;
          laser2ActiveRef.current = nextVal;
          setIsLaser2Active(nextVal);
        }
        lastBtn2StepRef.current = onBtn2;

        const onBtn3 = checkPlayerStepBtn(button3);
        if (onBtn3 && !lastBtn3StepRef.current) {
          const nextVal = !laser3ActiveRef.current;
          laser3ActiveRef.current = nextVal;
          setIsLaser3Active(nextVal);
        }
        lastBtn3StepRef.current = onBtn3;

        // 9. CEK KEDEKATAN HITBOX TES 1 & TES 2
        const checkNearObj = (obj: { x: number; y: number; w: number; h: number }, threshold = 55) => {
          const dx = Math.abs(p.x + PLAYER_W / 2 - (obj.x + obj.w / 2));
          const dy = Math.abs(p.y + PLAYER_H / 2 - (obj.y + obj.h / 2));
          return dx < threshold && dy < threshold;
        };

        setIsNearTes1(checkNearObj(tes1TriggerObj, 50));
        setIsNearTes2(checkNearObj(tes2TriggerObj, 50));

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
          if (isPortalActive) {
            router.push("/stage/stage2");
          }
        }

        // UPDATE STATES
        setPlayerX(p.x);
        setPlayerY(p.y);
        setVelocityY(p.vy);
        setIsJumping(p.jumping);

        setBoxX(b.x);
        setBoxY(b.y);
        setBoxVelocityY(b.vy);

        // ─── STATE MACHINE ANIMASI SPRITE (astron.png 6x4 Grid) ──
        const ar = animRef.current;
        const now = performance.now();
        const isAirborne = p.jumping || Math.abs(p.vy) > 0.05;
        const isFacingLeft = ar.facing === "left";
        const walking = moveX !== 0;

        let nextSprite = "/idle.png";

        // PRIORITAS 1 - MELOMPAT / DI UDARA (!isGrounded)
        if (isAirborne) {
          const isDoubleJump = ar.isDoubleJumping || (!p.canDoubleJump && p.jumping);
          if (isDoubleJump) {
            // Animasi bergantian antara /jetpack-1.png dan /jetpack-2.png saat double jump
            if (ar.action !== "jetpack") {
              ar.action = "jetpack";
              ar.frame = 1;
              ar.lastFrameTime = now;
            } else if (now - ar.lastFrameTime >= 100) {
              ar.frame = ar.frame === 1 ? 2 : 1;
              ar.lastFrameTime = now;
            }
            nextSprite = `/jetpack-${ar.frame}.png`;
          } else {
            // Lompat pertama biasa: /jump-1.png
            ar.action = "jump";
            ar.frame = 1;
            nextSprite = "/jump-1.png";
          }
        }
        // PRIORITAS 2 - BERJALAN KE KANAN (isWalking && !facingLeft)
        else if (walking && !isFacingLeft) {
          if (ar.action !== "walk_r") {
            ar.action = "walk_r";
            ar.frame = 1;
            ar.lastFrameTime = now;
          } else if (now - ar.lastFrameTime >= 120) {
            ar.frame = (ar.frame % 6) + 1; // 1 s.d. 6
            ar.lastFrameTime = now;
          }
          nextSprite = `/walk-r-${ar.frame}.png`;
        }
        // PRIORITAS 3 - BERJALAN KE KIRI (isWalking && facingLeft)
        else if (walking && isFacingLeft) {
          if (ar.action !== "walk_l") {
            ar.action = "walk_l";
            ar.frame = 1;
            ar.lastFrameTime = now;
          } else if (now - ar.lastFrameTime >= 120) {
            ar.frame = (ar.frame % 6) + 1; // 1 s.d. 6
            ar.lastFrameTime = now;
          }
          nextSprite = `/walk-l-${ar.frame}.png`;
        }
        // PRIORITAS 4 - DIAM / IDLE (!isWalking && isGrounded)
        else {
          ar.action = "idle";
          ar.frame = 0;
          nextSprite = "/idle.png";
        }

        setPlayerSprite(nextSprite);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [showMaterial, isMiniGameOpen, isPortalActive, showTes1Modal, showTes2Modal]);

  // ─── KUIS DATA & HANDLERS ─────────────────────────────────
  // ─── DATA KUIS SJF (TRIGGER 2 / MATERI 2) ──────────────────
  const sjfQuestions = [
    {
      id: 1,
      question: "Kriteria utama apa yang digunakan algoritma Shortest Job First (SJF) dalam memilih proses berikutnya untuk dieksekusi CPU?",
      options: [
        "A. Proses yang pertama kali masuk ke Ready Queue",
        "B. Proses dengan waktu eksekusi (Burst Time) paling singkat",
        "C. Proses dengan ukuran memori paling besar",
        "D. Proses yang memiliki nilai Time Quantum terbesar",
      ],
      correct: 1,
    },
    {
      id: 2,
      question: "Apa kelemahan utama dari algoritma SJF apabila proses-proses dengan Burst Time pendek terus berdatangan tanpa henti?",
      options: [
        "A. Terjadinya Convoy Effect pada proses kecil",
        "B. Proses dengan Burst Time panjang berisiko mengalami Starvation (tertunda terus-menerus)",
        "C. CPU menjadi diam (idle) meskipun antrean penuh",
        "D. Average Waiting Time menjadi paling tinggi dibanding semua algoritma lain",
      ],
      correct: 1,
    },
    {
      id: 3,
      question: "Jika 4 proses tiba bersamaan pada 0 ms dengan Burst Time: P1 = 6 ms, P2 = 8 ms, P3 = 7 ms, dan P4 = 3 ms, bagaimanakah urutan eksekusi yang benar pada SJF Non-Preemptive?",
      options: [
        "A. P1 -> P2 -> P3 -> P4",
        "B. P2 -> P3 -> P1 -> P4",
        "C. P4 -> P1 -> P3 -> P2",
        "D. P4 -> P3 -> P2 -> P1",
      ],
      correct: 2,
    },
  ];

  // ─── DATA KUIS ROUND ROBIN (TRIGGER 3 / MATERI 3) ─────────
  const rrQuestions = [
    {
      id: 1,
      question: "Apa yang terjadi jika sebuah proses pada algoritma Round Robin belum selesai dieksekusi setelah jatah Time Quantum (q) miliknya habis?",
      options: [
        "A. Proses langsung dihapus dari memori dan dianggap gagal",
        "B. Proses tetap melanjutkan eksekusinya sampai selesai tanpa jeda",
        "C. Proses dihentikan sementara (preempted) dan dikembalikan ke belakang Ready Queue",
        "D. Nilai Time Quantum otomatis diperbesar untuk proses tersebut",
      ],
      correct: 2,
    },
    {
      id: 2,
      question: "Apa dampak yang terjadi jika ukuran Time Quantum (q) pada algoritma Round Robin diatur terlalu kecil?",
      options: [
        "A. Round Robin akan berubah menjadi identik dengan algoritma FCFS",
        "B. Terlalu sering terjadi Context Switch yang meningkatkan overhead dan menurunkan efisiensi CPU",
        "C. Proses dengan Burst Time pendek akan mengalami Starvation",
        "D. CPU tidak dapat menjalankan lebih dari dua proses secara bergantian",
      ],
      correct: 1,
    },
    {
      id: 3,
      question: "Diketahui Time Quantum q = 4 ms dengan 3 proses tiba bersamaan di 0 ms: P1 (Burst Time 24 ms), P2 (3 ms), dan P3 (3 ms). Pada milidetik ke berapa proses P3 selesai dieksekusi?",
      options: [
        "A. 7 ms",
        "B. 10 ms",
        "C. 12 ms",
        "D. 30 ms",
      ],
      correct: 1,
    },
  ];

  // ─── DATA KUIS FCFS (TERMINAL 1) ──────────────────────────
  const fcfsQuestions = [
    {
      id: 1,
      question: "Bagaimana cara kerja utama algoritma penjadwalan First-Come, First-Served (FCFS)?",
      options: [
        "A. Mendahulukan proses dengan waktu eksekusi tersingkat",
        "B. Mengeksekusi proses berdasarkan urutan kedatangannya di antrean",
        "C. Membagi jatah waktu (kwanta) yang sama secara bergilir",
        "D. Menghentikan proses yang sedang berjalan jika ada proses baru masuk",
      ],
      correct: 1,
    },
    {
      id: 2,
      question: "FCFS termasuk ke dalam strategi penjadwalan Non-Preemptive. Apa maksud dari sifat tersebut?",
      options: [
        "A. Proses yang sedang berjalan tidak dapat dihentikan CPU sampai selesai",
        "B. CPU bebas memotong proses kapan saja demi efisiensi",
        "C. Setiap proses wajib memiliki burst time yang sama",
        "D. Proses dengan prioritas rendah akan langsung dihapus dari memori",
      ],
      correct: 0,
    },
    {
      id: 3,
      question: "Jika urutan kedatangan adalah P1 (Burst Time 24 ms), P2 (3 ms), dan P3 (3 ms), berapa Waiting Time yang dialami oleh P2?",
      options: [
        "A. 0 ms",
        "B. 3 ms",
        "C. 24 ms",
        "D. 27 ms",
      ],
      correct: 2,
    },
  ];

  const isFcfsQuizAllCorrect = fcfsQuestions.every((q, idx) => fcfsQuizAnswers[idx] === q.correct);

  const handleSelectFcfsQuiz = (qIdx: number, optIdx: number) => {
    setFcfsQuizAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  };

  const handleCompleteFcfsMateri = () => {
    if (!isFcfsQuizAllCorrect && !isMateriRead) return;
    setIsMateriRead(true);
    setIsLaser4Active(false);
    laser4ActiveRef.current = false;
    setShowMaterial(false);
  };

  const handleCloseTerminalMaterial = () => {
    setShowMaterial(false);
  };

  const isSjfQuizAllCorrect = sjfQuestions.every((q, idx) => sjfQuizAnswers[idx] === q.correct);

  const handleSelectSjfQuiz = (qIdx: number, optIdx: number) => {
    setSjfQuizAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  };

  const handleCompleteSjfMateri = () => {
    if (!isSjfQuizAllCorrect && !isTes1Done) return;
    setIsTes1Done(true);
    setIsLaser5Active(false);
    laser5ActiveRef.current = false;
    setShowTes1Modal(false);
  };

  const handleCloseTes1Modal = () => {
    setShowTes1Modal(false);
  };

  const isRrQuizAllCorrect = rrQuestions.every((q, idx) => rrQuizAnswers[idx] === q.correct);

  const handleSelectRrQuiz = (qIdx: number, optIdx: number) => {
    setRrQuizAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  };

  const handleCompleteRrMateri = () => {
    if (!isRrQuizAllCorrect && !isTes2Done) return;
    setIsTes2Done(true);
    setIsLaser6Active(false);
    laser6ActiveRef.current = false;
    setShowTes2Modal(false);
  };

  const handleCloseTes2Modal = () => {
    setShowTes2Modal(false);
  };

  // ─── LOGIKA ALIEN REACTOR POWER DISTRIBUTOR ───────────────
  const handleCloseReactorModal = () => {
    if (cpuExecutionTimerRef.current) {
      clearInterval(cpuExecutionTimerRef.current);
      cpuExecutionTimerRef.current = null;
    }
    setIsCpuBusy(false);
    setActiveCoreProcess(null);
    setIsMiniGameOpen(false);
  };

  const handleSelectProcess = (proc: ReactorProcess) => {
    if (isCpuBusy || reactorStatus !== "playing") return;

    if (reactorLevel === 1) {
      // FCFS: Wajib pilih Arrival Time paling kecil
      const minArrival = Math.min(...readyQueue.map((p) => p.arrivalTime));
      if (proc.arrivalTime !== minArrival) {
        setReactorFeedback({
          text: "⚠️ Error: FCFS wajib mendahulukan proses dengan Arrival Time paling awal!",
          type: "error",
        });
        setLevelTimer((t) => Math.max(0, t - 3));
        return;
      }
    } else if (reactorLevel === 2) {
      // SJF: Wajib pilih Burst Time terkecil
      const minBurst = Math.min(...readyQueue.map((p) => p.remainingTime));
      if (proc.remainingTime !== minBurst) {
        setReactorFeedback({
          text: "⚠️ Error: SJF wajib mendahulukan Burst Time terkecil!",
          type: "error",
        });
        setLevelTimer((t) => Math.max(0, t - 3));
        return;
      }
    } else if (reactorLevel === 3) {
      // Round Robin: Wajib pilih proses paling depan di Ready Queue
      if (proc.id !== readyQueue[0]?.id) {
        setReactorFeedback({
          text: "⚠️ Error: Ikuti urutan antrean Round Robin dari depan!",
          type: "error",
        });
        setLevelTimer((t) => Math.max(0, t - 3));
        return;
      }
    }

    // Pilihan valid! Mulai simulasi eksekusi CPU Core
    const allocTime = reactorLevel === 3 ? Math.min(proc.remainingTime, 2) : proc.remainingTime;
    setIsCpuBusy(true);
    setActiveCoreProcess({ ...proc, allocTime });
    setExecutionProgress(0);
    setReactorFeedback({
      text: `⚡ Mengalokasikan ${proc.id} (${allocTime}s) ke CPU Core...`,
      type: "success",
    });

    const stepMs = 30;
    const totalMs = allocTime * 450; // 450ms per detik burst time
    let elapsed = 0;

    if (cpuExecutionTimerRef.current) {
      clearInterval(cpuExecutionTimerRef.current);
    }

    cpuExecutionTimerRef.current = setInterval(() => {
      elapsed += stepMs;
      const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));
      setExecutionProgress(pct);

      if (elapsed >= totalMs) {
        if (cpuExecutionTimerRef.current) {
          clearInterval(cpuExecutionTimerRef.current);
          cpuExecutionTimerRef.current = null;
        }

        // Simpan log ke Gantt History
        setGanttHistory((prev) => {
          const currentTotal = prev.reduce((sum, item) => sum + item.duration, 0);
          return [
            ...prev,
            {
              id: proc.id,
              name: proc.name,
              start: currentTotal,
              duration: allocTime,
              ganttBg: proc.ganttBg,
            },
          ];
        });

        const newRemaining = proc.remainingTime - allocTime;

        if (newRemaining <= 0) {
          // Proses tuntas
          setReadyQueue((prev) => {
            const nextQ = prev.filter((p) => p.id !== proc.id);
            if (nextQ.length === 0) {
              if (reactorLevel < 3) {
                setReactorStatus("won_level");
                setReactorFeedback({
                  text: `🎉 Level ${reactorLevel} Selesai! Klik tombol untuk lanjut ke Level berikutnya.`,
                  type: "success",
                });
              } else {
                setReactorStatus("victory");
                setIsPortalActive(true);
                setReactorFeedback({
                  text: "🌟 Reaktor Stabil! Semua level berhasil diselesaikan. Portal Stage 2 kini terbuka!",
                  type: "success",
                });
              }
            } else {
              setReactorFeedback({
                text: `✓ ${proc.id} selesai dieksekusi!`,
                type: "info",
              });
            }
            return nextQ;
          });
        } else {
          // Round Robin: sisa > 0, putar ke belakang antrean
          setReadyQueue((prev) => {
            const rest = prev.filter((p) => p.id !== proc.id);
            const updated = { ...proc, remainingTime: newRemaining };
            return [...rest, updated];
          });
          setReactorFeedback({
            text: `🔄 ${proc.id} quantum 2s habis (sisa ${newRemaining}s) ➔ kembali ke antrean belakang.`,
            type: "info",
          });
        }

        setActiveCoreProcess(null);
        setIsCpuBusy(false);
        setExecutionProgress(0);
      }
    }, stepMs);
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
        <div className="flex items-center gap-2 text-[10px]">
          <span>
            <strong className="text-white">A/D</strong>: Jalan • <strong className="text-white">W/Spasi</strong>: Lompat • <strong className="text-white">E</strong>: Tombol
          </span>
          <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${!isLaser1Active ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "bg-cyan-950/60 text-cyan-400 border border-cyan-400/30 animate-pulse"}`}>
            L1 (KOTAK): {isLaser1Active ? "ON" : "OFF"}
          </span>
          <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${!isLaser2Active ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" : "bg-yellow-950/60 text-yellow-400 border border-yellow-400/30 animate-pulse"}`}>
            L2 (KNG): {isLaser2Active ? "ON" : "OFF"}
          </span>
          <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${!isLaser3Active ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-emerald-950/60 text-emerald-400 border border-emerald-400/30 animate-pulse"}`}>
            L3 (HJU): {isLaser3Active ? "ON" : "OFF"}
          </span>
          <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${!isLaser4Active ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "bg-purple-950/60 text-purple-400 border border-purple-400/30 animate-pulse"}`}>
            L4 (UNG-H): {isLaser4Active ? "ON" : "OFF"}
          </span>
          <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${!isLaser5Active ? "bg-red-500/20 text-red-300 border border-red-500/40" : "bg-red-950/60 text-red-400 border border-red-400/30 animate-pulse"}`}>
            L5 (MRH-H): {isLaser5Active ? "ON" : "OFF"}
          </span>
          <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${!isLaser6Active ? "bg-blue-600/20 text-blue-300 border border-blue-500/40" : "bg-blue-950/60 text-blue-400 border border-blue-400/30 animate-pulse"}`}>
            L6 (BRU-V): {isLaser6Active ? "ON" : "OFF"}
          </span>
          <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${isPortalActive ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "bg-purple-500/20 text-purple-300 border border-purple-500/40"}`}>
            {isPortalActive ? "PORTAL: ON" : "PORTAL: LOCK"}
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
          className="absolute left-0 right-0 border-t border-dashed border-emerald-400/50 pointer-events-none z-10 opacity-0"
          style={{ top: `${GROUND_Y}px` }}
        >
          <span className="absolute left-2 -top-4 text-[9px] font-mono text-emerald-400 bg-black/60 px-1 rounded">
            Ground (y: {GROUND_Y})
          </span>
        </div>

        {/* ─── 1. LANTAI DASAR (Ground) ──────────────────────── */}
        <div
          className="absolute bg-green-500/30 border-t-2 border-green-400 pointer-events-none z-10 opacity-0"
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
          className="absolute bg-yellow-500/40 border-2 border-yellow-400 pointer-events-none z-10 flex items-center justify-center opacity-0"
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

        {/* ─── PLATFORM SEMENTARA BARU (TENGAH) ───────────── */}
        <div
          className="absolute bg-cyan-900/40 border border-cyan-400 pointer-events-none z-10 flex items-center justify-center rounded opacity-0"
          style={{
            left: `${newPlatform1.x}px`,
            top: `${newPlatform1.y}px`,
            width: `${newPlatform1.w}px`,
            height: `${newPlatform1.h}px`,
          }}
        >
          <span className="text-[7px] font-mono text-cyan-200 bg-black/60 px-1 rounded">
            NEW_PLAT_1
          </span>
        </div>

        <div
          className="absolute bg-cyan-900/40 border border-cyan-400 pointer-events-none z-10 flex items-center justify-center rounded opacity-0"
          style={{
            left: `${newPlatform2.x}px`,
            top: `${newPlatform2.y}px`,
            width: `${newPlatform2.w}px`,
            height: `${newPlatform2.h}px`,
          }}
        >
          <span className="text-[7px] font-mono text-cyan-200 bg-black/60 px-1 rounded">
            NEW_PLAT_2
          </span>
        </div>

        <div
          className="absolute bg-cyan-900/40 border border-cyan-400 pointer-events-none z-10 flex items-center justify-center rounded opacity-0"
          style={{
            left: `${newPlatform3.x}px`,
            top: `${newPlatform3.y}px`,
            width: `${newPlatform3.w}px`,
            height: `${newPlatform3.h}px`,
          }}
        >
          <span className="text-[7px] font-mono text-cyan-200 bg-black/60 px-1 rounded">
            NEW_PLAT_3
          </span>
        </div>

        {/* ─── 5 PLATFORM PUTIH BARU (newPlat 1-5) ───────────── */}
        {[
          { plat: newPlat1, name: "newPlat 1" },
          { plat: newPlat2, name: "newPlat 2" },
          { plat: newPlat3, name: "newPlat 3" },
          { plat: newPlat4, name: "newPlat 4" },
          { plat: newPlat5, name: "newPlat 5" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="absolute bg-white/40 border-2 border-white pointer-events-none z-10 flex items-center justify-center rounded shadow-[0_0_12px_rgba(255,255,255,0.6)] opacity-0"
            style={{
              left: `${item.plat.x}px`,
              top: `${item.plat.y}px`,
              width: `${item.plat.w}px`,
              height: `${item.plat.h}px`,
            }}
          >
            <span className="text-[8px] font-mono font-bold text-white bg-black/80 px-1 py-0.5 rounded shadow">
              {item.name}
            </span>
          </div>
        ))}

        {/* ─── 2 PLATFORM KUNING BARU (newp 1-2, SOLID 4 ARAH) ─── */}
        {[
          { plat: newp1, name: "newp 1" },
          { plat: newp2, name: "newp 2" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="absolute bg-yellow-500/40 border-2 border-yellow-400 pointer-events-none z-10 flex items-center justify-center rounded shadow-[0_0_12px_rgba(234,179,8,0.6)] opacity-0"
            style={{
              left: `${item.plat.x}px`,
              top: `${item.plat.y}px`,
              width: `${item.plat.w}px`,
              height: `${item.plat.h}px`,
            }}
          >
            <span className="text-[8px] font-mono font-bold text-yellow-100 bg-black/80 px-1 py-0.5 rounded shadow">
              {item.name}
            </span>
          </div>
        ))}

        {/* Dinding kiri area materi */}
        <div
          className="absolute bg-gray-500/40 border border-gray-400 pointer-events-none z-10 opacity-0"
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
          className="absolute bg-gray-500/40 border border-gray-400 pointer-events-none z-10 opacity-0"
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
          className="absolute bg-orange-500/40 border border-orange-400 pointer-events-none z-10 flex items-center justify-center opacity-0"
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
          className="absolute bg-emerald-500/40 border-2 border-emerald-400 z-10 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
          style={{
            left: `${leverTrigger.x}px`,
            top: `${leverTrigger.y}px`,
            width: `${leverTrigger.w}px`,
            height: `${leverTrigger.h}px`,
          }}
          onClick={openSJFGame}
        >
          {isNearLever && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce z-30 pointer-events-none">
              <span className="rounded bg-cyan-400 px-2 py-0.5 text-[9px] font-black text-black shadow-md">
                [E] Reaktor Alien
              </span>
            </div>
          )}
        </div>

        {/* Platform di bawah lever */}
        <div
          className="absolute bg-emerald-500/30 border border-emerald-400 pointer-events-none z-10 flex items-center justify-center opacity-0"
          style={{
            left: `${leverPlatform.x}px`,
            top: `${leverPlatform.y}px`,
            width: `${leverPlatform.w}px`,
            height: `${leverPlatform.h}px`,
          }}
        >
        </div>

        {/* Platform atas kiri */}
        <div
          className="absolute bg-red-500/40 border border-red-400 pointer-events-none z-10 flex items-center justify-center opacity-0"
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
          className="absolute bg-purple-500/40 border border-purple-400 pointer-events-none z-10 flex items-center justify-center opacity-0"
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
          className="absolute bg-blue-500/40 border border-blue-400 pointer-events-none z-10 flex items-center justify-center opacity-0"
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
          className="absolute bg-gray-500/30 border border-gray-400 pointer-events-none z-10 opacity-0"
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

        {/* ─── TOMBOL 1: TEKANAN KOTAK KARGO (BIRU/CYAN) ────── */}
        <div
          className={`absolute flex items-center justify-center rounded-t border transition-all z-10 ${
            !isLaser1Active
              ? "bg-cyan-500/80 border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.9)]"
              : "bg-cyan-900/60 border-cyan-400/50 animate-pulse"
          }`}
          style={{
            left: `${floorButton.x}px`,
            top: `${floorButton.y}px`,
            width: `${floorButton.w}px`,
            height: `${floorButton.h}px`,
          }}
        >
          <span className="text-[7px] font-black text-black uppercase tracking-tighter">
            {!isLaser1Active ? "OPEN" : "BOX PLT"}
          </span>
        </div>

        {/* ─── TOMBOL 2: TOGGLE KUNING (YELLOW) ─────────────── */}
        <div
          onClick={() => setIsLaser2Active((prev) => !prev)}
          className={`absolute flex items-center justify-center rounded-t border transition-all z-10 cursor-pointer ${
            !isLaser2Active
              ? "bg-yellow-400/80 border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.9)]"
              : "bg-yellow-600/60 border-yellow-400 animate-pulse"
          }`}
          style={{
            left: `${button2.x}px`,
            top: `${button2.y}px`,
            width: `${button2.w}px`,
            height: `${button2.h}px`,
          }}
        >
          <span className="text-[6.5px] font-black text-black uppercase tracking-tighter">
            {!isLaser2Active ? "OFF 2" : "BTN 2"}
          </span>
        </div>

        {/* ─── TOMBOL 3: TOGGLE HIJAU (EMERALD) ─────────────── */}
        <div
          onClick={() => setIsLaser3Active((prev) => !prev)}
          className={`absolute flex items-center justify-center rounded-t border transition-all z-10 cursor-pointer ${
            !isLaser3Active
              ? "bg-emerald-400/80 border-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.9)]"
              : "bg-emerald-600/60 border-emerald-400 animate-pulse"
          }`}
          style={{
            left: `${button3.x}px`,
            top: `${button3.y}px`,
            width: `${button3.w}px`,
            height: `${button3.h}px`,
          }}
        >
          <span className="text-[6.5px] font-black text-black uppercase tracking-tighter">
            {!isLaser3Active ? "OFF 3" : "BTN 3"}
          </span>
        </div>


        {/* ─── TRIGGER TES 1 (Area Tengah) ───────────────────── */}
        <div
          className="absolute bg-red-900/60 border-2 border-red-400/90 rounded-xl z-20 flex flex-col items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.6)] hover:scale-105 transition-transform"
          style={{
            left: `${tes1TriggerObj.x}px`,
            top: `${tes1TriggerObj.y}px`,
            width: `${tes1TriggerObj.w}px`,
            height: `${tes1TriggerObj.h}px`,
          }}
          onClick={() => setShowTes1Modal(true)}
        >
          {isNearTes1 && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce z-30 pointer-events-none">
              <span className="rounded bg-red-400 px-2 py-0.5 text-[9px] font-black text-black shadow-md">
                [E] Materi 2: SJF
              </span>
            </div>
          )}
          <span className="text-base select-none">🖥️</span>
        </div>

        {/* ─── TRIGGER TES 2 (Area Tengah) ───────────────────── */}
        <div
          className="absolute bg-blue-900/60 border-2 border-blue-400/90 rounded-xl z-20 flex flex-col items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:scale-105 transition-transform"
          style={{
            left: `${tes2TriggerObj.x}px`,
            top: `${tes2TriggerObj.y}px`,
            width: `${tes2TriggerObj.w}px`,
            height: `${tes2TriggerObj.h}px`,
          }}
          onClick={() => setShowTes2Modal(true)}
        >
          {isNearTes2 && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce z-30 pointer-events-none">
              <span className="rounded bg-blue-400 px-2 py-0.5 text-[9px] font-black text-black shadow-md">
                [E] Materi 3: RR
              </span>
            </div>
          )}
          <span className="text-base select-none">🖥️</span>
        </div>

        {/* ─── LASER 1: ENERGI BIRU/CYAN (TEKANAN KOTAK) ─────── */}
        <div
          className={`absolute flex flex-col items-center justify-between transition-all duration-500 pointer-events-none ${
            !isLaser1Active ? "opacity-0 scale-95" : "opacity-100 z-20"
          }`}
          style={{
            left: `${laserDoor.x}px`,
            top: `${laserDoor.y}px`,
            width: `${laserDoor.w}px`,
            height: `${laserDoor.h}px`,
          }}
        >
          <div className="relative w-6 h-2.5 -mt-1 rounded-sm bg-gradient-to-r from-slate-900 via-cyan-500 to-slate-900 border border-cyan-300 flex items-center justify-center z-30">
            <span className="w-2 h-1 rounded-full bg-white animate-ping" />
          </div>
          <div className="relative w-full flex-1 flex items-center justify-center overflow-visible my-0.5">
            <div className="relative w-3 h-full bg-gradient-to-b from-cyan-300 via-blue-500 to-cyan-300 rounded-full laser-alive flex items-center justify-center overflow-hidden">
              <div className="w-1 h-full bg-white rounded-full opacity-95 laser-core-flicker" />
              <div className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-white to-transparent opacity-90 laser-energy-pulse" />
            </div>
          </div>
          <div className="relative w-6 h-2.5 -mb-1 rounded-sm bg-gradient-to-r from-slate-900 via-cyan-500 to-slate-900 border border-cyan-300 flex items-center justify-center z-30">
            <span className="w-2 h-1 rounded-full bg-white animate-ping" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>

        {/* ─── LASER 2: ENERGI KUNING (YELLOW) ────────────────── */}
        <div
          className={`absolute flex flex-col items-center justify-between transition-all duration-500 pointer-events-none ${
            !isLaser2Active ? "opacity-0 scale-95" : "opacity-100 z-20"
          }`}
          style={{
            left: `${laser2.x}px`,
            top: `${laser2.y}px`,
            width: `${laser2.w}px`,
            height: `${laser2.h}px`,
          }}
        >
          <div className="relative w-6 h-2.5 -mt-1 rounded-sm bg-gradient-to-r from-slate-900 via-yellow-500 to-slate-900 border border-yellow-300 flex items-center justify-center z-30">
            <span className="w-2 h-1 rounded-full bg-white animate-ping" />
          </div>
          <div className="relative w-full flex-1 flex items-center justify-center overflow-visible my-0.5">
            <div className="relative w-3 h-full bg-gradient-to-b from-yellow-500 to-yellow-300 rounded-full laser-alive-yellow flex items-center justify-center overflow-hidden">
              <div className="w-1 h-full bg-white rounded-full opacity-95 laser-core-flicker" />
              <div className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-white to-transparent opacity-90 laser-energy-pulse" />
            </div>
          </div>
          <div className="relative w-6 h-2.5 -mb-1 rounded-sm bg-gradient-to-r from-slate-900 via-yellow-500 to-slate-900 border border-yellow-300 flex items-center justify-center z-30">
            <span className="w-2 h-1 rounded-full bg-white animate-ping" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>

        {/* ─── LASER 3: ENERGI HIJAU (EMERALD) ────────────────── */}
        <div
          className={`absolute flex flex-col items-center justify-between transition-all duration-500 pointer-events-none ${
            !isLaser3Active ? "opacity-0 scale-95" : "opacity-100 z-20"
          }`}
          style={{
            left: `${laser3.x}px`,
            top: `${laser3.y}px`,
            width: `${laser3.w}px`,
            height: `${laser3.h}px`,
          }}
        >
          <div className="relative w-6 h-2.5 -mt-1 rounded-sm bg-gradient-to-r from-slate-900 via-emerald-500 to-slate-900 border border-emerald-300 flex items-center justify-center z-30">
            <span className="w-2 h-1 rounded-full bg-white animate-ping" />
          </div>
          <div className="relative w-full flex-1 flex items-center justify-center overflow-visible my-0.5">
            <div className="relative w-3 h-full bg-gradient-to-b from-emerald-500 to-emerald-300 rounded-full laser-alive-green flex items-center justify-center overflow-hidden">
              <div className="w-1 h-full bg-white rounded-full opacity-95 laser-core-flicker" />
              <div className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-white to-transparent opacity-90 laser-energy-pulse" />
            </div>
          </div>
          <div className="relative w-6 h-2.5 -mb-1 rounded-sm bg-gradient-to-r from-slate-900 via-emerald-500 to-slate-900 border border-emerald-300 flex items-center justify-center z-30">
            <span className="w-2 h-1 rounded-full bg-white animate-ping" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>

        {/* ─── LASER 4: ENERGI UNGU (PURPLE - HORIZONTAL) ────── */}
        <div
          className={`absolute flex flex-row items-center justify-between transition-all duration-500 pointer-events-none ${
            !isLaser4Active ? "opacity-0 scale-95" : "opacity-100 z-20"
          }`}
          style={{
            left: `${laser4.x}px`,
            top: `${laser4.y}px`,
            width: `${laser4.w}px`,
            height: `${laser4.h}px`,
          }}
        >
          {/* Emitter Kiri */}
          <div className="relative w-2.5 h-6 -ml-1 rounded-sm bg-gradient-to-b from-slate-900 via-purple-500 to-slate-900 border border-purple-300 flex items-center justify-center z-30">
            <span className="w-1 h-2 rounded-full bg-white animate-ping" />
          </div>
          {/* Sinar Laser Horizontal */}
          <div className="relative h-full flex-1 flex items-center justify-center overflow-visible mx-0.5">
            <div className="relative h-3 w-full bg-gradient-to-r from-purple-500 via-fuchsia-300 to-purple-500 rounded-full laser-alive-purple flex items-center justify-center overflow-hidden">
              <div className="h-1 w-full bg-white rounded-full opacity-95 laser-core-flicker" />
              <div className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white to-transparent opacity-90 laser-energy-pulse-h" />
            </div>
          </div>
          {/* Emitter Kanan */}
          <div className="relative w-2.5 h-6 -mr-1 rounded-sm bg-gradient-to-b from-slate-900 via-purple-500 to-slate-900 border border-purple-300 flex items-center justify-center z-30">
            <span className="w-1 h-2 rounded-full bg-white animate-ping" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>

        {/* ─── LASER 5: ENERGI MERAH (RED - HORIZONTAL) ───────── */}
        <div
          className={`absolute flex flex-row items-center justify-between transition-all duration-500 pointer-events-none ${
            !isLaser5Active ? "opacity-0 scale-95" : "opacity-100 z-20"
          }`}
          style={{
            left: `${laser5.x}px`,
            top: `${laser5.y}px`,
            width: `${laser5.w}px`,
            height: `${laser5.h}px`,
          }}
        >
          {/* Emitter Kiri */}
          <div className="relative w-2.5 h-6 -ml-1 rounded-sm bg-gradient-to-b from-slate-900 via-red-600 to-slate-900 border border-red-300 flex items-center justify-center z-30">
            <span className="w-1 h-2 rounded-full bg-white animate-ping" />
          </div>
          {/* Sinar Laser Horizontal */}
          <div className="relative h-full flex-1 flex items-center justify-center overflow-visible mx-0.5">
            <div className="relative h-3 w-full bg-gradient-to-r from-red-500 via-red-300 to-red-500 rounded-full laser-alive flex items-center justify-center overflow-hidden">
              <div className="h-1 w-full bg-white rounded-full opacity-95 laser-core-flicker" />
              <div className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white to-transparent opacity-90 laser-energy-pulse-h" />
            </div>
          </div>
          {/* Emitter Kanan */}
          <div className="relative w-2.5 h-6 -mr-1 rounded-sm bg-gradient-to-b from-slate-900 via-red-600 to-slate-900 border border-red-300 flex items-center justify-center z-30">
            <span className="w-1 h-2 rounded-full bg-white animate-ping" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>

        {/* ─── LASER 6: ENERGI BIRU TUA (VERTICAL) ───────────── */}
        <div
          className={`absolute flex flex-col items-center justify-between transition-all duration-500 pointer-events-none ${
            !isLaser6Active ? "opacity-0 scale-95" : "opacity-100 z-20"
          }`}
          style={{
            left: `${laser6.x}px`,
            top: `${laser6.y}px`,
            width: `${laser6.w}px`,
            height: `${laser6.h}px`,
          }}
        >
          {/* Emitter Atas */}
          <div className="relative w-6 h-2.5 -mt-1 rounded-sm bg-gradient-to-r from-slate-900 via-blue-700 to-slate-900 border border-blue-400 flex items-center justify-center z-30">
            <span className="w-2 h-1 rounded-full bg-white animate-ping" />
          </div>
          {/* Sinar Laser Vertical */}
          <div className="relative w-full flex-1 flex items-center justify-center overflow-visible my-0.5">
            <div className="relative w-3 h-full bg-gradient-to-b from-blue-700 via-blue-500 to-blue-700 rounded-full laser-alive flex items-center justify-center overflow-hidden">
              <div className="w-1 h-full bg-white rounded-full opacity-95 laser-core-flicker" />
              <div className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-white to-transparent opacity-90 laser-energy-pulse" />
            </div>
          </div>
          {/* Emitter Bawah */}
          <div className="relative w-6 h-2.5 -mb-1 rounded-sm bg-gradient-to-r from-slate-900 via-blue-700 to-slate-900 border border-blue-400 flex items-center justify-center z-30">
            <span className="w-2 h-1 rounded-full bg-white animate-ping" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>

        {}
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
          className="absolute z-20 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform"
          style={{
            left: `${portalObj.x}px`,
            top: `${portalObj.y}px`,
            width: `${portalObj.w}px`,
            height: `${portalObj.h}px`,
          }}
          onClick={() => {
            if (isPortalActive) {
              router.push("/stage/stage2");
            } else {
              alert("⚠️ Portal terkunci! Aktifkan reaktor melalui tuas konsol terlebih dahulu.");
            }
          }}
        >
          <div
            className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
              isPortalActive
                ? "border-emerald-400 bg-emerald-600/50 shadow-[0_0_35px_rgba(52,211,153,0.9)] animate-pulse"
                : "border-purple-400 bg-purple-600/30 shadow-[0_0_20px_rgba(168,85,247,0.5)] opacity-70"
            }`}
          />
          <div className="relative z-10 text-center pointer-events-none">
            <span className="text-2xl animate-spin inline-block" style={{ animationDuration: "8s" }}>🌀</span>
            <span
              className={`block text-[8px] font-black tracking-widest uppercase ${
                isPortalActive ? "text-emerald-300" : "text-cyan-200"
              }`}
            >
              {isPortalActive ? "PORTAL ON" : "PORTAL 2"}
            </span>
          </div>
        </div>

        {/* ─── KARAKTER PLAYER (SPRITE SHEET 2D astron-1..4.png) ────────── */}
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: `${playerX}px`,
            top: `${playerY}px`,
            width: `${PLAYER_W}px`,
            height: `${PLAYER_H}px`,
          }}
        >
          {/* Kontainer visual VISUAL_W x VISUAL_H terpusat pada hitbox */}
          <div
            className="absolute"
            style={{
              left: `${(PLAYER_W - VISUAL_W) / 2}px`,
              bottom: "0px",
              width: `${VISUAL_W}px`,
              height: `${VISUAL_H}px`,
            }}
          >
            {/* Elemen sprite utama persegi (VISUAL_H x VISUAL_H) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={playerSprite}
              alt="Player"
              draggable={false}
              className="absolute select-none pointer-events-none"
              style={{
                width: `${VISUAL_H}px`,
                height: `${VISUAL_H}px`,
                bottom: 0,
                left: "50%",
                objectFit: "contain",
                objectPosition: "center bottom",
                transform: ((isJumping || !isWalking) && facingLeft)
                  ? "translateX(-50%) scaleX(-1)"
                  : "translateX(-50%)",
                transformOrigin: "center bottom",
              }}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODAL 1: TERMINAL LOG MATERI FCFS & KUIS (MEMATIKAN LASER 4)
          ═══════════════════════════════════════════════════════ */}
      {showMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-cyan-400/60 bg-[#0d091e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_50px_rgba(34,211,238,0.4)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
                <div>
                  <h2 className="text-base md:text-lg font-bold text-cyan-300 tracking-wider uppercase">
                    🖥️ OMNI LOG // PENJADWALAN FIRST-COME, FIRST-SERVED (FCFS)
                  </h2>
                  <p className="text-[11px] text-gray-400">Terminal 1 • Modul Algoritma Penjadwalan & Kuis Pemahaman</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseTerminalMaterial}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-400 hover:text-white hover:border-cyan-400 transition"
              >
                ✕ Tutup
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-4 flex items-center gap-2 border-b border-white/10 pb-2">
              <button
                type="button"
                onClick={() => setMaterialModalTab("material")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  materialModalTab === "material"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                }`}
              >
                <span>📖</span> Ringkasan Materi FCFS
              </button>
              <button
                type="button"
                onClick={() => setMaterialModalTab("quiz")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  materialModalTab === "quiz"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                }`}
              >
                <span>📝</span> Kuis Pemahaman (3 Soal)
                <span
                  className={`ml-1 rounded px-1.5 py-0.2 text-[10px] font-bold ${
                    isFcfsQuizAllCorrect
                      ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                      : "bg-white/10 text-gray-300"
                  }`}
                >
                  {fcfsQuizAnswers.filter((ans, idx) => ans === fcfsQuestions[idx].correct).length}/3
                </span>
              </button>
            </div>

            {/* TAB 1: MATERI FCFS */}
            {materialModalTab === "material" && (
              <div className="mt-4 space-y-4 text-xs md:text-sm text-gray-300 leading-relaxed">
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
                  <h3 className="font-bold text-cyan-300 text-sm md:text-base">
                    Algoritma Penjadwalan: First-Come, First-Served (FCFS)
                  </h3>
                  <p className="mt-2 text-gray-200">
                    <strong>First-Come, First-Served (FCFS)</strong> adalah algoritma penjadwalan CPU paling sederhana di mana proses dieksekusi berdasarkan urutan kedatangannya di antrean (<em>Ready Queue</em>), mengadopsi konsep antrean <strong>FIFO (First-In, First-Out)</strong>.
                  </p>
                </div>

                <div className="rounded-xl border border-purple-500/30 bg-white/[0.03] p-4">
                  <h4 className="font-bold text-purple-300">1. Sifat Penjadwalan: Non-Preemptive</h4>
                  <p className="mt-1">
                    FCFS bersifat <strong>Non-Preemptive</strong>: sekali proses dialokasikan ke CPU, proses tersebut tidak dapat dihentikan atau disela (<em>preempted</em>) di tengah jalan hingga proses tersebut selesai dieksekusi atau melepaskan CPU secara sukarela.
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-white/[0.03] p-4">
                  <h4 className="font-bold text-amber-300">2. Keuntungan & Kekurangan (Convoy Effect)</h4>
                  <ul className="mt-1 list-disc list-inside space-y-1.5">
                    <li>
                      <strong className="text-emerald-300">Keuntungan:</strong> Sangat sederhana, adil dari segi antrean masuk, dan mudah diimplementasikan dengan struktur data FIFO queue sederhana.
                    </li>
                    <li>
                      <strong className="text-rose-300">Kekurangan (Convoy Effect):</strong> Berisiko tinggi memunculkan <strong>Convoy Effect</strong>, yaitu fenomena di mana proses-proses kecil (burst time singkat) harus menunggu sangat lama di antrean di belakang satu proses besar (burst time sangat panjang), sehingga menyebabkan rata-rata waktu tunggu (average waiting time) menjadi sangat buruk.
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-blue-500/30 bg-white/[0.03] p-4">
                  <h4 className="font-bold text-blue-300">3. Contoh Simulasi Eksekusi</h4>
                  <p className="mt-1 text-gray-300">
                    Diketahui 3 proses datang berurutan (<strong>P1 → P2 → P3</strong>) dengan Burst Time:
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center font-mono text-xs">
                    <div className="rounded border border-cyan-500/40 bg-cyan-950/30 p-2">
                      <div className="font-bold text-cyan-300">P1</div>
                      <div className="text-gray-300">Burst: 24 ms</div>
                    </div>
                    <div className="rounded border border-indigo-500/40 bg-indigo-950/30 p-2">
                      <div className="font-bold text-indigo-300">P2</div>
                      <div className="text-gray-300">Burst: 3 ms</div>
                    </div>
                    <div className="rounded border border-purple-500/40 bg-purple-950/30 p-2">
                      <div className="font-bold text-purple-300">P3</div>
                      <div className="text-gray-300">Burst: 3 ms</div>
                    </div>
                  </div>

                  {/* Visual Gantt Chart */}
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-gray-400 mb-1">Visualisasi Gantt Chart:</div>
                    <div className="flex h-10 w-full overflow-hidden rounded-lg border border-white/20 text-xs font-bold text-black">
                      <div className="flex flex-[8] items-center justify-center bg-cyan-400">
                        P1 (24 ms)
                      </div>
                      <div className="flex flex-1 items-center justify-center bg-indigo-400 border-l border-black/40">
                        P2 (3)
                      </div>
                      <div className="flex flex-1 items-center justify-center bg-purple-400 border-l border-black/40">
                        P3 (3)
                      </div>
                    </div>
                    {/* Timeline markers */}
                    <div className="mt-1 flex justify-between font-mono text-[10px] text-gray-400">
                      <span>0</span>
                      <span className="translate-x-12">24</span>
                      <span className="translate-x-4">27</span>
                      <span>30 ms</span>
                    </div>
                  </div>

                  {/* Perhitungan WT & TAT */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-black/40 p-3 rounded-lg border border-white/5 font-mono">
                    <div>
                      <div className="font-bold text-cyan-300">Waiting Time (WT):</div>
                      <div>• P1 = 0 ms</div>
                      <div>• P2 = 24 ms</div>
                      <div>• P3 = 24 + 3 = 27 ms</div>
                      <div className="mt-1 font-semibold text-amber-300">Rata-rata WT: 17 ms</div>
                    </div>
                    <div>
                      <div className="font-bold text-purple-300">Turnaround Time (TAT):</div>
                      <div>• P1 = 24 ms</div>
                      <div>• P2 = 27 ms</div>
                      <div>• P3 = 30 ms</div>
                      <div className="mt-1 font-semibold text-amber-300">Rata-rata TAT: 27 ms</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/30 p-3.5 text-cyan-200">
                  <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <span>💡</span> Syarat Mematikan Laser 4:
                  </p>
                  <p className="mt-1 text-xs">
                    Kerjakan <strong>Kuis Singkat (3 Soal)</strong> berdasarkan materi di atas. Setelah ke-3 soal dijawab dengan benar, <strong>Laser 4 (Ungu Horizontal)</strong> akan dinonaktifkan!
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleCloseTerminalMaterial}
                    className="rounded-xl border border-white/20 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    Tutup Sementara
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialModalTab("quiz")}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-6 py-2.5 text-xs md:text-sm font-bold text-white shadow-[0_0_20px_rgba(34,211,238,0.5)] transition hover:scale-105 active:scale-95"
                  >
                    Lanjut ke Kuis Pemahaman (3 Soal) ➔
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: KUIS SINGKAT (3 SOAL) */}
            {materialModalTab === "quiz" && (
              <div className="mt-4 space-y-5 text-xs md:text-sm text-gray-300 leading-relaxed">
                <div className="flex items-center justify-between rounded-xl border border-purple-500/30 bg-purple-950/20 px-4 py-2.5">
                  <div className="text-xs text-purple-200">
                    Pilih jawaban yang benar untuk setiap soal. Warna hijau menandakan jawaban benar.
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaterialModalTab("material")}
                    className="flex items-center gap-1 rounded-lg border border-purple-400/40 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition"
                  >
                    📖 Review Materi
                  </button>
                </div>

                {fcfsQuestions.map((q, qIdx) => {
                  const selectedOpt = fcfsQuizAnswers[qIdx];
                  const isAnswered = selectedOpt !== null;
                  const isCorrect = selectedOpt === q.correct;

                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-4 transition ${
                        isAnswered
                          ? isCorrect
                            ? "border-emerald-500/60 bg-emerald-950/15"
                            : "border-rose-500/60 bg-rose-950/15"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-white text-xs md:text-sm">
                          {qIdx + 1}. {q.question}
                        </h4>
                        {isAnswered && (
                          <span
                            className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${
                              isCorrect
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            }`}
                          >
                            {isCorrect ? "✓ Benar" : "✕ Belum Tepat"}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isOptionSelected = selectedOpt === optIdx;
                          let btnStyle = "border-white/10 bg-white/[0.02] text-gray-300 hover:bg-white/[0.06] hover:border-white/20";

                          if (isOptionSelected) {
                            if (isCorrect) {
                              btnStyle = "border-emerald-400 bg-emerald-500/25 text-emerald-200 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                            } else {
                              btnStyle = "border-rose-400 bg-rose-500/25 text-rose-200 font-semibold shadow-[0_0_15px_rgba(244,63,94,0.3)]";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectFcfsQuiz(qIdx, optIdx)}
                              className={`w-full text-left rounded-lg border p-2.5 text-xs transition flex items-center justify-between ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {isOptionSelected && (
                                <span className="ml-2 font-bold text-xs">
                                  {isCorrect ? "✓" : "✕"}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Feedback Text */}
                      {isAnswered && (
                        <div className="mt-2.5 text-[11px]">
                          {isCorrect ? (
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              <span>✓</span> Pilihan tepat! Sesuai dengan prinsip FCFS.
                            </span>
                          ) : (
                            <span className="text-rose-400 font-medium flex items-center gap-1">
                              <span>⚠️</span> Jawaban kurang tepat. Pelajari kembali materi dan pilih opsi lain!
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Status Box & Tombol Selesai */}
                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-300">
                        Status Kuis:{" "}
                        <span className={isFcfsQuizAllCorrect ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                          {fcfsQuizAnswers.filter((ans, idx) => ans === fcfsQuestions[idx].correct).length} dari 3 Soal Benar
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {isFcfsQuizAllCorrect
                          ? "Semua jawaban benar! Silakan klik tombol untuk mematikan Laser 4."
                          : "Jawab seluruh 3 soal dengan benar untuk membuka kunci Laser 4."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleCloseTerminalMaterial}
                        className="rounded-xl border border-white/20 px-3.5 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition"
                      >
                        Tutup
                      </button>

                      {isFcfsQuizAllCorrect || isMateriRead ? (
                        <button
                          type="button"
                          onClick={handleCompleteFcfsMateri}
                          className="flex-1 sm:flex-initial rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-2.5 text-xs md:text-sm font-bold text-white shadow-[0_0_25px_rgba(16,185,129,0.5)] transition hover:scale-105 active:scale-95"
                        >
                          ✓ {isMateriRead ? "Tutup (Laser 4 Telah Padam)" : "Selesai & Padamkan Laser 4 ➔"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="flex-1 sm:flex-initial rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs md:text-sm font-bold text-gray-500 cursor-not-allowed"
                        >
                          🔒 Jawab Semua Benar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL 2: ALIEN REACTOR POWER DISTRIBUTOR (3 LEVEL)
          ═══════════════════════════════════════════════════════ */}
      {isMiniGameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md select-none">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-cyan-500/70 bg-[#090d1f]/95 p-6 md:p-7 text-[#e9e4ff] shadow-[0_0_60px_rgba(6,182,212,0.35)]">
            {/* 1. Header Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-cyan-500/30 pb-3.5 gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-3.5 w-3.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500" />
                </span>
                <div>
                  <h2 className="text-base md:text-lg font-black tracking-wider text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)] uppercase flex items-center gap-2">
                    <span>⚛️</span> ALIEN REACTOR // POWER DISTRIBUTOR
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Mini-Game Penjadwalan CPU • 3 Level Berurutan (FCFS ➔ SJF ➔ Round Robin)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-center">
                {/* Level Indicator Badge */}
                <div className="rounded-lg border px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm border-cyan-400/50 bg-cyan-950/40 text-cyan-300">
                  <span>LEVEL {reactorLevel}/3:</span>
                  <span className="text-white">
                    {reactorLevel === 1 ? "FCFS" : reactorLevel === 2 ? "SJF" : "ROUND ROBIN (q=2s)"}
                  </span>
                </div>

                {/* Countdown Timer */}
                <div
                  className={`rounded-lg border px-3 py-1 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                    levelTimer <= 10
                      ? "border-rose-500 bg-rose-950/60 text-rose-300 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                      : "border-cyan-400/40 bg-cyan-950/30 text-cyan-300"
                  }`}
                >
                  <span>⏳</span>
                  <span className="text-sm">{levelTimer}s</span>
                </div>

                <button
                  type="button"
                  onClick={handleCloseReactorModal}
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-gray-400 hover:text-white hover:border-cyan-400 transition"
                  title="Tutup Modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Instruction Banner & Feedback Bar */}
            <div className="mt-3.5 space-y-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 flex items-center justify-between text-xs">
                <span className="text-gray-300 flex items-center gap-2">
                  <span className="text-amber-400">⚡ Aturan Level:</span>
                  <span>
                    {reactorLevel === 1 && "FCFS: Pilih proses dengan Arrival Time paling awal (terkecil)!"}
                    {reactorLevel === 2 && "SJF: Pilih proses dengan Burst Time paling singkat (terkecil)!"}
                    {reactorLevel === 3 && "Round Robin: Pilih proses paling depan di Ready Queue (maks 2s per giliran)!"}
                  </span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono hidden md:inline">
                  Salah klik = Penalti -3 detik
                </span>
              </div>

              {reactorFeedback && (
                <div
                  className={`rounded-xl border px-3.5 py-2 text-xs flex items-center justify-between transition-all ${
                    reactorFeedback.type === "error"
                      ? "border-rose-500/60 bg-rose-950/50 text-rose-200"
                      : reactorFeedback.type === "success"
                      ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-200"
                      : "border-blue-500/60 bg-blue-950/50 text-blue-200"
                  }`}
                >
                  <span className="font-medium">{reactorFeedback.text}</span>
                  {reactorFeedback.type === "error" && (
                    <span className="text-[10px] font-bold text-rose-300 bg-rose-900/60 px-1.5 py-0.5 rounded">
                      -3s
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 2. Main Work Area: Ready Queue (Left) & Reactor CPU Core (Right) */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ready Queue (Antrean Kapsul Energi) */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <span>📦</span> Ready Queue ({readyQueue.length} Kapsul):
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {isCpuBusy ? "🔒 CPU Sibuk" : "🖱️ Klik Kapsul"}
                    </span>
                  </div>

                  {readyQueue.length === 0 ? (
                    <div className="h-44 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-4 text-gray-400">
                      <span className="text-2xl mb-1">✓</span>
                      <span className="text-xs font-semibold text-emerald-400">Semua Kapsul Telah Tuntas!</span>
                      <span className="text-[10px] text-gray-500 mt-0.5">Seluruh daya reaktor berhasil dialokasikan.</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {readyQueue.map((p, idx) => {
                        const isFront = idx === 0;
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleSelectProcess(p)}
                            className={`rounded-xl border p-2.5 transition-all select-none flex items-center justify-between ${
                              isCpuBusy
                                ? "opacity-50 cursor-not-allowed border-white/10 bg-white/[0.02]"
                                : "cursor-pointer hover:scale-[1.02] active:scale-[0.98] border-cyan-500/40 bg-cyan-950/20 hover:border-cyan-300 hover:bg-cyan-950/40 hover:shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${p.badgeColor}`}>
                                {p.id}
                              </span>
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span>{p.name}</span>
                                  {reactorLevel === 3 && isFront && (
                                    <span className="rounded bg-blue-500/30 text-blue-300 border border-blue-400/40 px-1 text-[9px] font-mono">
                                      DEPAN
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-gray-400 flex items-center gap-2 mt-0.5">
                                  <span>Arrival: <strong className="text-gray-200">{p.arrivalTime}s</strong></span>
                                  <span>•</span>
                                  <span>Burst: <strong className="text-gray-200">{p.burstTime}s</strong></span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right font-mono">
                              <span className="text-[10px] text-gray-400 block">Sisa Waktu</span>
                              <span className="text-sm font-bold text-amber-300">
                                {p.remainingTime}s
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-2 text-[10px] text-gray-500 font-mono text-center">
                  {reactorLevel === 1 && "Prioritas: Arrival Time paling kecil."}
                  {reactorLevel === 2 && "Prioritas: Burst Time paling singkat."}
                  {reactorLevel === 3 && "Prioritas: Urutan antrean paling depan (FIFO)."}
                </div>
              </div>

              {/* Reactor CPU Core (Slot Eksekusi Tengah) */}
              <div className="rounded-xl border border-cyan-500/30 bg-black/40 p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <span>⚡</span> Reactor CPU Core:
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      {activeCoreProcess ? "STATUS: AKTIF" : "STATUS: IDLE"}
                    </span>
                  </div>

                  <div className="h-44 rounded-xl border-2 border-cyan-500/40 bg-gradient-to-b from-cyan-950/20 to-black/60 p-3 flex flex-col justify-between items-center text-center relative overflow-hidden">
                    {activeCoreProcess ? (
                      <>
                        <div className="w-full flex items-center justify-between text-xs font-mono">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                            INTI AKTIF
                          </span>
                          <span className="text-amber-300 font-bold animate-pulse">
                            {executionProgress}%
                          </span>
                        </div>

                        <div className="my-auto flex flex-col items-center">
                          <div className="h-12 w-12 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(34,211,238,0.5)] animate-bounce">
                            ⚛️
                          </div>
                          <h4 className="mt-2 text-sm font-black text-white font-mono">
                            {activeCoreProcess.name}
                          </h4>
                          <p className="text-[10px] font-mono text-cyan-300">
                            Dialokasikan: <strong>{activeCoreProcess.allocTime} detik</strong>
                            {reactorLevel === 3 && activeCoreProcess.allocTime < activeCoreProcess.remainingTime && " (Quantum 2s)"}
                          </p>
                        </div>

                        {/* Progress Bar Eksekusi */}
                        <div className="w-full">
                          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden border border-white/10">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-75 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                              style={{ width: `${executionProgress}%` }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="my-auto flex flex-col items-center text-center text-gray-400">
                        <span className="text-3xl opacity-30 mb-1">⚙️</span>
                        <span className="text-xs font-mono font-bold text-gray-300">
                          INTI REAKTOR SIAP
                        </span>
                        <span className="text-[10px] text-gray-500 mt-1 max-w-[200px]">
                          Klik kapsul yang sesuai aturan algoritma di samping untuk dialokasikan.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-gray-400 px-1">
                  <span>Kecepatan Eksekusi: 0.45s / unit</span>
                  <span>CPU: 1 Core</span>
                </div>
              </div>
            </div>

            {/* 3. Gantt Chart / Log Eksekusi Bawah */}
            <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-gray-300 flex items-center gap-1.5">
                  <span>📊</span> Gantt Chart Riwayat Eksekusi (Level {reactorLevel}):
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  Total Terproses: {ganttHistory.reduce((sum, i) => sum + i.duration, 0)} detik
                </span>
              </div>

              {ganttHistory.length === 0 ? (
                <div className="h-8 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-[10px] font-mono text-gray-500">
                  Belum ada proses yang dieksekusi pada level ini.
                </div>
              ) : (
                <div className="flex h-8 w-full overflow-hidden rounded-lg border border-white/20 text-[10px] font-bold font-mono">
                  {ganttHistory.map((item, idx) => (
                    <div
                      key={idx}
                      style={{ flex: item.duration }}
                      className={`flex items-center justify-center border-r border-black/40 px-1 truncate ${item.ganttBg}`}
                      title={`${item.name} (${item.start}s - ${item.start + item.duration}s)`}
                    >
                      {item.id}({item.duration}s)
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Footer & Action Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between border-t border-cyan-500/30 pt-3.5 gap-3">
              {reactorStatus === "failed" ? (
                <div className="flex items-center justify-between w-full">
                  <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <span>⚠️</span> Reaktor Overload! Batas waktu habis sebelum level selesai.
                  </div>
                  <button
                    type="button"
                    onClick={() => startReactorLevel(reactorLevel)}
                    className="rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-5 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:scale-105 active:scale-95 transition"
                  >
                    ↺ Ulangi Level Ini
                  </button>
                </div>
              ) : reactorStatus === "won_level" ? (
                <div className="flex items-center justify-between w-full">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>🎉</span> Level {reactorLevel} Sukses! Seluruh kapsul teralokasi dengan benar.
                  </div>
                  <button
                    type="button"
                    onClick={() => startReactorLevel((reactorLevel + 1) as 1 | 2 | 3)}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-6 py-2 text-xs font-black text-black shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:scale-105 active:scale-95 transition"
                  >
                    Lanjut ke Level {reactorLevel + 1} ➔
                  </button>
                </div>
              ) : reactorStatus === "victory" ? (
                <div className="flex items-center justify-between w-full">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>🌟</span> Reaktor Stabil! Ketiga Algoritma Penjadwalan Berhasil Diselesaikan.
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseReactorModal}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-6 py-2.5 text-xs font-black text-black shadow-[0_0_25px_rgba(52,211,153,0.6)] hover:scale-105 active:scale-95 transition"
                  >
                    ✓ Selesaikan Misi & Buka Portal Stage 2 ➔
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <button
                    type="button"
                    onClick={() => startReactorLevel(reactorLevel)}
                    className="rounded-xl border border-white/20 bg-white/[0.04] px-4 py-1.5 text-xs font-bold text-gray-300 hover:border-cyan-400 hover:text-cyan-300 transition"
                  >
                    ↺ Acak Ulang Level Ini
                  </button>
                  <span className="text-[11px] text-gray-400 font-mono">
                    Selesaikan 3 level sebelum batas waktu habis untuk membuka Portal.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════
          MODAL 4: TRIGGER 2 / MATERI 2 SJF & KUIS (MEMATIKAN LASER 5)
          ═══════════════════════════════════════════════════════ */}
      {showTes1Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-red-500/70 bg-[#0d091e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_50px_rgba(239,68,68,0.4)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-red-500/40 pb-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-red-400 animate-ping" />
                <div>
                  <h2 className="text-base md:text-lg font-bold text-red-300 tracking-wider uppercase">
                    🖥️ OMNI LOG // PENJADWALAN SHORTEST JOB FIRST (SJF)
                  </h2>
                  <p className="text-[11px] text-gray-400">Trigger 2 • Modul Algoritma Penjadwalan & Kuis Pemahaman</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseTes1Modal}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-400 hover:text-white hover:border-red-400 transition"
              >
                ✕ Tutup
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-4 flex items-center gap-2 border-b border-white/10 pb-2">
              <button
                type="button"
                onClick={() => setTes1ModalTab("material")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  tes1ModalTab === "material"
                    ? "bg-red-500/20 text-red-300 border border-red-400/50 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                }`}
              >
                <span>📖</span> Ringkasan Materi SJF
              </button>
              <button
                type="button"
                onClick={() => setTes1ModalTab("quiz")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  tes1ModalTab === "quiz"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-400/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                }`}
              >
                <span>📝</span> Kuis Pemahaman (3 Soal)
                <span
                  className={`ml-1 rounded px-1.5 py-0.2 text-[10px] font-bold ${
                    isSjfQuizAllCorrect
                      ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                      : "bg-white/10 text-gray-300"
                  }`}
                >
                  {sjfQuizAnswers.filter((ans, idx) => ans === sjfQuestions[idx].correct).length}/3
                </span>
              </button>
            </div>

            {/* TAB 1: MATERI SJF */}
            {tes1ModalTab === "material" && (
              <div className="mt-4 space-y-4 text-xs md:text-sm text-gray-300 leading-relaxed">
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4">
                  <h3 className="font-bold text-red-300 text-sm md:text-base">
                    Algoritma Penjadwalan: Shortest Job First (SJF)
                  </h3>
                  <p className="mt-2 text-gray-200">
                    <strong>Shortest Job First (SJF)</strong> adalah algoritma penjadwalan CPU yang memprioritaskan dan mengeksekusi proses dengan waktu eksekusi atau <strong>Burst Time paling singkat</strong> terlebih dahulu dari antrean (<em>Ready Queue</em>).
                  </p>
                </div>

                <div className="rounded-xl border border-purple-500/30 bg-white/[0.03] p-4">
                  <h4 className="font-bold text-purple-300">1. Dua Jenis Strategi SJF</h4>
                  <ul className="mt-2 space-y-2">
                    <li className="rounded-lg bg-black/30 p-2.5 border border-white/5">
                      <strong className="text-cyan-300">a. Non-Preemptive SJF:</strong> Setelah proses dengan Burst Time terpendek mendapat jatah CPU, proses tersebut tidak dapat dihentikan hingga selesai.
                    </li>
                    <li className="rounded-lg bg-black/30 p-2.5 border border-white/5">
                      <strong className="text-pink-300">b. Preemptive SJF (Shortest Remaining Time First / SRTF):</strong> Jika datang proses baru yang memiliki sisa waktu eksekusi (Burst Time) lebih singkat daripada sisa waktu proses yang sedang berjalan, maka proses yang sedang berjalan akan dihentikan sementara (<em>preempted</em>) untuk memberi jalan ke proses baru tersebut.
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-white/[0.03] p-4">
                  <h4 className="font-bold text-amber-300">2. Keuntungan & Kekurangan</h4>
                  <ul className="mt-1 list-disc list-inside space-y-1.5">
                    <li>
                      <strong className="text-emerald-300">Keuntungan:</strong> Sangat optimal dalam menghasilkan rata-rata waktu tunggu (<strong>Average Waiting Time</strong>) paling minimal dibanding algoritma non-preemptive lainnya.
                    </li>
                    <li>
                      <strong className="text-rose-300">Kekurangan (Starvation):</strong> Berisiko menyebabkan <strong>Starvation</strong> (kelaparan proses), di mana proses dengan Burst Time panjang bisa tertunda terus-menerus jika proses-proses kecil terus berdatangan tanpa henti. Selain itu, sulit memprediksi durasi Burst Time secara pasti sebelum proses dijalankan di dunia nyata.
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-blue-500/30 bg-white/[0.03] p-4">
                  <h4 className="font-bold text-blue-300">3. Contoh Simulasi Singkat (Non-Preemptive, Tiba pada t = 0 ms)</h4>
                  <p className="mt-1 text-gray-300">
                    Diketahui 4 proses dengan durasi Burst Time:
                  </p>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-center font-mono text-xs">
                    <div className="rounded border border-cyan-500/40 bg-cyan-950/30 p-2">
                      <div className="font-bold text-cyan-300">P1</div>
                      <div className="text-gray-300">Burst: 6 ms</div>
                    </div>
                    <div className="rounded border border-rose-500/40 bg-rose-950/30 p-2">
                      <div className="font-bold text-rose-300">P2</div>
                      <div className="text-gray-300">Burst: 8 ms</div>
                    </div>
                    <div className="rounded border border-purple-500/40 bg-purple-950/30 p-2">
                      <div className="font-bold text-purple-300">P3</div>
                      <div className="text-gray-300">Burst: 7 ms</div>
                    </div>
                    <div className="rounded border border-amber-500/40 bg-amber-950/30 p-2">
                      <div className="font-bold text-amber-300">P4</div>
                      <div className="text-gray-300">Burst: 3 ms</div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-300">
                    <strong>Urutan Eksekusi (dari Burst Time terkecil):</strong>{" "}
                    <span className="font-mono text-amber-300 font-bold">P4 (3 ms) → P1 (6 ms) → P3 (7 ms) → P2 (8 ms)</span>
                  </div>

                  {/* Visual Gantt Chart */}
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-gray-400 mb-1">Visualisasi Gantt Chart:</div>
                    <div className="flex h-10 w-full overflow-hidden rounded-lg border border-white/20 text-xs font-bold text-black font-mono">
                      <div className="flex flex-[3] items-center justify-center bg-amber-400">
                        P4 (3)
                      </div>
                      <div className="flex flex-[6] items-center justify-center bg-cyan-400 border-l border-black/40">
                        P1 (6 ms)
                      </div>
                      <div className="flex flex-[7] items-center justify-center bg-purple-400 border-l border-black/40">
                        P3 (7 ms)
                      </div>
                      <div className="flex flex-[8] items-center justify-center bg-rose-400 border-l border-black/40">
                        P2 (8 ms)
                      </div>
                    </div>
                    {/* Timeline markers */}
                    <div className="mt-1 flex justify-between font-mono text-[10px] text-gray-400">
                      <span>0</span>
                      <span className="translate-x-1">3</span>
                      <span className="translate-x-4">9</span>
                      <span className="translate-x-6">16</span>
                      <span>24 ms</span>
                    </div>
                  </div>

                  {/* Perhitungan WT */}
                  <div className="mt-3 bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-xs">
                    <div className="font-bold text-red-300">Waiting Time (WT):</div>
                    <div className="grid grid-cols-2 gap-1 mt-1 text-gray-300">
                      <div>• P4 = 0 ms</div>
                      <div>• P1 = 3 ms</div>
                      <div>• P3 = 3 + 6 = 9 ms</div>
                      <div>• P2 = 3 + 6 + 7 = 16 ms</div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/10 font-semibold text-amber-300">
                      Rata-rata WT: (0 + 3 + 9 + 16) / 4 = <span className="text-emerald-300 font-bold text-sm">7 ms</span>{" "}
                      <span className="text-[10px] text-gray-400">(Jauh lebih efisien daripada FCFS: 10,25 ms)</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3.5 text-red-200">
                  <p className="font-semibold text-red-300 flex items-center gap-1.5">
                    <span>💡</span> Syarat Mematikan Laser 5:
                  </p>
                  <p className="mt-1 text-xs">
                    Kerjakan <strong>Kuis Singkat (3 Soal)</strong> berdasarkan materi SJF di atas. Setelah ke-3 soal dijawab dengan benar, <strong>Laser 5 (Merah Horizontal)</strong> akan dinonaktifkan!
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleCloseTes1Modal}
                    className="rounded-xl border border-white/20 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    Tutup Sementara
                  </button>
                  <button
                    type="button"
                    onClick={() => setTes1ModalTab("quiz")}
                    className="rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-6 py-2.5 text-xs md:text-sm font-bold text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] transition hover:scale-105 active:scale-95"
                  >
                    Lanjut ke Kuis Pemahaman (3 Soal) ➔
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: KUIS SINGKAT SJF (3 SOAL) */}
            {tes1ModalTab === "quiz" && (
              <div className="mt-4 space-y-5 text-xs md:text-sm text-gray-300 leading-relaxed">
                <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-2.5">
                  <div className="text-xs text-red-200">
                    Pilih jawaban yang benar untuk setiap soal SJF. Warna hijau menandakan jawaban benar.
                  </div>
                  <button
                    type="button"
                    onClick={() => setTes1ModalTab("material")}
                    className="flex items-center gap-1 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition"
                  >
                    📖 Review Materi
                  </button>
                </div>

                {sjfQuestions.map((q, qIdx) => {
                  const selectedOpt = sjfQuizAnswers[qIdx];
                  const isAnswered = selectedOpt !== null;
                  const isCorrect = selectedOpt === q.correct;

                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-4 transition ${
                        isAnswered
                          ? isCorrect
                            ? "border-emerald-500/60 bg-emerald-950/15"
                            : "border-rose-500/60 bg-rose-950/15"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-white text-xs md:text-sm">
                          {qIdx + 1}. {q.question}
                        </h4>
                        {isAnswered && (
                          <span
                            className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${
                              isCorrect
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            }`}
                          >
                            {isCorrect ? "✓ Benar" : "✕ Belum Tepat"}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isOptionSelected = selectedOpt === optIdx;
                          let btnStyle = "border-white/10 bg-white/[0.02] text-gray-300 hover:bg-white/[0.06] hover:border-white/20";

                          if (isOptionSelected) {
                            if (isCorrect) {
                              btnStyle = "border-emerald-400 bg-emerald-500/25 text-emerald-200 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                            } else {
                              btnStyle = "border-rose-400 bg-rose-500/25 text-rose-200 font-semibold shadow-[0_0_15px_rgba(244,63,94,0.3)]";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectSjfQuiz(qIdx, optIdx)}
                              className={`w-full text-left rounded-lg border p-2.5 text-xs transition flex items-center justify-between ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {isOptionSelected && (
                                <span className="ml-2 font-bold text-xs">
                                  {isCorrect ? "✓" : "✕"}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Feedback Text */}
                      {isAnswered && (
                        <div className="mt-2.5 text-[11px]">
                          {isCorrect ? (
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              <span>✓</span> Pilihan tepat! Sesuai dengan prinsip Shortest Job First (SJF).
                            </span>
                          ) : (
                            <span className="text-rose-400 font-medium flex items-center gap-1">
                              <span>⚠️</span> Jawaban kurang tepat. Pelajari kembali materi dan pilih opsi lain!
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Status Box & Tombol Selesai */}
                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-300">
                        Status Kuis:{" "}
                        <span className={isSjfQuizAllCorrect ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                          {sjfQuizAnswers.filter((ans, idx) => ans === sjfQuestions[idx].correct).length} dari 3 Soal Benar
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {isSjfQuizAllCorrect
                          ? "Semua jawaban benar! Silakan klik tombol untuk mematikan Laser 5."
                          : "Jawab seluruh 3 soal dengan benar untuk membuka kunci Laser 5."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleCloseTes1Modal}
                        className="rounded-xl border border-white/20 px-3.5 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition"
                      >
                        Tutup
                      </button>

                      {isSjfQuizAllCorrect || isTes1Done ? (
                        <button
                          type="button"
                          onClick={handleCompleteSjfMateri}
                          className="flex-1 sm:flex-initial rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-2.5 text-xs md:text-sm font-bold text-white shadow-[0_0_25px_rgba(16,185,129,0.5)] transition hover:scale-105 active:scale-95"
                        >
                          ✓ {isTes1Done ? "Tutup (Laser 5 Telah Padam)" : "Selesai & Padamkan Laser 5 ➔"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="flex-1 sm:flex-initial rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs md:text-sm font-bold text-gray-500 cursor-not-allowed"
                        >
                          🔒 Jawab Semua Benar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL 5: TRIGGER 3 / MATERI 3 ROUND ROBIN & KUIS (MEMATIKAN LASER 6)
          ═══════════════════════════════════════════════════════ */}
      {showTes2Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-blue-500/70 bg-[#0d091e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_50px_rgba(59,130,246,0.4)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-blue-500/40 pb-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-blue-400 animate-ping" />
                <div>
                  <h2 className="text-base md:text-lg font-bold text-blue-300 tracking-wider uppercase">
                    🖥️ OMNI LOG // PENJADWALAN ROUND ROBIN (RR)
                  </h2>
                  <p className="text-[11px] text-gray-400">Trigger 3 • Modul Algoritma Penjadwalan & Kuis Pemahaman</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseTes2Modal}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-400 hover:text-white hover:border-blue-400 transition"
              >
                ✕ Tutup
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-4 flex items-center gap-2 border-b border-white/10 pb-2">
              <button
                type="button"
                onClick={() => setTes2ModalTab("material")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  tes2ModalTab === "material"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-400/50 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                }`}
              >
                <span>📖</span> Ringkasan Materi RR
              </button>
              <button
                type="button"
                onClick={() => setTes2ModalTab("quiz")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  tes2ModalTab === "quiz"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                }`}
              >
                <span>📝</span> Kuis Pemahaman (3 Soal)
                <span
                  className={`ml-1 rounded px-1.5 py-0.2 text-[10px] font-bold ${
                    isRrQuizAllCorrect
                      ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                      : "bg-white/10 text-gray-300"
                  }`}
                >
                  {rrQuizAnswers.filter((ans, idx) => ans === rrQuestions[idx].correct).length}/3
                </span>
              </button>
            </div>

            {/* TAB 1: MATERI ROUND ROBIN */}
            {tes2ModalTab === "material" && (
              <div className="mt-4 space-y-4 text-xs md:text-sm text-gray-300 leading-relaxed">
                <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4">
                  <h3 className="font-bold text-blue-300 text-sm md:text-base">
                    Algoritma Penjadwalan: Round Robin (RR)
                  </h3>
                  <p className="mt-2 text-gray-200">
                    <strong>Round Robin (RR)</strong> adalah algoritma penjadwalan CPU yang dirancang khusus untuk sistem <em>time-sharing</em>. Setiap proses mendapat jatah waktu eksekusi yang sama secara bergiliran sebesar <strong>Time Quantum (q)</strong> (umumnya 10–100 milidetik) dari antrean melingkar (<em>circular queue</em> / FIFO).
                  </p>
                </div>

                <div className="rounded-xl border border-purple-500/30 bg-white/[0.03] p-4">
                  <h4 className="font-bold text-purple-300">1. Sifat Penjadwalan: Preemptive</h4>
                  <p className="mt-1">
                    Jika proses belum selesai setelah jatah <strong>Time Quantum (q)</strong> miliknya habis, CPU akan menghentikan proses tersebut sementara (<em>preempted</em>) dan mengembalikannya ke bagian belakang antrean (<em>Ready Queue</em>) untuk menunggu giliran berikutnya. Jika proses selesai sebelum <em>q</em> habis, proses langsung melepaskan CPU secara sukarela.
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-white/[0.03] p-4">
                  <h4 className="font-bold text-amber-300">2. Keuntungan & Kekurangan (Pengaruh Time Quantum)</h4>
                  <ul className="mt-1 list-disc list-inside space-y-1.5">
                    <li>
                      <strong className="text-emerald-300">Keuntungan:</strong> Sangat adil (<em>fair</em>), mencegah terjadinya <em>Starvation</em> dan <em>Convoy Effect</em>, serta memberikan <em>Response Time</em> yang cepat untuk sistem interaktif.
                    </li>
                    <li>
                      <strong className="text-rose-300">Kekurangan:</strong> Performa sangat bergantung pada ukuran <strong>Time Quantum (q)</strong>:
                      <div className="mt-1.5 ml-4 space-y-1 text-gray-300">
                        <div>• Jika <em>q</em> <strong>terlalu besar</strong>, Round Robin akan berperilaku sama persis seperti <strong>FCFS</strong>.</div>
                        <div>• Jika <em>q</em> <strong>terlalu kecil</strong>, akan terjadi terlalu banyak <strong>Context Switch</strong> (perpindahan proses) yang menimbulkan overhead tinggi dan menurunkan efisiensi CPU.</div>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-cyan-500/30 bg-white/[0.03] p-4">
                  <h4 className="font-bold text-cyan-300">3. Contoh Simulasi Singkat (Time Quantum q = 4 ms, Tiba pada t = 0 ms)</h4>
                  <p className="mt-1 text-gray-300">
                    Diketahui 3 proses dengan Burst Time: <strong>P1 = 24 ms</strong>, <strong>P2 = 3 ms</strong>, dan <strong>P3 = 3 ms</strong>.
                  </p>

                  {/* Visual Gantt Chart RR */}
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-gray-400 mb-1">Visualisasi Gantt Chart (q = 4 ms):</div>
                    <div className="flex h-10 w-full overflow-hidden rounded-lg border border-white/20 text-[10px] md:text-xs font-bold text-black font-mono">
                      <div className="flex flex-[4] items-center justify-center bg-cyan-400" title="P1: 0 - 4 ms">
                        P1(4)
                      </div>
                      <div className="flex flex-[3] items-center justify-center bg-amber-400 border-l border-black/40" title="P2: 4 - 7 ms">
                        P2(3)
                      </div>
                      <div className="flex flex-[3] items-center justify-center bg-purple-400 border-l border-black/40" title="P3: 7 - 10 ms">
                        P3(3)
                      </div>
                      <div className="flex flex-[4] items-center justify-center bg-cyan-400 border-l border-black/40" title="P1: 10 - 14 ms">
                        P1(4)
                      </div>
                      <div className="flex flex-[4] items-center justify-center bg-cyan-300 border-l border-black/40" title="P1: 14 - 18 ms">
                        P1(4)
                      </div>
                      <div className="flex flex-[4] items-center justify-center bg-cyan-400 border-l border-black/40" title="P1: 18 - 22 ms">
                        P1(4)
                      </div>
                      <div className="flex flex-[4] items-center justify-center bg-cyan-300 border-l border-black/40" title="P1: 22 - 26 ms">
                        P1(4)
                      </div>
                      <div className="flex flex-[4] items-center justify-center bg-cyan-400 border-l border-black/40" title="P1: 26 - 30 ms">
                        P1(4)
                      </div>
                    </div>
                    {/* Timeline markers */}
                    <div className="mt-1 flex justify-between font-mono text-[9px] md:text-[10px] text-gray-400">
                      <span>0</span>
                      <span>4</span>
                      <span>7</span>
                      <span className="font-bold text-purple-300">10 (P3 fin)</span>
                      <span>14</span>
                      <span>18</span>
                      <span>22</span>
                      <span>26</span>
                      <span>30 ms</span>
                    </div>
                  </div>

                  {/* Penjelasan Siklus & Waiting Time */}
                  <div className="mt-3 bg-black/40 p-3 rounded-lg border border-white/5 space-y-2 text-xs">
                    <div>
                      <strong className="text-gray-200">Penjelasan Siklus:</strong>
                      <p className="mt-0.5 text-gray-300 leading-normal">
                        Pada putaran pertama, P1 berjalan 4 ms (sisa 20 ms) lalu dialihkan ke belakang antrean; P2 berjalan 3 ms (langsung selesai sebelum 4 ms habis); P3 berjalan 3 ms (langsung selesai pada t = 10 ms); kemudian P1 melanjutkan sisa 20 ms waktunya per 4 ms hingga tuntas di t = 30 ms.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-white/10 font-mono">
                      <div className="font-bold text-blue-300">Waiting Time (WT):</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 mt-1 text-gray-300">
                        <div>• P1 = 10 - 4 = 6 ms</div>
                        <div>• P2 = 4 ms</div>
                        <div>• P3 = 7 ms</div>
                      </div>
                      <div className="mt-2 text-amber-300 font-semibold">
                        Rata-rata WT: (6 + 4 + 7) / 3 = <span className="text-emerald-300 font-bold text-sm">5,67 ms</span>{" "}
                        <span className="text-[10px] text-gray-400">(Jauh lebih responsif dibanding FCFS yang bernilai 17 ms!)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-500/40 bg-blue-950/30 p-3.5 text-blue-200">
                  <p className="font-semibold text-blue-300 flex items-center gap-1.5">
                    <span>💡</span> Syarat Mematikan Laser 6:
                  </p>
                  <p className="mt-1 text-xs">
                    Kerjakan <strong>Kuis Singkat (3 Soal)</strong> berdasarkan materi Round Robin di atas. Setelah ke-3 soal dijawab dengan benar, <strong>Laser 6 (Biru Tua Vertikal)</strong> akan dinonaktifkan!
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleCloseTes2Modal}
                    className="rounded-xl border border-white/20 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    Tutup Sementara
                  </button>
                  <button
                    type="button"
                    onClick={() => setTes2ModalTab("quiz")}
                    className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 px-6 py-2.5 text-xs md:text-sm font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] transition hover:scale-105 active:scale-95"
                  >
                    Lanjut ke Kuis Pemahaman (3 Soal) ➔
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: KUIS SINGKAT ROUND ROBIN (3 SOAL) */}
            {tes2ModalTab === "quiz" && (
              <div className="mt-4 space-y-5 text-xs md:text-sm text-gray-300 leading-relaxed">
                <div className="flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-950/20 px-4 py-2.5">
                  <div className="text-xs text-blue-200">
                    Pilih jawaban yang benar untuk setiap soal Round Robin. Warna hijau menandakan jawaban benar.
                  </div>
                  <button
                    type="button"
                    onClick={() => setTes2ModalTab("material")}
                    className="flex items-center gap-1 rounded-lg border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 transition"
                  >
                    📖 Review Materi
                  </button>
                </div>

                {rrQuestions.map((q, qIdx) => {
                  const selectedOpt = rrQuizAnswers[qIdx];
                  const isAnswered = selectedOpt !== null;
                  const isCorrect = selectedOpt === q.correct;

                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-4 transition ${
                        isAnswered
                          ? isCorrect
                            ? "border-emerald-500/60 bg-emerald-950/15"
                            : "border-rose-500/60 bg-rose-950/15"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-white text-xs md:text-sm">
                          {qIdx + 1}. {q.question}
                        </h4>
                        {isAnswered && (
                          <span
                            className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${
                              isCorrect
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            }`}
                          >
                            {isCorrect ? "✓ Benar" : "✕ Belum Tepat"}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isOptionSelected = selectedOpt === optIdx;
                          let btnStyle = "border-white/10 bg-white/[0.02] text-gray-300 hover:bg-white/[0.06] hover:border-white/20";

                          if (isOptionSelected) {
                            if (isCorrect) {
                              btnStyle = "border-emerald-400 bg-emerald-500/25 text-emerald-200 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                            } else {
                              btnStyle = "border-rose-400 bg-rose-500/25 text-rose-200 font-semibold shadow-[0_0_15px_rgba(244,63,94,0.3)]";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectRrQuiz(qIdx, optIdx)}
                              className={`w-full text-left rounded-lg border p-2.5 text-xs transition flex items-center justify-between ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {isOptionSelected && (
                                <span className="ml-2 font-bold text-xs">
                                  {isCorrect ? "✓" : "✕"}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Feedback Text */}
                      {isAnswered && (
                        <div className="mt-2.5 text-[11px]">
                          {isCorrect ? (
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              <span>✓</span> Pilihan tepat! Sesuai dengan prinsip Round Robin (RR).
                            </span>
                          ) : (
                            <span className="text-rose-400 font-medium flex items-center gap-1">
                              <span>⚠️</span> Jawaban kurang tepat. Pelajari kembali materi dan pilih opsi lain!
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Status Box & Tombol Selesai */}
                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-300">
                        Status Kuis:{" "}
                        <span className={isRrQuizAllCorrect ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                          {rrQuizAnswers.filter((ans, idx) => ans === rrQuestions[idx].correct).length} dari 3 Soal Benar
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {isRrQuizAllCorrect
                          ? "Semua jawaban benar! Silakan klik tombol untuk mematikan Laser 6."
                          : "Jawab seluruh 3 soal dengan benar untuk membuka kunci Laser 6."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleCloseTes2Modal}
                        className="rounded-xl border border-white/20 px-3.5 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition"
                      >
                        Tutup
                      </button>

                      {isRrQuizAllCorrect || isTes2Done ? (
                        <button
                          type="button"
                          onClick={handleCompleteRrMateri}
                          className="flex-1 sm:flex-initial rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-2.5 text-xs md:text-sm font-bold text-white shadow-[0_0_25px_rgba(16,185,129,0.5)] transition hover:scale-105 active:scale-95"
                        >
                          ✓ {isTes2Done ? "Tutup (Laser 6 Telah Padam)" : "Selesai & Padamkan Laser 6 ➔"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="flex-1 sm:flex-initial rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs md:text-sm font-bold text-gray-500 cursor-not-allowed"
                        >
                          🔒 Jawab Semua Benar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Efek Laser Sci-Fi */}
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

        /* Animasi Laser Hidup (Flicker, Surge, Sparkle) */
        @keyframes laserFlicker {
          0%, 100% {
            opacity: 1;
            filter: drop-shadow(0 0 16px rgba(6, 182, 212, 0.95)) drop-shadow(0 0 30px rgba(59, 130, 246, 0.7));
          }
          20% {
            opacity: 0.86;
            filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.75)) drop-shadow(0 0 18px rgba(59, 130, 246, 0.5));
          }
          40% {
            opacity: 1;
            filter: drop-shadow(0 0 20px rgba(6, 182, 212, 1)) drop-shadow(0 0 35px rgba(59, 130, 246, 0.85));
          }
          65% {
            opacity: 0.92;
            filter: drop-shadow(0 0 12px rgba(6, 182, 212, 0.8)) drop-shadow(0 0 22px rgba(59, 130, 246, 0.6));
          }
          85% {
            opacity: 0.84;
            filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.65));
          }
        }
        .laser-alive {
          animation: laserFlicker 0.16s infinite alternate ease-in-out;
        }

        @keyframes laserCoreFlicker {
          0%, 100% {
            opacity: 0.98;
            transform: scaleX(1);
          }
          50% {
            opacity: 0.75;
            transform: scaleX(0.7);
          }
        }
        .laser-core-flicker {
          animation: laserCoreFlicker 0.12s infinite alternate ease-in-out;
        }

        @keyframes laserPulseFlow {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(200%);
          }
        }
        .laser-energy-pulse {
          animation: laserPulseFlow 1.1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes laserPulseFlowH {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        .laser-energy-pulse-h {
          animation: laserPulseFlowH 1.1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes laserSparkle {
          0%, 100% {
            transform: scale(0.7) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.3) rotate(180deg);
            opacity: 1;
          }
        }
        .laser-sparkle-1 {
          animation: laserSparkle 0.75s ease-in-out infinite;
        }
        .laser-sparkle-2 {
          animation: laserSparkle 0.55s ease-in-out infinite reverse;
        }
      `}</style>
    </main>
  );
}

