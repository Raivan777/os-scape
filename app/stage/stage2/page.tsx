"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ──────────────────────────────────────────────────────────────
// TIPE DATA MISI & MINI GAME
// ──────────────────────────────────────────────────────────────
interface TaskState {
  plate: boolean;
  lever: boolean;
  materi: boolean;
  key: boolean;
  game: boolean;
}

interface AlgoSlot {
  id: number;
  total: number;
  remaining: number;
}

interface AlgoCargo {
  id: number;
  size: number;
}

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
  const [facingRight, setFacingRight] = useState(false);
  const [isWalking, setIsWalking] = useState(false);

  // 2. State Sistem Misi
  const [tasks, setTasks] = useState<TaskState>({
    plate: false,
    lever: false,
    materi: false,
    key: false,
    game: false,
  });
  const tasksRef = useRef<TaskState>({
    plate: false,
    lever: false,
    materi: false,
    key: false,
    game: false,
  });
  tasksRef.current = tasks;

  // 3. State Kotak Kargo (Dapat Didorong) di Lantai Kanan
  // Ukuran 44x44, posisi lantai y = 572 - 44 = 528, batas X: 720 s/d 955
  const [boxX, setBoxX] = useState(790);
  const boxXRef = useRef(790);

  // 4. State Titik Aman Terakhir (Untuk Reset Kolam Plasma)
  const safeGroundRef = useRef({ x: SPAWN_X, y: SPAWN_Y });

  // 5. State Animasi & Interaksi
  const [isSuctioning, setIsSuctioning] = useState(false);
  const isSuctioningRef = useRef(false);
  const [teleportToast, setTeleportToast] = useState<string | null>(null);
  const lockedToastCooldownRef = useRef(0);
  const plasmaToastCooldownRef = useRef(0);

  // 6. State Modal Materi & Mini Game
  const [showMateriModal, setShowMateriModal] = useState(false);
  const showMateriModalRef = useRef(false);
  showMateriModalRef.current = showMateriModal;
  const [materiSlide, setMateriSlide] = useState(0);

  const [showGameModal, setShowGameModal] = useState(false);
  const showGameModalRef = useRef(false);
  showGameModalRef.current = showGameModal;

  // 7. State Mini Game "Cargo Bay Partitioning"
  const roundAlgos = useMemo(() => ["first", "best", "worst"] as const, []);
  const [roundIdx, setRoundIdx] = useState(0);
  const [gameScore, setGameScore] = useState(0);
  const [gameLives, setGameLives] = useState(3);
  const [currentScenario, setCurrentScenario] = useState<{ slots: AlgoSlot[]; cargos: AlgoCargo[] }>({
    slots: [],
    cargos: [],
  });
  const [currentSlots, setCurrentSlots] = useState<AlgoSlot[]>([]);
  const [currentCargoIdx, setCurrentCargoIdx] = useState(0);
  const [placedCargos, setPlacedCargos] = useState<{ id: number; size: number; placedAt: number | "queue" }[]>([]);
  const [scannedSlotIds, setScannedSlotIds] = useState<number[]>([]);
  const [gameFeedback, setGameFeedback] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isGameWon, setIsGameWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // ──────────────────────────────────────────────────────────────
  // KONSTANTA TATA LETAK & OBJEK LEVEL (JANGAN DIUBAH KOORDINATNYA)
  // ──────────────────────────────────────────────────────────────
  const GATE_STAGE3 = true;

  const platforms = [
    { id: 1, x: 40, y: 543, w: 581, h: 40, label: "Lantai Kiri" },
    { id: 2, x: 652, y: 572, w: 347, h: 26, label: "Lantai Kanan" },
    { id: 3, x: 109, y: 426, w: 108, h: 26, label: "Platform 1" },
    { id: 4, x: -5, y: 248, w: 386, h: 43, label: "Platform 2" },
    { id: 5, x: 737, y: 307, w: 262, h: 26, label: "Platform 3" },
    { id: 6, x: 809, y: 190, w: 193, h: 26, label: "Platform 4" },
  ];

  const ramp = {
    xStart: 40 + 581, // 621 px
    xEnd: 652,        // 652 px
    yStart: 543,
    yEnd: 572,
    hLeft: 40,
    hRight: 26,
  };

  const barriers = [
    { id: 1, label: "Penghalang Plat 2", x: 381, y: 0, w: 14, h: 295 },
    { id: 2, label: "Penghalang Plat 4", x: 795, y: 0, w: 14, h: 220 },
    { id: 3, label: "Penghalang Plat 3", x: 723, y: 70, w: 14, h: 270 },
  ];

  const nextStagePortal = {
    x: -11,
    y: 173,
    w: 56,
    h: 75,
    label: "PORTAL KE STAGE 3",
    targetUrl: "/stage/stage3",
  };

  const portals = [
    { id: "p1-in", name: "portal masuk 1", pair: 1, targetId: "p1-out", x: 142, y: 364, w: 44, h: 65 },
    { id: "p1-out", name: "portal keluar 1", pair: 1, targetId: "p1-in", x: 142, y: 183, w: 44, h: 65 },
    { id: "p2-in", name: "portal masuk 2", pair: 2, targetId: "p2-out", x: 964, y: 126, w: 44, h: 65 },
    { id: "p2-out", name: "portal keluar 2", pair: 2, targetId: "p2-in", x: 964, y: 507, w: 44, h: 65 },
    { id: "p3-in", name: "portal masuk 3", pair: 3, targetId: "p3-out", x: 805, y: 242, w: 44, h: 65 },
    { id: "p3-out", name: "portal keluar 3", pair: 3, targetId: "p3-in", x: 798, y: 125, w: 45, h: 65 },
  ];

  // Objek Misi Khusus
  const pressurePlateObj = { x: 862, y: 564, w: 58, h: 8 };
  const yellowGateObj = { x: 638, y: 372, w: 14, h: 200 };
  const leverObj = { x: 190, y: 392, w: 22, h: 34 };
  const purpleGateObj = { x: 232, y: 90, w: 14, h: 158 };
  const keycardObj = { x: 912, y: 162, w: 26, h: 26 };
  const plasmaPools = [
    { id: 1, x: 250, y: 531, w: 70, h: 12 },
    { id: 2, x: 400, y: 531, w: 45, h: 12 },
  ];

  // Zona Interaksi Platform 2
  const materiZone = { x: 272, y: 170, w: 74, h: 78 };
  const consoleZone = { x: 36, y: 178, w: 52, h: 70 };

  // Penanda Atas (Dashed Area Header)
  const markerMateri = { x: 220, y: 50, w: 130, h: 42, label: "[ Area Materi ]" };
  const markerMiniGame = { x: 150, y: 50, w: 130, h: 42, label: "[ Mini Game ]" };

  // ──────────────────────────────────────────────────────────────
  // REFS UNTUK GAME LOOP & KONTROL
  // ──────────────────────────────────────────────────────────────
  const teleportCooldownRef = useRef(0);
  const hasExitedPortalRef = useRef(true);
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: playerX, y: playerY, vy: velocityY, jumping: isJumping });
  playerRef.current = { x: playerX, y: playerY, vy: velocityY, jumping: isJumping };

  // Timer Toast
  useEffect(() => {
    if (!teleportToast) return;
    const t = setTimeout(() => setTeleportToast(null), 2500);
    return () => clearTimeout(t);
  }, [teleportToast]);

  // Kosongkan tombol yang sedang ditekan saat modal dibuka atau ditutup
  useEffect(() => {
    keysPressed.current.clear();
  }, [showMateriModal, showGameModal]);

  // ──────────────────────────────────────────────────────────────
  // GENERATOR SOAL MINI GAME (RANDOM SETIAP SESI)
  // ──────────────────────────────────────────────────────────────
  function simulateAlgo(
    algo: "first" | "best" | "worst",
    slotSizes: number[],
    cargoSizes: number[]
  ): { allocations: (number | "queue")[]; queueCount: number } {
    const rem = [...slotSizes];
    const allocations: (number | "queue")[] = [];
    let queueCount = 0;

    for (const cSize of cargoSizes) {
      const valid = rem.map((r, idx) => ({ idx, rem: r })).filter(item => item.rem >= cSize);
      if (valid.length === 0) {
        allocations.push("queue");
        queueCount++;
      } else if (algo === "first") {
        const chosen = valid[0];
        allocations.push(chosen.idx);
        rem[chosen.idx] -= cSize;
      } else if (algo === "best") {
        const minRem = Math.min(...valid.map(v => v.rem));
        const chosen = valid.find(v => v.rem === minRem)!;
        allocations.push(chosen.idx);
        rem[chosen.idx] -= cSize;
      } else if (algo === "worst") {
        const maxRem = Math.max(...valid.map(v => v.rem));
        const chosen = valid.find(v => v.rem === maxRem)!;
        allocations.push(chosen.idx);
        rem[chosen.idx] -= cSize;
      }
    }
    return { allocations, queueCount };
  }

  function generateRoundScenario(algo: "first" | "best" | "worst"): { slots: AlgoSlot[]; cargos: AlgoCargo[] } {
    const possibleSlots = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600];
    const possibleCargos = [50, 100, 150, 200, 250, 300, 350, 400, 450];

    for (let attempt = 0; attempt < 60; attempt++) {
      const shuffledSlots = [...possibleSlots].sort(() => Math.random() - 0.5).slice(0, 5);
      const chosenCargos = Array.from({ length: 4 }, () =>
        possibleCargos[Math.floor(Math.random() * possibleCargos.length)]
      );

      const resThis = simulateAlgo(algo, shuffledSlots, chosenCargos);
      if (resThis.queueCount > 1) continue; // Syarat: Maksimal 1 kargo tidak muat

      const otherAlgos = (["first", "best", "worst"] as const).filter(a => a !== algo);
      const diffCount = otherAlgos.filter(other => {
        const resOther = simulateAlgo(other, shuffledSlots, chosenCargos);
        return resThis.allocations.some((al, idx) => al !== resOther.allocations[idx]);
      }).length;

      // Prioritaskan yang berbeda dari KEDUA algoritma lain, atau minimal 1 jika attempt > 30
      if (diffCount === otherAlgos.length || (attempt > 30 && diffCount >= 1)) {
        return {
          slots: shuffledSlots.map((total, id) => ({ id, total, remaining: total })),
          cargos: chosenCargos.map((size, id) => ({ id, size })),
        };
      }
    }

    // Default Fallback
    if (algo === "first") {
      return {
        slots: [200, 450, 150, 350, 500].map((total, id) => ({ id, total, remaining: total })),
        cargos: [300, 150, 200, 400].map((size, id) => ({ id, size })),
      };
    } else if (algo === "best") {
      return {
        slots: [100, 500, 200, 300, 600].map((total, id) => ({ id, total, remaining: total })),
        cargos: [200, 400, 100, 450].map((size, id) => ({ id, size })),
      };
    } else {
      return {
        slots: [250, 550, 300, 400, 150].map((total, id) => ({ id, total, remaining: total })),
        cargos: [200, 350, 150, 300].map((size, id) => ({ id, size })),
      };
    }
  }

  function startMiniGameSession() {
    setRoundIdx(0);
    setGameScore(0);
    setGameLives(3);
    setIsGameWon(false);
    setIsGameOver(false);
    setPlacedCargos([]);
    setScannedSlotIds([]);
    setGameFeedback(null);

    const firstScen = generateRoundScenario("first");
    setCurrentScenario(firstScen);
    setCurrentSlots(firstScen.slots);
    setCurrentCargoIdx(0);
    setShowGameModal(true);
  }

  // ──────────────────────────────────────────────────────────────
  // LOGIKA AKSI KONSOL, MATERI & STAGE 3
  // ──────────────────────────────────────────────────────────────
  const isGameUnlocked = tasks.plate && tasks.lever && tasks.materi && tasks.key;

  const handleInteractE = () => {
    if (showMateriModalRef.current || showGameModalRef.current || isSuctioningRef.current) return;

    const p = playerRef.current;
    const pCenterX = p.x + PLAYER_W / 2;
    const pCenterY = p.y + PLAYER_H / 2;

    // Hitung jarak ke 3 zona interaksi utama
    const distLever = Math.hypot(pCenterX - (leverObj.x + leverObj.w / 2), pCenterY - (leverObj.y + leverObj.h / 2));
    const distMateri = Math.hypot(pCenterX - (materiZone.x + materiZone.w / 2), pCenterY - (materiZone.y + materiZone.h / 2));
    const distConsole = Math.hypot(pCenterX - (consoleZone.x + consoleZone.w / 2), pCenterY - (consoleZone.y + consoleZone.h / 2));

    let closestTarget: "lever" | "materi" | "console" | null = null;
    let minDist = 75;

    if (distLever < minDist) {
      minDist = distLever;
      closestTarget = "lever";
    }
    if (distMateri < minDist) {
      minDist = distMateri;
      closestTarget = "materi";
    }
    if (distConsole < minDist) {
      minDist = distConsole;
      closestTarget = "console";
    }

    if (closestTarget === "lever") {
      if (!tasksRef.current.lever) {
        setTasks(prev => ({ ...prev, lever: true }));
        tasksRef.current.lever = true;
        setTeleportToast("⚡ Tuas ditarik! Gerbang ungu terbuka.");
      }
      return;
    }

    if (closestTarget === "materi") {
      setShowMateriModal(true);
      keysPressed.current.clear();
      return;
    }

    if (closestTarget === "console") {
      if (isGameUnlocked) {
        startMiniGameSession();
        keysPressed.current.clear();
      } else {
        const missing: string[] = [];
        if (!tasksRef.current.plate) missing.push("Kotak ke Tombol");
        if (!tasksRef.current.lever) missing.push("Tarik Tuas");
        if (!tasksRef.current.materi) missing.push("Baca Materi");
        if (!tasksRef.current.key) missing.push("Ambil Keycard");
        setTeleportToast(`🔒 Konsol terkunci! Belum selesai: ${missing.join(", ")}`);
      }
      return;
    }

    // Fallback: Portal Stage 3
    const distPortalX = Math.abs(pCenterX - (nextStagePortal.x + nextStagePortal.w / 2));
    const distPortalY = Math.abs(pCenterY - (nextStagePortal.y + nextStagePortal.h / 2));
    if (distPortalX < 70 && distPortalY < 75) {
      handleStage3PortalEnter();
    }
  };

  const handleStage3PortalEnter = () => {
    if (isSuctioningRef.current) return;

    if (!tasksRef.current.game) {
      const now = Date.now();
      if (now > lockedToastCooldownRef.current) {
        lockedToastCooldownRef.current = now + 2500;
        setTeleportToast("🔒 Portal Terkunci! Selesaikan mini game Cargo Bay terlebih dahulu.");
      }
      return;
    }

    // Portal Aktif: Jalankan animasi astronot tersedot ke atas (durasi 700 ms)
    setIsSuctioning(true);
    isSuctioningRef.current = true;
    setTeleportToast("🚀 Memasuki Portal Menuju Stage 3...");
    setTimeout(() => {
      router.push(nextStagePortal.targetUrl);
    }, 700);
  };

  // ──────────────────────────────────────────────────────────────
  // EVENT LISTENER KEYBOARD
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        e.preventDefault();
      }

      if (key === "escape") {
        if (showMateriModalRef.current) setShowMateriModal(false);
        if (showGameModalRef.current) setShowGameModal(false);
        keysPressed.current.clear();
        return;
      }

      if (key === "e") {
        handleInteractE();
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
  }, [isGameUnlocked]);

  // ──────────────────────────────────────────────────────────────
  // GAME LOOP FISIKA 60 FPS
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      // Pause pembaruan fisika saat modal aktif atau sedang tersedot
      if (showMateriModalRef.current || showGameModalRef.current || isSuctioningRef.current) {
        animId = requestAnimationFrame(gameLoop);
        return;
      }

      let p = { ...playerRef.current };
      const keys = keysPressed.current;

      // 1. Kontrol Horizontal (A / D)
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

      // 2. Lompat (W / Spasi)
      const wantsJump = keys.has("w") || keys.has("arrowup") || keys.has(" ");
      if (wantsJump && !p.jumping) {
        p.vy = JUMP_POWER;
        p.jumping = true;
      }

      // 3. Batasan Penghalang Aktif
      const activeBarriers = [
        ...barriers,
        ...(!tasksRef.current.plate ? [yellowGateObj] : []),
        ...(!tasksRef.current.lever ? [purpleGateObj] : []),
      ];

      // 4. Hitung Posisi X & Tabrakan Penghalang
      // Izinkan pergerakan hingga batas portal tepi kanan (x: 964)
      let nextX = Math.max(0, Math.min(p.x + moveX, GAME_WIDTH - 36));

      for (const barrier of activeBarriers) {
        const vOverlap = p.y + PLAYER_H > barrier.y + 2 && p.y < barrier.y + barrier.h - 2;
        if (vOverlap) {
          if (moveX > 0 && p.x + PLAYER_W <= barrier.x + 4 && nextX + PLAYER_W > barrier.x) {
            nextX = barrier.x - PLAYER_W;
          } else if (moveX < 0 && p.x >= barrier.x + barrier.w - 4 && nextX < barrier.x + barrier.w) {
            nextX = barrier.x + barrier.w;
          } else if (p.x + PLAYER_W > barrier.x && p.x < barrier.x + barrier.w) {
            nextX = p.x + PLAYER_W / 2 < barrier.x + barrier.w / 2 ? barrier.x - PLAYER_W : barrier.x + barrier.w;
          }
        }
      }

      // 5. Interaksi Mendorong Kotak Kargo (Lantai Kanan y = 528, batas X: 720..955)
      const bX = boxXRef.current;
      const bY = 528;
      const bW = 44;
      const bH = 44;

      const vOverlapBox = p.y + PLAYER_H > bY + 6 && p.y < bY + bH - 4;
      if (vOverlapBox) {
        if (moveX > 0 && p.x + PLAYER_W <= bX + 6 && nextX + PLAYER_W > bX) {
          let newBoxX = nextX + PLAYER_W;
          if (newBoxX > 955) {
            newBoxX = 955;
            nextX = 955 - PLAYER_W;
          } else {
            nextX = newBoxX - PLAYER_W;
          }
          boxXRef.current = newBoxX;
          setBoxX(newBoxX);
        } else if (moveX < 0 && p.x >= bX + bW - 6 && nextX < bX + bW) {
          let newBoxX = nextX - bW;
          if (newBoxX < 720) {
            newBoxX = 720;
            nextX = 720 + bW;
          } else {
            nextX = newBoxX + bW;
          }
          boxXRef.current = newBoxX;
          setBoxX(newBoxX);
        }
      }

      p.x = nextX;

      // Pijakan di Atas Kotak Kargo
      const isStandingOnBox =
        p.x + PLAYER_W > bX + 4 &&
        p.x < bX + bW - 4 &&
        p.y + PLAYER_H >= bY &&
        p.y + PLAYER_H - p.vy <= bY + 14;

      if (isStandingOnBox && p.vy >= 0) {
        p.y = bY - PLAYER_H;
        p.vy = 0;
        p.jumping = false;
      }

      // Cek Tekanan Tombol Kuning oleh Kotak (Titik Tengah Kotak bX + 22)
      const boxCenter = boxXRef.current + 22;
      if (boxCenter >= pressurePlateObj.x && boxCenter <= pressurePlateObj.x + pressurePlateObj.w) {
        if (!tasksRef.current.plate) {
          setTasks(prev => ({ ...prev, plate: true }));
          tasksRef.current.plate = true;
          setTeleportToast("⚡ Tombol tertekan! Gerbang kuning terbuka.");
        }
      }

      // 6. Gravitasi & Pergerakan Vertikal
      p.vy += GRAVITY;
      let nextY = p.y + p.vy;

      for (const barrier of activeBarriers) {
        const hOverlap = p.x + PLAYER_W > barrier.x + 2 && p.x < barrier.x + barrier.w - 2;
        if (hOverlap) {
          if (p.vy > 0 && p.y + PLAYER_H <= barrier.y + 12 && nextY + PLAYER_H >= barrier.y) {
            nextY = barrier.y - PLAYER_H;
            p.vy = 0;
            p.jumping = false;
          } else if (p.vy < 0 && p.y >= barrier.y + barrier.h - 12 && nextY <= barrier.y + barrier.h) {
            nextY = barrier.y + barrier.h;
            p.vy = 0;
          }
        }
      }
      p.y = nextY;

      // 7. Collision Ramp Zone & Platform Normal
      let onRamp = false;
      const playerFootX = p.x + PLAYER_W / 2;

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

      if (!onRamp && !isStandingOnBox) {
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

      // Rekam Posisi Tanah Aman (Bukan di area kolam plasma)
      const inPlasmaZone =
        (playerFootX >= 240 && playerFootX <= 330) ||
        (playerFootX >= 390 && playerFootX <= 455);

      if (!p.jumping && p.vy === 0 && !inPlasmaZone && p.y < 580) {
        safeGroundRef.current = { x: p.x, y: p.y };
      }

      // 8. Bahaya Kolam Plasma Neon
      const playerBottom = p.y + PLAYER_H;
      const hitPlasma = plasmaPools.some(
        pool =>
          p.x + PLAYER_W > pool.x + 8 &&
          p.x < pool.x + pool.w - 8 &&
          playerBottom >= pool.y &&
          playerBottom <= pool.y + pool.h + 10
      );

      if (hitPlasma) {
        p.x = safeGroundRef.current.x;
        p.y = safeGroundRef.current.y;
        p.vy = 0;
        p.jumping = false;
        const now = Date.now();
        if (now > plasmaToastCooldownRef.current) {
          plasmaToastCooldownRef.current = now + 1500;
          setTeleportToast("☣ Terkena radiasi plasma! Kembali ke titik aman.");
        }
      }

      // 9. Ambil Keycard di Platform 4
      if (!tasksRef.current.key) {
        if (
          p.x + PLAYER_W > keycardObj.x &&
          p.x < keycardObj.x + keycardObj.w &&
          p.y + PLAYER_H > keycardObj.y &&
          p.y < keycardObj.y + keycardObj.h
        ) {
          setTasks(prev => ({ ...prev, key: true }));
          tasksRef.current.key = true;
          setTeleportToast("🔑 Keycard diperoleh! Misi 4 selesai.");
        }
      }

      // 10. Deteksi Teleportasi 3 Pasang Portal Internal
      const isInsideAnyPortal = portals.some(
        portal =>
          p.x + PLAYER_W > portal.x &&
          p.x < portal.x + portal.w &&
          p.y + PLAYER_H > portal.y &&
          p.y < portal.y + portal.h
      );

      if (!isInsideAnyPortal) {
        hasExitedPortalRef.current = true;
      }

      const now = Date.now();
      if (now > teleportCooldownRef.current && hasExitedPortalRef.current) {
        for (const portal of portals) {
          const portalCenterX = portal.x + portal.w / 2;
          const distToCenter = Math.abs(p.x + PLAYER_W / 2 - portalCenterX);
          // Portal di tepi kanan/kiri arena memiliki toleransi tepi agar pemain tidak terganjal batas layar
          const isEdgePortal = portal.x + portal.w >= GAME_WIDTH - 15;
          const isCenterInside = distToCenter <= 10 || (isEdgePortal && p.x + PLAYER_W >= portal.x + 12);
          const isYInside = p.y + PLAYER_H > portal.y + 8 && p.y < portal.y + portal.h + 8;

          if (isCenterInside && isYInside) {
            const target = portals.find(pt => pt.id === portal.targetId);
            if (target) {
              p.x = target.x + (target.w - PLAYER_W) / 2;
              p.y = target.y + target.h - PLAYER_H;
              p.vy = 0;
              teleportCooldownRef.current = now + 400;
              hasExitedPortalRef.current = false;
              setTeleportToast(`⚡ Teleport: ${portal.name} ➔ ${target.name}`);
              break;
            }
          }
        }
      }

      // 11. Deteksi Menyentuh Portal Stage 3
      const isTouchingNextStage =
        p.x + PLAYER_W > nextStagePortal.x + 8 &&
        p.x < nextStagePortal.x + nextStagePortal.w - 8 &&
        p.y + PLAYER_H > nextStagePortal.y + 10 &&
        p.y < nextStagePortal.y + nextStagePortal.h;

      if (isTouchingNextStage && !isSuctioningRef.current) {
        handleStage3PortalEnter();
      }

      // 12. Cek Jika Jatuh ke Bawah Layar (Reset ke Spawn tanpa mematikan loop)
      if (p.y > GAME_HEIGHT) {
        p.x = SPAWN_X;
        p.y = SPAWN_Y;
        p.vy = 0;
        p.jumping = false;
        setTeleportToast("⚠️ Terjatuh ke ruang hampa! Kembali ke titik awal.");
      }

      // Update State
      setPlayerX(p.x);
      setPlayerY(p.y);
      setVelocityY(p.vy);
      setIsJumping(p.jumping);

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // ──────────────────────────────────────────────────────────────
  // LOGIKA AKSI KONTROL DI MINI GAME
  // ──────────────────────────────────────────────────────────────
  function handleCargoPlacement(target: number | "queue") {
    if (currentCargoIdx >= currentScenario.cargos.length || isGameWon || isGameOver) return;
    const cargo = currentScenario.cargos[currentCargoIdx];
    const algo = roundAlgos[roundIdx];

    const validSlots = currentSlots.filter(s => s.remaining >= cargo.size);
    let isCorrect = false;
    let errorMsg = "";

    if (target === "queue") {
      if (validSlots.length === 0) {
        isCorrect = true;
      } else {
        isCorrect = false;
        errorMsg = "Masih ada slot yang muat! Kargo tidak boleh dimasukkan ke Antrian.";
      }
    } else {
      const chosenSlot = currentSlots.find(s => s.id === target);
      if (!chosenSlot || chosenSlot.remaining < cargo.size) {
        isCorrect = false;
        errorMsg = `Slot ${target + 1} tidak cukup! Ukuran kargo (${cargo.size} KB) > sisa (${chosenSlot ? chosenSlot.remaining : 0} KB).`;
      } else {
        if (algo === "first") {
          const firstValid = validSlots[0];
          if (target === firstValid.id) {
            isCorrect = true;
          } else {
            isCorrect = false;
            errorMsg = `First-Fit harus memilih slot pertama yang muat (Slot ${firstValid.id + 1}, sisa ${firstValid.remaining} KB).`;
          }
        } else if (algo === "best") {
          const minRem = Math.min(...validSlots.map(s => s.remaining));
          if (chosenSlot.remaining === minRem) {
            isCorrect = true;
          } else {
            isCorrect = false;
            errorMsg = `Best-Fit harus memilih slot dengan sisa terkecil (sisa ${minRem} KB), bukan Slot ${chosenSlot.id + 1} (sisa ${chosenSlot.remaining} KB).`;
          }
        } else if (algo === "worst") {
          const maxRem = Math.max(...validSlots.map(s => s.remaining));
          if (chosenSlot.remaining === maxRem) {
            isCorrect = true;
          } else {
            isCorrect = false;
            errorMsg = `Worst-Fit harus memilih slot dengan sisa terbesar (sisa ${maxRem} KB), bukan Slot ${chosenSlot.id + 1} (sisa ${chosenSlot.remaining} KB).`;
          }
        }
      }
    }

    if (isCorrect) {
      setGameScore(s => s + 10);
      setGameFeedback({
        type: "success",
        text: target === "queue" ? `Tepat! Kargo ${cargo.size} KB diarahkan ke Antrian.` : `Tepat! Kargo ${cargo.size} KB masuk ke Slot ${Number(target) + 1}.`,
      });
      if (typeof target === "number") {
        setCurrentSlots(prev =>
          prev.map(s => (s.id === target ? { ...s, remaining: s.remaining - cargo.size } : s))
        );
      }
      setPlacedCargos(prev => [...prev, { ...cargo, placedAt: target }]);
      setScannedSlotIds([]);

      const nextIdx = currentCargoIdx + 1;
      setCurrentCargoIdx(nextIdx);

      if (nextIdx >= currentScenario.cargos.length) {
        if (roundIdx < 2) {
          setTimeout(() => {
            const nextRound = roundIdx + 1;
            setRoundIdx(nextRound);
            const nextScen = generateRoundScenario(roundAlgos[nextRound]);
            setCurrentScenario(nextScen);
            setCurrentSlots(nextScen.slots);
            setCurrentCargoIdx(0);
            setPlacedCargos([]);
            setScannedSlotIds([]);
            setGameFeedback({ type: "info", text: `Ronde Selesai! Memulai Ronde ${nextRound + 1}: ${roundAlgos[nextRound].toUpperCase()}-FIT.` });
          }, 900);
        } else {
          setTimeout(() => setIsGameWon(true), 600);
        }
      }
    } else {
      setGameScore(s => Math.max(0, s - 5));
      setGameLives(l => {
        const nextL = l - 1;
        if (nextL <= 0) setIsGameOver(true);
        return nextL;
      });
      setGameFeedback({ type: "error", text: errorMsg });
    }
  }

  function handleScanSlots() {
    if (currentCargoIdx >= currentScenario.cargos.length || isGameWon || isGameOver) return;
    const cargo = currentScenario.cargos[currentCargoIdx];
    const valids = currentSlots.filter(s => s.remaining >= cargo.size).map(s => s.id);
    setScannedSlotIds(valids);
    setGameScore(s => Math.max(0, s - 3));
    setGameFeedback({
      type: "info",
      text: `Scan radar (-3 poin): Ditemukan ${valids.length} slot yang cukup untuk kargo ${cargo.size} KB.`,
    });
  }

  // ──────────────────────────────────────────────────────────────
  // PERHITUNGAN PROMPT INTERAKSI TERDEKAT
  // ──────────────────────────────────────────────────────────────
  const pCenterX = playerX + PLAYER_W / 2;
  const pCenterY = playerY + PLAYER_H / 2;

  const isNearLever = Math.hypot(pCenterX - (leverObj.x + leverObj.w / 2), pCenterY - (leverObj.y + leverObj.h / 2)) < 65;
  const isNearMateri = Math.hypot(pCenterX - (materiZone.x + materiZone.w / 2), pCenterY - (materiZone.y + materiZone.h / 2)) < 70;
  const isNearConsole = Math.hypot(pCenterX - (consoleZone.x + consoleZone.w / 2), pCenterY - (consoleZone.y + consoleZone.h / 2)) < 70;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-3 md:p-4 select-none">
      {/* HUD Info Atas */}
      <div className="mb-2 flex w-full max-w-[1000px] flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-500/30 bg-[#09061a]/80 px-4 py-2.5 text-xs text-gray-300 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-wider text-cyan-300 uppercase font-mono">
            STAGE 2 // ALOKASI MEMORI KONTIGU
          </span>
        </div>
        <div className="font-mono text-[11px] text-gray-400 flex items-center gap-3">
          <span>Kontrol: <strong className="text-white">A/D</strong> jalan, <strong className="text-white">W/Spasi</strong> lompat, <strong className="text-cyan-300">E</strong> interaksi</span>
        </div>
      </div>

      {/* Bar Checklist Misi Berurutan */}
      <div className="mb-3 flex w-full max-w-[1000px] flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-500/20 bg-[#070415]/90 px-3.5 py-2 text-[11px] font-mono text-gray-300 shadow-[0_0_15px_rgba(0,0,0,0.8)]">
        <span className="font-bold text-amber-400">Misi:</span>
        <span className={tasks.plate ? "text-emerald-400 font-bold" : "text-gray-500"}>
          {tasks.plate ? "☑" : "☐"} Kotak ke tombol (gerbang kuning)
        </span>
        <span className={tasks.lever ? "text-emerald-400 font-bold" : "text-gray-500"}>
          {tasks.lever ? "☑" : "☐"} Tarik tuas (gerbang ungu)
        </span>
        <span className={tasks.materi ? "text-emerald-400 font-bold" : "text-gray-500"}>
          {tasks.materi ? "☑" : "☐"} Baca materi
        </span>
        <span className={tasks.key ? "text-emerald-400 font-bold" : "text-gray-500"}>
          {tasks.key ? "☑" : "☐"} Ambil keycard
        </span>
        <span className={tasks.game ? "text-emerald-400 font-bold" : "text-gray-500"}>
          {tasks.game ? "☑" : "☐"} Mini game
        </span>
      </div>

      {/* Arena Game 2D Platformer (1000px x 600px) */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/40 bg-cover bg-center bg-no-repeat shadow-[0_0_60px_rgba(6,182,212,0.25)]"
        style={{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
          backgroundImage:
            "url('/stage2bg.jpg'), url('/stage2bg.jpg'), url('/stage%202%20bg.jpg'), url('/stage%202%20bg.png'), url('/stage2bg.png')",
          backgroundColor: "#070415",
        }}
      >
        {/* Lapisan Tipis untuk Keterbacaan Visual */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />

        {/* 1. Kotak Penanda Putus-Putus MATERI di Area Atas */}
        <div
          className="absolute z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-purple-400/80 bg-purple-950/30 backdrop-blur-xs pointer-events-none"
          style={{
            left: `${markerMateri.x}px`,
            top: `${markerMateri.y}px`,
            width: `${markerMateri.w}px`,
            height: `${markerMateri.h}px`,
          }}
        >
          <span className="font-mono text-xs font-bold text-purple-300">
            {markerMateri.label}
          </span>
        </div>

        {/* 2. Kotak Penanda Putus-Putus MINI GAME di Area Atas */}
        <div
          className="absolute z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-cyan-400/80 bg-cyan-950/30 backdrop-blur-xs pointer-events-none"
          style={{
            left: `${markerMiniGame.x}px`,
            top: `${markerMiniGame.y}px`,
            width: `${markerMiniGame.w}px`,
            height: `${markerMiniGame.h}px`,
          }}
        >
          <span className="font-mono text-xs font-bold text-cyan-300">
            {markerMiniGame.label}
          </span>
        </div>

        {/* 3. Pijakan (Platforms) Hijau Transparan */}
        {platforms.map(plat => (
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

        {/* 4. Ramp Zone (Bidang Miring Penghubung Lantai Kiri & Kanan) */}
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
        </div>

        {/* 5. Garis Penghalang Laser Permanen (Merah Neon) */}
        {barriers.map(bar => (
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
            <div className="absolute inset-y-0 w-1 bg-rose-400 shadow-[0_0_8px_#f43f5e] animate-pulse" />
            <span
              className="z-10 font-mono text-[8px] font-black uppercase tracking-wider text-rose-200 drop-shadow whitespace-nowrap opacity-90 [writing-mode:vertical-rl]"
            >
              ⛔ {bar.label}
            </span>
          </div>
        ))}

        {/* Gerbang Kuning (Laser Vertikal di Ramp) — Hilang saat plate selesai */}
        {!tasks.plate && (
          <div
            className="absolute z-15 flex flex-col items-center justify-center select-none overflow-hidden rounded-md border-2 border-amber-400 bg-amber-950/70 shadow-[0_0_20px_rgba(251,191,36,0.8)] backdrop-blur-xs"
            style={{
              left: `${yellowGateObj.x}px`,
              top: `${yellowGateObj.y}px`,
              width: `${yellowGateObj.w}px`,
              height: `${yellowGateObj.h}px`,
            }}
          >
            <div className="absolute inset-y-0 w-1 bg-amber-300 shadow-[0_0_8px_#fcd34d] animate-pulse" />
            <span className="z-10 font-mono text-[8px] font-black uppercase tracking-wider text-amber-200 drop-shadow whitespace-nowrap opacity-90 [writing-mode:vertical-rl]">
              🔒 GERBANG KUNING
            </span>
          </div>
        )}

        {/* Gerbang Ungu (Laser Vertikal di Platform 2) — Hilang saat lever ditarik */}
        {!tasks.lever && (
          <div
            className="absolute z-15 flex flex-col items-center justify-center select-none overflow-hidden rounded-md border-2 border-purple-400 bg-purple-950/70 shadow-[0_0_20px_rgba(192,132,252,0.8)] backdrop-blur-xs"
            style={{
              left: `${purpleGateObj.x}px`,
              top: `${purpleGateObj.y}px`,
              width: `${purpleGateObj.w}px`,
              height: `${purpleGateObj.h}px`,
            }}
          >
            <div className="absolute inset-y-0 w-1 bg-purple-300 shadow-[0_0_8px_#d8b4fe] animate-pulse" />
            <span className="z-10 font-mono text-[8px] font-black uppercase tracking-wider text-purple-200 drop-shadow whitespace-nowrap opacity-90 [writing-mode:vertical-rl]">
              🔒 GERBANG UNGU
            </span>
          </div>
        )}

        {/* Tombol Lantai Kuning (Pressure Plate) di Lantai Kanan */}
        <div
          className={`absolute z-10 flex items-center justify-center rounded-t border transition-all ${
            tasks.plate
              ? "bg-emerald-500/80 border-emerald-300 shadow-[0_0_15px_#34d399]"
              : "bg-amber-500/60 border-amber-300 shadow-[0_0_10px_#f59e0b] animate-pulse"
          }`}
          style={{
            left: `${pressurePlateObj.x}px`,
            top: `${pressurePlateObj.y}px`,
            width: `${pressurePlateObj.w}px`,
            height: `${pressurePlateObj.h}px`,
          }}
        >
          <span className="text-[7px] font-mono font-black text-black">
            {tasks.plate ? "AKTIF" : "TOMBOL"}
          </span>
        </div>

        {/* Kotak Kargo (Bisa Didorong Kiri-Kanan) */}
        <div
          className="absolute z-15 flex flex-col items-center justify-center rounded-lg border-2 border-amber-300 bg-amber-600/90 shadow-[0_4px_14px_rgba(0,0,0,0.8)] cursor-grab"
          style={{
            left: `${boxX}px`,
            top: `528px`,
            width: `44px`,
            height: `44px`,
          }}
        >
          <span className="text-base select-none pointer-events-none">📦</span>
          <span className="text-[7px] font-mono font-black text-amber-100 uppercase pointer-events-none">
            KARGO
          </span>
        </div>

        {/* Tuas di Platform 1 */}
        <div
          className="absolute z-20 flex flex-col items-center cursor-pointer select-none"
          style={{
            left: `${leverObj.x}px`,
            top: `${leverObj.y}px`,
            width: `${leverObj.w}px`,
            height: `${leverObj.h}px`,
          }}
          onClick={handleInteractE}
        >
          {isNearLever && !tasks.lever && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce z-40 pointer-events-none">
              <span className="rounded bg-amber-400 px-2 py-0.5 text-[9px] font-black text-black shadow-md">
                [E] Tarik Tuas
              </span>
            </div>
          )}
          {/* Batang Tuas dengan Rotasi CSS */}
          <div className="relative h-full w-full flex flex-col items-center justify-end">
            <div
              className="h-6 w-1.5 rounded-full bg-gradient-to-t from-zinc-400 to-amber-300 origin-bottom transition-transform duration-300"
              style={{ transform: `rotate(${tasks.lever ? 35 : -35}deg)` }}
            >
              <div className="h-2.5 w-2.5 -ml-0.5 -mt-1 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
            </div>
            <div className="h-2 w-5 rounded-t bg-zinc-700 border border-zinc-500" />
          </div>
        </div>

        {/* Keycard 🔑 di Platform 4 */}
        {!tasks.key && (
          <div
            className="absolute z-20 flex items-center justify-center animate-bounce select-none pointer-events-none"
            style={{
              left: `${keycardObj.x}px`,
              top: `${keycardObj.y}px`,
              width: `${keycardObj.w}px`,
              height: `${keycardObj.h}px`,
            }}
          >
            <div className="flex h-full w-full items-center justify-center rounded-md border border-amber-300 bg-amber-500/80 shadow-[0_0_15px_#f59e0b]">
              <span className="text-sm">🔑</span>
            </div>
          </div>
        )}

        {/* 2 Kolam Plasma Hijau Neon di Lantai Kiri */}
        {plasmaPools.map(pool => (
          <div
            key={pool.id}
            className="absolute z-10 flex items-center justify-center rounded-sm border border-lime-300 bg-lime-500/80 shadow-[0_0_15px_#84cc16] animate-pulse select-none pointer-events-none"
            style={{
              left: `${pool.x}px`,
              top: `${pool.y}px`,
              width: `${pool.w}px`,
              height: `${pool.h}px`,
            }}
          >
            <span className="text-[7px] font-mono font-black text-black tracking-tight">
              ☣ PLASMA
            </span>
          </div>
        ))}

        {/* Zona Tabung Materi (Tabung Hologram ke-2 di Platform 2) */}
        <div
          className="absolute z-15 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-purple-400/80 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer hover:border-purple-300 transition"
          style={{
            left: `${materiZone.x}px`,
            top: `${materiZone.y}px`,
            width: `${materiZone.w}px`,
            height: `${materiZone.h}px`,
          }}
          onClick={() => {
            setShowMateriModal(true);
            keysPressed.current.clear();
          }}
        >
          {isNearMateri && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce z-40 pointer-events-none">
              <span className="rounded bg-purple-400 px-2 py-0.5 text-[9px] font-black text-black shadow-md">
                [E] Baca Materi
              </span>
            </div>
          )}
          <span className="text-xl">🧪</span>
          <span className="text-[8px] font-mono font-bold text-purple-300 uppercase mt-0.5">
            TABUNG MATERI
          </span>
        </div>

        {/* Konsol Mini Game (Terminal Kiri Platform 2) */}
        <div
          className={`absolute z-15 flex flex-col items-center justify-center rounded-xl border-2 border-dashed shadow-md cursor-pointer transition ${
            isGameUnlocked
              ? "border-cyan-400/90 bg-cyan-950/30 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              : "border-rose-500/80 bg-rose-950/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
          }`}
          style={{
            left: `${consoleZone.x}px`,
            top: `${consoleZone.y}px`,
            width: `${consoleZone.w}px`,
            height: `${consoleZone.h}px`,
          }}
          onClick={handleInteractE}
        >
          {isNearConsole && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce z-40 pointer-events-none">
              <span
                className={`rounded px-2 py-0.5 text-[9px] font-black text-black shadow-md ${
                  isGameUnlocked ? "bg-cyan-400" : "bg-rose-400"
                }`}
              >
                {isGameUnlocked ? "[E] Main Cargo Bay" : "[E] Cek Konsol"}
              </span>
            </div>
          )}
          {/* Lampu Indikator Status */}
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`h-2 w-2 rounded-full animate-ping ${
                isGameUnlocked ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-rose-500 shadow-[0_0_8px_#ef4444]"
              }`}
            />
            <span className="text-[7.5px] font-mono font-bold text-gray-300">
              {isGameUnlocked ? "READY" : "LOCKED"}
            </span>
          </div>
          <span className="text-xl">{isGameUnlocked ? "🕹️" : "🔒"}</span>
          <span className="text-[7.5px] font-mono font-bold text-gray-200 uppercase mt-0.5">
            CARGO BAY
          </span>
        </div>

        {/* 6. Daftar 3 Pasang Portal Teleportasi Internal (Garis Lurus Vertikal Murni) */}
        {portals.map(portal => {
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
              <div className="absolute -top-6 whitespace-nowrap animate-bounce z-30">
                <span className={`rounded px-1.5 py-0.5 text-[8px] font-mono font-black uppercase shadow-md ${badgeClass}`}>
                  {portal.name}
                </span>
              </div>
              <div className="relative flex h-full w-full items-center justify-center overflow-visible">
                <div className={`absolute inset-y-0 w-8 blur-xs pointer-events-none ${bloomClass}`} />
                <div className={`relative flex h-full w-2.5 items-center justify-center rounded-full ${beamClass}`}>
                  <div className="h-full w-0.5 rounded-full bg-white shadow-[0_0_6px_#ffffff] opacity-95" />
                  <div className="absolute inset-x-0 h-7 bg-gradient-to-b from-transparent via-white to-transparent opacity-90 animate-beam-flow" />
                </div>
                <div className={`absolute top-1/4 h-0.5 w-5 rounded-full animate-ping ${pingClass}`} />
                <div className={`absolute top-2/3 h-0.5 w-5 rounded-full animate-ping ${pingClass}`} style={{ animationDelay: "0.5s" }} />
              </div>
            </div>
          );
        })}

        {/* 7. PORTAL MENUJU STAGE BERIKUTNYA (STAGE 3) DI PLATFORM 2 */}
        <div
          className={`absolute z-25 flex flex-col items-center justify-end select-none cursor-pointer group transition-all duration-300 ${
            !tasks.game ? "opacity-50 grayscale" : "hover:scale-105"
          }`}
          style={{
            left: `${nextStagePortal.x}px`,
            top: `${nextStagePortal.y}px`,
            width: `${nextStagePortal.w}px`,
            height: `${nextStagePortal.h}px`,
          }}
          onClick={handleStage3PortalEnter}
        >
          {/* Badge Interaksi Status */}
          <div className="absolute -top-7 whitespace-nowrap z-30">
            {tasks.game ? (
              <span className="rounded bg-cyan-400 px-2 py-0.5 text-[8px] font-mono font-black text-black uppercase shadow-[0_0_12px_rgba(34,211,238,0.95)] animate-bounce">
                [E] Masuk Stage 3
              </span>
            ) : (
              <span className="rounded bg-zinc-800/90 border border-zinc-600 px-2 py-0.5 text-[8px] font-mono font-bold text-gray-300">
                🔒 Selesaikan Mini Game
              </span>
            )}
          </div>

          {/* Garis Lurus Vertikal Portal Stage 3 */}
          <div className="relative flex h-full w-full items-center justify-center overflow-visible">
            <div className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent blur-xs pointer-events-none" />
            <div className="relative flex h-full w-3 items-center justify-center rounded-full bg-gradient-to-b from-cyan-100 via-cyan-400 to-blue-500 shadow-[0_0_20px_#00f0ff,0_0_35px_#06b6d4,0_0_50px_rgba(2,132,199,0.85)]">
              <div className="h-full w-1 rounded-full bg-white shadow-[0_0_8px_#ffffff] opacity-95" />
              <div className="absolute inset-x-0 h-9 bg-gradient-to-b from-transparent via-white to-transparent opacity-90 animate-beam-flow" />
            </div>
            <div className="absolute top-1/4 h-0.5 w-6 rounded-full bg-cyan-100 shadow-[0_0_8px_#22d3ee] animate-ping" />
            <div className="absolute top-2/3 h-0.5 w-6 rounded-full bg-cyan-100 shadow-[0_0_8px_#22d3ee] animate-ping" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>

        {/* Notifikasi Toast Mengambang */}
        {teleportToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 rounded-xl border border-cyan-400/60 bg-black/90 px-4 py-1.5 font-mono text-xs font-bold text-cyan-200 shadow-[0_0_25px_rgba(34,211,238,0.6)] backdrop-blur-md animate-in fade-in">
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
            className={`h-full w-full transition-transform duration-150 ease-out ${
              isSuctioning ? "animate-suction" : ""
            }`}
            style={{
              transformOrigin: "bottom center",
              transform: !isSuctioning
                ? isJumping
                  ? `${facingRight ? "scaleX(0.88)" : "scaleX(-0.88)"} scaleY(1.12)`
                  : `${facingRight ? "scaleX(1)" : "scaleX(-1)"} scaleY(1)`
                : undefined,
            }}
          >
            <img
              src="/astronaut-front.png"
              alt="Astronaut"
              className={`h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] ${
                isWalking && !isJumping && !isSuctioning ? "animate-waddle" : ""
              }`}
            />
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* MODAL 1: DATALOG MATERI ALOKASI MEMORI KONTIGU */}
        {/* ──────────────────────────────────────────────────────────── */}
        {showMateriModal && (
          <div className="absolute inset-4 z-50 flex flex-col justify-between rounded-2xl border-2 border-purple-500/50 bg-[#09061a]/95 p-6 backdrop-blur-md shadow-[0_0_60px_rgba(168,85,247,0.4)] animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📖</span>
                <h2 className="font-mono text-sm md:text-base font-black tracking-wider text-purple-200 uppercase">
                  MODUL KERNEL: ALOKASI MEMORI KONTIGU
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-purple-400">
                  Slide {materiSlide + 1} / 4
                </span>
                <button
                  type="button"
                  onClick={() => setShowMateriModal(false)}
                  className="rounded-lg border border-purple-500/40 bg-purple-950/60 px-2.5 py-1 text-xs font-bold text-gray-300 hover:bg-purple-800 hover:text-white transition"
                >
                  ✕ Tutup
                </button>
              </div>
            </div>

            {/* Konten Slide */}
            <div className="my-auto overflow-y-auto px-2 py-4 font-mono text-xs md:text-sm text-gray-200 leading-relaxed">
              {materiSlide === 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-black text-amber-300">
                    1. Konsep Dasar Alokasi Kontigu & Hole
                  </h3>
                  <p>
                    Pada sistem operasi klasik, <strong>Alokasi Memori Kontigu</strong> berarti setiap proses ditempatkan pada satu blok memori fisik yang berurutan secara utuh tanpa terpecah.
                  </p>
                  <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/40 p-3.5 space-y-2">
                    <div className="font-bold text-cyan-300">Apa itu Hole?</div>
                    <p className="text-xs text-gray-300">
                      <strong>Hole</strong> adalah blok ruang kosong (partisi bebas) di memori fisik yang belum ditempati proses. Sepanjang eksekusi sistem, proses datang dan pergi sehingga memori akan memiliki serangkaian hole dengan berbagai ukuran yang tersebar.
                    </p>
                  </div>
                  <p className="text-gray-300 text-xs">
                    Tantangan utama OS: Ketika sebuah proses baru meminta alokasi sebesar <em>N KB</em>, hole manakah di antara daftar memori bebas yang paling optimal untuk dipilih?
                  </p>
                </div>
              )}

              {materiSlide === 1 && (
                <div className="space-y-4">
                  <h3 className="text-base font-black text-amber-300">
                    2. Fragmentasi: Internal vs Eksternal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-3.5 space-y-2">
                      <div className="font-bold text-rose-300">Fragmentasi Internal</div>
                      <p className="text-xs text-gray-300">
                        Terjadi ketika memori dialokasikan dalam ukuran partisi tetap (fixed block) yang lebih besar dari kebutuhan proses. Sisa ruang yang terbuang berada <strong>di dalam</strong> partisi proses tersebut dan tidak bisa digunakan proses lain.
                      </p>
                    </div>
                    <div className="rounded-lg border border-amber-500/30 bg-amber-950/30 p-3.5 space-y-2">
                      <div className="font-bold text-amber-300">Fragmentasi Eksternal</div>
                      <p className="text-xs text-gray-300">
                        Total sisa memori kosong di seluruh sistem sebenarnya <strong>mencukupi</strong> untuk menampung proses baru, namun ruang tersebut <strong>terpecah-pecah</strong> menjadi banyak hole kecil yang tidak berurutan, sehingga tidak ada satu pun hole yang muat secara kontigu.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 italic">
                    Fragmentasi eksternal merupakan masalah utama dalam strategi alokasi memori dinamis variabel!
                  </p>
                </div>
              )}

              {materiSlide === 2 && (
                <div className="space-y-3.5">
                  <h3 className="text-base font-black text-amber-300">
                    3. Tiga Algoritma Penempatan Dinamis
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/40 p-3">
                      <strong className="text-cyan-300 text-sm">First-Fit (Paling Cepat):</strong>
                      <p className="mt-1 text-gray-300">
                        Memindai daftar hole dari alamat awal dan memilih <strong>hole pertama</strong> yang ukurannya cukup memuat proses. Pencarian langsung berhenti begitu hole ditemukan. Sangat cepat dan efisien waktu komputasi.
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 p-3">
                      <strong className="text-emerald-300 text-sm">Best-Fit (Sisa Terkecil):</strong>
                      <p className="mt-1 text-gray-300">
                        Memeriksa seluruh memori dan memilih <strong>hole terkecil yang cukup</strong> memuat proses. Menghasilkan sisa hole paling kecil, namun sering kali meninggalkan hole sisa sangat kecil yang sulit dimanfaatkan kembali.
                      </p>
                    </div>
                    <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3">
                      <strong className="text-rose-300 text-sm">Worst-Fit (Sisa Terbesar):</strong>
                      <p className="mt-1 text-gray-300">
                        Memeriksa seluruh memori dan memilih <strong>hole terbesar</strong> yang ada. Harapannya sisa ruang yang dihasilkan masih cukup besar untuk menampung proses lain. Namun strategi ini cepat menghabiskan blok-blok memori besar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {materiSlide === 3 && (
                <div className="space-y-3.5">
                  <h3 className="text-base font-black text-amber-300">
                    4. Contoh Perbandingan Nyata
                  </h3>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>Kondisi Hole: <code className="text-cyan-300">[100, 500, 200, 300, 600] KB</code></div>
                    <div>Antrean Proses: <code className="text-amber-300">[212, 417, 112, 426] KB</code></div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-purple-500/30">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-purple-950/70 text-purple-200 border-b border-purple-500/30">
                        <tr>
                          <th className="p-2">Proses</th>
                          <th className="p-2">First-Fit</th>
                          <th className="p-2">Best-Fit</th>
                          <th className="p-2">Worst-Fit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-500/20 text-gray-300">
                        <tr>
                          <td className="p-2 font-bold text-white">212 KB</td>
                          <td className="p-2 text-cyan-300">Hole 500 KB (sisa 288)</td>
                          <td className="p-2 text-emerald-300">Hole 300 KB (sisa 88)</td>
                          <td className="p-2 text-rose-300">Hole 600 KB (sisa 388)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-white">417 KB</td>
                          <td className="p-2 text-cyan-300">Hole 600 KB (sisa 183)</td>
                          <td className="p-2 text-emerald-300">Hole 500 KB (sisa 83)</td>
                          <td className="p-2 text-rose-300">Hole 500 KB (sisa 83)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-white">112 KB</td>
                          <td className="p-2 text-cyan-300">Hole 288 KB (sisa 176)</td>
                          <td className="p-2 text-emerald-300">Hole 200 KB (sisa 88)</td>
                          <td className="p-2 text-rose-300">Hole 388 KB (sisa 276)</td>
                        </tr>
                        <tr className="bg-purple-950/30">
                          <td className="p-2 font-bold text-amber-300">426 KB</td>
                          <td className="p-2 text-rose-400 font-bold">❌ Gagal / Antri</td>
                          <td className="p-2 text-emerald-400 font-bold">✔ Hole 600 KB (sisa 174)</td>
                          <td className="p-2 text-rose-400 font-bold">❌ Gagal / Antri</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-xs text-amber-200 font-bold">
                    💡 Catatan Penting: Hanya Best-Fit yang berhasil menampung keempat proses karena menjaga hole 600 KB tetap utuh untuk proses 426 KB!
                  </p>
                </div>
              )}
            </div>

            {/* Footer Navigasi Slide */}
            <div className="flex items-center justify-between border-t border-purple-500/30 pt-3">
              <button
                type="button"
                disabled={materiSlide === 0}
                onClick={() => setMateriSlide(s => Math.max(0, s - 1))}
                className="rounded-lg border border-purple-500/40 bg-purple-950/60 px-4 py-2 font-mono text-xs font-bold text-purple-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-800 transition"
              >
                ← Sebelumnya
              </button>

              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map(idx => (
                  <span
                    key={idx}
                    className={`h-2 w-2 rounded-full transition-all ${
                      materiSlide === idx ? "w-6 bg-purple-400" : "bg-purple-950 border border-purple-500/40"
                    }`}
                  />
                ))}
              </div>

              {materiSlide < 3 ? (
                <button
                  type="button"
                  onClick={() => setMateriSlide(s => Math.min(3, s + 1))}
                  className="rounded-lg border border-purple-500/40 bg-purple-600 px-4 py-2 font-mono text-xs font-bold text-white hover:bg-purple-500 transition shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                >
                  Berikutnya →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTasks(prev => ({ ...prev, materi: true }));
                    tasksRef.current.materi = true;
                    setShowMateriModal(false);
                    setTeleportToast("📖 Selesai membaca materi! Misi 3 selesai.");
                  }}
                  className="rounded-lg border border-emerald-400 bg-emerald-600 px-4 py-2 font-mono text-xs font-black text-black hover:bg-emerald-400 transition shadow-[0_0_15px_rgba(52,211,153,0.8)]"
                >
                  Selesai Baca ☑
                </button>
              )}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* MODAL 2: MINI GAME "CARGO BAY PARTITIONING" */}
        {/* ──────────────────────────────────────────────────────────── */}
        {showGameModal && (
          <div className="absolute inset-3 z-50 flex flex-col justify-between rounded-2xl border-2 border-cyan-500/50 bg-[#09061a]/95 p-4 md:p-5 backdrop-blur-md shadow-[0_0_60px_rgba(6,182,212,0.4)] animate-in fade-in zoom-in-95 duration-200">
            {/* Header Mini Game */}
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2.5">
              <div className="flex items-center gap-3">
                <span className="text-xl">🕹️</span>
                <div>
                  <h2 className="font-mono text-sm md:text-base font-black tracking-wider text-cyan-200 uppercase">
                    CARGO BAY PARTITIONING
                  </h2>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400">
                    <span>Ronde {roundIdx + 1}/3: <strong className="text-amber-300 font-bold uppercase">{roundAlgos[roundIdx]}-FIT</strong></span>
                    <span>•</span>
                    <span className="text-gray-300">
                      {roundAlgos[roundIdx] === "first" && "Pilih slot pertama dari kiri yang muat!"}
                      {roundAlgos[roundIdx] === "best" && "Pilih slot dengan sisa ruang paling kecil!"}
                      {roundAlgos[roundIdx] === "worst" && "Pilih slot dengan sisa ruang paling besar!"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 font-mono text-xs text-rose-400 font-bold">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} className={i < gameLives ? "opacity-100" : "opacity-20"}>
                      ❤️
                    </span>
                  ))}
                </div>
                <div className="font-mono text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded">
                  Skor: {gameScore}
                </div>
                <button
                  type="button"
                  onClick={() => setShowGameModal(false)}
                  className="rounded border border-cyan-500/40 bg-cyan-950/60 px-2 py-1 font-mono text-xs font-bold text-gray-300 hover:bg-cyan-800 hover:text-white transition"
                >
                  ✕ Batal
                </button>
              </div>
            </div>

            {/* Layar Menang / Game Over / Permainan Berlangsung */}
            {isGameWon ? (
              <div className="my-auto flex flex-col items-center justify-center space-y-4 text-center">
                <span className="text-5xl animate-bounce">🏆</span>
                <h3 className="font-mono text-xl font-black text-emerald-400 uppercase">
                  SIMULASI SELESAI & SUKSES!
                </h3>
                <div className="flex items-center gap-1 text-2xl">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} className={i < gameLives ? "text-amber-400" : "text-gray-600"}>
                      ⭐
                    </span>
                  ))}
                </div>
                <p className="max-w-md font-mono text-xs text-gray-300">
                  Kamu berhasil menyelesaikan seluruh skenario First-Fit, Best-Fit, dan Worst-Fit dengan skor akhir{" "}
                  <strong className="text-amber-300">{gameScore}</strong>! Portal Stage 3 telah aktif.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTasks(prev => ({ ...prev, game: true }));
                    tasksRef.current.game = true;
                    setShowGameModal(false);
                    setTeleportToast("🎉 Misi 5 Selesai! Portal Stage 3 sekarang terbuka.");
                  }}
                  className="rounded-xl border border-emerald-400 bg-emerald-500 px-6 py-2.5 font-mono text-sm font-black text-black shadow-[0_0_25px_rgba(52,211,153,0.8)] hover:bg-emerald-400 transition"
                >
                  Selesai & Buka Portal Stage 3 ☑
                </button>
              </div>
            ) : isGameOver ? (
              <div className="my-auto flex flex-col items-center justify-center space-y-4 text-center">
                <span className="text-5xl">💀</span>
                <h3 className="font-mono text-xl font-black text-rose-400 uppercase">
                  NYAWA HABIS - SIMULASI GAGAL
                </h3>
                <p className="max-w-md font-mono text-xs text-gray-300">
                  Terlalu banyak kesalahan alokasi memori. Evaluasi kembali aturan First-Fit, Best-Fit, dan Worst-Fit lalu coba lagi!
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={startMiniGameSession}
                    className="rounded-xl border border-cyan-400 bg-cyan-600 px-5 py-2 font-mono text-xs font-bold text-white hover:bg-cyan-500 transition"
                  >
                    🔄 Coba Lagi
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGameModal(false)}
                    className="rounded-xl border border-zinc-600 bg-zinc-800 px-5 py-2 font-mono text-xs font-bold text-gray-300 hover:bg-zinc-700 transition"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-3 my-auto">
                {/* Antrean Kargo & Tombol Kontrol */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/20 bg-black/60 p-3">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <span className="font-mono text-xs font-bold text-gray-400">Antrean Kargo:</span>
                    {currentScenario.cargos.map((cargo, idx) => {
                      const isPlaced = idx < currentCargoIdx;
                      const isActive = idx === currentCargoIdx;
                      return (
                        <div
                          key={cargo.id}
                          draggable={isActive}
                          onDragStart={e => e.dataTransfer.setData("text/plain", String(cargo.size))}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs font-bold transition-all ${
                            isActive
                              ? "border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)] scale-105 cursor-grab active:cursor-grabbing"
                              : isPlaced
                              ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400 line-through opacity-50"
                              : "border-zinc-700 bg-zinc-900/60 text-gray-400 opacity-60"
                          }`}
                        >
                          <span>📦</span>
                          <span>{cargo.size} KB</span>
                          {isActive && <span className="text-[9px] uppercase tracking-wider text-amber-200">AKTIF</span>}
                          {isPlaced && <span>✓</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        handleCargoPlacement("queue");
                      }}
                      onClick={() => handleCargoPlacement("queue")}
                      className="rounded-lg border border-amber-400/60 bg-amber-500/20 px-3 py-1.5 font-mono text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition shadow-sm"
                    >
                      📥 Antri (Tidak Muat)
                    </button>
                    <button
                      type="button"
                      onClick={handleScanSlots}
                      className="rounded-lg border border-cyan-400/60 bg-cyan-500/20 px-3 py-1.5 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition shadow-sm"
                    >
                      🔍 Scan (-3 Poin)
                    </button>
                  </div>
                </div>

                {/* Pesan Feedback / Kesalahan */}
                {gameFeedback && (
                  <div
                    className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-bold animate-in fade-in duration-150 ${
                      gameFeedback.type === "success"
                        ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300"
                        : gameFeedback.type === "error"
                        ? "border-rose-500/50 bg-rose-950/40 text-rose-300"
                        : "border-cyan-500/50 bg-cyan-950/40 text-cyan-300"
                    }`}
                  >
                    {gameFeedback.type === "success" && "✔ "}
                    {gameFeedback.type === "error" && "✖ "}
                    {gameFeedback.type === "info" && "ℹ "}
                    {gameFeedback.text}
                  </div>
                )}

                {/* 5 Kolom Slot Vertikal */}
                <div className="grid grid-cols-5 gap-3 pt-2">
                  {currentSlots.map((slot, idx) => {
                    const isScanned = scannedSlotIds.includes(slot.id);
                    const used = slot.total - slot.remaining;
                    const usedPct = (used / slot.total) * 100;
                    const heightPx = Math.max(80, (slot.total / 600) * 130 + 40);

                    return (
                      <div
                        key={slot.id}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault();
                          handleCargoPlacement(slot.id);
                        }}
                        onClick={() => handleCargoPlacement(slot.id)}
                        className={`flex flex-col items-center justify-between rounded-xl border-2 p-2.5 transition-all cursor-pointer hover:border-cyan-300 ${
                          isScanned
                            ? "border-emerald-400 bg-emerald-950/30 shadow-[0_0_20px_rgba(52,211,153,0.5)]"
                            : "border-cyan-500/30 bg-[#080517]/80 shadow-[0_0_15px_rgba(0,0,0,0.6)]"
                        }`}
                      >
                        <div className="font-mono text-xs font-bold text-gray-300">
                          Slot {idx + 1}
                        </div>

                        {/* Kolom Visual Proporsional */}
                        <div
                          className="relative w-full rounded-lg border border-cyan-500/40 bg-zinc-950/80 overflow-hidden my-2 flex flex-col justify-end"
                          style={{ height: `${heightPx}px` }}
                        >
                          {/* Bagian Terpakai (Warna Amber) */}
                          <div
                            className="w-full bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-300"
                            style={{ height: `${usedPct}%` }}
                          />
                          {/* Label Sisa di Tengah Kolom */}
                          <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-black text-white drop-shadow">
                            {slot.remaining} KB
                          </div>
                        </div>

                        <div className="text-center font-mono text-[10px] text-gray-400">
                          <div>Sisa: <strong className="text-cyan-300">{slot.remaining} KB</strong></div>
                          <div className="text-[9px] text-gray-500">Total: {slot.total} KB</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigasi Bawah */}
      <div className="mt-3 flex w-full max-w-[1000px] items-center justify-between text-xs text-gray-400">
        <Link href="/stage/stage1" className="hover:text-cyan-300 transition">
          ← Kembali ke Stage 1
        </Link>
        <span className="font-mono text-[11px] text-gray-500">
          Tip: Tekan E di depan objek untuk berinteraksi. Selesaikan seluruh 5 misi untuk membuka portal Stage 3.
        </span>
        <Link href="/stage/stage3" className="hover:text-cyan-300 transition font-bold">
          Langsung ke Stage 3 →
        </Link>
      </div>

      {/* Keyframe Animasi Waddle, Aliran Energi Laser, dan Suction Ke Atas */}
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

        @keyframes suctionAscend {
          0% {
            transform: translateY(0px) scale(1);
            opacity: 1;
          }
          45% {
            transform: translateY(-120px) scaleX(0.35) scaleY(1.4);
            opacity: 0.85;
          }
          100% {
            transform: translateY(-350px) scale(0);
            opacity: 0;
          }
        }
        .animate-suction {
          animation: suctionAscend 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </main>
  );
}
