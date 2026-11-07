"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";


export default function Stage1Platformer() {
  const router = useRouter();

  // ─── KONSTANTA KANVAS (16:9 Fixed) ─────────────────────────
  const GAME_WIDTH = 1024;
  const GAME_HEIGHT = 576;
  const GROUND_Y = 540; // Lantai dasar di paling bawah

  // ─── KONSTANTA PEMAIN ──────────────────────────────────────
  const PLAYER_W = 44;
  const PLAYER_H = 54;
  const MOVE_SPEED = 4.5;
  const JUMP_POWER = -12;
  const GRAVITY = 0.55;

  // ─── KONSTANTA KOTAK KARGO ─────────────────────────────────
  const BOX_W = 45;
  const BOX_H = 45;

  // ─── STATE PEMAIN & FISIKA ─────────────────────────────────
  const [playerX, setPlayerX] = useState(60);
  const [playerY, setPlayerY] = useState(GROUND_Y - PLAYER_H);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isWalking, setIsWalking] = useState(false);

  // ─── STATE SISTEM LASER & RINTANGAN ───────────────────────
  const [isLaser1Active, setIsLaser1Active] = useState(true);
  const [isLaser2Active, setIsLaser2Active] = useState(true);
  const [isLaser3Active, setIsLaser3Active] = useState(true);
  const [isLaser4Active, setIsLaser4Active] = useState(true);
  const [isLaser5Active, setIsLaser5Active] = useState(true);
  const [isLaser6Active, setIsLaser6Active] = useState(true);

  // State Tugas 1: Materi (Terminal) & Laser 4
  const [isMateriRead, setIsMateriRead] = useState(false);

  // State Tugas 2: Tes 1 (PG Tunggal) & Laser 5
  const [isTes1Done, setIsTes1Done] = useState(false);
  const [showTes1Modal, setShowTes1Modal] = useState(false);
  const [isNearTes1, setIsNearTes1] = useState(false);
  const [tes1Answers, setTes1Answers] = useState<(number | null)[]>([null, null, null, null, null]);

  // State Tugas 3: Tes 2 (PG Multi-Jawaban / Checkbox) & Laser 6
  const [isTes2Done, setIsTes2Done] = useState(false);
  const [showTes2Modal, setShowTes2Modal] = useState(false);
  const [isNearTes2, setIsNearTes2] = useState(false);
  const [tes2Answers, setTes2Answers] = useState<number[][]>([[], [], []]);

  // ─── STATE KOTAK KARGO ─────────────────────────────────────
  const [boxX, setBoxX] = useState(460);
  const [boxY, setBoxY] = useState(GROUND_Y - BOX_H);
  const [boxVelocityY, setBoxVelocityY] = useState(0);

  // ─── STATE MODAL & EDUKASI ─────────────────────────────────
  const [showMaterial, setShowMaterial] = useState(false);
  const [isNearTerminal, setIsNearTerminal] = useState(false);
  const [isNearLever, setIsNearLever] = useState(false);

  // ─── STATE MINI-GAME SJF SCHEDULING ────────────────────────
  const [isMiniGameOpen, setIsMiniGameOpen] = useState(false);
  const [availableModules, setAvailableModules] = useState<{ id: string; name: string; time: number }[]>([]);
  const [reactorQueue, setReactorQueue] = useState<({ id: string; name: string; time: number } | null)[]>([null, null, null]);
  const [isPortalActive, setIsPortalActive] = useState(false);

  // Fungsi mengacak 3 modul dengan nilai time unik antara 2 hingga 15 ms
  const generateRandomModules = () => {
    const times: number[] = [];
    while (times.length < 3) {
      const randTime = Math.floor(Math.random() * 14) + 2; // Acak unik 2 s.d 15 ms
      if (!times.includes(randTime)) {
        times.push(randTime);
      }
    }
    const modules = [
      { id: "A", name: "Modul A", time: times[0] },
      { id: "B", name: "Modul B", time: times[1] },
      { id: "C", name: "Modul C", time: times[2] },
    ];
    setAvailableModules(modules);
    setReactorQueue([null, null, null]);
  };

  const openSJFGame = () => {
    generateRandomModules();
    setIsMiniGameOpen(true);
  };

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
  const materialWallLeft = { x: 39, y: 135, w: 25, h: 151 };
  const materialWallRight = { x: 115, y: 135, w: 25, h: 151 };


  
  // Platform kecil di depan area cahaya (rak/pijakan di kiri)
  const leftShelfPlatform = { x: 43, y: 257, w: 90, h: 17 };

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
  const laser3 = { x: 527, y: 182, w: 16, h: 79 };
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
  const newp1 = { x: 515, y: 4, w: 42, h: 184 };
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

  // ─── REFS GAME LOOP ────────────────────────────────────────
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: playerX, y: playerY, vy: velocityY, jumping: isJumping });
  const boxRef = useRef({ x: boxX, y: boxY, vy: boxVelocityY });
  const laser1ActiveRef = useRef(isLaser1Active);
  const laser2ActiveRef = useRef(isLaser2Active);
  const laser3ActiveRef = useRef(isLaser3Active);
  const laser4ActiveRef = useRef(isLaser4Active);
  const laser5ActiveRef = useRef(isLaser5Active);
  const laser6ActiveRef = useRef(isLaser6Active);

  const lastBtn2StepRef = useRef(false);
  const lastBtn3StepRef = useRef(false);

  playerRef.current = { x: playerX, y: playerY, vy: velocityY, jumping: isJumping };
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
          setIsMateriRead(true);
          setIsLaser4Active(false);
          setShowMaterial(false);
        }
        setIsMiniGameOpen(false);
        setShowTes1Modal(false);
        setShowTes2Modal(false);
        return;
      }

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
          setFacingRight(false);
        }
        if (keys.has("d") || keys.has("arrowright")) {
          moveX += MOVE_SPEED;
          setFacingRight(true);
        }

        setIsWalking(moveX !== 0 && !p.jumping);

        // 2. LOMPAT
        const wantsJump = keys.has("w") || keys.has("arrowup") || keys.has(" ");
        if (wantsJump && !p.jumping) {
          p.vy = JUMP_POWER;
          p.jumping = true;
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
            }
          } else if (p.vy >= 0) {
            // Mendarat saat jatuh dari lompatan ke kontainer
            if (footY >= containerGroundY && prevFootY <= containerGroundY + Math.max(16, p.vy + 4)) {
              p.y = containerGroundY - PLAYER_H;
              p.vy = 0;
              p.jumping = false;
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
            }
          } else if (p.vy >= 0) {
            // Mendarat saat jatuh dari lompatan ke tanjakan
            if (footY >= leverRampGroundY && prevFootY <= leverRampGroundY + Math.max(16, p.vy + 4)) {
              p.y = leverRampGroundY - PLAYER_H;
              p.vy = 0;
              p.jumping = false;
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
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [showMaterial, isMiniGameOpen, isPortalActive, showTes1Modal, showTes2Modal]);

  // ─── KUIS DATA & HANDLERS ─────────────────────────────────
  const tes1Questions = [
    {
      question: "1. Komponen sistem operasi apa yang bertugas memilih proses dari Ready Queue untuk dialokasikan ke CPU?",
      options: [
        "A. Long-Term Scheduler (Job Scheduler)",
        "B. Short-Term Scheduler (CPU Scheduler)",
        "C. Medium-Term Scheduler (Swapper)",
        "D. I/O Device Controller",
      ],
      correct: 1,
    },
    {
      question: "2. Algoritma penjadwalan CPU mana yang memberikan rata-rata waktu tunggu (average waiting time) paling optimal?",
      options: [
        "A. First-Come, First-Served (FCFS)",
        "B. Round Robin (RR)",
        "C. Shortest Job First (SJF)",
        "D. Priority Scheduling Non-Preemptive",
      ],
      correct: 2,
    },
    {
      question: "3. Fenomena di mana proses pendek tertahan lama di belakang proses panjang pada FCFS dinamakan...",
      options: [
        "A. Convoy Effect",
        "B. Starvation",
        "C. Thrashing",
        "D. Deadlock",
      ],
      correct: 0,
    },
    {
      question: "4. Dalam algoritma Round Robin (RR), alokasi potongan waktu tetap yang diberikan ke setiap proses disebut...",
      options: [
        "A. Burst Time",
        "B. Turnaround Time",
        "C. Time Quantum / Time Slice",
        "D. Latency Overhead",
      ],
      correct: 2,
    },
    {
      question: "5. Solusi untuk mengatasi Starvation pada proses prioritas rendah yang tak kunjung dieksekusi adalah...",
      options: [
        "A. Aging (menaikkan prioritas proses secara bertahap seiring waktu)",
        "B. Reboot sistem operasi seketika",
        "C. Menghapus paksa proses dari memori RAM",
        "D. Menurunkan clock speed prosesor",
      ],
      correct: 0,
    },
  ];

  const tes2Questions = [
    {
      question: "1. Kriteria performa CPU scheduling yang ingin DIMAKSIMALKAN dalam sistem operasi adalah: (Pilih 2)",
      options: [
        "A. CPU Utilization (Persentase waktu CPU bekerja)",
        "B. Throughput (Jumlah proses selesai per satuan waktu)",
        "C. Turnaround Time (Total waktu dari submit hingga selesai)",
        "D. Waiting Time (Waktu proses mengantre di Ready Queue)",
      ],
      correct: [0, 1],
    },
    {
      question: "2. Algoritma penjadwalan berikut yang bersifat PREEMPTIVE (dapat menyela proses berjalan): (Pilih 3)",
      options: [
        "A. Round Robin (RR)",
        "B. Shortest Remaining Time First (SRTF)",
        "C. First-Come First-Served (FCFS) Murni",
        "D. Preemptive Priority Scheduling",
      ],
      correct: [0, 1, 3],
    },
    {
      question: "3. Status (Process State) resmi dalam 5-state process model sistem operasi standar meliputi: (Pilih 3)",
      options: [
        "A. Ready",
        "B. Running",
        "C. Waiting / Blocked",
        "D. Sleeping Permanently",
      ],
      correct: [0, 1, 2],
    },
  ];

  const handleCloseTerminalMaterial = () => {
    setIsMateriRead(true);
    setIsLaser4Active(false);
    setShowMaterial(false);
  };

  const handleSelectTes1 = (qIdx: number, optIdx: number) => {
    setTes1Answers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  };

  const handleSubmitTes1 = () => {
    if (tes1Answers.some((ans) => ans === null)) {
      alert("⚠️ Harap jawab semua 5 pertanyaan sebelum mengirim jawaban!");
      return;
    }
    let correctCount = 0;
    tes1Answers.forEach((ans, idx) => {
      if (ans === tes1Questions[idx].correct) {
        correctCount++;
      }
    });

    if (correctCount === 5) {
      setIsTes1Done(true);
      setIsLaser5Active(false);
      setShowTes1Modal(false);
      alert("🎉 SEMPURNA! Semua 5 soal Tes 1 terjawab dengan benar!\n\nLaser 5 (Merah) dinonaktifkan!");
    } else {
      alert(`❌ Jawaban belum tepat (${correctCount}/5 benar).\nSilakan baca kembali materi dan coba lagi!`);
    }
  };

  const handleToggleTes2 = (qIdx: number, optIdx: number) => {
    setTes2Answers((prev) => {
      const next = [...prev];
      const currentSelected = next[qIdx] || [];
      if (currentSelected.includes(optIdx)) {
        next[qIdx] = currentSelected.filter((x) => x !== optIdx);
      } else {
        next[qIdx] = [...currentSelected, optIdx].sort((a, b) => a - b);
      }
      return next;
    });
  };

  const handleSubmitTes2 = () => {
    if (tes2Answers.some((ans) => ans.length === 0)) {
      alert("⚠️ Harap pilih jawaban untuk setiap soal sebelum mengirim!");
      return;
    }

    let allMatch = true;
    for (let i = 0; i < tes2Questions.length; i++) {
      const userAns = [...(tes2Answers[i] || [])].sort((a, b) => a - b);
      const keyAns = [...tes2Questions[i].correct].sort((a, b) => a - b);
      if (userAns.length !== keyAns.length || !userAns.every((val, idx) => val === keyAns[idx])) {
        allMatch = false;
        break;
      }
    }

    if (allMatch) {
      setIsTes2Done(true);
      setIsLaser6Active(false);
      setShowTes2Modal(false);
      alert("🎉 LUAR BIASA! Seluruh kombinasi multi-jawaban Tes 2 COCOK PERSIS!\n\nLaser 6 (Biru Tua) dinonaktifkan!");
    } else {
      alert("❌ Kombinasi jawaban belum tepat untuk satu atau beberapa soal.\nPeriksa kembali kotak centang yang Anda pilih!");
    }
  };

  // ─── LOGIKA SJF (SHORTEST JOB FIRST) DRAG & DROP ──────────
  const handleDragStart = (e: React.DragEvent, moduleId: string) => {
    e.dataTransfer.setData("text/plain", moduleId);
  };

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    const moduleId = e.dataTransfer.getData("text/plain");
    if (!moduleId) return;

    const moduleToPlace = availableModules.find((m) => m.id === moduleId);
    if (!moduleToPlace) return;

    setReactorQueue((prev) => {
      const next = [...prev];
      // Jika modul ini sudah ada di slot antrean lain, kosongkan slot lamanya
      for (let i = 0; i < next.length; i++) {
        if (next[i]?.id === moduleId) {
          next[i] = null;
        }
      }
      next[slotIndex] = moduleToPlace;
      return next;
    });
  };

  const handleRemoveFromQueue = (slotIndex: number) => {
    setReactorQueue((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const handleResetQueue = () => {
    setReactorQueue([null, null, null]);
  };

  const handleActivateReactor = () => {
    // a. Cek apakah ada slot di reactorQueue yang masih null (belum penuh)
    if (reactorQueue.some((slot) => slot === null)) {
      alert("Isi semua slot!");
      return;
    }

    // b. Validasi apakah urutan time dari indeks 0 ke 2 sudah dari TERKECIL ke TERBESAR (Ascending)
    const q = reactorQueue as { id: string; name: string; time: number }[];
    const isCorrectOrder = q[0].time <= q[1].time && q[1].time <= q[2].time;

    if (isCorrectOrder) {
      // c. Jika BENAR: set isPortalActive = true, tutup modal, beri notifikasi sukses
      setIsPortalActive(true);
      setIsMiniGameOpen(false);
      alert(
        `✅ REAKTOR BERHASIL DIAKTIFKAN!\n\nPrinsip Shortest Job First (SJF) valid: [${q[0].name}: ${q[0].time}ms] ➔ [${q[1].name}: ${q[1].time}ms] ➔ [${q[2].name}: ${q[2].time}ms].\nAverage Waiting Time diminimalkan.\n\nGerbang Portal Stage 2 kini terbuka!`
      );
    } else {
      // d. Jika SALAH: beri alert overload lalu reset antrean
      alert("❌ Sistem Overload! Gunakan prinsip Shortest Job First (beban terkecil duluan).");
      setReactorQueue([null, null, null]);
    }
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
              <span className="rounded bg-emerald-400 px-2 py-0.5 text-[9px] font-black text-black shadow-md">
                [E] Konsol SJF
              </span>
            </div>
          )}
          <span className="text-[8px] font-mono font-bold text-emerald-200 bg-black/60 px-1 rounded pointer-events-none">
            LEVER
          </span>
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
          <span className="text-[7px] font-mono text-emerald-200 bg-black/60 px-1 rounded">
            LEVER PLAT
          </span>
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
                [E] Tes 1 (PG)
              </span>
            </div>
          )}
          <span className="text-base select-none">📝</span>
          <span className="text-[7px] font-mono font-bold text-red-200 bg-black/70 px-1 rounded pointer-events-none">
            {isTes1Done ? "TES 1 ✓" : "TES 1"}
          </span>
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
                [E] Tes 2 (Multi)
              </span>
            </div>
          )}
          <span className="text-base select-none">📋</span>
          <span className="text-[7px] font-mono font-bold text-blue-200 bg-black/70 px-1 rounded pointer-events-none">
            {isTes2Done ? "TES 2 ✓" : "TES 2"}
          </span>
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
            <span className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 text-[7px] font-mono font-black text-cyan-200 tracking-widest bg-cyan-950/80 border border-cyan-400/50 px-1.5 py-0.5 rounded">
              LASER 1 (BOX)
            </span>
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
            <span className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 text-[7px] font-mono font-black text-yellow-200 tracking-widest bg-yellow-950/80 border border-yellow-400/50 px-1.5 py-0.5 rounded">
              LASER 2 (YEL)
            </span>
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
            <span className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 text-[7px] font-mono font-black text-emerald-200 tracking-widest bg-emerald-950/80 border border-emerald-400/50 px-1.5 py-0.5 rounded">
              LASER 3 (GRN)
            </span>
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
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] font-mono font-black text-purple-200 tracking-widest bg-purple-950/80 border border-purple-400/50 px-1.5 py-0.5 rounded whitespace-nowrap">
              LASER 4 (PUR-H)
            </span>
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
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[7px] font-mono font-black text-red-200 tracking-widest bg-red-950/80 border border-red-400/50 px-1.5 py-0.5 rounded whitespace-nowrap">
              LASER 5 (RED-H)
            </span>
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
            <span className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-[7px] font-mono font-black text-blue-200 tracking-widest bg-blue-950/80 border border-blue-500/50 px-1.5 py-0.5 rounded whitespace-nowrap">
              LASER 6 (BLU-V)
            </span>
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

        {/* ─── KARAKTER ASTRONOT ──────────────────────────────── */}
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
              className={`h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] ${
                isWalking && !isJumping ? "animate-waddle" : ""
              }`}
              style={{
                transformOrigin: "bottom center",
              }}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODAL 1: TERMINAL LOG MATERI SISTEM OPERASI (MEMATIKAN LASER 4)
          ═══════════════════════════════════════════════════════ */}
      {showMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-cyan-400/60 bg-[#0d091e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_50px_rgba(34,211,238,0.4)]">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
                <h2 className="text-lg font-bold text-cyan-300 tracking-wider uppercase">
                  🖥️ OMNI LOG // MATERI CPU SCHEDULER & PROCESS MANAGEMENT
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseTerminalMaterial}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-400 hover:text-white hover:border-cyan-400 transition"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs md:text-sm text-gray-300 leading-relaxed">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="font-bold text-cyan-300">1. Apa itu CPU Scheduler?</h3>
                <p className="mt-1">
                  <strong>CPU Scheduler (Short-Term Scheduler)</strong> adalah modul inti sistem operasi yang bertugas memilih proses mana yang siap dieksekusi dari <em>Ready Queue</em> dan mengalokasikan CPU untuk proses tersebut saat proses berpindah status (state).
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="font-bold text-purple-300">2. Preemptive vs Non-Preemptive</h3>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li><strong>Preemptive:</strong> CPU dapat menyela (preempt) proses yang sedang berjalan ketika ada proses berprioritas lebih tinggi datang. Contoh: <em>Round Robin (RR)</em>, <em>Shortest Remaining Time First (SRTF)</em>, dan <em>Preemptive Priority</em>.</li>
                  <li><strong>Non-Preemptive:</strong> Sekali CPU dialokasikan ke suatu proses, proses tersebut memegang CPU sampai selesai atau meminta I/O. Contoh: <em>FCFS (First-Come, First-Served) standar</em>.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="font-bold text-amber-300">3. Kriteria Optimasi Penjadwalan</h3>
                <p className="mt-1">
                  Kriteria yang <strong>DIMAKSIMALKAN</strong>: <em>CPU Utilization</em> (persentase waktu kerja prosesor) dan <em>Throughput</em> (jumlah proses selesai per satuan waktu).<br />
                  Kriteria yang <strong>DIMINIMALKAN</strong>: <em>Turnaround Time</em>, <em>Waiting Time</em>, dan <em>Response Time</em>.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <h3 className="font-bold text-emerald-300">4. Masalah Algoritma & Solusinya</h3>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li><strong>Convoy Effect (FCFS):</strong> Proses-proses pendek tertahan lama menunggu proses panjang selesai.</li>
                  <li><strong>Starvation:</strong> Proses prioritas rendah tidak pernah dieksekusi karena proses prioritas tinggi terus berdatangan. Solusinya: teknik <strong>Aging</strong> (menaikkan prioritas proses secara bertahap seiring berjalannya waktu).</li>
                  <li><strong>Round Robin (RR):</strong> Menggunakan potongan waktu tetap (<strong>Time Quantum / Time Slice</strong>) untuk giliran eksekusi yang adil.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-purple-500/40 bg-purple-950/30 p-3.5 text-purple-200">
                <p className="font-semibold text-purple-300 flex items-center gap-1.5">
                  <span>💡</span> Kunci Membuka Rintangan:
                </p>
                <p className="mt-1 text-xs">
                  Membaca dan menutup Terminal Log OS ini menandakan modul materi telah dikuasai. <strong>Laser 4 (Ungu Horizontal)</strong> akan otomatis padam dan terbuka!
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleCloseTerminalMaterial}
                className="rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-6 py-2.5 text-xs md:text-sm font-bold text-white shadow-[0_0_20px_rgba(34,211,238,0.5)] transition hover:scale-105 active:scale-95"
              >
                ✓ Selesai Membaca Log & Matikan Laser 4 ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL 2: MINI-GAME SHORTEST JOB FIRST (SJF) SCHEDULING
          ═══════════════════════════════════════════════════════ */}
      {isMiniGameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md select-none">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-cyan-500 bg-gray-900/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_60px_rgba(6,182,212,0.4)]">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                </span>
                <div>
                  <h2 className="text-base md:text-lg font-black tracking-wider text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)] uppercase">
                    ⚡ KONSOL REAKTOR // SHORTEST JOB FIRST (SJF)
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Susun urutan eksekusi modul ke dalam antrean inti berdasarkan beban waktu (burst time) terkecil ke terbesar.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMiniGameOpen(false)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:border-cyan-400 transition"
              >
                ✕ Tutup
              </button>
            </div>

            {/* Konten Utama Mini-Game */}
            <div className="mt-5 space-y-6">
              {/* Bagian Atas: Modul Tersedia */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                    📦 Modul Proses Tersedia (Tarik ke Slot Bawah):
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Drag & Drop Native HTML5
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {availableModules.map((mod) => {
                    const isPlaced = reactorQueue.some((q) => q?.id === mod.id);

                    return (
                      <div
                        key={mod.id}
                        draggable={!isPlaced}
                        onDragStart={(e) => handleDragStart(e, mod.id)}
                        className={`rounded-xl border p-3 flex flex-col justify-between transition-all select-none ${
                          isPlaced
                            ? "border-gray-700 bg-gray-800/40 opacity-40 cursor-not-allowed"
                            : "border-cyan-400/60 bg-cyan-950/40 hover:border-cyan-300 hover:scale-102 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] cursor-grab active:cursor-grabbing"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            MODUL {mod.id}
                          </span>
                          <span className="text-base">⚡</span>
                        </div>
                        <div className="mt-2 text-center">
                          <span className="text-xs text-gray-300 block">{mod.name}</span>
                          <span className="text-lg font-black font-mono text-amber-400 tracking-wider">
                            {mod.time} <span className="text-[11px] font-normal text-amber-200">ms</span>
                          </span>
                        </div>
                        {isPlaced && (
                          <span className="mt-1 text-[9px] font-mono text-center text-emerald-400">
                            ✓ Di Antrean
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bagian Bawah: Antrean Inti Reaktor (3 Slot) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                    ⚛️ Antrean Inti Reaktor (CPU Execution Queue):
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Slot 1 (Awal) ➔ Slot 2 ➔ Slot 3 (Akhir)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {reactorQueue.map((slot, index) => (
                    <div
                      key={`slot-${index}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`min-h-[110px] rounded-xl border-2 transition-all p-3 flex flex-col justify-between ${
                        slot === null
                          ? "border-dashed border-cyan-500/40 bg-gray-950/60 hover:border-cyan-400 hover:bg-cyan-950/20"
                          : "border-solid border-emerald-400 bg-emerald-950/40 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                        <span className="text-gray-400">
                          SLOT {index + 1}{" "}
                          <span className="text-[9px] text-gray-500">
                            ({index === 0 ? "Prioritas 1" : index === 1 ? "Prioritas 2" : "Prioritas 3"})
                          </span>
                        </span>
                        {slot !== null && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFromQueue(index)}
                            className="text-gray-400 hover:text-rose-400 transition"
                            title="Hapus dari slot"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {slot === null ? (
                        <div className="my-auto text-center">
                          <span className="text-2xl opacity-40 block mb-1">📥</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            Tarik modul ke sini
                          </span>
                        </div>
                      ) : (
                        <div className="my-auto text-center">
                          <span className="text-sm font-black font-mono text-emerald-300">
                            MODUL {slot.id}
                          </span>
                          <span className="block text-base font-black font-mono text-amber-300 mt-0.5">
                            {slot.time} ms
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bagian Bawah Modal: Tombol Aksi */}
            <div className="mt-6 flex items-center justify-between border-t border-cyan-500/30 pt-4">
              <button
                type="button"
                onClick={handleResetQueue}
                className="rounded-xl border border-white/20 bg-white/[0.04] px-5 py-2 text-xs font-bold text-gray-300 hover:border-rose-400 hover:text-rose-300 transition"
              >
                ↺ RESET ANTREAN
              </button>

              <button
                type="button"
                onClick={handleActivateReactor}
                className="rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 px-6 py-2.5 text-xs font-black text-black shadow-[0_0_25px_rgba(34,211,238,0.6)] hover:scale-105 active:scale-95 transition"
              >
                ⚡ AKTIFKAN REAKTOR ➔
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════
          MODAL 4: TES 1 (5 SOAL PG TUNGGAL - MEMATIKAN LASER 5)
          ═══════════════════════════════════════════════════════ */}
      {showTes1Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-red-500/70 bg-[#0d091e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_50px_rgba(239,68,68,0.4)]">
            <div className="flex items-center justify-between border-b border-red-500/40 pb-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-red-400 animate-ping" />
                <div>
                  <h2 className="text-lg font-bold text-red-300 tracking-wider uppercase">
                    📝 TES 1 // EVALUASI PILIHAN GANDA TUNGGAL
                  </h2>
                  <p className="text-[11px] text-gray-400">Jawab ke-5 soal dengan benar untuk melumpuhkan Laser 5 (Merah).</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTes1Modal(false)}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-400 hover:text-white hover:border-red-400 transition"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="mt-4 space-y-5 text-xs md:text-sm">
              {tes1Questions.map((q, qIdx) => (
                <div key={qIdx} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="font-semibold text-gray-100 mb-2.5">{q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = tes1Answers[qIdx] === optIdx;
                      return (
                        <label
                          key={optIdx}
                          onClick={() => handleSelectTes1(qIdx, optIdx)}
                          className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition ${
                            isSelected
                              ? "border-red-400 bg-red-950/50 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                              : "border-white/10 bg-white/[0.02] text-gray-300 hover:border-red-500/40 hover:bg-white/[0.05]"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`tes1-q-${qIdx}`}
                            checked={isSelected}
                            onChange={() => handleSelectTes1(qIdx, optIdx)}
                            className="accent-red-500 cursor-pointer"
                          />
                          <span className="select-none">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-red-500/30 pt-4">
              <span className="text-[11px] text-gray-400">
                Dijawab: {tes1Answers.filter((a) => a !== null).length} / 5 Soal
              </span>
              <button
                type="button"
                onClick={handleSubmitTes1}
                className="rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-6 py-2.5 text-xs md:text-sm font-bold text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] transition hover:scale-105 active:scale-95"
              >
                Kirim Jawaban & Matikan Laser 5 ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL 5: TES 2 (3 SOAL PG MULTI-JAWABAN CHECKBOX - MEMATIKAN LASER 6)
          ═══════════════════════════════════════════════════════ */}
      {showTes2Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-blue-500/70 bg-[#0d091e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_50px_rgba(59,130,246,0.4)]">
            <div className="flex items-center justify-between border-b border-blue-500/40 pb-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-blue-400 animate-ping" />
                <div>
                  <h2 className="text-lg font-bold text-blue-300 tracking-wider uppercase">
                    📋 TES 2 // EVALUASI MULTI-JAWABAN (CHECKBOX)
                  </h2>
                  <p className="text-[11px] text-gray-400">
                    Tiap soal memiliki 2 hingga 3 jawaban benar. Semua pilihan yang dicentang harus cocok persis dengan kunci!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTes2Modal(false)}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-400 hover:text-white hover:border-blue-400 transition"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="mt-4 space-y-5 text-xs md:text-sm">
              {tes2Questions.map((q, qIdx) => {
                const selectedList = tes2Answers[qIdx] || [];
                return (
                  <div key={qIdx} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="font-semibold text-gray-100">{q.question}</p>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 whitespace-nowrap">
                        Terpilih: {selectedList.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isChecked = selectedList.includes(optIdx);
                        return (
                          <label
                            key={optIdx}
                            onClick={(e) => {
                              e.preventDefault();
                              handleToggleTes2(qIdx, optIdx);
                            }}
                            className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition select-none ${
                              isChecked
                                ? "border-blue-400 bg-blue-950/50 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                : "border-white/10 bg-white/[0.02] text-gray-300 hover:border-blue-500/40 hover:bg-white/[0.05]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by label onClick
                              className="accent-blue-500 cursor-pointer h-4 w-4 rounded"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-blue-500/30 pt-4">
              <span className="text-[11px] text-gray-400">
                Format: Checkbox Multi-Selection
              </span>
              <button
                type="button"
                onClick={handleSubmitTes2}
                className="rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-6 py-2.5 text-xs md:text-sm font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] transition hover:scale-105 active:scale-95"
              >
                Kirim Jawaban & Matikan Laser 6 ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe Animasi Waddle & Efek Laser Sci-Fi */}
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

