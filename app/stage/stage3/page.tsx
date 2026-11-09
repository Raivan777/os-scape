"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type PageSizeMode,
  type FrameItem,
  type TranslationResult,
  PROCESSES,
  TRANSLATION_CHALLENGES,
  generatePagesForProcesses,
  initializeFrames,
  calculateExpectedPhysicalAddress,
  getAllPagingMetrics,
  autoMapPagesToFrames,
} from "@/utils/pagingLogic";

// ──────────────────────────────────────────────────────────────
// OS-SCAPE Stage 3: The Memory Vault - Paging System
// 2D Platformer Mechanics (Kanvas Tetap 1024×576 16:9)
// ──────────────────────────────────────────────────────────────

// ─── TACTICAL SCI-FI VECTOR ICONS (BESPOKE HUD & RETICLE GLYPHS) ─────
const IconTerminalScreen = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="3" width="20" height="14" rx="2" className="stroke-cyan-400" />
    <path d="M8 21h8M12 17v4" className="stroke-cyan-500" />
    <path d="M7 8l3 3-3 3" className="stroke-cyan-300" />
    <path d="M13 14h4" className="stroke-cyan-300" />
  </svg>
);

const IconDatalogChip = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="4" y="4" width="16" height="16" rx="2" className="stroke-cyan-400" />
    <rect x="9" y="9" width="6" height="6" className="stroke-cyan-300 fill-cyan-400/20" />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" className="stroke-cyan-500" />
  </svg>
);

const IconBreakerSwitch = ({ active, color = "amber" }: { active?: boolean; color?: "amber" | "purple" }) => {
  const strokeColor = active
    ? "stroke-emerald-400"
    : color === "amber"
    ? "stroke-amber-400"
    : "stroke-purple-400";
  const glowFill = active
    ? "fill-emerald-400/20"
    : color === "amber"
    ? "fill-amber-400/20"
    : "fill-purple-400/20";
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" className={`${strokeColor} ${glowFill}`} />
      <polygon points="13 3 6 13 12 13 11 21 18 11 12 11 13 3" className={strokeColor} />
    </svg>
  );
};

const IconTransitGateway = ({ unlocked }: { unlocked?: boolean }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
    <circle
      cx="12"
      cy="12"
      r="9"
      className={unlocked ? "stroke-emerald-400 animate-spin" : "stroke-rose-500/80"}
      style={{ animationDuration: "12s" }}
      strokeDasharray={unlocked ? "4 2" : "none"}
    />
    <circle
      cx="12"
      cy="12"
      r="5"
      className={unlocked ? "stroke-cyan-300 fill-emerald-500/30" : "stroke-rose-400/60 fill-rose-950/40"}
    />
    {unlocked ? (
      <path d="M12 7v10M7 12h10" className="stroke-emerald-200" />
    ) : (
      <rect x="9.5" y="10.5" width="5" height="4" rx="1" className="stroke-rose-400 fill-rose-400/30" />
    )}
  </svg>
);

export default function Stage3Page() {
  const router = useRouter();

  // ─── KONSTANTA KANVAS (16:9 Fixed Sesuai Stage 1 & 2) ────────
  const GAME_WIDTH = 1024;
  const GAME_HEIGHT = 576;
  const GROUND_Y = 540; // Lantai dasar solid mengikuti garis lantai gambar baru

  // ─── KONSTANTA PEMAIN ────────────────────────────────────────
  const PLAYER_W = 44;
  const PLAYER_H = 64;
  const MOVE_SPEED = 4.5;
  const JUMP_POWER = -13.8; // Lompatan responsif menjangkau catwalk atas
  const GRAVITY = 0.6;

  // ─── TITIK AWAL PEMAIN (SPAWN POINT) ─────────────────────────
  const SPAWN_X = 60;
  const SPAWN_Y = GROUND_Y - PLAYER_H;

  // ─── STATE PEMAIN & FISIKA ───────────────────────────────────
  const [playerX, setPlayerX] = useState(SPAWN_X);
  const [playerY, setPlayerY] = useState(SPAWN_Y);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isWalking, setIsWalking] = useState(false);
  const [isHurt, setIsHurt] = useState(false);

  // ─── STATE TOAST NOTIFIKASI ──────────────────────────────────
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const triggerAlert = (msg: string) => {
    setAlertMessage(msg);
  };

  useEffect(() => {
    if (!alertMessage) return;
    const t = setTimeout(() => setAlertMessage(null), 3500);
    return () => clearTimeout(t);
  }, [alertMessage]);

  // ─── HITBOX DEFINITIONS (PLATFORM SESUAI GAMBAR) ─────────────
  // 1. Lantai Dasar Paling Bawah (Continuous Solid Floor)
  const groundPlatform = { x: 0, y: GROUND_Y, w: GAME_WIDTH, h: GAME_HEIGHT - GROUND_Y };

  // 2. Platform Mezanin Kiri (Lantai mezanin di atas lab bawah)
  const platLeftDeck = { x: 0, y: 350, w: 330, h: 20, label: "DATA DECK" };

  // 3. Platform Utama Tengah (Ketinggian y=295 pas dengan lantai panggung gambar)
  const platMain = { x: 325, y: 295, w: 515, h: 22, label: "MAIN PLATFORM" };

  // 4. Bordas Pendaratan Tangga Kanan (Lantai bawah di sebelah kanan tangga)
  const platLanding = { x: 780, y: 410, w: 210, h: 20, label: "LOWER DECK" };

  // 5. Catwalk Pipa Atas Kiri (Tempat Gerbang Portal Keluar ke Stage 4 di Ujung Kiri)
  const platCatwalkLeft = { x: 10, y: 166, w: 285, h: 18, label: "PORTAL DECK L" };

  // 6. Catwalk Atas Kanan (Tempat Komputer Materi OMNI di bawah jendela planet)
  const platCatwalkRight = { x: 748, y: 165, w: 235, h: 18, label: "CONSOLE DECK R" };

  // Daftar semua platform statis untuk deteksi tabrakan
  const allPlatforms = [
    platLeftDeck,
    platMain,
    platLanding,
    platCatwalkLeft,
    platCatwalkRight,
  ];

  // ─── OBJEK INTERAKTIF RUANGAN ────────────────────────────────
  // 1. Materi di Komputer Kanan Atas (Manual OMNI)
  const consoleObj = { x: 915, y: 165 - 48, w: 46, h: 48 };

  // 2. Mini Game Tetap di Komputer Tengah (Page Frame Mapper)
  const terminalObj = { x: 475, y: 295 - 54, w: 54, h: 54 };

  // 3. Portal di Catwalk Kiri Atas (Stage 4 Gate) - Pas menyatu dengan pintu di gambar background
  const laserDoor = { x: 160, y: 166 - 96, w: 64, h: 96 };
  const portalObj = { x: 160, y: 166 - 96, w: 64, h: 96 };

  // 4. Komputer Tengah Kanan (Switch Pembuka Tembok Kuning) - Pas di komputer gambar dek kanan
  const consoleMidRightObj = { x: 805, y: 295 - 48, w: 46, h: 48 };

  // 5. Komputer Kiri (Switch Pembuka Tembok Merah) - Pas di komputer gambar mezanin kiri
  const consoleMidLeftObj = { x: 215, y: 350 - 48, w: 46, h: 48 };

  // ─── TEMBOK PENGHALANG SEKURITAS RUANGAN (TINGGI PENUH: TIDAK BISA DILOMPATI) ─────────
  // 1. Tembok Kuning (Bawah): Di x=285, y=166..350 (menghalangi akses ke Komputer Kiri)
  const wallYellow = { x: 285, y: 166, w: 22, h: 350 - 166 };
  const wallCenter = wallYellow; // Alias kompatibilitas

  // 2. Tembok Biru (Atas): Di x=285, y=0..166 (menghalangi akses ke Catwalk Portal Stage 4)
  const wallBlue = { x: 285, y: 0, w: 22, h: 166 };

  // 3. Tembok Merah: Di ujung kiri platCatwalkRight (x=748, y=0..165, menghalangi Catwalk Materi)
  const wallMaterial = { x: 748, y: 0, w: 22, h: 165 };

  // Status Kedekatan Pemain dengan Objek Interaktif
  const [isNearConsole, setIsNearConsole] = useState(false);
  const [isNearTerminal, setIsNearTerminal] = useState(false);
  const [isNearPortal, setIsNearPortal] = useState(false);
  const [isNearMidRightSwitch, setIsNearMidRightSwitch] = useState(false);
  const [isNearMidLeftSwitch, setIsNearMidLeftSwitch] = useState(false);

  // Status Pembukaan Tembok Penghalang
  const [isWallCenterOpen, setIsWallCenterOpen] = useState(false);
  const [isWallMaterialOpen, setIsWallMaterialOpen] = useState(false);

  // Refs untuk Game Loop 60fps
  const wallCenterOpenRef = useRef(isWallCenterOpen);
  const wallMaterialOpenRef = useRef(isWallMaterialOpen);
  useEffect(() => {
    wallCenterOpenRef.current = isWallCenterOpen;
  }, [isWallCenterOpen]);
  useEffect(() => {
    wallMaterialOpenRef.current = isWallMaterialOpen;
  }, [isWallMaterialOpen]);

  // Status Pembacaan Materi Manual OMNI (Wajib dibaca sebelum Terminal Mini-Game dapat diakses)
  const [hasReadMaterial, setHasReadMaterial] = useState(false);

  // ============================================================================
  // LOGIKA PAGING & STATE MINI-GAME
  // ============================================================================

  // Mode ukuran page aktif: 2 KB (Kecil) | 4 KB (Sedang) | 8 KB (Besar)
  const [activeMode, setActiveMode] = useState<PageSizeMode>(4);

  // Status penyelesaian verifikasi per mode
  const [completedModes, setCompletedModes] = useState<Record<PageSizeMode, boolean>>({
    2: false,
    4: false,
    8: false,
  });

  // State penyimpanan frame memory per mode
  const [framesPerMode, setFramesPerMode] = useState<Record<PageSizeMode, FrameItem[]>>(() => ({
    2: initializeFrames(2),
    4: initializeFrames(4),
    8: initializeFrames(8),
  }));

  // Page yang sedang dipilih pemain untuk ditempatkan ke Frame
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // Input alamat fisik untuk formulir tantangan per mode
  const [challengeInputs, setChallengeInputs] = useState<Record<PageSizeMode, string>>({
    2: "",
    4: "",
    8: "",
  });

  // Hasil verifikasi tantangan per mode
  const [challengeResults, setChallengeResults] = useState<Record<PageSizeMode, TranslationResult | null>>({
    2: null,
    4: null,
    8: null,
  });

  // State Modal Popup
  const [showMapperModal, setShowMapperModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [hasAutoOpenedMetrics, setHasAutoOpenedMetrics] = useState(false);

  // Cek apakah seluruh 3 mode telah selesai
  const isAllModesCompleted = useMemo(() => {
    return completedModes[2] && completedModes[4] && completedModes[8];
  }, [completedModes]);

  // Begitu ketiga mode selesai, tutup terminal mini-game, buka modal metrik dan buka portal di kiri atas
  useEffect(() => {
    if (isAllModesCompleted && !hasAutoOpenedMetrics) {
      setHasAutoOpenedMetrics(true);
      setShowMapperModal(false);
      setShowMetricsModal(true);
      triggerAlert("🔓 Selamat! 3 Mode Paging Selesai. Tembok Biru Dinonaktifkan & Portal Stage 4 di Kiri Atas Terbuka!");
    }
  }, [isAllModesCompleted, hasAutoOpenedMetrics]);

  // Data turunan untuk mode aktif
  const currentPages = useMemo(() => {
    return generatePagesForProcesses(PROCESSES, activeMode);
  }, [activeMode]);

  const currentFrames = useMemo(() => {
    return framesPerMode[activeMode];
  }, [framesPerMode, activeMode]);

  const mappedPageIds = useMemo(() => {
    const ids = new Set<string>();
    for (const frame of currentFrames) {
      if (frame.mappedPage) {
        ids.add(frame.mappedPage.id);
      }
    }
    return ids;
  }, [currentFrames]);

  const unmappedPages = useMemo(() => {
    return currentPages.filter((page) => !mappedPageIds.has(page.id));
  }, [currentPages, mappedPageIds]);

  const isAllPagesMapped = useMemo(() => {
    return unmappedPages.length === 0;
  }, [unmappedPages]);

  const activeSelectedPage = useMemo(() => {
    if (!selectedPageId) return null;
    return currentPages.find((p) => p.id === selectedPageId) || null;
  }, [selectedPageId, currentPages]);

  const activeChallenge = useMemo(() => {
    return TRANSLATION_CHALLENGES[activeMode];
  }, [activeMode]);

  // Target Page & Frame untuk Verifikasi Translasi MMU
  const targetPageId = `${activeChallenge.processId}-P${activeChallenge.targetPageIndex}`;
  const targetFrame = currentFrames.find((f) => f.mappedPage?.id === targetPageId);
  const targetFrameIndex = targetFrame ? targetFrame.frameIndex : 0;
  const correctAddressVal = targetFrameIndex * activeMode + activeChallenge.offsetKB;

  // 3 Kartu Pilihan Jawaban MMU Dinamis (1 Jawaban Benar + 2 Distraktor Edukatif)
  const mmuOptions = useMemo(() => {
    // Distraktor 1: Lupa menambahkan offset (hanya frameIndex * activeMode)
    const distractor1Val = targetFrameIndex * activeMode;

    // Distraktor 2: Salah baris frame (frame alternatif yang valid di RAM)
    const altFrameIndex = targetFrameIndex === 0 ? targetFrameIndex + 2 : targetFrameIndex - 1;
    const distractor2Val = altFrameIndex * activeMode + activeChallenge.offsetKB;

    const optCorrect = {
      value: correctAddressVal,
      formula: `(${targetFrameIndex} × ${activeMode}) + ${activeChallenge.offsetKB} KB`,
      note: `Perhitungan Tepat: (Frame ${targetFrameIndex} × ${activeMode} KB) + Offset ${activeChallenge.offsetKB} KB`,
      isCorrect: true,
    };

    const optNoOffset = {
      value: distractor1Val,
      formula: `(${targetFrameIndex} × ${activeMode}) + 0 KB`,
      note: `Lupa Offset: Hanya mengalikan Frame ${targetFrameIndex} tanpa Offset ${activeChallenge.offsetKB} KB`,
      isCorrect: false,
    };

    const optWrongFrame = {
      value: distractor2Val,
      formula: `(${altFrameIndex} × ${activeMode}) + ${activeChallenge.offsetKB} KB`,
      note: `Salah Lookup Frame: Mengambil baris Frame ${altFrameIndex} di Page Table`,
      isCorrect: false,
    };

    // Susunan deterministik per mode agar posisi jawaban variatif (Mode 2 -> B, Mode 4 -> A, Mode 8 -> C)
    if (activeMode === 2) {
      return [
        { letter: "A", ...optNoOffset },
        { letter: "B", ...optCorrect },
        { letter: "C", ...optWrongFrame },
      ];
    } else if (activeMode === 4) {
      return [
        { letter: "A", ...optCorrect },
        { letter: "B", ...optNoOffset },
        { letter: "C", ...optWrongFrame },
      ];
    } else {
      return [
        { letter: "A", ...optWrongFrame },
        { letter: "B", ...optNoOffset },
        { letter: "C", ...optCorrect },
      ];
    }
  }, [activeMode, targetFrameIndex, correctAddressVal, activeChallenge]);

  const allMetrics = useMemo(() => {
    return getAllPagingMetrics();
  }, []);

  const completedCount = useMemo(() => {
    return [completedModes[2], completedModes[4], completedModes[8]].filter(Boolean).length;
  }, [completedModes]);

  // ─── HANDLERS INTERAKSI PEMETAAN PAGING ─────────────────────
  const handleSelectPage = (pageId: string) => {
    setSelectedPageId((prev) => (prev === pageId ? null : pageId));
  };

  const handleFrameClick = (frameIndex: number) => {
    const frame = currentFrames[frameIndex];
    if (frame.isReserved) return;

    if (frame.mappedPage) {
      const updated = currentFrames.map((f, idx) =>
        idx === frameIndex ? { ...f, mappedPage: null } : f
      );
      setFramesPerMode((prev) => ({
        ...prev,
        [activeMode]: updated,
      }));
      if (challengeResults[activeMode]) {
        setChallengeResults((prev) => ({ ...prev, [activeMode]: null }));
      }
      return;
    }

    if (activeSelectedPage) {
      const updated = currentFrames.map((f, idx) =>
        idx === frameIndex ? { ...f, mappedPage: { ...activeSelectedPage } } : f
      );
      setFramesPerMode((prev) => ({
        ...prev,
        [activeMode]: updated,
      }));
      setSelectedPageId(null);
      if (challengeResults[activeMode]) {
        setChallengeResults((prev) => ({ ...prev, [activeMode]: null }));
      }
    }
  };

  const handleAutoMap = () => {
    const mapped = autoMapPagesToFrames(currentPages, currentFrames);
    setFramesPerMode((prev) => ({
      ...prev,
      [activeMode]: mapped,
    }));
    setSelectedPageId(null);
    if (challengeResults[activeMode]) {
      setChallengeResults((prev) => ({ ...prev, [activeMode]: null }));
    }
  };

  const handleResetMode = () => {
    setFramesPerMode((prev) => ({
      ...prev,
      [activeMode]: initializeFrames(activeMode),
    }));
    setSelectedPageId(null);
    setChallengeResults((prev) => ({ ...prev, [activeMode]: null }));
    setChallengeInputs((prev) => ({ ...prev, [activeMode]: "" }));
  };

  const handleVerifyTranslation = (selectedAddress?: number) => {
    let userVal: number;
    if (selectedAddress !== undefined) {
      userVal = selectedAddress;
    } else {
      const rawInput = challengeInputs[activeMode].trim();
      userVal = Number(rawInput);
    }

    if (isNaN(userVal)) {
      setChallengeResults((prev) => ({
        ...prev,
        [activeMode]: {
          isValid: false,
          pageIndex: 0,
          offsetKB: 0,
          frameIndex: null,
          expectedPhysicalAddressKB: null,
          userAddressKB: 0,
          isCorrect: false,
          message: "Pilih salah satu kartu kalkulasi Physical Address di bawah.",
        },
      }));
      return;
    }

    const res = calculateExpectedPhysicalAddress(
      activeMode,
      currentFrames,
      activeChallenge,
      userVal
    );

    setChallengeResults((prev) => ({
      ...prev,
      [activeMode]: res,
    }));

    if (res.isCorrect) {
      setCompletedModes((prev) => {
        const next = { ...prev, [activeMode]: true };
        const allDone = next[2] && next[4] && next[8];
        if (allDone) {
          setShowMapperModal(false);
          setShowMetricsModal(true);
          triggerAlert("🔓 Selesai! Evaluasi Metrik Siap & Portal Stage 4 di Kiri Atas Terbuka!");
        } else {
          triggerAlert(`🎉 Mode Page ${activeMode} KB Berhasil Diverifikasi!`);
        }
        return next;
      });
    }
  };

  // ─── REFS GAME LOOP ──────────────────────────────────────────
  const keysPressed = useRef<Set<string>>(new Set());
  const playerRef = useRef({ x: playerX, y: playerY, vy: velocityY, jumping: isJumping });
  const laserOpenRef = useRef(isAllModesCompleted);
  // Tembok Biru terbuka bersamaan dengan portal menuju Stage 4 setelah menyelesaikan mini-game
  const isWallBlueOpen = isAllModesCompleted;
  const wallBlueOpenRef = useRef(isWallBlueOpen);

  playerRef.current = { x: playerX, y: playerY, vy: velocityY, jumping: isJumping };
  laserOpenRef.current = isAllModesCompleted;
  wallBlueOpenRef.current = isWallBlueOpen;

  // ─── RESET PEMAIN KE TITIK SPAWN ─────────────────────────────
  const resetPlayerToSpawn = (reason?: string) => {
    setIsHurt(true);
    setTimeout(() => setIsHurt(false), 500);

    setPlayerX(SPAWN_X);
    setPlayerY(SPAWN_Y);
    setVelocityY(0);
    setIsJumping(false);
    setIsWalking(false);
    playerRef.current = { x: SPAWN_X, y: SPAWN_Y, vy: 0, jumping: false };

    if (reason) triggerAlert(reason);
  };

  // ─── KEYBOARD EVENT LISTENERS ────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Interaksi tombol E
      if (key === "e") {
        // 1. Komputer Tengah Kanan (Membuka Tembok Kuning di Kiri)
        if (isNearMidRightSwitch && !showManualModal && !showMapperModal && !showMetricsModal) {
          if (!isWallCenterOpen) {
            setIsWallCenterOpen(true);
            triggerAlert("🔓 Tembok Kuning Terbuka! Akses menuju Komputer Kiri sekarang terbuka.");
          } else {
            triggerAlert("ℹ️ Tembok Kuning sudah dinonaktifkan.");
          }
          return;
        }

        // 2. Komputer Kiri (Membuka Tembok Merah di Catwalk Kanan)
        if (isNearMidLeftSwitch && !showManualModal && !showMapperModal && !showMetricsModal) {
          if (!isWallMaterialOpen) {
            setIsWallMaterialOpen(true);
            triggerAlert("🔓 Tembok Merah Terbuka! Akses Catwalk menuju Komputer Materi (Kanan Atas) sekarang terbuka.");
          } else {
            triggerAlert("ℹ️ Tembok Merah sudah dinonaktifkan.");
          }
          return;
        }

        // 3. Komputer Materi (Kanan Atas)
        if (isNearConsole && !showManualModal && !showMapperModal && !showMetricsModal) {
          setShowManualModal(true);
          setHasReadMaterial(true);
          return;
        }

        // 4. Komputer Tengah (Page Mapper)
        if (isNearTerminal && !showManualModal && !showMapperModal && !showMetricsModal) {
          if (!hasReadMaterial) {
            triggerAlert("🔒 Terminal Terkunci! Buka dan pelajari Manual OMNI di komputer kanan atas terlebih dahulu.");
          } else {
            setShowMapperModal(true);
          }
          return;
        }

        // 5. Portal Keluar (Kiri Atas)
        if (isNearPortal && !showManualModal && !showMapperModal && !showMetricsModal) {
          if (isAllModesCompleted) {
            router.push("/stage/stage4");
          } else {
            triggerAlert("⚠️ Firewall Aktif! Selesaikan 3 mode Paging di Terminal Tengah.");
          }
          return;
        }
      }

      // Tombol ESC menutup modal
      if (key === "escape") {
        if (showManualModal && !isAllModesCompleted) {
          triggerAlert("✅ Log Manual OMNI dipelajari! Terminal Page Mapper di meja tengah sekarang terbuka.");
        }
        setShowManualModal(false);
        setShowMapperModal(false);
        setShowMetricsModal(false);
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
  }, [
    isNearConsole,
    isNearTerminal,
    isNearPortal,
    isNearMidRightSwitch,
    isNearMidLeftSwitch,
    isWallCenterOpen,
    isWallMaterialOpen,
    showManualModal,
    showMapperModal,
    showMetricsModal,
    isAllModesCompleted,
    hasReadMaterial,
    router,
  ]);

  // ─── GAME LOOP FISIKA 60FPS ──────────────────────────────────
  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      const isPaused = showManualModal || showMapperModal || showMetricsModal;

      if (!isPaused) {
        const p = { ...playerRef.current };
        const keys = keysPressed.current;
        const laserOpen = laserOpenRef.current;

        // 1. GERAKAN HORIZONTAL PEMAIN
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

        // 2. LOMPAT PEMAIN
        const wantsJump = keys.has("w") || keys.has("arrowup") || keys.has(" ");
        if (wantsJump && !p.jumping) {
          p.vy = JUMP_POWER;
          p.jumping = true;
        }

        // 3. GRAVITASI
        p.vy += GRAVITY;
        p.y += p.vy;

        let nextPlayerX = p.x + moveX;

        // 5. TABRAKAN PELAPON (LOGIKA KEJEDOT SAAT MELOMPAT KE ATAS)
        // Pemain tidak bisa menembus bagian bawah pelapon platform saat melompat ke atas
        if (p.vy < 0) {
          for (const plat of allPlatforms) {
            const platBottom = plat.y + plat.h;
            const isUnderPlatform =
              nextPlayerX + PLAYER_W > plat.x + 4 &&
              nextPlayerX < plat.x + plat.w - 4;

            if (isUnderPlatform) {
              if (p.y <= platBottom && (p.y - p.vy) >= platBottom - 8) {
                p.y = platBottom;
                p.vy = 1.0; // Kejedot: membatalkan dorongan ke atas, langsung memantul ke bawah
              }
            }
          }

          // Langit-langit atap layar
          if (p.y <= 8) {
            p.y = 8;
            p.vy = 1.0;
          }
        }

        // 6. TABRAKAN PLATFORM STATIS (PIJAKAN DARI ATAS)
        for (const plat of allPlatforms) {
          const isOverPlatform =
            p.x + PLAYER_W > plat.x &&
            p.x < plat.x + plat.w &&
            p.y + PLAYER_H >= plat.y &&
            p.y + PLAYER_H - p.vy <= plat.y + 14;

          if (isOverPlatform && p.vy >= 0) {
            p.y = plat.y - PLAYER_H;
            p.vy = 0;
            p.jumping = false;
          }
        }

        // 7. TANGGA REALISTIS (RAMP DARI LANTAI DASAR KE LANDING KANAN)
        // Tangga dari x: 740 (y: 540) menanjak ke kanan menuju x: 840 (y: 410)
        let stairsGroundY: number | null = null;
        const charFootX = nextPlayerX + PLAYER_W * 0.5;
        const footY = p.y + PLAYER_H;

        if (charFootX >= 740 && charFootX <= 840) {
          const t = (840 - charFootX) / (840 - 740);
          const rampLowerY = 410 + t * (540 - 410);
          if (footY >= 400 && footY <= 545) {
            stairsGroundY = rampLowerY;
          }
        }

        if (stairsGroundY !== null) {
          const prevFootY = footY - p.vy;
          if (!p.jumping) {
            if (Math.abs(footY - stairsGroundY) <= 16) {
              p.y = stairsGroundY - PLAYER_H;
              p.vy = 0;
            }
          } else if (p.vy >= 0) {
            if (footY >= stairsGroundY && prevFootY <= stairsGroundY + 16) {
              p.y = stairsGroundY - PLAYER_H;
              p.vy = 0;
              p.jumping = false;
            }
          }
        }

        // 8. LANTAI DASAR SOLID (FULL LEBAR 1024 PX)
        if (p.y + PLAYER_H >= GROUND_Y) {
          p.y = GROUND_Y - PLAYER_H;
          p.vy = 0;
          p.jumping = false;
        }

        // 9. PENGHALANG PINTU LASER FIREWALL (DI PIJAKAN KIRI ATAS SEBELUM SELESAI)
        if (!laserOpen) {
          const inLaserYRange = p.y + PLAYER_H > laserDoor.y && p.y < laserDoor.y + laserDoor.h;
          if (inLaserYRange) {
            if (p.x + PLAYER_W <= laserDoor.x && nextPlayerX + PLAYER_W > laserDoor.x) {
              nextPlayerX = laserDoor.x - PLAYER_W;
            } else if (p.x >= laserDoor.x + laserDoor.w && nextPlayerX < laserDoor.x + laserDoor.w) {
              nextPlayerX = laserDoor.x + laserDoor.w;
            }
          }
        }

        // 9b. TEMBOK KUNING (BAWAH: PENGHALANG MENUJU KOMPUTER KIRI, y=166..350)
        if (!wallCenterOpenRef.current) {
          const wallL = wallYellow.x;
          const wallR = wallYellow.x + wallYellow.w;
          const wallT = wallYellow.y;
          const wallB = wallYellow.y + wallYellow.h;

          const pBottom = p.y + PLAYER_H;
          const inVertical = pBottom > wallT && p.y < wallB;

          if (inVertical) {
            const nextL = nextPlayerX;
            const nextR = nextPlayerX + PLAYER_W;
            const willOverlap = nextR > wallL && nextL < wallR;

            if (willOverlap) {
              const prevR = p.x + PLAYER_W;
              const prevL = p.x;

              if (prevR <= wallL + 6) {
                nextPlayerX = wallL - PLAYER_W;
              } else if (prevL >= wallR - 6) {
                nextPlayerX = wallR;
              } else {
                const pCenter = p.x + PLAYER_W * 0.5;
                const wallMid = wallL + wallYellow.w * 0.5;
                if (pCenter < wallMid) {
                  nextPlayerX = wallL - PLAYER_W;
                } else {
                  nextPlayerX = wallR;
                }
              }
            }
          }
        }

        // 9c. TEMBOK BIRU (ATAS: PENGHALANG MENUJU CATWALK PORTAL STAGE 4, y=0..166)
        if (!wallBlueOpenRef.current) {
          const wallL = wallBlue.x;
          const wallR = wallBlue.x + wallBlue.w;
          const wallT = wallBlue.y;
          const wallB = wallBlue.y + wallBlue.h;

          const pBottom = p.y + PLAYER_H;
          const inVertical = pBottom > wallT && p.y < wallB;

          if (inVertical) {
            const nextL = nextPlayerX;
            const nextR = nextPlayerX + PLAYER_W;
            const willOverlap = nextR > wallL && nextL < wallR;

            if (willOverlap) {
              const prevR = p.x + PLAYER_W;
              const prevL = p.x;

              if (prevR <= wallL + 6) {
                nextPlayerX = wallL - PLAYER_W;
              } else if (prevL >= wallR - 6) {
                nextPlayerX = wallR;
              } else {
                const pCenter = p.x + PLAYER_W * 0.5;
                const wallMid = wallL + wallBlue.w * 0.5;
                if (pCenter < wallMid) {
                  nextPlayerX = wallL - PLAYER_W;
                } else {
                  nextPlayerX = wallR;
                }
              }
            }
          }
        }

        // 9d. TEMBOK MERAH (PENGHALANG MENUJU KOMPUTER MATERI CATWALK KANAN)
        if (!wallMaterialOpenRef.current) {
          const wallL = wallMaterial.x;
          const wallR = wallMaterial.x + wallMaterial.w;
          const wallT = wallMaterial.y;
          const wallB = wallMaterial.y + wallMaterial.h;

          const pBottom = p.y + PLAYER_H;
          const inVertical = pBottom > wallT && p.y < wallB;

          if (inVertical) {
            const nextL = nextPlayerX;
            const nextR = nextPlayerX + PLAYER_W;
            const willOverlap = nextR > wallL && nextL < wallR;

            if (willOverlap) {
              const prevR = p.x + PLAYER_W;
              const prevL = p.x;

              if (prevR <= wallL + 6) {
                nextPlayerX = wallL - PLAYER_W;
              } else if (prevL >= wallR - 6) {
                nextPlayerX = wallR;
              } else {
                const pCenter = p.x + PLAYER_W * 0.5;
                const wallMid = wallL + wallMaterial.w * 0.5;
                if (pCenter < wallMid) {
                  nextPlayerX = wallL - PLAYER_W;
                } else {
                  nextPlayerX = wallR;
                }
              }
            }
          }
        }

        // 10. BATAS KANVAS KIRI & KANAN
        if (nextPlayerX < 10) nextPlayerX = 10;
        if (nextPlayerX + PLAYER_W > GAME_WIDTH - 10) nextPlayerX = GAME_WIDTH - 10 - PLAYER_W;
        p.x = nextPlayerX;

        // 11. DETEKSI KEDEKATAN OBJEK INTERAKTIF
        const distConsoleX = Math.abs(p.x + PLAYER_W / 2 - (consoleObj.x + consoleObj.w / 2));
        const distConsoleY = Math.abs(p.y + PLAYER_H / 2 - (consoleObj.y + consoleObj.h / 2));
        setIsNearConsole(distConsoleX < 65 && distConsoleY < 65);

        const distTermX = Math.abs(p.x + PLAYER_W / 2 - (terminalObj.x + terminalObj.w / 2));
        const distTermY = Math.abs(p.y + PLAYER_H / 2 - (terminalObj.y + terminalObj.h / 2));
        setIsNearTerminal(distTermX < 75 && distTermY < 75);

        const distPortalX = Math.abs(p.x + PLAYER_W / 2 - (portalObj.x + portalObj.w / 2));
        const distPortalY = Math.abs(p.y + PLAYER_H / 2 - (portalObj.y + portalObj.h / 2));
        setIsNearPortal(distPortalX < 65 && distPortalY < 65);

        const distMidRightX = Math.abs(p.x + PLAYER_W / 2 - (consoleMidRightObj.x + consoleMidRightObj.w / 2));
        const distMidRightY = Math.abs(p.y + PLAYER_H / 2 - (consoleMidRightObj.y + consoleMidRightObj.h / 2));
        setIsNearMidRightSwitch(distMidRightX < 65 && distMidRightY < 65);

        const distMidLeftX = Math.abs(p.x + PLAYER_W / 2 - (consoleMidLeftObj.x + consoleMidLeftObj.w / 2));
        const distMidLeftY = Math.abs(p.y + PLAYER_H / 2 - (consoleMidLeftObj.y + consoleMidLeftObj.h / 2));
        setIsNearMidLeftSwitch(distMidLeftX < 65 && distMidLeftY < 65);

        // Sinkronisasi state React
        setPlayerX(p.x);
        setPlayerY(p.y);
        setVelocityY(p.vy);
        setIsJumping(p.jumping);
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [showManualModal, showMapperModal, showMetricsModal, isAllModesCompleted]);

  // ============================================================================
  // RENDER UTAMA
  // ============================================================================

  return (
    <main className="min-h-screen bg-black text-[#e9e4ff] select-none flex flex-col items-center justify-center p-2">
      
      {/* ─── HUD TELEMETRY COMMAND BAR ────────────────────────────── */}
      <div className="flex w-[1024px] max-w-full items-center justify-between rounded-xl border border-cyan-500/20 bg-[#070913]/90 px-4 py-2 text-xs backdrop-blur-xl mb-2 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
        
        {/* Left: Mission Callout */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="font-mono text-[11px] font-bold text-cyan-300 tracking-wider">
            STAGE 03 // THE MEMORY VAULT
          </span>
          <span className="hidden md:inline font-mono text-[9px] text-slate-500 border-l border-slate-700 pl-2">
            PAGING ARCHITECTURE
          </span>
        </div>

        {/* Center: System Status Telemetry */}
        <div className="flex items-center gap-4 text-[10px] font-mono">
          
          {/* Paging Modes Status */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-md">
            <span className="text-slate-500 font-bold mr-1">MMU:</span>
            {([2, 4, 8] as PageSizeMode[]).map((mode) => (
              <span
                key={mode}
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold tracking-tight ${
                  completedModes[mode]
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-600"
                }`}
              >
                {mode}K {completedModes[mode] ? "●" : "○"}
              </span>
            ))}
          </div>

          {/* Security Grids Telemetry */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-md text-[9px]">
            <span className="text-slate-500 font-bold">GRIDS:</span>
            <span className={isWallCenterOpen ? "text-emerald-400 font-bold" : "text-amber-400/80"}>
              A:{isWallCenterOpen ? "OFFLINE" : "ENGAGED"}
            </span>
            <span className="text-slate-700">•</span>
            <span className={isWallMaterialOpen ? "text-emerald-400 font-bold" : "text-rose-400/80"}>
              B:{isWallMaterialOpen ? "OFFLINE" : "ENGAGED"}
            </span>
            <span className="text-slate-700">•</span>
            <span className={isWallBlueOpen ? "text-emerald-400 font-bold" : "text-cyan-400/80"}>
              C:{isWallBlueOpen ? "OFFLINE" : "ENGAGED"}
            </span>
          </div>

          {/* Firewall Gate Status */}
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded text-[9px] tracking-wider uppercase border ${
              isAllModesCompleted
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
            }`}
          >
            {isAllModesCompleted ? "TRANSIT UNLOCKED" : "TRANSIT CONTAINED"}
          </span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <Link
            href="/stage/stage2"
            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-slate-400 hover:text-white hover:border-white/20 transition"
          >
            ← STAGE 02
          </Link>
        </div>
      </div>

      {/* ─── CONTAINER KANVAS UTAMA 1024×576 (16:9) ────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/30 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
        style={{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
          backgroundImage: "url('/stage3bg.jpeg')",
          backgroundSize: "100% 100%",
        }}
      >
        {/* Overlay lembut sci-fi */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

        {/* ─── TOAST NOTIFIKASI TELEMETRI (HUD TACTICAL) ────────────── */}
        {alertMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-all duration-300">
            <div className="flex items-center gap-2.5 rounded-lg border border-cyan-400/50 bg-[#060914]/95 px-4 py-2 font-mono text-xs text-cyan-200 shadow-[0_0_25px_rgba(34,211,238,0.35)] backdrop-blur-md">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="text-[10px] tracking-wider text-cyan-400 font-bold uppercase">[SYS // TELEMETRY]</span>
              <span className="text-gray-200 font-semibold">{alertMessage}</span>
            </div>
          </div>
        )}

        {/* ─── PIJAKAN & LANTAI DASAR (TRANSPARAN PENUH MENGIKUTI BACKGROUND) ─── */}
        {/* Fisika tabrakan dikelola secara matematis di gameLoop oleh allPlatforms & groundPlatform */}

        {/* ─── 1. MATERI DI KOMPUTER KANAN ATAS (CATWALK R) ─────────── */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
          style={{
            left: `${consoleObj.x}px`,
            top: `${consoleObj.y}px`,
            width: `${consoleObj.w}px`,
            height: `${consoleObj.h}px`,
          }}
          onClick={() => {
            setShowManualModal(true);
            setHasReadMaterial(true);
          }}
        >
          {isNearConsole && (
            <div className="absolute -top-8 whitespace-nowrap z-30 pointer-events-none animate-in fade-in duration-150">
              <span className="rounded-md border border-cyan-400/80 bg-black/90 px-2.5 py-1 text-[10px] font-mono font-bold text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                Tekan <kbd className="rounded bg-cyan-400 px-1 py-0.2 text-[9px] font-black text-black mx-0.5">E</kbd> untuk {hasReadMaterial ? "Baca Ulang Materi" : "Baca Materi OMNI"}
              </span>
            </div>
          )}
        </div>

        {/* ─── 2. MINI GAME TETAP DI KOMPUTER TENGAH (PAGE MAPPER) ──── */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
          style={{
            left: `${terminalObj.x}px`,
            top: `${terminalObj.y}px`,
            width: `${terminalObj.w}px`,
            height: `${terminalObj.h}px`,
          }}
          onClick={() => {
            if (!hasReadMaterial) {
              triggerAlert("Terminal Terkunci! Pelajari Manual OMNI di komputer kanan atas terlebih dahulu.");
            } else {
              setShowMapperModal(true);
            }
          }}
        >
          {isNearTerminal && (
            <div className="absolute -top-8 whitespace-nowrap z-30 pointer-events-none animate-in fade-in duration-150">
              <span
                className={`rounded-md border px-2.5 py-1 text-[10px] font-mono font-bold shadow-md ${
                  hasReadMaterial
                    ? "border-amber-400/80 bg-black/90 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                    : "border-rose-500/80 bg-black/90 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                }`}
              >
                {hasReadMaterial ? (
                  <>
                    Tekan <kbd className="rounded bg-amber-400 px-1 py-0.2 text-[9px] font-black text-black mx-0.5">E</kbd> untuk Akses Terminal Page Mapper
                  </>
                ) : (
                  "🔒 Terminal Terkunci (Pelajari Materi di Komputer Kanan Dahulu)"
                )}
              </span>
            </div>
          )}
        </div>

        {/* ─── 3. PORTAL PINDAH KE PIJAKAN KIRI ATAS (CATWALK L) ─────── */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
          style={{
            left: `${portalObj.x}px`,
            top: `${portalObj.y}px`,
            width: `${portalObj.w}px`,
            height: `${portalObj.h}px`,
          }}
          onClick={() => {
            if (isAllModesCompleted) {
              router.push("/stage/stage4");
            } else {
              triggerAlert("Singularity Transit Terkunci! Selesaikan 3 mode Paging di Terminal Tengah.");
            }
          }}
        >
          {isNearPortal && (
            <div className="absolute -top-8 whitespace-nowrap z-30 pointer-events-none animate-in fade-in duration-150">
              <span
                className={`rounded-md border px-2.5 py-1 text-[10px] font-mono font-bold shadow-md ${
                  isAllModesCompleted
                    ? "border-emerald-400/80 bg-black/90 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.6)]"
                    : "border-rose-500/80 bg-black/90 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                }`}
              >
                {isAllModesCompleted ? (
                  <>
                    Tekan <kbd className="rounded bg-emerald-400 px-1 py-0.2 text-[9px] font-black text-black mx-0.5">E</kbd> vsuk ke Stage 4 ➔
                  </>
                ) : (
                  "🔒 Portal Terkunci (Selesaikan Tantangan di Komputer Tengah)"
                )}
              </span>
            </div>
          )}

          {/* Efek visual portal hanya aktif ketika isAllModesCompleted */}
          {isAllModesCompleted && (
            <div className="h-full w-full rounded-t-2xl rounded-b-sm border-2 border-emerald-400/90 bg-emerald-950/40 shadow-[0_0_35px_rgba(52,211,153,0.7)] flex flex-col items-center justify-center animate-pulse">
              <IconTransitGateway unlocked={true} />
              <span className="text-[7px] font-mono font-bold tracking-widest mt-1 text-emerald-300">
                TRANSIT OPEN
              </span>
            </div>
          )}
        </div>

        {/* ─── 4. KOMPUTER TENGAH KANAN (SWITCH PEMBUKA TEMBOK KUNING) ─── */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
          style={{
            left: `${consoleMidRightObj.x}px`,
            top: `${consoleMidRightObj.y}px`,
            width: `${consoleMidRightObj.w}px`,
            height: `${consoleMidRightObj.h}px`,
          }}
          onClick={() => {
            if (!isWallCenterOpen) {
              setIsWallCenterOpen(true);
              triggerAlert("Grid Amber dinonaktifkan! Jalur akses menuju Mezanin Kiri terbuka.");
            } else {
              triggerAlert("Grid Amber sudah dalam status deaktif.");
            }
          }}
        >
          {isNearMidRightSwitch && (
            <div className="absolute -top-8 whitespace-nowrap z-30 pointer-events-none animate-in fade-in duration-150">
              <span
                className={`rounded-md border px-2.5 py-1 text-[10px] font-mono font-bold shadow-md ${
                  isWallCenterOpen
                    ? "border-emerald-400/80 bg-black/90 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                    : "border-amber-400/80 bg-black/90 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                }`}
              >
                {isWallCenterOpen ? (
                  "Tembok Kuning Terbuka ✓"
                ) : (
                  <>
                    Tekan <kbd className="rounded bg-amber-400 px-1 py-0.2 text-[9px] font-black text-black mx-0.5">E</kbd> untuk Buka Tembok Kuning
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* ─── 5. KOMPUTER KIRI (SWITCH PEMBUKA TEMBOK MERAH) ───────── */}
        <div
          className="absolute z-20 flex flex-col items-center justify-center cursor-pointer"
          style={{
            left: `${consoleMidLeftObj.x}px`,
            top: `${consoleMidLeftObj.y}px`,
            width: `${consoleMidLeftObj.w}px`,
            height: `${consoleMidLeftObj.h}px`,
          }}
          onClick={() => {
            if (!isWallMaterialOpen) {
              setIsWallMaterialOpen(true);
              triggerAlert("Containment Crimson dinonaktifkan! Catwalk menuju Komputer Log terbuka.");
            } else {
              triggerAlert("Containment Crimson sudah dalam status deaktif.");
            }
          }}
        >
          {isNearMidLeftSwitch && (
            <div className="absolute -top-8 whitespace-nowrap z-30 pointer-events-none animate-in fade-in duration-150">
              <span
                className={`rounded-md border px-2.5 py-1 text-[10px] font-mono font-bold shadow-md ${
                  isWallMaterialOpen
                    ? "border-emerald-400/80 bg-black/90 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                    : "border-purple-400/80 bg-black/90 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                }`}
              >
                {isWallMaterialOpen ? (
                  "Tembok Merah Terbuka ✓"
                ) : (
                  <>
                    Tekan <kbd className="rounded bg-purple-400 px-1 py-0.2 text-[9px] font-black text-black mx-0.5">E</kbd> untuk Buka Tembok Merah
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* ─── TEMBOK 1: TEMBOK KUNING (BAWAH: PENGHALANG MENUJU KOMPUTER KIRI) ── */}
        <div
          className={`absolute z-25 transition-all duration-700 flex flex-col items-center justify-between rounded overflow-hidden ${
            isWallCenterOpen
              ? "opacity-0 scale-y-0 pointer-events-none origin-top"
              : "opacity-100 border-x border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.6)]"
          }`}
          style={{
            left: `${wallYellow.x}px`,
            top: `${wallYellow.y}px`,
            width: `${wallYellow.w}px`,
            height: `${wallYellow.h}px`,
          }}
        >
          {/* Top Industrial Emitter Clamp */}
          <div className="w-full h-3 bg-[#0d121f] border-b border-amber-400/80 flex items-center justify-center">
            <span className="h-1 w-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_#f59e0b]" />
          </div>

          {/* Central Laser Containment Beam with High-Tech Scanline Filaments */}
          <div
            className="flex-1 w-full relative flex items-center justify-center"
            style={{
              background:
                "repeating-linear-gradient(0deg, rgba(245,158,11,0.2) 0px, rgba(245,158,11,0.2) 2px, transparent 2px, transparent 6px), linear-gradient(90deg, rgba(245,158,11,0.1), rgba(245,158,11,0.35), rgba(245,158,11,0.1))",
            }}
          >
            <div className="absolute inset-y-0 w-[2px] bg-amber-300 shadow-[0_0_10px_#f59e0b] animate-pulse" />
            <span className="text-[6.5px] font-mono font-black text-amber-200/90 uppercase tracking-widest transform -rotate-90 select-none pointer-events-none">
              GRID // AMBER-01
            </span>
          </div>

          {/* Bottom Industrial Emitter Clamp */}
          <div className="w-full h-3 bg-[#0d121f] border-t border-amber-400/80 flex items-center justify-center">
            <span className="h-1 w-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_#f59e0b]" />
          </div>
        </div>

        {/* ─── TEMBOK 2: TEMBOK BIRU (ATAS: PENGHALANG MENUJU PORTAL STAGE 4) ──── */}
        <div
          className={`absolute z-25 transition-all duration-700 flex flex-col items-center justify-between rounded overflow-hidden ${
            isWallBlueOpen
              ? "opacity-0 scale-y-0 pointer-events-none origin-top"
              : "opacity-100 border-x border-cyan-400/60 shadow-[0_0_25px_rgba(34,211,238,0.6)]"
          }`}
          style={{
            left: `${wallBlue.x}px`,
            top: `${wallBlue.y}px`,
            width: `${wallBlue.w}px`,
            height: `${wallBlue.h}px`,
          }}
        >
          {/* Top Industrial Emitter Clamp */}
          <div className="w-full h-3 bg-[#081224] border-b border-cyan-400/80 flex items-center justify-center">
            <span className="h-1 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
          </div>

          {/* Central Laser Containment Beam with High-Tech Scanline Filaments */}
          <div
            className="flex-1 w-full relative flex items-center justify-center"
            style={{
              background:
                "repeating-linear-gradient(0deg, rgba(34,211,238,0.2) 0px, rgba(34,211,238,0.2) 2px, transparent 2px, transparent 6px), linear-gradient(90deg, rgba(34,211,238,0.1), rgba(34,211,238,0.35), rgba(34,211,238,0.1))",
            }}
          >
            <div className="absolute inset-y-0 w-[2px] bg-cyan-300 shadow-[0_0_10px_#22d3ee] animate-pulse" />
            <span className="text-[6.5px] font-mono font-black text-cyan-200/90 uppercase tracking-widest transform -rotate-90 select-none pointer-events-none">
              SHIELD // CYAN-04
            </span>
          </div>

          {/* Bottom Industrial Emitter Clamp */}
          <div className="w-full h-3 bg-[#081224] border-t border-cyan-400/80 flex items-center justify-center">
            <span className="h-1 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
          </div>
        </div>

        {/* ─── TEMBOK 3: TEMBOK MERAH (PENGHALANG MENUJU KOMPUTER MATERI) ── */}
        <div
          className={`absolute z-25 transition-all duration-700 flex flex-col items-center justify-between rounded overflow-hidden ${
            isWallMaterialOpen
              ? "opacity-0 scale-y-0 pointer-events-none origin-top"
              : "opacity-100 border-x border-rose-500/70 shadow-[0_0_25px_rgba(244,63,94,0.7)]"
          }`}
          style={{
            left: `${wallMaterial.x}px`,
            top: `${wallMaterial.y}px`,
            width: `${wallMaterial.w}px`,
            height: `${wallMaterial.h}px`,
          }}
        >
          {/* Top Industrial Emitter Clamp */}
          <div className="w-full h-3 bg-[#190812] border-b border-rose-500/80 flex items-center justify-center">
            <span className="h-1 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_#f43f5e]" />
          </div>

          {/* Central Laser Containment Beam with High-Tech Scanline Filaments */}
          <div
            className="flex-1 w-full relative flex items-center justify-center"
            style={{
              background:
                "repeating-linear-gradient(0deg, rgba(244,63,94,0.2) 0px, rgba(244,63,94,0.2) 2px, transparent 2px, transparent 6px), linear-gradient(90deg, rgba(244,63,94,0.1), rgba(244,63,94,0.4), rgba(244,63,94,0.1))",
            }}
          >
            <div className="absolute inset-y-0 w-[2px] bg-rose-400 shadow-[0_0_10px_#f43f5e] animate-pulse" />
            <span className="text-[6.5px] font-mono font-black text-rose-200/90 uppercase tracking-widest transform -rotate-90 select-none pointer-events-none">
              CONTAINMENT // CRIMSON
            </span>
          </div>

          {/* Bottom Industrial Emitter Clamp */}
          <div className="w-full h-3 bg-[#190812] border-t border-rose-500/80 flex items-center justify-center">
            <span className="h-1 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_#f43f5e]" />
          </div>
        </div>

        {/* ─── KARAKTER ASTRONOT (SPRITE & ANIMASI LENGKAP) ──────────── */}
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: `${playerX}px`,
            top: `${playerY}px`,
            width: `${PLAYER_W}px`,
            height: `${PLAYER_H}px`,
          }}
        >
          {/* Bayangan di bawah kaki astronot */}
          <div className="absolute -bottom-1 left-1/2 h-2.5 w-8 -translate-x-1/2 rounded-full bg-black/70 blur-[1px]" />

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
              className={`h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] transition-all ${
                isWalking && !isJumping ? "animate-waddle" : ""
              } ${
                isHurt ? "brightness-150 contrast-125 sepia hue-rotate-[300deg] animate-pulse" : ""
              }`}
              style={{
                transformOrigin: "bottom center",
              }}
            />
          </div>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: TERMINAL PAGE FRAME MAPPER (MINI-GAME UTAMA)                 */}
      {/* ===================================================================== */}
      {showMapperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 md:p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950/90 text-[#e9e4ff] shadow-[0_0_60px_rgba(34,211,238,0.3)]">
            
            {/* Header Modal Mini-Game */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/30 px-5 md:px-6 py-3.5 bg-[#0b081e]/90">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse" />
                <h2 className="font-mono text-sm md:text-base font-black text-cyan-200 tracking-wider">
                  TERMINAL PAGE FRAME MAPPER // 32 KB RAM
                </h2>
              </div>

              {/* Tabs Ukuran Page (2 KB, 4 KB, 8 KB) */}
              <div className="flex items-center gap-2">
                {([2, 4, 8] as PageSizeMode[]).map((mode) => {
                  const isCompleted = completedModes[mode];
                  const isActive = activeMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setActiveMode(mode);
                        setSelectedPageId(null);
                      }}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-mono font-bold transition-all ${
                        isActive
                          ? "border-2 border-cyan-400 bg-cyan-950/80 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-105"
                          : "border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span>Page {mode} KB</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                          isCompleted
                            ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/50"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {isCompleted ? "✓" : "○"}
                      </span>
                    </button>
                  );
                })}

                {isAllModesCompleted && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMapperModal(false);
                      setShowMetricsModal(true);
                    }}
                    className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-mono font-bold border border-amber-400/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/30 transition shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                    title="Buka Laporan Metrik Kinerja"
                  >
                    📊 Laporan Metrik
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowMapperModal(false)}
                  className="ml-2 rounded-xl border border-white/10 px-3 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition"
                >
                  ✕ Tutup
                </button>
              </div>
            </div>

            {/* Body 3 Kolom Interaktif */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
              
              {/* Petunjuk Aksi Dinamis */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/30 bg-[#070b1a]/90 px-4 py-2.5 text-xs font-mono text-cyan-200">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-cyan-400/50 bg-cyan-950/70 font-bold text-cyan-300">
                    SYS // INFO
                  </span>
                  <span className="text-gray-300">
                    {selectedPageId
                      ? `Page [${selectedPageId}] aktif. Klik salah satu Frame KOSONG di kolom kanan.`
                      : isAllPagesMapped
                      ? "Seluruh Page telah terpetakan. Selesaikan formulir Translasi Alamat di bawah."
                      : "Pilih Page pada kolom kiri, lalu tempatkan ke Frame kosong di kolom kanan."}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoMap}
                    disabled={isAllPagesMapped}
                    className="rounded-lg bg-cyan-500/20 border border-cyan-400/50 px-2.5 py-1 text-[11px] font-bold text-cyan-200 hover:bg-cyan-500/40 disabled:opacity-30 disabled:pointer-events-none transition"
                  >
                    AUTO-MAP
                  </button>
                  <button
                    type="button"
                    onClick={handleResetMode}
                    className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-gray-300 hover:bg-white/15 transition"
                  >
                    RESET
                  </button>
                </div>
              </div>

              {/* Tampilan 3 Kolom */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                
                {/* 1. KOLOM KIRI: LOGICAL PAGES */}
                <div className="lg:col-span-4 rounded-xl border border-white/10 bg-[#0a071c]/80 p-3.5 flex flex-col min-h-[380px]">
                  <div className="border-b border-white/10 pb-2 mb-2.5 flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase">
                      1. LOGICAL PAGES
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">
                      {unmappedPages.length} tersisa
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {unmappedPages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-emerald-500/40 bg-emerald-950/20">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-950/60 text-emerald-300 mb-2 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-emerald-300 font-mono tracking-wider">
                          SEMUA PAGE TERPETAKAN
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Page Table terisi penuh. Silakan verifikasi Alamat Fisik di bawah.
                        </p>
                      </div>
                    ) : (
                      unmappedPages.map((page) => {
                        const isSelected = selectedPageId === page.id;
                        const isCyan = page.color === "cyan";

                        return (
                          <div
                            key={page.id}
                            onClick={() => handleSelectPage(page.id)}
                            className={`group relative cursor-pointer rounded-xl border p-2.5 transition-all duration-150 ${
                              isSelected
                                ? "border-amber-400 bg-amber-950/50 shadow-[0_0_15px_rgba(251,191,36,0.4)] ring-2 ring-amber-400"
                                : isCyan
                                ? "border-cyan-500/40 bg-cyan-950/30 hover:border-cyan-300 hover:bg-cyan-950/50"
                                : "border-purple-500/40 bg-purple-950/30 hover:border-purple-300 hover:bg-purple-950/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                                  isCyan
                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                                    : "bg-purple-500/20 text-purple-300 border border-purple-400/40"
                                }`}
                              >
                                {page.processName} ({page.processId})
                              </span>
                              <span className="font-mono text-xs font-bold text-white">
                                {page.id}
                              </span>
                            </div>

                            {/* Kapasitas bar terpakai vs fragmentasi internal */}
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-gray-300">
                                  Terpakai: <strong className="text-white">{page.usedKB} KB</strong> / {activeMode} KB
                                </span>
                                {page.internalFragKB > 0 && (
                                  <span className="text-rose-400 font-bold">
                                    Frag: {page.internalFragKB} KB
                                  </span>
                                )}
                              </div>

                              <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-white/10">
                                <div
                                  className={`h-full ${isCyan ? "bg-cyan-400" : "bg-purple-400"}`}
                                  style={{
                                    width: `${(page.usedKB / activeMode) * 100}%`,
                                  }}
                                />
                                {page.internalFragKB > 0 && (
                                  <div
                                    className="h-full bg-[repeating-linear-gradient(45deg,#f43f5e,#f43f5e_3px,#9f1239_3px,#9f1239_6px)]"
                                    style={{
                                      width: `${(page.internalFragKB / activeMode) * 100}%`,
                                    }}
                                    title={`Fragmentasi Internal: ${page.internalFragKB} KB`}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2. KOLOM TENGAH: REAL-TIME PAGE TABLE */}
                <div className="lg:col-span-4 rounded-xl border border-white/10 bg-[#0a071c]/80 p-3.5 flex flex-col min-h-[380px]">
                  <div className="border-b border-white/10 pb-2 mb-2.5 flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold tracking-wider text-purple-300 uppercase">
                      2. PAGE TABLE (REAL-TIME)
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">
                      {currentPages.length} Baris Entri
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 text-[10px]">
                          <th className="py-1.5 px-1">Proses</th>
                          <th className="py-1.5 px-1 text-center">Page #</th>
                          <th className="py-1.5 px-1 text-center">Frame #</th>
                          <th className="py-1.5 px-1 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {currentPages.map((page) => {
                          const mappedFrame = currentFrames.find(
                            (f) => f.mappedPage?.id === page.id
                          );
                          const isMapped = Boolean(mappedFrame);
                          const isTarget =
                            isAllPagesMapped &&
                            activeChallenge.processId === page.processId &&
                            activeChallenge.targetPageIndex === page.pageIndex;

                          return (
                            <tr
                              key={page.id}
                              className={`transition ${
                                isTarget
                                  ? "bg-amber-500/25 ring-1 ring-amber-400 font-bold"
                                  : isMapped
                                  ? "bg-white/[0.02]"
                                  : "opacity-60"
                              }`}
                            >
                              <td className="py-1.5 px-1">
                                <div className="flex items-center gap-1">
                                  {isTarget && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                                  )}
                                  <span
                                    className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                      page.processId === "A"
                                        ? "text-cyan-300 bg-cyan-950/60"
                                        : "text-purple-300 bg-purple-950/60"
                                    }`}
                                  >
                                    Proc {page.processId}
                                  </span>
                                  {isTarget && (
                                    <span className="rounded bg-amber-400/30 border border-amber-400/60 px-1 text-[8px] text-amber-200 uppercase font-mono">
                                      QUERY
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-1.5 px-1 text-center font-bold text-white">
                                P{page.pageIndex}
                              </td>
                              <td className="py-1.5 px-1 text-center">
                                {isMapped ? (
                                  <span
                                    className={`rounded px-2 py-0.2 font-bold ${
                                      isTarget
                                        ? "bg-amber-400/30 border border-amber-400 text-amber-200 animate-pulse"
                                        : "bg-emerald-950/80 border border-emerald-400/50 text-emerald-300"
                                    }`}
                                  >
                                    Frame {mappedFrame!.frameIndex}
                                  </span>
                                ) : (
                                  <span className="text-gray-600">—</span>
                                )}
                              </td>
                              <td className="py-1.5 px-1 text-right">
                                {isTarget ? (
                                  <span className="text-[9px] text-amber-300 font-bold">Target MMU</span>
                                ) : isMapped ? (
                                  <span className="text-[9px] text-emerald-400">Mapped</span>
                                ) : (
                                  <span className="text-[9px] text-amber-400">Wait</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2.5 rounded-lg border border-white/10 bg-black/40 p-2 text-[10px] font-mono text-gray-300 flex justify-between">
                    <span>Overhead Page Table:</span>
                    <strong
                      className={
                        activeMode === 2
                          ? "text-rose-400"
                          : activeMode === 4
                          ? "text-amber-300"
                          : "text-emerald-300"
                      }
                    >
                      {activeMode === 2 ? "Tinggi (8 Baris)" : activeMode === 4 ? "Sedang (5 Baris)" : "Rendah (3 Baris)"}
                    </strong>
                  </div>
                </div>

                {/* 3. KOLOM KANAN: PHYSICAL RAM FRAMES */}
                <div className="lg:col-span-4 rounded-xl border border-white/10 bg-[#0a071c]/80 p-3.5 flex flex-col min-h-[380px]">
                  <div className="border-b border-white/10 pb-2 mb-2.5 flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold tracking-wider text-emerald-300 uppercase">
                      3. PHYSICAL RAM (32 KB)
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">
                      {currentFrames.length} Frames
                    </span>
                  </div>

                  <div
                    className={`flex-1 overflow-y-auto pr-1 grid gap-2 ${
                      activeMode === 2
                        ? "grid-cols-2"
                        : activeMode === 4
                        ? "grid-cols-2"
                        : "grid-cols-1"
                    }`}
                  >
                    {currentFrames.map((frame) => {
                      const isReserved = frame.isReserved;
                      const hasPage = Boolean(frame.mappedPage);
                      const page = frame.mappedPage;

                      if (isReserved) {
                        return (
                          <div
                            key={frame.frameIndex}
                            className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-2 flex flex-col justify-between opacity-80 cursor-not-allowed select-none min-h-[64px]"
                          >
                            <div className="flex items-center justify-between text-[9px] font-mono">
                              <span className="font-bold text-rose-300">
                                Frame {frame.frameIndex}
                              </span>
                              <span className="rounded bg-rose-500/30 px-1 py-0.2 text-[8px] font-mono font-black text-rose-200">
                                SYS_CORE
                              </span>
                            </div>
                            <div className="text-center my-0.5">
                              <span className="text-[11px] font-mono font-bold text-rose-400">
                                OMNI_SYS
                              </span>
                              <span className="block text-[8px] text-rose-300/70">
                                {frame.frameIndex * activeMode}K - {(frame.frameIndex + 1) * activeMode}K
                              </span>
                            </div>
                          </div>
                        );
                      }

                      if (hasPage && page) {
                        const isCyan = page.color === "cyan";
                        return (
                          <div
                            key={frame.frameIndex}
                            onClick={() => handleFrameClick(frame.frameIndex)}
                            className={`group relative cursor-pointer rounded-lg border p-2 flex flex-col justify-between transition-all min-h-[64px] ${
                              isCyan
                                ? "border-cyan-400 bg-cyan-950/40 hover:border-cyan-300 hover:shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                                : "border-purple-400 bg-purple-950/40 hover:border-purple-300 hover:shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                            }`}
                            title="Klik untuk melepas page ini dari frame"
                          >
                            <div className="flex items-center justify-between text-[9px] font-mono">
                              <span className="font-bold text-white">
                                Frame {frame.frameIndex}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.2 text-[8px] font-bold ${
                                  isCyan
                                    ? "bg-cyan-500/30 text-cyan-200"
                                    : "bg-purple-500/30 text-purple-200"
                                }`}
                              >
                                {page.id}
                              </span>
                            </div>

                            <div className="my-0.5 flex justify-between items-center text-[9px] font-mono text-gray-300">
                              <span>{page.processName}</span>
                              <span className="text-white font-bold">{page.usedKB} KB</span>
                            </div>

                            <div className="text-right">
                              <span className="text-[8px] font-mono text-rose-400 group-hover:underline">
                                ✕ Klik Lepas
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Frame Kosong
                      return (
                        <div
                          key={frame.frameIndex}
                          onClick={() => handleFrameClick(frame.frameIndex)}
                          className={`rounded-lg border border-dashed p-2 flex flex-col justify-between transition-all min-h-[64px] ${
                            activeSelectedPage
                              ? "border-amber-400/80 bg-amber-950/25 cursor-pointer hover:border-amber-300 hover:scale-102 animate-pulse"
                              : "border-slate-700 bg-slate-900/30 hover:border-slate-500"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono text-gray-500">
                            <span>Frame {frame.frameIndex}</span>
                            <span>{frame.frameIndex * activeMode}K</span>
                          </div>
                          <div className="text-center my-0.5">
                            <span
                              className={`text-[10px] font-mono font-bold ${
                                activeSelectedPage ? "text-amber-300" : "text-gray-600"
                              }`}
                            >
                              {activeSelectedPage ? `+ Pasang ${activeSelectedPage.id}` : "[ KOSONG ]"}
                            </span>
                          </div>
                          <span className="text-[8px] font-mono text-gray-500 text-right">
                            Slot {activeMode} KB
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* TANTANGAN VERIFIKASI TRANSLASI ALAMAT (BYPASS FIREWALL) */}
              <div
                className={`rounded-xl border p-4 transition-all ${
                  isAllPagesMapped
                    ? "border-amber-400/70 bg-gradient-to-b from-[#1c1206]/90 to-[#0b0602]/95 shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                    : "border-slate-800 bg-slate-950/50 opacity-60"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isAllPagesMapped
                          ? "bg-amber-400 animate-ping shadow-[0_0_8px_#f59e0b]"
                          : "bg-slate-600"
                      }`}
                    />
                    <div>
                      <h3 className="text-xs md:text-sm font-bold font-mono text-amber-300">
                        TANTANGAN KUNCI FIREWALL: TRANSLASI ALAMAT MMU (MODE {activeMode} KB)
                      </h3>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {isAllPagesMapped
                          ? "Ikuti alur translasi hardware MMU (Langkah 1 s.d. 3) lalu pilih kartu kalkulasi yang tepat."
                          : "Petakan seluruh page ke frame fisik terlebih dahulu untuk membuka formulir ini."}
                      </p>
                    </div>
                  </div>

                  {completedModes[activeMode] && (
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-400/50 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-300">
                      ✓ MODE {activeMode} KB SELESAI
                    </span>
                  )}
                </div>

                {isAllPagesMapped ? (
                  <div className="mt-3 space-y-4">
                    {/* VISUAL STEP-BY-STEP MMU SCAFFOLDING */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* LANGKAH 1 */}
                      <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/30 p-2.5 font-mono text-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold mb-1">
                            <span>LANGKAH 1: LOGICAL ADDR</span>
                            <span className="rounded bg-cyan-500/20 px-1 text-[9px]">CPU QUERY</span>
                          </div>
                          <p className="text-gray-300 text-[11px] leading-snug">
                            Instruksi CPU: <strong className="text-white">{activeChallenge.processName} ({activeChallenge.processId})</strong> meminta Logical Address <strong className="text-cyan-300">{activeChallenge.logicalAddressKB} KB</strong>.
                          </p>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-cyan-500/20 text-[10px] text-cyan-200">
                          <div>• Page = ⌊{activeChallenge.logicalAddressKB} / {activeMode}⌋ = <span className="font-bold text-amber-300">Page P{activeChallenge.targetPageIndex}</span></div>
                          <div>• Offset (d) = {activeChallenge.logicalAddressKB} % {activeMode} = <span className="font-bold text-amber-300">{activeChallenge.offsetKB} KB</span></div>
                        </div>
                      </div>

                      {/* LANGKAH 2 */}
                      <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-2.5 font-mono text-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold mb-1">
                            <span>LANGKAH 2: LOOKUP TABLE</span>
                            <span className="rounded bg-amber-500/20 px-1 text-[9px]">PAGE TABLE</span>
                          </div>
                          <p className="text-gray-300 text-[11px] leading-snug">
                            MMU memeriksa baris target <strong className="text-amber-300">Proc {activeChallenge.processId} - P{activeChallenge.targetPageIndex}</strong> pada Page Table di atas.
                          </p>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-amber-500/20 text-[10px] text-amber-200">
                          <div>• Berada di: <span className="font-bold text-emerald-300">Frame {targetFrameIndex}</span> (Physical RAM)</div>
                          <div>• Base Frame = {targetFrameIndex} × {activeMode} KB = <span className="font-bold text-emerald-300">{targetFrameIndex * activeMode} KB</span></div>
                        </div>
                      </div>

                      {/* LANGKAH 3 */}
                      <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-2.5 font-mono text-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold mb-1">
                            <span>LANGKAH 3: RUMUS PHYSICAL</span>
                            <span className="rounded bg-emerald-500/20 px-1 text-[9px]">RAM OUTPUT</span>
                          </div>
                          <p className="text-gray-300 text-[11px] leading-snug">
                            Kalkulasi Alamat Fisik di RAM:<br />
                            <span className="text-emerald-300 font-bold text-[11px]">(Frame × Ukuran Page) + Offset</span>
                          </p>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-emerald-500/20 text-[10px] text-emerald-200">
                          <div>• Substitusi: ({targetFrameIndex} × {activeMode}) + {activeChallenge.offsetKB} KB</div>
                          <div>• Pilih kartu kalkulasi yang benar di bawah ⬇</div>
                        </div>
                      </div>
                    </div>

                    {/* 3 KARTU PILIHAN JAWABAN INTERAKTIF */}
                    <div>
                      <div className="text-[11px] font-mono font-bold text-gray-300 mb-2 flex items-center justify-between">
                        <span>PILIH KALKULASI PHYSICAL ADDRESS (KLIK KARTU):</span>
                        {completedModes[activeMode] && (
                          <span className="text-emerald-400 text-[10px]">Tervalidasi ✓ (Bisa klik untuk simulasi ulang)</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {mmuOptions.map((opt) => {
                          const isSelected = challengeResults[activeMode]?.userAddressKB === opt.value;
                          const isSolved = completedModes[activeMode] && opt.isCorrect;

                          return (
                            <button
                              key={opt.letter}
                              type="button"
                              onClick={() => handleVerifyTranslation(opt.value)}
                              className={`group relative text-left rounded-xl p-3 border font-mono transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                                isSolved
                                  ? "border-emerald-400 bg-emerald-950/60 shadow-[0_0_20px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400"
                                  : isSelected && !challengeResults[activeMode]?.isCorrect
                                  ? "border-rose-500 bg-rose-950/60 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                                  : "border-white/15 bg-black/60 hover:border-amber-400/80 hover:bg-black/80 hover:shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${
                                    isSolved
                                      ? "bg-emerald-500 text-black shadow-[0_0_8px_#10b981]"
                                      : isSelected && !challengeResults[activeMode]?.isCorrect
                                      ? "bg-rose-500 text-white"
                                      : "bg-white/10 text-amber-300 group-hover:bg-amber-400 group-hover:text-black transition"
                                  }`}
                                >
                                  {opt.letter}
                                </span>
                                <span className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                                  {opt.value} KB
                                </span>
                              </div>

                              <div className="text-[11px] text-gray-300 font-mono mb-1">
                                Rumus: <span className="font-bold text-white">{opt.formula}</span>
                              </div>

                              <div className="text-[10px] text-gray-400 leading-tight">
                                {opt.note}
                              </div>

                              {isSolved && (
                                <div className="mt-2 pt-1 border-t border-emerald-500/30 text-[9px] font-bold text-emerald-300 flex items-center gap-1">
                                  <span>✓ KUNCI FIREWALL TERKONFIRMASI</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* STATUS DAN PENJELASAN VERIFIKASI */}
                    {challengeResults[activeMode] && (
                      <div
                        className={`rounded-lg border p-3 text-xs font-mono leading-relaxed transition-all ${
                          challengeResults[activeMode]?.isCorrect
                            ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-300"
                            : "border-rose-500/60 bg-rose-950/40 text-rose-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold tracking-wider">
                            {challengeResults[activeMode]?.isCorrect
                              ? "[STATUS // OTENTIKASI BERHASIL]"
                              : "[STATUS // KALKULASI BELUM TEPAT]"}
                          </p>
                          {challengeResults[activeMode]?.isCorrect && !isAllModesCompleted && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextMode = ([2, 4, 8] as PageSizeMode[]).find(
                                  (m) => !completedModes[m] && m !== activeMode
                                );
                                if (nextMode) setActiveMode(nextMode);
                              }}
                              className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-400/50 rounded px-2.5 py-1 text-emerald-200 transition font-bold"
                            >
                              Lanjut ke Mode Berikutnya ➔
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] mt-1">{challengeResults[activeMode]?.message}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs font-mono text-gray-500">
                    [Tantangan akan terbuka setelah semua page ditempatkan ke Frame Fisik]
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: MANUAL OMNI (PANDUAN RUMUS RINGKAS)                           */}
      {/* ===================================================================== */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cyan-400/50 bg-[#0c081e]/95 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_60px_rgba(34,211,238,0.3)] space-y-4">
            
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
                <h3 className="font-mono text-base font-bold text-cyan-300">
                  OMNI DATALOG // PANDUAN PAGING &amp; TRANSLASI ALAMAT
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowManualModal(false);
                  if (!isAllModesCompleted) {
                    triggerAlert("✅ Log Manual OMNI dipelajari! Terminal Page Mapper di meja tengah sekarang terbuka.");
                  }
                }}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-400 hover:text-white"
              >
                ✕ Tutup (ESC)
              </button>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-gray-200 leading-relaxed font-sans">
              <section className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
                <h4 className="font-bold text-cyan-300 font-mono mb-1">
                  1. Mengapa Menggunakan Paging?
                </h4>
                <p className="text-gray-300 text-xs">
                  Paging membagi memori logis proses menjadi blok berukuran seragam bernama <strong className="text-white">Page</strong>, dan memori fisik RAM menjadi <strong className="text-white">Frame</strong> berukuran persis sama. Hal ini sepenuhnya menghilangkan <strong className="text-rose-300">Fragmentasi Eksternal</strong> karena proses dapat ditempatkan di frame mana pun yang bebas secara terpisah (*non-contiguous*).
                </p>
              </section>

              <section className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
                <h4 className="font-bold text-amber-300 font-mono mb-1">
                  2. Fragmentasi Internal (Internal Fragmentation)
                </h4>
                <p className="text-gray-300 text-xs">
                  Karena ukuran page bersifat tetap, sisa memori pada <strong className="text-white">page terakhir proses</strong> yang tidak terpakai habis akan terbuang sia-sia.
                  <br />
                  <span className="font-mono text-amber-200 text-[11px]">
                    Rumus: Fragmentasi Internal = Ukuran Page - Memori Terpakai Aktual
                  </span>
                </p>
              </section>

              <section className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-4">
                <h4 className="font-bold text-purple-300 font-mono mb-1">
                  3. Rumus Translasi Alamat Fisik (MMU Hardware)
                </h4>
                <div className="font-mono text-xs space-y-1 bg-black/50 p-3 rounded-lg border border-purple-500/30 text-purple-200">
                  <p>&bull; Page Number = floor(Logical Address / Page Size)</p>
                  <p>&bull; Offset = Logical Address % Page Size</p>
                  <p className="pt-1 text-white font-bold">
                    &bull; Physical Address = (Frame Number × Page Size) + Offset
                  </p>
                </div>
              </section>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowManualModal(false);
                  if (!isAllModesCompleted) {
                    triggerAlert("✅ Log Manual OMNI dipelajari! Terminal Page Mapper di meja tengah sekarang terbuka.");
                  }
                }}
                className="rounded-xl bg-cyan-500 px-5 py-2 font-mono text-xs font-bold text-black shadow-lg hover:bg-cyan-400 transition"
              >
                Mengerti &amp; Buka Akses Terminal ➔
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: LAPORAN KINERJA ALGORITMA (EVALUASI AKADEMIK AKHIR)          */}
      {/* ===================================================================== */}
      {showMetricsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-amber-400/50 bg-[#0c081e]/98 p-6 md:p-8 text-[#e9e4ff] shadow-[0_0_80px_rgba(251,191,36,0.3)] space-y-5">
            
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-amber-400 animate-ping" />
                <div>
                  <h3 className="font-mono text-base md:text-lg font-black text-amber-300 tracking-wider">
                    LAPORAN METRIK KINERJA: EVALUASI TRADE-OFF PAGING
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    Perbandingan Fragmentasi Internal vs Overhead Ukuran Page Table (RAM 32 KB)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMetricsModal(false)}
                className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-400 hover:text-white"
              >
                ✕ Tutup
              </button>
            </div>

            {/* GRAFIK 1: TOTAL FRAGMENTASI INTERNAL (KB) */}
            <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-cyan-300">
                  [METRIK 01] TOTAL FRAGMENTASI INTERNAL (KB)
                </span>
                <span className="text-[10px] text-gray-400">
                  (Makin Rendah = Pemborosan Memori Makin Sedikit)
                </span>
              </div>
              <div className="space-y-2.5 pt-1">
                {allMetrics.map((item) => {
                  const barWidth = (item.totalInternalFragKB / 10) * 100;
                  return (
                    <div key={item.pageSizeKB} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-gray-300">
                          Mode <strong className="text-white">Page {item.pageSizeKB} KB</strong>
                          {item.pageSizeKB === 4 && (
                            <span className="ml-1.5 rounded bg-amber-500/20 text-amber-300 px-1 py-0.2 text-[9px] border border-amber-400/40">
                              Sweet Spot
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-white">
                          {item.totalInternalFragKB} KB Terbuang
                        </span>
                      </div>

                      <div className="h-5 w-full rounded-lg bg-slate-900 border border-white/10 overflow-hidden flex items-center p-0.5">
                        <div
                          className={`h-full rounded transition-all duration-700 flex items-center justify-end pr-2 text-[9px] font-mono font-bold text-black ${
                            item.pageSizeKB === 2
                              ? "bg-emerald-400"
                              : item.pageSizeKB === 4
                              ? "bg-amber-400"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.max(barWidth, 14)}%` }}
                        >
                          {item.totalInternalFragKB} KB
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GRAFIK 2: OVERHEAD ENTRI PAGE TABLE */}
            <div className="rounded-xl border border-white/10 bg-black/50 p-4 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-purple-300">
                  [METRIK 02] OVERHEAD ENTRI PAGE TABLE (JUMLAH BARIS TABEL)
                </span>
                <span className="text-[10px] text-gray-400">
                  (Makin Sedikit = Struktur Data Kernel Makin Ringan)
                </span>
              </div>
              <div className="space-y-2.5 pt-1">
                {allMetrics.map((item) => {
                  const barWidth = (item.totalPages / 8) * 100;
                  return (
                    <div key={item.pageSizeKB} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-gray-300">
                          Mode <strong className="text-white">Page {item.pageSizeKB} KB</strong>
                        </span>
                        <span className="font-bold text-white">
                          {item.totalPages} Entri Baris Tabel
                        </span>
                      </div>

                      <div className="h-5 w-full rounded-lg bg-slate-900 border border-white/10 overflow-hidden flex items-center p-0.5">
                        <div
                          className={`h-full rounded transition-all duration-700 flex items-center justify-end pr-2 text-[9px] font-mono font-bold text-black ${
                            item.pageSizeKB === 2
                              ? "bg-rose-500"
                              : item.pageSizeKB === 4
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                          }`}
                          style={{ width: `${Math.max(barWidth, 14)}%` }}
                        >
                          {item.totalPages} Entri
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* KESIMPULAN AKADEMIS SISTEM OPERASI */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-xs text-gray-200 leading-relaxed space-y-1.5 font-sans">
              <h4 className="font-bold text-emerald-300 font-mono text-sm flex items-center gap-1.5">
                <span>[ANALISIS ARSITEKTUR] MENGAPA PAGE SIZE 4 KB MENJADI STANDAR MODERN</span>
              </h4>
              <p className="text-gray-300 text-[11px]">
                Dalam desain sistem operasi dan prosesor modern (seperti arsitektur x86 dan ARM64), ukuran <strong className="text-white">Page 4 KB</strong> dipilih sebagai standar utama karena menghasilkan kompromi (*trade-off*) paling seimbang:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-[11px] pt-1">
                <li>
                  <strong className="text-white">Page 2 KB (Kecil):</strong> Fragmentasi internal minim (hanya 2 KB), namun memicu <strong className="text-rose-300">8 baris entri tabel</strong> (overhead memori kernel membengkak).
                </li>
                <li>
                  <strong className="text-white">Page 8 KB (Besar):</strong> Tabel sangat ringkas (hanya 3 entri), tetapi menyebabkan <strong className="text-rose-400">10 KB fragmentasi internal</strong> (~41.7% alokasi memori terbuang sia-sia).
                </li>
                <li>
                  <strong className="text-amber-300">Page 4 KB (Sedang):</strong> Merupakan titik temu paling efisien (*sweet spot*) antara efisiensi pemanfaatan ruang fisik dan ukuran Page Table di kernel.
                </li>
              </ul>
            </div>

            {/* Tombol Aksi Modal */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-500/30 pt-3">
              <span className="text-[11px] font-mono text-emerald-400">
                ✓ Seluruh 3 Mode Selesai! Tembok Biru Dinonaktifkan &amp; Portal Stage 4 Aktif di Catwalk Kiri Atas.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMetricsModal(false);
                    setShowMapperModal(true);
                  }}
                  className="rounded-xl border border-white/20 bg-white/5 px-3.5 py-1.5 font-mono text-xs text-gray-300 hover:bg-white/10 transition"
                >
                  ← Ke Terminal Mapper
                </button>

                <button
                  type="button"
                  onClick={() => setShowMetricsModal(false)}
                  className="rounded-xl border border-cyan-400/50 bg-cyan-950/60 px-5 py-2 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                >
                  Kembali ke Ruangan &amp; Masuk Portal ➔
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── KEYFRAME ANIMASI WADDLE (PERSIS SEPERTI STAGE 1 & 2) ─── */}
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
