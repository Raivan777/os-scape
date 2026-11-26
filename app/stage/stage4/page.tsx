"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeadlockBackground from "@/components/DeadlockBackground";
import AlienLifeSupportMiniGame from "@/components/AlienLifeSupportMiniGame";
import DeadlockQuizModal from "@/components/DeadlockQuizModal";

export default function Stage4Page() {
  const router = useRouter();

  // ─── KONSTANTA KANVAS (16:9 Fixed, selaras Stage 1) ────────
  const GAME_WIDTH = 1024;
  const GAME_HEIGHT = 576;

  // ─── KONSTANTA PEMAIN & SPRITE (Sama dengan Stage 1) ────────
  const VISUAL_W = 54;
  const VISUAL_H = 82;

  // Dimensi Hitbox Fisika & Konstanta Gerak Halus
  const PLAYER_W = 44;
  const PLAYER_H = 76;
  const MOVE_SPEED = 3.6;
  const JUMP_POWER = -9.2;
  const DOUBLE_JUMP_POWER = -9.6;
  const GRAVITY = 0.52;
  const BASE_GRAVITY = 0.52;
  const FALL_MULTIPLIER = 1.42; // Snappier descent saat mulai jatuh
  const LOW_JUMP_MULTIPLIER = 1.85; // Variable jump height saat tombol dilepas
  const MAX_FALL_SPEED = 12.0; // Terminal velocity
  const COYOTE_TIME = 0.1; // 100ms toleransi lompat di ujung platform
  const JUMP_BUFFER_TIME = 0.12; // 120ms buffer input sebelum menyentuh lantai

  // ─── SPAWN AWAL: Pojok Kiri Bawah (Pintu Masuk) ────────────
  // Permukaan lantai bawah (metal floor) pada stage4bg.jpg berada tepat di y = 540
  const GROUND_Y = 540;
  const SPAWN_X = 85;
  const SPAWN_Y = GROUND_Y - PLAYER_H;

  // ─── STATE PEMAIN & FISIKA ──────────────────────────────────
  const [playerX, setPlayerX] = useState(SPAWN_X);
  const [playerY, setPlayerY] = useState(SPAWN_Y);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isWalking, setIsWalking] = useState(false);

  // ─── STATE ANIMASI SPRITE ───────────────────────────────────
  const [playerSprite, setPlayerSprite] = useState<string>("/idle.png");

  // ─── STATE SISTEM LASER (3 LASER STAGE 4) ──────────────────
  // L1 (Merah 1 - Vertikal): Di atas meja tengah (di bawah SASCO) memblokir jalur ke Modul — dibuka via Tombol [E] di terminal kiri
  const [isLaser1Active, setIsLaser1Active] = useState(true);
  // L2 (Merah 2 - Vertikal): Sisi kanan platform tengah sebelum Level 5 — dibuka setelah Modul selesai
  const [isLaser2Active, setIsLaser2Active] = useState(true);
  // L3 (Kuning - Vertikal): Di celah antara ujung kanan platform kiri dan sisi kiri platform tengah — dibuka via Life-Support Banker
  const [isLaser3Active, setIsLaser3Active] = useState(true);

  // Refs laser untuk pembacaan instan dalam game loop
  const laser1ActiveRef = useRef(true);
  const laser2ActiveRef = useRef(true);
  const laser3ActiveRef = useRef(true);

  // ─── STATE MODAL ────────────────────────────────────────────
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showMiniGameModal, setShowMiniGameModal] = useState(false);

  // ─── STATE MISI & PROGRES ───────────────────────────────────
  const [quizPassed, setQuizPassed] = useState(false);
  const [bankerDone, setBankerDone] = useState(false);
  const [portalUsed, setPortalUsed] = useState(false);

  // State gembok untuk kompatibilitas AlienLifeSupportMiniGame
  const [unlockedLocks, setUnlockedLocks] = useState({
    green: false,
    blue: false,
    purple: false,
  });

  // ─── STATE KEDEKATAN INTERAKSI ──────────────────────────────
  const [isNearButton1, setIsNearButton1] = useState(false);
  const [isNearHologram, setIsNearHologram] = useState(false);
  const [isNearBanker, setIsNearBanker] = useState(false);
  const [isNearPortal, setIsNearPortal] = useState(false);

  // ─── TOAST NOTIFIKASI ───────────────────────────────────────
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  // ─── HITBOX PLATFORM (Diselaraskan Presisi dengan stage4bg.jpg) ─
  // 1. Lantai dasar bawah (x: 0..1024, permukaan y = 540)
  const groundPlatform = { x: 0, y: GROUND_Y, w: GAME_WIDTH, h: GAME_HEIGHT - GROUND_Y };

  // 2. Platform kiri di atas pintu masuk (permukaan y = 412, x: 0..330)
  //    Meja/pijakan panel kontrol kiri atas background
  const leftUpperPlatform = { x: 0, y: 412, w: 330, h: 22 };

  // 3. Platform tengah atas (meja besar laboratorium, permukaan y = 340, x: 345..860)
  //    Permukaan meja besar tempat SASCO, Modul, hologram, dan robot berada
  const midPlatform = { x: 345, y: 340, w: 515, h: 22 };

  // 4. Platform kanan bawah di puncak tangga (permukaan y = 440, x: 840..1024)
  const rightLowerPlatform = { x: 840, y: 440, w: 184, h: 22 };

  // 5. Platform kanan atas area Level 5 (permukaan y = 205, x: 745..1024)
  const rightUpperPlatform = { x: 745, y: 205, w: 279, h: 22 };

  // 6. Platform penghubung menuju Portal Level 5 (menyambung dari midPlatform y = 340 hingga dinding kanan)
  const portalBridgePlatform = { x: 850, y: 340, w: 174, h: 22 };

  const allPlatforms = [
    midPlatform,
    portalBridgePlatform,
    leftUpperPlatform,
    rightLowerPlatform,
    rightUpperPlatform,
  ];

  // ─── HITBOX LASER (Sesuai Posisi Coretan Merah & Kuning) ─────
  // Laser Merah 1 (L1): Vertikal — di atas meja tengah di bawah SASCO/SWICC (x = 410, y = 245..340)
  // Memblokir jalur dari sisi kiri meja menuju MODUL: STAGE 4
  const laser1 = { x: 410, y: 245, w: 14, h: 95 };

  // Laser Kuning (L3): Vertikal — di celah antara ujung kanan platform kiri dan sisi kiri platform tengah (x = 335, y = 240..412)
  // Memblokir jalur lompatan/penyeberangan antara platform kiri dan meja tengah
  const laser3 = { x: 335, y: 240, w: 14, h: 172 };

  // Laser Merah 2 (L2): Vertikal — di sisi kanan platform tengah atas sebelum area Level 5 (x = 818, y = 205..340)
  // Memblokir jalur dari meja tengah ke arah Level 5
  const laser2 = { x: 818, y: 205, w: 14, h: 135 };

  // ─── KOORDINAT OBJEK INTERAKTIF ─────────────────────────────
  // Tombol terminal kiri (Tengah layar monitor konsol di sebelah kiri L3) — membuka Laser Merah 1
  const button1Obj = { x: 227, y: 336, w: 50, h: 32 };

  // Modul: Stage 4 — hologram kuis di platform tengah atas
  const hologramObj = { x: 490, y: 268, w: 70, h: 70 };

  // Life-Support Banker — di platform kanan bawah dekat tangga
  const bankerObj = { x: 865, y: 378, w: 60, h: 60 };

  // Portal Level 5 — sejajar ketinggian platform/modul utama (y = 340, 255 + 85 = 340)
  const portalObj = { x: 920, y: 255, w: 65, h: 85 };

  // Portal siap hanya jika quiz selesai DAN banker selesai
  const isPortalReady = quizPassed && bankerDone;

  // ─── SKOR ───────────────────────────────────────────────────
  const currentScore =
    (!isLaser1Active ? 50 : 0) +
    (quizPassed ? 150 : 0) +
    (!isLaser2Active ? 50 : 0) +
    (bankerDone ? 100 : 0) +
    (!isLaser3Active ? 50 : 0) +
    (portalUsed ? 100 : 0);

  // ─── HANDLER INTERAKSI ──────────────────────────────────────
  const handlePressButton1 = () => {
    if (isLaser1Active) {
      setIsLaser1Active(false);
      laser1ActiveRef.current = false;
      showToast("🔓 Tombol Terminal Ditekan — Laser Merah 1 (L1) Dinonaktifkan! Jalur ke Modul Stage 4 kini terbuka.");
    } else {
      showToast("✅ Laser Merah 1 sudah dinonaktifkan. Lanjutkan ke Modul Stage 4.");
    }
  };

  const handlePassQuiz = () => {
    if (!quizPassed) {
      setQuizPassed(true);
      setIsLaser2Active(false);
      laser2ActiveRef.current = false;
      showToast("🎉 Modul Stage 4 Selesai! Laser Merah 2 (L2) Dinonaktifkan — Jalur ke Level 5 kini terbuka.");
    }
  };

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
      showToast(`🔓 ${lockName} Berhasil Dibuka!`);

      const allUnlocked = next.green && next.blue && next.purple;
      if (allUnlocked && !bankerDone) {
        setBankerDone(true);
        setIsLaser3Active(false);
        laser3ActiveRef.current = false;
        showToast("🟡 Life-Support Banker Selesai! Laser Kuning (L3) Dinonaktifkan — Jalur penyeberangan celah terbuka.");
      }
      return next;
    });
  };

  const handleEnterPortal = () => {
    if (!isPortalReady) {
      if (!quizPassed && !bankerDone) {
        showToast("⚠️ Selesaikan Modul Stage 4 dan Life-Support Banker terlebih dahulu.");
      } else if (!quizPassed) {
        showToast("⚠️ Selesaikan Modul Stage 4 terlebih dahulu.");
      } else {
        showToast("⚠️ Selesaikan Life-Support Banker terlebih dahulu.");
      }
      return;
    }
    setPortalUsed(true);
    showToast("🌀 Memasuki Level 5 (+100 poin)...");
    setTimeout(() => {
      router.push("/stage/stage5");
    }, 1200);
  };

  // ─── REFS GAME LOOP ─────────────────────────────────────────
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({
    x: SPAWN_X,
    y: SPAWN_Y,
    vy: 0,
    jumping: false,
    canDoubleJump: false,
  });
  const animRef = useRef({
    action: "idle",
    frame: 1,
    lastFrameTime: 0,
    isDoubleJumping: false,
    facing: "right" as "right" | "left",
  });
  const lastTimeRef = useRef<number>(0);

  playerRef.current = { ...playerRef.current, x: playerX, y: playerY, vy: velocityY, jumping: isJumping };
  laser1ActiveRef.current = isLaser1Active;
  laser2ActiveRef.current = isLaser2Active;
  laser3ActiveRef.current = isLaser3Active;

  // ─── KEYBOARD EVENTS ────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === "e") {
        // Tombol Terminal (Lingkaran Merah) — membuka L1
        if (isNearButton1 && !showQuizModal && !showMiniGameModal) {
          handlePressButton1();
          return;
        }
        // Modul: Stage 4 — hanya dapat diakses setelah L1 dinonaktifkan
        if (isNearHologram && !showQuizModal && !showMiniGameModal) {
          if (!isLaser1Active) {
            setShowQuizModal(true);
          } else {
            showToast("⚠️ Jalur ke Modul masih terblokir Laser Merah 1 (L1). Tekan tombol terminal kiri terlebih dahulu.");
          }
          return;
        }
        // Life-Support Banker
        if (isNearBanker && !showQuizModal && !showMiniGameModal) {
          setShowMiniGameModal(true);
          return;
        }
        // Portal Level 5
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

      // Lompatan & Double Jump
      if (key === "w" || key === "arrowup" || key === " ") {
        if (!showQuizModal && !showMiniGameModal) {
          const p = playerRef.current;
          if (!p.jumping) {
            p.vy = JUMP_POWER;
            p.jumping = true;
            p.canDoubleJump = true;
            animRef.current.isDoubleJumping = false;
          } else if (p.canDoubleJump) {
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
  }, [
    isNearButton1,
    isNearHologram,
    isNearBanker,
    isNearPortal,
    showQuizModal,
    showMiniGameModal,
    isLaser1Active,
    isPortalReady,
    quizPassed,
    bankerDone,
  ]);

  // ─── GAME LOOP FISIKA 60 FPS ─────────────────────────────────
  useEffect(() => {
    let animId: number;
    lastTimeRef.current = 0;

    const MIN_X = 5;
    const MAX_X = GAME_WIDTH - PLAYER_W - 5;
    const MIN_Y = 0;
    const MAX_Y = GROUND_Y - PLAYER_H;

    const gameLoop = () => {
      if (!showQuizModal && !showMiniGameModal) {
        const now = performance.now();
        if (lastTimeRef.current === 0) {
          lastTimeRef.current = now;
        }
        const rawDt = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;
        // Clamp dt agar perpindahan tidak meloncat ekstrem saat lag atau pindah tab
        const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
        const dtScale = dt * 60;

        const p = { ...playerRef.current };
        const keys = keysPressed.current;

        // Fallback recovery jika posisi sebelumnya tidak valid / keluar batas map
        if (
          !Number.isFinite(p.x) ||
          !Number.isFinite(p.y) ||
          p.x < -PLAYER_W ||
          p.x > GAME_WIDTH ||
          p.y < -PLAYER_H ||
          p.y > GAME_HEIGHT
        ) {
          p.x = SPAWN_X;
          p.y = SPAWN_Y;
          p.vy = 0;
          p.jumping = false;
          p.canDoubleJump = false;
          animRef.current.isDoubleJumping = false;
        }

        // 1. GERAKAN HORIZONTAL
        let moveX = 0;
        if (keys.has("a") || keys.has("arrowleft")) {
          moveX -= MOVE_SPEED * dtScale;
          setFacingLeft(true);
          setFacingRight(false);
          animRef.current.facing = "left";
        }
        if (keys.has("d") || keys.has("arrowright")) {
          moveX += MOVE_SPEED * dtScale;
          setFacingLeft(false);
          setFacingRight(true);
          animRef.current.facing = "right";
        }
        setIsWalking(moveX !== 0);

        // 2. LOMPAT
        const wantsJump = keys.has("w") || keys.has("arrowup") || keys.has(" ");
        if (wantsJump && !p.jumping) {
          p.vy = JUMP_POWER;
          p.jumping = true;
          p.canDoubleJump = true;
          animRef.current.isDoubleJumping = false;
        }

        // 3. GRAVITASI (dengan batas atas agar tidak keluar kanvas)
        p.vy += GRAVITY * dtScale;
        p.y += p.vy * dtScale;

        if (p.y < MIN_Y) {
          p.y = MIN_Y;
          if (p.vy < 0) p.vy = 0;
        }

        // 4. LANTAI DASAR
        if (p.y >= MAX_Y) {
          p.y = MAX_Y;
          if (p.vy > 0) p.vy = 0;
          p.jumping = false;
          p.canDoubleJump = false;
          animRef.current.isDoubleJumping = false;
        }

        // 5. TABRAKAN PLATFORM (Mendarat dari atas)
        let nextPlayerX = Math.max(MIN_X, Math.min(p.x + moveX, MAX_X));

        for (const plat of allPlatforms) {
          const horizontallyOver =
            p.x + PLAYER_W > plat.x + 3 && p.x < plat.x + plat.w - 3;

          if (!horizontallyOver) continue;

          // Mendarat dari ATAS (toleransi mulus agar tidak nyangkut saat melompat atau mendarat)
          if (p.vy >= 0) {
            const footY = p.y + PLAYER_H;
            const prevFootY = footY - p.vy * dtScale;
            if (footY >= plat.y && prevFootY <= plat.y + 16) {
              p.y = plat.y - PLAYER_H;
              p.vy = 0;
              p.jumping = false;
              p.canDoubleJump = false;
              animRef.current.isDoubleJumping = false;
            }
          }
        }

        // 6. RAMP TANGGA KANAN (x: 740 s.d. 840 — dari lantai dasar y=540 ke platform kanan y=440)
        const charFootX = nextPlayerX + PLAYER_W * 0.5;
        if (charFootX >= 740 && charFootX <= 840) {
          const t = (charFootX - 740) / (840 - 740);
          const stairsGroundY = 540 - t * (540 - 440);
          const footY = p.y + PLAYER_H;

          if (!p.jumping) {
            if (Math.abs(footY - stairsGroundY) <= 24) {
              p.y = stairsGroundY - PLAYER_H;
              p.vy = 0;
              p.canDoubleJump = false;
              animRef.current.isDoubleJumping = false;
            }
          } else if (p.vy >= 0) {
            if (footY >= stairsGroundY && footY - p.vy * dtScale <= stairsGroundY + 16) {
              p.y = stairsGroundY - PLAYER_H;
              p.vy = 0;
              p.jumping = false;
              p.canDoubleJump = false;
              animRef.current.isDoubleJumping = false;
            }
          }
        }

        // 7. TABRAKAN SISTEM LASER (Barrier + Respawn)
        const allLasers = [
          { ...laser1, active: laser1ActiveRef.current },
          { ...laser2, active: laser2ActiveRef.current },
          { ...laser3, active: laser3ActiveRef.current },
        ];

        for (const laser of allLasers) {
          if (!laser.active) continue;

          // A. Barrier: tidak bisa menembus laser aktif
          const inLaserYRange = p.y + PLAYER_H > laser.y && p.y < laser.y + laser.h;
          if (inLaserYRange) {
            if (p.x + PLAYER_W <= laser.x && nextPlayerX + PLAYER_W > laser.x) {
              nextPlayerX = laser.x - PLAYER_W;
            } else if (p.x >= laser.x + laser.w && nextPlayerX < laser.x + laser.w) {
              nextPlayerX = laser.x + laser.w;
            }
          }

          // B. Menyentuh langsung → respawn ke Pintu Masuk
          const isTouching =
            nextPlayerX + PLAYER_W > laser.x + 2 &&
            nextPlayerX < laser.x + laser.w - 2 &&
            p.y + PLAYER_H > laser.y + 2 &&
            p.y < laser.y + laser.h - 2;

          if (isTouching) {
            nextPlayerX = SPAWN_X;
            p.y = SPAWN_Y;
            p.vy = 0;
            p.jumping = false;
            p.canDoubleJump = false;
            animRef.current.isDoubleJumping = false;
            animRef.current.facing = "right";
            showToast("⚡ Tersengat Laser! Kembali ke Pintu Masuk.");
          }
        }

        // 8. BOUNDARY CLAMPING HORIZONTAL & VERTIKAL
        p.x = Math.max(MIN_X, Math.min(nextPlayerX, MAX_X));
        p.y = Math.max(MIN_Y, Math.min(p.y, MAX_Y));

        // 9. FALLBACK RECOVERY (jika melewati batas bawah/luar arena)
        if (p.y > GAME_HEIGHT || p.x < 0 || p.x + PLAYER_W > GAME_WIDTH) {
          p.x = SPAWN_X;
          p.y = SPAWN_Y;
          p.vy = 0;
          p.jumping = false;
          p.canDoubleJump = false;
          animRef.current.isDoubleJumping = false;
        }

        // 10. CEK KEDEKATAN OBJEK INTERAKTIF
        const checkNear = (obj: { x: number; y: number; w: number; h: number }, range = 55) => {
          const dx = Math.abs(p.x + PLAYER_W / 2 - (obj.x + obj.w / 2));
          const dy = Math.abs(p.y + PLAYER_H / 2 - (obj.y + obj.h / 2));
          return dx < obj.w / 2 + range && dy < obj.h / 2 + range;
        };

        setIsNearButton1(checkNear(button1Obj, 50));
        setIsNearHologram(checkNear(hologramObj, 55));
        setIsNearBanker(checkNear(bankerObj, 50));
        setIsNearPortal(checkNear(portalObj, 55));

        // 11. UPDATE STATE ANIMASI SPRITE (Sama persis dengan Stage 1)
        const ar = animRef.current;
        const nowAnim = performance.now();
        const isAirborne = p.jumping || Math.abs(p.vy) > 0.05;
        const isFacingLeft = ar.facing === "left";
        const walking = moveX !== 0;

        let nextSprite = "/idle.png";

        // PRIORITAS 1 - MELOMPAT / DI UDARA
        if (isAirborne) {
          const isDoubleJump = ar.isDoubleJumping || (!p.canDoubleJump && p.jumping);
          if (isDoubleJump) {
            if (ar.action !== "jetpack") {
              ar.action = "jetpack";
              ar.frame = 1;
              ar.lastFrameTime = nowAnim;
            } else if (nowAnim - ar.lastFrameTime >= 100) {
              ar.frame = ar.frame === 1 ? 2 : 1;
              ar.lastFrameTime = nowAnim;
            }
            nextSprite = `/jetpack-${ar.frame}.png`;
          } else {
            ar.action = "jump";
            ar.frame = 1;
            nextSprite = "/jump-1.png";
          }
        }
        // PRIORITAS 2 - BERJALAN KE KANAN
        else if (walking && !isFacingLeft) {
          if (ar.action !== "walk_r") {
            ar.action = "walk_r";
            ar.frame = 1;
            ar.lastFrameTime = nowAnim;
          } else if (nowAnim - ar.lastFrameTime >= 120) {
            ar.frame = (ar.frame % 6) + 1;
            ar.lastFrameTime = nowAnim;
          }
          nextSprite = `/walk-r-${ar.frame}.png`;
        }
        // PRIORITAS 3 - BERJALAN KE KIRI
        else if (walking && isFacingLeft) {
          if (ar.action !== "walk_l") {
            ar.action = "walk_l";
            ar.frame = 1;
            ar.lastFrameTime = nowAnim;
          } else if (nowAnim - ar.lastFrameTime >= 120) {
            ar.frame = (ar.frame % 6) + 1;
            ar.lastFrameTime = nowAnim;
          }
          nextSprite = `/walk-l-${ar.frame}.png`;
        }
        // PRIORITAS 4 - DIAM / IDLE
        else {
          ar.action = "idle";
          ar.frame = 0;
          nextSprite = "/idle.png";
        }

        setPlayerSprite(nextSprite);
        setPlayerX(p.x);
        setPlayerY(p.y);
        setVelocityY(p.vy);
        setIsJumping(p.jumping);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [showQuizModal, showMiniGameModal]);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <main className="min-h-screen bg-black text-[#e9e4ff] select-none flex flex-col items-center justify-center">

      {/* ═══ HUD ATAS (Struktur selaras Stage 1) ══════════════════ */}
      <div className="flex w-[1024px] items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2 text-xs text-gray-300 backdrop-blur-md mb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-wider text-[#ffb347] uppercase text-[11px]">
            Stage 4 // Deadlock &amp; Penanganannya
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <span>
            <strong className="text-white">A/D</strong>: Jalan •{" "}
            <strong className="text-white">W/Spasi</strong>: Lompat •{" "}
            <strong className="text-white">E</strong>: Tombol
          </span>

          {/* Status Laser L1 (Merah 1 — Jalur ke Modul) */}
          <span
            className={`font-mono font-bold px-1.5 py-0.5 rounded ${
              !isLaser1Active
                ? "bg-red-500/20 text-red-300 border border-red-500/40"
                : "bg-red-950/60 text-red-400 border border-red-400/30 animate-pulse"
            }`}
          >
            L1 (MRH): {isLaser1Active ? "ON" : "OFF"}
          </span>

          {/* Status Laser L2 (Merah 2 — Jalur ke Level 5) */}
          <span
            className={`font-mono font-bold px-1.5 py-0.5 rounded ${
              !isLaser2Active
                ? "bg-red-500/20 text-red-300 border border-red-500/40"
                : "bg-red-950/60 text-red-400 border border-red-400/30 animate-pulse"
            }`}
          >
            L2 (MRH): {isLaser2Active ? "ON" : "OFF"}
          </span>

          {/* Status Laser L3 (Kuning — Celah Platform Kiri & Tengah) */}
          <span
            className={`font-mono font-bold px-1.5 py-0.5 rounded ${
              !isLaser3Active
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                : "bg-yellow-950/60 text-yellow-400 border border-yellow-400/30 animate-pulse"
            }`}
          >
            L3 (KNG): {isLaser3Active ? "ON" : "OFF"}
          </span>

          {/* Status Portal */}
          <span
            className={`font-mono font-bold px-1.5 py-0.5 rounded ${
              isPortalReady
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
            }`}
          >
            {isPortalReady ? "PORTAL: UNLOCK" : "PORTAL: LOCK"}
          </span>

          {/* Skor */}
          <span className="font-mono font-bold text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-400/20">
            {currentScore} PTS
          </span>
        </div>
      </div>

      {/* ═══ ARENA PLATFORMER 1024×576 ════════════════════════════ */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/30 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
        style={{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
        }}
      >
        {/* Background Stage 4 (dipertahankan tanpa perubahan gambar) */}
        <DeadlockBackground />

        {/* ─── INDIKATOR PINTU MASUK (Kiri Bawah) ─────────────── */}
        <div
          className="absolute z-10 pointer-events-none flex flex-col items-center"
          style={{ left: `${SPAWN_X - 20}px`, top: `${SPAWN_Y - 36}px`, width: "80px" }}
        >
          <span className="flex items-center gap-1 rounded bg-black/70 border border-cyan-400/40 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-wider text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            PINTU MASUK
          </span>
          <div className="mt-1 h-16 w-14 rounded-t-lg border border-dashed border-cyan-500/20 bg-gradient-to-t from-cyan-500/10 to-transparent" />
        </div>

        {/* ─── TOMBOL TERMINAL KIRI (Monitor biru di platform kiri — buka L1) ─── */}
        <div
          className={`absolute z-20 flex flex-col items-center justify-center cursor-pointer rounded-lg border backdrop-blur-[1px] transition-colors ${
            !isLaser1Active
              ? "border-emerald-400/50 bg-emerald-950/55 opacity-80"
              : "border-red-400/85 bg-red-950/65 shadow-[0_0_14px_rgba(239,68,68,0.55)] hover:border-red-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.85)]"
          }`}
          style={{
            left: `${button1Obj.x + button1Obj.w / 2}px`,
            top: `${button1Obj.y}px`,
            width: `${button1Obj.w}px`,
            height: `${button1Obj.h}px`,
            transform: "translateX(-50%)",
          }}
          onClick={handlePressButton1}
        >
          {isNearButton1 && isLaser1Active && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce z-30 pointer-events-none">
              <span className="rounded bg-red-400 px-2 py-0.5 text-[9px] font-black text-black shadow-md">
                [E] Terminal Kunci
              </span>
            </div>
          )}
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              !isLaser1Active
                ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]"
                : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.95)] animate-pulse"
            }`}
          />
          <span
            className={`text-[7.5px] font-mono font-bold mt-0.5 uppercase tracking-wider leading-none ${
              !isLaser1Active ? "text-emerald-200" : "text-red-100"
            }`}
          >
            {!isLaser1Active ? "OPEN" : "BTN 1"}
          </span>
        </div>

        {/* ─── HOLOGRAM MODUL: STAGE 4 (Platform Tengah Atas) ───── */}
        <div
          className="absolute z-20 flex flex-col items-center cursor-pointer"
          style={{
            left: `${hologramObj.x}px`,
            top: `${hologramObj.y}px`,
            width: `${hologramObj.w}px`,
            height: `${hologramObj.h}px`,
          }}
          onClick={() => {
            if (!isLaser1Active) {
              setShowQuizModal(true);
            } else {
              showToast("⚠️ Jalur ke Modul Stage 4 masih terblokir! Tekan tombol terminal kiri terlebih dahulu.");
            }
          }}
        >
          {isNearHologram && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce z-30">
              <span
                className={`rounded px-2 py-0.5 text-[9px] font-black shadow-md ${
                  !isLaser1Active
                    ? "bg-cyan-400 text-black"
                    : "bg-gray-700 text-gray-200"
                }`}
              >
                {!isLaser1Active ? "[E] MODUL: STAGE 4" : "🔒 Terkunci (L1)"}
              </span>
            </div>
          )}
          <div
            className={`flex h-12 w-14 items-center justify-center rounded-xl border transition-all ${
              quizPassed
                ? "border-emerald-400/80 bg-emerald-950/60 shadow-[0_0_20px_rgba(52,211,153,0.7)]"
                : "border-cyan-400/80 bg-cyan-950/60 shadow-[0_0_20px_rgba(34,211,238,0.7)] animate-pulse"
            }`}
          >
            <span className="text-xl">{quizPassed ? "✅" : "📜"}</span>
          </div>
          <span className="mt-1 text-[9px] font-mono font-bold tracking-wider text-cyan-300 bg-black/60 px-1.5 py-0.5 rounded border border-cyan-400/30">
            MODUL: STAGE 4
          </span>
        </div>

        {/* ─── LIFE-SUPPORT BANKER (Kanan Bawah Dekat Tangga) ─────── */}
        <div
          className="absolute z-20 flex flex-col items-center cursor-pointer"
          style={{
            left: `${bankerObj.x}px`,
            top: `${bankerObj.y}px`,
            width: `${bankerObj.w}px`,
            height: `${bankerObj.h}px`,
          }}
          onClick={() => setShowMiniGameModal(true)}
        >
          {isNearBanker && (
            <div className="absolute -top-7 whitespace-nowrap animate-bounce z-30">
              <span className="rounded bg-yellow-400 px-2 py-0.5 text-[9px] font-black text-black shadow-md">
                [E] Life-Support Banker
              </span>
            </div>
          )}
          <div
            className={`flex h-11 w-12 items-center justify-center rounded-xl border transition-all ${
              bankerDone
                ? "border-emerald-400/80 bg-emerald-950/60 shadow-[0_0_20px_rgba(52,211,153,0.7)]"
                : "border-yellow-400/80 bg-yellow-950/70 shadow-[0_0_20px_rgba(234,179,8,0.7)] animate-pulse"
            }`}
          >
            <span className="text-lg">{bankerDone ? "✅" : "🧪"}</span>
          </div>
          <span className="mt-1 text-[9px] font-mono font-bold text-yellow-300 bg-black/60 px-1 rounded border border-yellow-400/30">
            BANKER CORE
          </span>
        </div>

        {/* ─── PORTAL LEVEL 5 (Platform Kanan Atas) ───────────────── */}
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
            <div className="absolute -top-7 whitespace-nowrap animate-bounce z-30">
              <span
                className={`rounded px-2 py-0.5 text-[9px] font-black shadow-md ${
                  isPortalReady ? "bg-emerald-400 text-black" : "bg-gray-700 text-gray-300"
                }`}
              >
                {isPortalReady ? "[E] Masuk Level 5" : "🔒 Portal Terkunci"}
              </span>
            </div>
          )}
          <div
            className={`absolute inset-0 rounded-full border-2 ${
              isPortalReady
                ? "transition-all duration-500 border-emerald-400 bg-emerald-500/30 shadow-[0_0_35px_rgba(52,211,153,0.9)] animate-pulse"
                : "border-purple-400 bg-purple-600/30 shadow-[0_0_20px_rgba(168,85,247,0.5)] opacity-70"
            }`}
          />
          <div className="relative z-10 text-center pointer-events-none">
            <span
              className={isPortalReady ? "text-2xl animate-spin inline-block" : "text-2xl inline-block"}
              style={isPortalReady ? { animationDuration: "8s" } : undefined}
            >
              {isPortalReady ? "🌀" : "🔒"}
            </span>
            <span
              className={`block text-[8px] font-black tracking-widest uppercase mt-0.5 ${
                isPortalReady ? "text-emerald-300" : "text-cyan-200"
              }`}
            >
              LEVEL 5
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            LASER 1: MERAH TERANG (Vertikal — Di atas meja tengah di bawah SASCO/SWICC)
            Posisi: x = 410, y = 245..340
            Dibuka setelah Tombol Terminal Kiri ditekan
            ═══════════════════════════════════════════════════════ */}
        <div
          className={`absolute flex flex-col items-center justify-between transition-all duration-500 pointer-events-none ${
            !isLaser1Active ? "opacity-0 scale-95" : "opacity-100 z-20"
          }`}
          style={{
            left: `${laser1.x}px`,
            top: `${laser1.y}px`,
            width: `${laser1.w}px`,
            height: `${laser1.h}px`,
          }}
        >
          {/* Emitter Atas */}
          <div className="relative w-6 h-2.5 -mt-1 rounded-sm bg-gradient-to-r from-slate-900 via-red-600 to-slate-900 border border-red-300 flex items-center justify-center z-30">
            <span className="w-2 h-1 rounded-full bg-white animate-ping" />
          </div>
          {/* Sinar Laser Vertikal */}
          <div className="relative w-full flex-1 flex items-center justify-center overflow-visible my-0.5">
            <div className="relative w-3 h-full bg-gradient-to-b from-red-500 via-red-300 to-red-500 rounded-full laser-alive-red flex items-center justify-center overflow-hidden">
              <div className="w-1 h-full bg-white rounded-full opacity-90 laser-core-flicker" />
              <div className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-white to-transparent opacity-80 laser-energy-pulse" />
            </div>
          </div>
          {/* Emitter Bawah */}
          <div className="relative w-6 h-2.5 -mb-1 rounded-sm bg-gradient-to-r from-slate-900 via-red-600 to-slate-900 border border-red-300 flex items-center justify-center z-30">
            <span className="w-2 h-1 rounded-full bg-white animate-ping" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>

        {/* Label L1 */}
        {isLaser1Active && (
          <div
            className="absolute z-25 pointer-events-none"
            style={{ left: `${laser1.x + laser1.w + 3}px`, top: `${laser1.y + Math.floor(laser1.h / 2) - 8}px` }}
          >
            <span className="text-[8px] font-mono font-bold text-red-400 bg-black/80 px-1 py-0.5 rounded border border-red-500/30">
              L1
            </span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            LASER 3: KUNING TERANG (Vertikal — Celah Platform Kiri & Meja Tengah)
            Posisi: x = 335, y = 240..412
            Dibuka setelah Life-Support Banker selesai
            ═══════════════════════════════════════════════════════ */}
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
          {/* Emitter Atas */}
          <div className="relative w-6 h-2.5 -mt-1 rounded-sm bg-gradient-to-r from-slate-900 via-yellow-500 to-slate-900 border border-yellow-300 flex items-center justify-center z-30">
            <span className="w-2 h-1 rounded-full bg-white animate-ping" />
          </div>
          {/* Sinar Laser Vertikal */}
          <div className="relative w-full flex-1 flex items-center justify-center overflow-visible my-0.5">
            <div className="relative w-3 h-full bg-gradient-to-b from-yellow-500 to-yellow-300 rounded-full laser-alive-yellow flex items-center justify-center overflow-hidden">
              <div className="w-1 h-full bg-white rounded-full opacity-90 laser-core-flicker" />
              <div className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-white to-transparent opacity-80 laser-energy-pulse" />
            </div>
          </div>
          {/* Emitter Bawah */}
          <div className="relative w-6 h-2.5 -mb-1 rounded-sm bg-gradient-to-r from-slate-900 via-yellow-500 to-slate-900 border border-yellow-300 flex items-center justify-center z-30">
            <span className="w-2 h-1 rounded-full bg-white animate-ping" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>

        {/* Label L3 */}
        {isLaser3Active && (
          <div
            className="absolute z-25 pointer-events-none"
            style={{ left: `${laser3.x + laser3.w + 3}px`, top: `${laser3.y + Math.floor(laser3.h / 2) - 8}px` }}
          >
            <span className="text-[8px] font-mono font-bold text-yellow-400 bg-black/80 px-1 py-0.5 rounded border border-yellow-500/30">
              L3
            </span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            LASER 2: MERAH TERANG (Vertikal — Sisi Kanan Platform Tengah Atas sebelum Level 5)
            Posisi: x = 818, y = 205..340
            Dibuka setelah Modul Stage 4 selesai dikerjakan
            ═══════════════════════════════════════════════════════ */}
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
          {/* Emitter Atas */}
          <div className="relative w-6 h-2.5 -mt-1 rounded-sm bg-gradient-to-r from-slate-900 via-red-600 to-slate-900 border border-red-300 flex items-center justify-center z-30">
            <span className="w-2 h-1 rounded-full bg-white animate-ping" />
          </div>
          {/* Sinar Laser Vertikal */}
          <div className="relative w-full flex-1 flex items-center justify-center overflow-visible my-0.5">
            <div className="relative w-3 h-full bg-gradient-to-b from-red-500 via-red-300 to-red-500 rounded-full laser-alive-red flex items-center justify-center overflow-hidden">
              <div className="w-1 h-full bg-white rounded-full opacity-90 laser-core-flicker" />
              <div className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-white to-transparent opacity-80 laser-energy-pulse" />
            </div>
          </div>
          {/* Emitter Bawah */}
          <div className="relative w-6 h-2.5 -mb-1 rounded-sm bg-gradient-to-r from-slate-900 via-red-600 to-slate-900 border border-red-300 flex items-center justify-center z-30">
            <span className="w-2 h-1 rounded-full bg-white animate-ping" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>

        {/* Label L2 */}
        {isLaser2Active && (
          <div
            className="absolute z-25 pointer-events-none"
            style={{ left: `${laser2.x + laser2.w + 3}px`, top: `${laser2.y + Math.floor(laser2.h / 2) - 8}px` }}
          >
            <span className="text-[8px] font-mono font-bold text-red-400 bg-black/80 px-1 py-0.5 rounded border border-red-500/30">
              L2
            </span>
          </div>
        )}

        {/* ─── KARAKTER PLAYER ─────────────────────────────────── */}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={playerSprite}
              alt="Player"
              draggable={false}
              className="absolute select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
              style={{
                width: `${VISUAL_H}px`,
                height: `${VISUAL_H}px`,
                bottom: 0,
                left: "50%",
                objectFit: "contain",
                objectPosition: "center bottom",
                transform:
                  (isJumping || !isWalking) && facingLeft
                    ? "translateX(-50%) scaleX(-1)"
                    : "translateX(-50%)",
                transformOrigin: "center bottom",
              }}
            />
          </div>
        </div>
      </div>

      {/* ═══ NAVIGASI & KONTROL BAWAH ═════════════════════════════ */}
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
          Kontrol:{" "}
          <span className="text-cyan-300 font-bold">[A/D]</span> Jalan •{" "}
          <span className="text-cyan-300 font-bold">[W/Spasi]</span> Lompat •{" "}
          <span className="text-cyan-300 font-bold">[E]</span> Interaksi
        </div>
      </div>

      {/* ═══ TOAST NOTIFIKASI ═══════════════════════════════════════ */}
      {toastMessage && (
        <div className="fixed bottom-6 z-50 rounded-xl border border-cyan-500/40 bg-[#071324]/95 px-5 py-2.5 text-xs text-cyan-200 shadow-xl backdrop-blur-md">
          {toastMessage}
        </div>
      )}

      {/* ═══ MODAL KUIS: MODUL STAGE 4 ═══════════════════════════════ */}
      <DeadlockQuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onPass={handlePassQuiz}
        isAlreadyPassed={quizPassed}
      />

      {/* ═══ MODAL MINI-GAME: LIFE-SUPPORT BANKER ════════════════════ */}
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

      {/* ═══ ANIMASI LASER (Selaras Stage 1) ═══════════════════════ */}
      <style jsx>{`
        @keyframes laserFlickerRed {
          0%, 100% {
            opacity: 1;
            filter: drop-shadow(0 0 14px rgba(239, 68, 68, 0.95)) drop-shadow(0 0 28px rgba(220, 38, 38, 0.7));
          }
          20% {
            opacity: 0.86;
            filter: drop-shadow(0 0 9px rgba(239, 68, 68, 0.75)) drop-shadow(0 0 16px rgba(220, 38, 38, 0.5));
          }
          40% {
            opacity: 1;
            filter: drop-shadow(0 0 18px rgba(239, 68, 68, 1)) drop-shadow(0 0 32px rgba(220, 38, 38, 0.85));
          }
          65% {
            opacity: 0.92;
            filter: drop-shadow(0 0 11px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 20px rgba(220, 38, 38, 0.6));
          }
          85% {
            opacity: 0.84;
            filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.65));
          }
        }
        .laser-alive-red {
          animation: laserFlickerRed 0.16s infinite alternate ease-in-out;
        }

        @keyframes laserFlickerYellow {
          0%, 100% {
            opacity: 1;
            filter: drop-shadow(0 0 14px rgba(234, 179, 8, 0.95)) drop-shadow(0 0 28px rgba(202, 138, 4, 0.7));
          }
          20% {
            opacity: 0.86;
            filter: drop-shadow(0 0 9px rgba(234, 179, 8, 0.75)) drop-shadow(0 0 16px rgba(202, 138, 4, 0.5));
          }
          40% {
            opacity: 1;
            filter: drop-shadow(0 0 18px rgba(234, 179, 8, 1)) drop-shadow(0 0 32px rgba(202, 138, 4, 0.85));
          }
          65% {
            opacity: 0.92;
            filter: drop-shadow(0 0 11px rgba(234, 179, 8, 0.8)) drop-shadow(0 0 20px rgba(202, 138, 4, 0.6));
          }
          85% {
            opacity: 0.84;
            filter: drop-shadow(0 0 8px rgba(234, 179, 8, 0.65));
          }
        }
        .laser-alive-yellow {
          animation: laserFlickerYellow 0.16s infinite alternate ease-in-out;
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
      `}</style>
    </main>
  );
}
