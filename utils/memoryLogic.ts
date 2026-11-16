/**
 * Modul Logika Inti Alokasi Memori Kontigu (Contiguous Memory Allocation)
 * Stage 2: The Core Simulation Game - OS-Scape
 * 
 * Modul ini berisi logika murni (pure functions) untuk:
 * - Algoritma First-Fit, Best-Fit, Worst-Fit
 * - Pemotongan partisi (hole split) & pelacakan fragmentasi eksternal
 * - Perhitungan metrik performa memori
 * - Single source of truth untuk Simulator & Mini-game Cargo Bay
 */

// 1. Tipe Data Inti Memori & Kargo
export interface Hole {
  id: string | number; // Identitas unik partisi bebas
  start: number;       // Alamat fisik awal memori (KB)
  size: number;        // Kapasitas partisi bebas (KB)
}

export interface Cargo {
  id: string | number; // Identitas unik muatan/kargo (proses)
  name: string;        // Nama label kargo (misal: "CRATE-A")
  size: number;        // Kebutuhan memori kargo (KB)
}

export interface StepLog {
  stepIndex: number;
  cargo: Cargo;
  inspectedHoleId: string | number;
  holeSize: number;
  isFitting: boolean;
  message: string;
}

export interface InspectionResult {
  selectedHole: Hole | null;
  checkedHoles: Hole[];
  logs: StepLog[];
}

export interface PlacementResult {
  cargo: Cargo;
  allocatedHoleId: string | number | null;
  allocatedStart: number | null;
  remainingHoleSize: number | null;
  checkedHoles: Hole[];
  logs: StepLog[];
  success: boolean;
}

export interface MemoryMetrics {
  totalInitialMemory: number;
  totalFreeMemory: number;
  totalUsedMemory: number;
  utilizationPercentage: number;
  largestHoleSize: number;
  externalFragmentationSize: number;
  externalFragmentationPercentage: number;
  allocatedCargosCount: number;
  failedCargosCount: number;
  totalSlotsInspected: number;
  remainingHolesCount: number;
}

export type MemoryAlgorithm = "First-Fit" | "Best-Fit" | "Worst-Fit";

export interface ScenarioResult {
  algorithm: MemoryAlgorithm;
  initialHoles: Hole[];
  cargos: Cargo[];
  placements: PlacementResult[];
  finalHoles: Hole[];
  metrics: MemoryMetrics;
  historyLogs: StepLog[];
}

/**
 * 1. Algoritma First-Fit
 * Memeriksa daftar hole secara berurutan dari alamat awal terendah (indeks 0).
 * Berhenti di hole pertama yang cukup menampung kargo (size >= cargo.size).
 * 
 * Aturan Tie-break: Alamat awal (start) terkecil (urutan indeks alami).
 * 
 * @param holes Daftar partisi memori bebas saat ini
 * @param cargo Kargo/proses yang ingin dialokasikan
 * @returns Slot terpilih (atau null jika tidak ada yang muat), daftar slot yang diperiksa, dan catatan log
 */
export function firstFit(holes: Hole[], cargo: Cargo): InspectionResult {
  const checkedHoles: Hole[] = [];
  const logs: StepLog[] = [];
  let selectedHole: Hole | null = null;

  for (let i = 0; i < holes.length; i++) {
    const hole = holes[i];
    checkedHoles.push(hole);

    // Cek apakah hole saat ini muat
    if (hole.size >= cargo.size) {
      selectedHole = hole;
      logs.push({
        stepIndex: i + 1,
        cargo,
        inspectedHoleId: hole.id,
        holeSize: hole.size,
        isFitting: true,
        message: `Periksa slot #${hole.id} @${hole.start} (${hole.size} KB): muat untuk kargo ${cargo.name} (${cargo.size} KB). First-Fit memilih slot ini.`,
      });
      // First-Fit langsung berhenti di slot pertama yang muat!
      break;
    } else {
      logs.push({
        stepIndex: i + 1,
        cargo,
        inspectedHoleId: hole.id,
        holeSize: hole.size,
        isFitting: false,
        message: `Periksa slot #${hole.id} @${hole.start} (${hole.size} KB): kurang dari ${cargo.size} KB, lanjut mencari.`,
      });
    }
  }

  // Kasus jika tidak ada slot yang muat
  if (!selectedHole) {
    if (holes.length === 0) {
      logs.push({
        stepIndex: 0,
        cargo,
        inspectedHoleId: "-",
        holeSize: 0,
        isFitting: false,
        message: `Tidak ada partisi memori bebas (hole) yang tersedia untuk ${cargo.name}.`,
      });
    } else {
      logs.push({
        stepIndex: checkedHoles.length + 1,
        cargo,
        inspectedHoleId: "-",
        holeSize: 0,
        isFitting: false,
        message: `Semua slot telah diperiksa, tidak ada slot yang cukup untuk kargo ${cargo.name} (${cargo.size} KB). Alokasi ditolak.`,
      });
    }
  }

  return { selectedHole, checkedHoles, logs };
}

/**
 * 2. Algoritma Best-Fit
 * Memeriksa SELURUH daftar hole untuk mencari partisi terkecil yang masih muat
 * (size >= cargo.size dengan selisih size - cargo.size paling minimal).
 * Tujuannya meminimalkan sisa ruang partisi yang terbuang.
 * 
 * Aturan Tie-break: Jika ada ukuran sama yang muat, pilih alamat awal (start) terkecil.
 * 
 * @param holes Daftar partisi memori bebas saat ini
 * @param cargo Kargo/proses yang ingin dialokasikan
 * @returns Slot terpilih (atau null), daftar seluruh slot yang diperiksa, dan catatan log
 */
export function bestFit(holes: Hole[], cargo: Cargo): InspectionResult {
  const checkedHoles: Hole[] = [];
  const logs: StepLog[] = [];
  let selectedHole: Hole | null = null;
  let minDifference = Infinity;

  for (let i = 0; i < holes.length; i++) {
    const hole = holes[i];
    checkedHoles.push(hole);

    if (hole.size >= cargo.size) {
      const diff = hole.size - cargo.size;
      const isBetter = diff < minDifference;

      if (isBetter) {
        minDifference = diff;
        selectedHole = hole;
        logs.push({
          stepIndex: i + 1,
          cargo,
          inspectedHoleId: hole.id,
          holeSize: hole.size,
          isFitting: true,
          message: `Periksa slot #${hole.id} @${hole.start} (${hole.size} KB): muat (sisa ${diff} KB). Menjadi kandidat terbaik saat ini.`,
        });
      } else {
        logs.push({
          stepIndex: i + 1,
          cargo,
          inspectedHoleId: hole.id,
          holeSize: hole.size,
          isFitting: true,
          message: `Periksa slot #${hole.id} @${hole.start} (${hole.size} KB): muat (sisa ${diff} KB), namun slot #${selectedHole?.id} lebih pas (sisa ${minDifference} KB).`,
        });
      }
    } else {
      logs.push({
        stepIndex: i + 1,
        cargo,
        inspectedHoleId: hole.id,
        holeSize: hole.size,
        isFitting: false,
        message: `Periksa slot #${hole.id} @${hole.start} (${hole.size} KB): kurang dari ${cargo.size} KB, lanjut mencari.`,
      });
    }
  }

  if (selectedHole) {
    logs.push({
      stepIndex: checkedHoles.length + 1,
      cargo,
      inspectedHoleId: selectedHole.id,
      holeSize: selectedHole.size,
      isFitting: true,
      message: `Best-Fit menetapkan slot #${selectedHole.id} @${selectedHole.start} (${selectedHole.size} KB) karena menyisakan ruang terkecil (${minDifference} KB).`,
    });
  } else if (holes.length === 0) {
    logs.push({
      stepIndex: 0,
      cargo,
      inspectedHoleId: "-",
      holeSize: 0,
      isFitting: false,
      message: `Tidak ada partisi memori bebas (hole) yang tersedia untuk ${cargo.name}.`,
    });
  } else {
    logs.push({
      stepIndex: checkedHoles.length + 1,
      cargo,
      inspectedHoleId: "-",
      holeSize: 0,
      isFitting: false,
      message: `Semua slot telah diperiksa, tidak ada slot yang cukup untuk kargo ${cargo.name} (${cargo.size} KB). Alokasi ditolak.`,
    });
  }

  return { selectedHole, checkedHoles, logs };
}

/**
 * 3. Algoritma Worst-Fit
 * Memeriksa SELURUH daftar hole untuk mencari partisi TERBESAR yang muat
 * (size >= cargo.size dengan kapasitas hole.size paling maksimal).
 * Tujuannya agar ruang sisa yang dihasilkan sebesar mungkin dan dapat dimanfaatkan proses lain.
 * 
 * Aturan Tie-break: Jika ada ukuran terbesar yang sama, pilih alamat awal (start) terkecil.
 * 
 * @param holes Daftar partisi memori bebas saat ini
 * @param cargo Kargo/proses yang ingin dialokasikan
 * @returns Slot terpilih (atau null), daftar seluruh slot yang diperiksa, dan catatan log
 */
export function worstFit(holes: Hole[], cargo: Cargo): InspectionResult {
  const checkedHoles: Hole[] = [];
  const logs: StepLog[] = [];
  let selectedHole: Hole | null = null;
  let maxHoleSize = -Infinity;

  for (let i = 0; i < holes.length; i++) {
    const hole = holes[i];
    checkedHoles.push(hole);

    if (hole.size >= cargo.size) {
      const isLarger = hole.size > maxHoleSize;

      if (isLarger) {
        maxHoleSize = hole.size;
        selectedHole = hole;
        logs.push({
          stepIndex: i + 1,
          cargo,
          inspectedHoleId: hole.id,
          holeSize: hole.size,
          isFitting: true,
          message: `Periksa slot #${hole.id} @${hole.start} (${hole.size} KB): muat. Menjadi kandidat slot terbesar saat ini (${hole.size} KB).`,
        });
      } else {
        logs.push({
          stepIndex: i + 1,
          cargo,
          inspectedHoleId: hole.id,
          holeSize: hole.size,
          isFitting: true,
          message: `Periksa slot #${hole.id} @${hole.start} (${hole.size} KB): muat, namun slot #${selectedHole?.id} lebih besar (${maxHoleSize} KB).`,
        });
      }
    } else {
      logs.push({
        stepIndex: i + 1,
        cargo,
        inspectedHoleId: hole.id,
        holeSize: hole.size,
        isFitting: false,
        message: `Periksa slot #${hole.id} @${hole.start} (${hole.size} KB): kurang dari ${cargo.size} KB, lanjut mencari.`,
      });
    }
  }

  if (selectedHole) {
    const leftover = selectedHole.size - cargo.size;
    logs.push({
      stepIndex: checkedHoles.length + 1,
      cargo,
      inspectedHoleId: selectedHole.id,
      holeSize: selectedHole.size,
      isFitting: true,
      message: `Worst-Fit menetapkan slot #${selectedHole.id} @${selectedHole.start} (${selectedHole.size} KB) karena merupakan partisi terbesar (sisa ${leftover} KB).`,
    });
  } else if (holes.length === 0) {
    logs.push({
      stepIndex: 0,
      cargo,
      inspectedHoleId: "-",
      holeSize: 0,
      isFitting: false,
      message: `Tidak ada partisi memori bebas (hole) yang tersedia untuk ${cargo.name}.`,
    });
  } else {
    logs.push({
      stepIndex: checkedHoles.length + 1,
      cargo,
      inspectedHoleId: "-",
      holeSize: 0,
      isFitting: false,
      message: `Semua slot telah diperiksa, tidak ada slot yang cukup untuk kargo ${cargo.name} (${cargo.size} KB). Alokasi ditolak.`,
    });
  }

  return { selectedHole, checkedHoles, logs };
}

/**
 * Melakukan alokasi kargo tunggal ke dalam daftar hole dan memotong partisi (split).
 * Menjaga immutability (tidak mengubah array input secara langsung).
 * 
 * Aturan Split:
 * - Jika hole.size > cargo.size: sisa memori tetap menjadi hole dengan alamat start baru dan kapasitas berkurang.
 * - Jika hole.size === cargo.size: hole terpakai sempurna (sisa 0), sehingga hole dihapus dari daftar partisi bebas.
 */
export function allocate(
  holes: Hole[],
  cargo: Cargo,
  algorithm: MemoryAlgorithm
): {
  newHoles: Hole[];
  placement: PlacementResult;
} {
  let inspection: InspectionResult;
  if (algorithm === "First-Fit") {
    inspection = firstFit(holes, cargo);
  } else if (algorithm === "Best-Fit") {
    inspection = bestFit(holes, cargo);
  } else {
    inspection = worstFit(holes, cargo);
  }

  const { selectedHole, checkedHoles, logs } = inspection;

  // Jika tidak ada hole yang muat
  if (!selectedHole) {
    return {
      newHoles: holes.map((h) => ({ ...h })),
      placement: {
        cargo,
        allocatedHoleId: null,
        allocatedStart: null,
        remainingHoleSize: null,
        checkedHoles,
        logs,
        success: false,
      },
    };
  }

  const newHoles: Hole[] = [];
  const allocatedStart = selectedHole.start;
  const remainingSize = selectedHole.size - cargo.size;

  for (const h of holes) {
    if (h.id === selectedHole.id) {
      if (remainingSize > 0) {
        // Pemotongan partisi (Split Hole)
        newHoles.push({
          id: h.id,
          start: h.start + cargo.size,
          size: remainingSize,
        });
      }
      // Jika remainingSize === 0, hole habis dan tidak dimasukkan lagi ke newHoles
    } else {
      newHoles.push({ ...h });
    }
  }

  return {
    newHoles,
    placement: {
      cargo,
      allocatedHoleId: selectedHole.id,
      allocatedStart,
      remainingHoleSize: remainingSize,
      checkedHoles,
      logs,
      success: true,
    },
  };
}

/**
 * Menghitung seluruh metrik performa memori setelah serangkaian penempatan kargo.
 */
export function calculateMetrics(
  initialHoles: Hole[],
  finalHoles: Hole[],
  placements: PlacementResult[]
): MemoryMetrics {
  const totalInitialMemory = initialHoles.reduce((acc, h) => acc + h.size, 0);
  const totalFreeMemory = finalHoles.reduce((acc, h) => acc + h.size, 0);
  const totalUsedMemory = totalInitialMemory - totalFreeMemory;

  const utilizationPercentage =
    totalInitialMemory > 0
      ? Number(((totalUsedMemory / totalInitialMemory) * 100).toFixed(2))
      : 0;

  const largestHoleSize =
    finalHoles.length > 0 ? Math.max(...finalHoles.map((h) => h.size)) : 0;

  // Sisa Fragmentasi Eksternal = Total Memori Bebas - Hole Terbesar
  const externalFragmentationSize = Math.max(0, totalFreeMemory - largestHoleSize);
  const externalFragmentationPercentage =
    totalInitialMemory > 0
      ? Number(((externalFragmentationSize / totalInitialMemory) * 100).toFixed(2))
      : 0;

  let allocatedCargosCount = 0;
  let failedCargosCount = 0;
  let totalSlotsInspected = 0;

  for (const p of placements) {
    if (p.success) allocatedCargosCount++;
    else failedCargosCount++;
    totalSlotsInspected += p.checkedHoles.length;
  }

  return {
    totalInitialMemory,
    totalFreeMemory,
    totalUsedMemory,
    utilizationPercentage,
    largestHoleSize,
    externalFragmentationSize,
    externalFragmentationPercentage,
    allocatedCargosCount,
    failedCargosCount,
    totalSlotsInspected,
    remainingHolesCount: finalHoles.length,
  };
}

/**
 * Menjalankan skenario alokasi lengkap untuk daftar kargo secara berurutan.
 * Mengembalikan hasil langkah demi langkah, riwayat log, daftar hole akhir, dan komputasi metrik.
 */
export function runScenario(
  initialHoles: Hole[],
  cargos: Cargo[],
  algorithm: MemoryAlgorithm
): ScenarioResult {
  let currentHoles = initialHoles.map((h) => ({ ...h }));
  const placements: PlacementResult[] = [];
  const historyLogs: StepLog[] = [];

  for (const cargo of cargos) {
    const { newHoles, placement } = allocate(currentHoles, cargo, algorithm);
    placements.push(placement);
    historyLogs.push(...placement.logs);
    currentHoles = newHoles;
  }

  const metrics = calculateMetrics(initialHoles, currentHoles, placements);

  return {
    algorithm,
    initialHoles: initialHoles.map((h) => ({ ...h })),
    cargos: cargos.map((c) => ({ ...c })),
    placements,
    finalHoles: currentHoles,
    metrics,
    historyLogs,
  };
}

/**
 * Data Skenario Default (Studi Kasus Standar Sistem Operasi)
 * Holes: [100, 500, 200, 300, 600] KB
 * Cargos: [212, 417, 112, 426] KB
 */
export const DEFAULT_HOLES: Hole[] = [
  { id: 1, start: 0, size: 100 },
  { id: 2, start: 100, size: 500 },
  { id: 3, start: 600, size: 200 },
  { id: 4, start: 800, size: 300 },
  { id: 5, start: 1100, size: 600 },
];

export const DEFAULT_CARGOS: Cargo[] = [
  { id: "c1", name: "C1 (212 KB)", size: 212 },
  { id: "c2", name: "C2 (417 KB)", size: 417 },
  { id: "c3", name: "C3 (112 KB)", size: 112 },
  { id: "c4", name: "C4 (426 KB)", size: 426 },
];

// ==========================================
// LOGIKA & GENERATOR MISI CARGO BAY MINI-GAME
// ==========================================

export type MissionType =
  | "drag_and_drop"     // 1. Seret Kargo ke Slot yang Benar
  | "guess_slot"         // 2. Tebak Slot Mana yang Dipilih
  | "guess_algorithm"    // 3. Tebak Algoritma yang Cocok
  | "calculate_leftover" // 4. Hitung Sisa Ruang Partisi (Split)
  | "inspection_order"   // 5. Urutan Slot yang Diperiksa
  | "find_the_wrong"     // 6. Cari Penempatan yang Melanggar Aturan
  | "will_it_fit"        // 7. Muat Nggak Ya? (Fragmentasi Eksternal)
  | "match_cards";       // 8. Pasangkan Kartu Deskripsi & Algoritma

export interface WrongCandidate {
  id: string | number;
  cargoName: string;
  cargoSize: number;
  holeId: string | number;
  holeSize: number;
  isWrong: boolean;
  explanation: string;
}

export interface CardMatchItem {
  algo: MemoryAlgorithm;
  description: string;
}

export interface Mission {
  id: number;
  type: MissionType;
  title: string;
  instruction: string;
  algorithm?: MemoryAlgorithm;
  holes?: Hole[];
  cargos?: Cargo[];
  targetCargo?: Cargo;
  correctSlotId?: string | number | null;
  correctAlgorithm?: MemoryAlgorithm;
  correctLeftover?: number;
  leftoverOptions?: number[];
  correctInspectionOrder?: Array<string | number>;
  wrongCandidates?: WrongCandidate[];
  canFit?: boolean;
  matchPairs?: CardMatchItem[];
  explanation: string;
}

/**
 * Generator Bilangan Acak Pseudo Deterministik (LCG)
 * Menjamin hasil tes dan sesi presentasi selalu stabil untuk seed yang sama.
 */
export function createPRNG(seed: number) {
  let s = Math.abs(Math.floor(seed)) || 12345;
  return function next(): number {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Membuat 6 misi acak namun deterministik untuk 1 ronde mini-game.
 * Aturan:
 * 1. Tidak ada tipe misi yang sama berturut-turut.
 * 2. Ketiga algoritma (First, Best, Worst) muncul minimal satu kali.
 * 3. Jawaban selalu valid dan unik (single source of truth).
 */
export function generateRoundMissions(seed: number = 42): Mission[] {
  const prng = createPRNG(seed);

  // Pool 8 tipe misi
  const allTypes: MissionType[] = [
    "drag_and_drop",
    "guess_slot",
    "guess_algorithm",
    "calculate_leftover",
    "inspection_order",
    "find_the_wrong",
    "will_it_fit",
    "match_cards",
  ];

  // Acak urutan tipe misi tanpa jenis sama berturut-turut
  const shuffledTypes = [...allTypes].sort(() => prng() - 0.5);
  const selectedTypes = shuffledTypes.slice(0, 6);

  // Pastikan variasi algoritma
  const algos: MemoryAlgorithm[] = ["First-Fit", "Best-Fit", "Worst-Fit"];

  return selectedTypes.map((type, idx) => {
    const assignedAlgo = algos[idx % algos.length];
    return generateSingleMission(idx + 1, type, assignedAlgo, prng);
  });
}

function generateSingleMission(
  id: number,
  type: MissionType,
  algorithm: MemoryAlgorithm,
  prng: () => number
): Mission {
  // Ukuran kelipatan 10 KB, 3-5 slot, 2-4 kargo
  const baseSizes = [80, 120, 160, 200, 240, 280, 320, 360, 400, 480];
  const pick = <T>(arr: T[]): T => arr[Math.floor(prng() * arr.length)];

  switch (type) {
    case "drag_and_drop": {
      // 3-4 slot
      const holes: Hole[] = [
        { id: "A", start: 0, size: pick([100, 120, 140]) },
        { id: "B", start: 200, size: pick([260, 300, 340]) },
        { id: "C", start: 600, size: pick([180, 220, 240]) },
        { id: "D", start: 900, size: pick([380, 420, 460]) },
      ];
      const cargoSize = pick([150, 190, 210]);
      const targetCargo: Cargo = { id: "c1", name: `CRATE-1 (${cargoSize} KB)`, size: cargoSize };

      let correctSlot: Hole | null = null;
      if (algorithm === "First-Fit") correctSlot = firstFit(holes, targetCargo).selectedHole;
      else if (algorithm === "Best-Fit") correctSlot = bestFit(holes, targetCargo).selectedHole;
      else correctSlot = worstFit(holes, targetCargo).selectedHole;

      return {
        id,
        type,
        title: "MISI 1: SERET KARGO KE SLOT",
        instruction: `Gunakan protokol ${algorithm}: Tempatkan kargo ${targetCargo.name} ke slot yang tepat! (Bisa seret atau klik slot target)`,
        algorithm,
        holes,
        targetCargo,
        correctSlotId: correctSlot?.id ?? null,
        explanation: `${algorithm} memilih Slot #${correctSlot?.id} (${correctSlot?.size} KB).`,
      };
    }

    case "guess_slot": {
      const holes: Hole[] = [
        { id: 1, start: 0, size: pick([100, 150]) },
        { id: 2, start: 200, size: pick([400, 450]) },
        { id: 3, start: 700, size: pick([220, 250]) },
        { id: 4, start: 1000, size: pick([500, 550]) },
      ];
      const cargoSize = pick([180, 210, 230]);
      const targetCargo: Cargo = { id: "c2", name: `MODUL-ALPHA (${cargoSize} KB)`, size: cargoSize };

      let correctSlot: Hole | null = null;
      if (algorithm === "First-Fit") correctSlot = firstFit(holes, targetCargo).selectedHole;
      else if (algorithm === "Best-Fit") correctSlot = bestFit(holes, targetCargo).selectedHole;
      else correctSlot = worstFit(holes, targetCargo).selectedHole;

      return {
        id,
        type,
        title: "MISI 2: TEBAK SLOT PARTISI",
        instruction: `Menurut aturan ${algorithm}, kargo ${targetCargo.name} akan dialokasikan ke slot nomor berapa? Klik slot terpilih!`,
        algorithm,
        holes,
        targetCargo,
        correctSlotId: correctSlot?.id ?? null,
        explanation:
          algorithm === "First-Fit"
            ? `First-Fit berhenti di slot pertama yang cukup, yaitu Slot #${correctSlot?.id}.`
            : algorithm === "Best-Fit"
            ? `Best-Fit memilih partisi terkecil yang cukup (${correctSlot?.size} KB) untuk meminimalkan sisa.`
            : `Worst-Fit memilih partisi terbesar (${correctSlot?.size} KB) agar sisa partisi tetap besar.`,
      };
    }

    case "guess_algorithm": {
      // Buat konfigurasi di mana penempatan UNIK (hanya 1 algoritma yang memilihnya)
      // Misal: holes: 100, 400, 250, 600, kargo 200
      // First-Fit -> 400 (pertama)
      // Best-Fit  -> 250 (terkecil muat)
      // Worst-Fit -> 600 (terbesar)
      const holes: Hole[] = [
        { id: 1, start: 0, size: 100 },
        { id: 2, start: 100, size: 400 },
        { id: 3, start: 500, size: 250 },
        { id: 4, start: 800, size: 600 },
      ];
      const targetCargo: Cargo = { id: "c3", name: "BEACON-DATA (200 KB)", size: 200 };

      const chosenAlgo = algorithm;
      let targetHoleId: string | number;

      if (chosenAlgo === "First-Fit") targetHoleId = 2; // 400
      else if (chosenAlgo === "Best-Fit") targetHoleId = 3; // 250
      else targetHoleId = 4; // 600

      return {
        id,
        type,
        title: "MISI 3: TEBAK ALGORITMA",
        instruction: `Kargo ${targetCargo.name} ditempatkan ke Slot #${targetHoleId} (${holes.find((h) => h.id === targetHoleId)?.size} KB). Algoritma manakah yang menghasilkan keputusan ini?`,
        holes,
        targetCargo,
        correctSlotId: targetHoleId,
        correctAlgorithm: chosenAlgo,
        explanation:
          chosenAlgo === "First-Fit"
            ? "Slot #2 (400 KB) adalah slot pertama yang muat (First-Fit)."
            : chosenAlgo === "Best-Fit"
            ? "Slot #3 (250 KB) adalah slot terkecil yang muat (Best-Fit)."
            : "Slot #4 (600 KB) adalah slot terbesar yang muat (Worst-Fit).",
      };
    }

    case "calculate_leftover": {
      const holeSize = pick([300, 350, 400, 450, 500]);
      const cargoSize = pick([110, 120, 150, 170, 210]);
      const leftover = holeSize - cargoSize;

      // 4 pilihan distraktor logis kelipatan 10
      const optionsSet = new Set<number>([leftover]);
      optionsSet.add(leftover + 20);
      optionsSet.add(Math.max(10, leftover - 20));
      optionsSet.add(leftover + 50);
      const leftoverOptions = Array.from(optionsSet).sort((a, b) => a - b);

      const holes: Hole[] = [
        { id: 1, start: 0, size: 100 },
        { id: 2, start: 100, size: holeSize },
        { id: 3, start: 600, size: 200 },
      ];
      const targetCargo: Cargo = { id: "c4", name: `REAKTOR (${cargoSize} KB)`, size: cargoSize };

      return {
        id,
        type,
        title: "MISI 4: HITUNG SISA PARTISI (SPLIT)",
        instruction: `Kargo ${targetCargo.name} masuk ke Slot #2 (${holeSize} KB). Setelah pemotongan partisi (split hole), berapa KB sisa memori bebas pada slot tersebut?`,
        holes,
        targetCargo,
        correctSlotId: 2,
        correctLeftover: leftover,
        leftoverOptions,
        explanation: `Sisa partisi = ${holeSize} KB - ${cargoSize} KB = ${leftover} KB.`,
      };
    }

    case "inspection_order": {
      const holes: Hole[] = [
        { id: "A", start: 0, size: 80 },
        { id: "B", start: 100, size: 120 },
        { id: "C", start: 300, size: 300 },
        { id: "D", start: 700, size: 400 },
      ];
      const cargoSize = 250;
      const targetCargo: Cargo = { id: "c5", name: `KONTENER (${cargoSize} KB)`, size: cargoSize };

      let inspection: InspectionResult;
      if (algorithm === "First-Fit") inspection = firstFit(holes, targetCargo);
      else if (algorithm === "Best-Fit") inspection = bestFit(holes, targetCargo);
      else inspection = worstFit(holes, targetCargo);

      const correctOrder = inspection.checkedHoles.map((h) => h.id);

      return {
        id,
        type,
        title: "MISI 5: URUTAN PEMERIKSAAN SLOT",
        instruction: `Protokol ${algorithm}: Klik slot-slot sesuai urutan yang diperiksa sistem dari awal hingga alokasi ditetapkan!`,
        algorithm,
        holes,
        targetCargo,
        correctInspectionOrder: correctOrder,
        explanation:
          algorithm === "First-Fit"
            ? `First-Fit memeriksa A, B, lalu langsung berhenti di C karena sudah muat (Urutan: ${correctOrder.join(" ➔ ")}).`
            : `${algorithm} wajib memeriksa SELURUH slot untuk membandingkan kapasitas (Urutan: ${correctOrder.join(" ➔ ")}).`,
      };
    }

    case "find_the_wrong": {
      // 3 penempatan, 1 melanggar aturan algoritma
      const holes: Hole[] = [
        { id: 1, start: 0, size: 100 },
        { id: 2, start: 100, size: 500 },
        { id: 3, start: 600, size: 200 },
        { id: 4, start: 800, size: 300 },
      ];

      let wrongCandidates: WrongCandidate[];

      if (algorithm === "Best-Fit") {
        wrongCandidates = [
          {
            id: "opt1",
            cargoName: "Kargo X (80 KB)",
            cargoSize: 80,
            holeId: 1,
            holeSize: 100,
            isWrong: false,
            explanation: "Tepat, 100 KB adalah slot terkecil yang muat 80 KB.",
          },
          {
            id: "opt2",
            cargoName: "Kargo Y (180 KB)",
            cargoSize: 180,
            holeId: 2, // Salah! Harusnya masuk slot 3 (200 KB), bukan 2 (500 KB)
            holeSize: 500,
            isWrong: true,
            explanation: "SALAH! Best-Fit harusnya memilih Slot #3 (200 KB, sisa 20 KB), bukan Slot #2 (500 KB)!",
          },
          {
            id: "opt3",
            cargoName: "Kargo Z (260 KB)",
            cargoSize: 260,
            holeId: 4,
            holeSize: 300,
            isWrong: false,
            explanation: "Tepat, 300 KB adalah slot terkecil yang muat 260 KB.",
          },
        ];
      } else {
        // First-Fit
        wrongCandidates = [
          {
            id: "opt1",
            cargoName: "Kargo P (70 KB)",
            cargoSize: 70,
            holeId: 1,
            holeSize: 100,
            isWrong: false,
            explanation: "Tepat, Slot #1 adalah slot pertama yang muat.",
          },
          {
            id: "opt2",
            cargoName: "Kargo Q (150 KB)",
            cargoSize: 150,
            holeId: 4, // Salah! Slot 2 (500 KB) sudah muat lebih awal
            holeSize: 300,
            isWrong: true,
            explanation: "SALAH! First-Fit harusnya memilih Slot #2 (500 KB) karena posisinya mendahului Slot #4!",
          },
          {
            id: "opt3",
            cargoName: "Kargo R (250 KB)",
            cargoSize: 250,
            holeId: 2,
            holeSize: 500,
            isWrong: false,
            explanation: "Tepat, Slot #2 adalah slot pertama yang muat 250 KB.",
          },
        ];
      }

      return {
        id,
        type,
        title: "MISI 6: CARI PENEMPATAN YANG SALAH",
        instruction: `Di antara 3 rencana penempatan dengan ${algorithm} berikut, manakah yang melanggar aturan? Klik penempatan yang salah!`,
        algorithm,
        holes,
        wrongCandidates,
        explanation: wrongCandidates.find((c) => c.isWrong)?.explanation ?? "",
      };
    }

    case "will_it_fit": {
      // Total memori bebas cukup, tapi tidak ada satu pun slot yang muat
      // Contoh: slot [90, 80, 100] KB (total 270 KB bebas), kargo butuh 150 KB
      const holes: Hole[] = [
        { id: 1, start: 0, size: 90 },
        { id: 2, start: 100, size: 80 },
        { id: 3, start: 200, size: 100 },
      ];
      const targetCargo: Cargo = { id: "c7", name: "MODUL-WARP (150 KB)", size: 150 };
      const totalFree = holes.reduce((acc, h) => acc + h.size, 0); // 270 KB

      return {
        id,
        type,
        title: "MISI 7: MUAT NGGAK YA? (FRAGMENTASI EKSTERNAL)",
        instruction: `Total memori bebas: ${totalFree} KB. Kargo ${targetCargo.name} membutuhkan 150 KB memori kontigu. Apakah kargo ini bisa diterima di salah satu slot?`,
        holes,
        targetCargo,
        canFit: false,
        explanation: `Total memori bebas (${totalFree} KB) memang lebih besar dari 150 KB, namun karena alokasi kontigu membutuhkan 1 blok utuh dan slot terbesar hanya 100 KB, kargo HARUS DITOLAK. Inilah fenomena Fragmentasi Eksternal!`,
      };
    }

    case "match_cards": {
      const matchPairs: CardMatchItem[] = [
        {
          algo: "First-Fit",
          description: "Mencari dari alamat awal dan langsung mengalokasikan ke slot pertama yang muat (Paling Cepat).",
        },
        {
          algo: "Best-Fit",
          description: "Memeriksa seluruh slot untuk mencari partisi terkecil yang cukup (Meminimalkan Sisa).",
        },
        {
          algo: "Worst-Fit",
          description: "Memeriksa seluruh slot untuk mencari partisi berkapasitas terbesar (Menyisakan Partisi Besar).",
        },
      ];

      return {
        id,
        type,
        title: "MISI 8: PASANGKAN KARTU PROTOKOL",
        instruction: "Pasangkan setiap kartu deskripsi cara kerja ke nama algoritma yang tepat!",
        matchPairs,
        explanation: "Ketiga algoritma memiliki strategi dan trade-off kompleksitas pencarian yang berbeda.",
      };
    }
  }
}
