// ============================================================================
// utils/pagingLogic.ts
// Modul Logika Alokasi Memori Non-Contiguous (Paging) — Stage 3
// Murni fungsi kalkulasi, translasi alamat, dan metrik komparasi arsitektur.
// ============================================================================

export type PageSizeMode = 2 | 4 | 8; // Dalam KB

export interface ProcessInput {
  id: "A" | "B";
  name: string;
  sizeKB: number;
  color: "cyan" | "purple";
  badgeClass: string;
}

export interface PageItem {
  id: string; // Misal "A-P0", "A-P1"
  processId: "A" | "B";
  processName: string;
  pageIndex: number;
  usedKB: number;
  internalFragKB: number;
  color: "cyan" | "purple";
}

export interface FrameItem {
  frameIndex: number;
  isReserved: boolean; // True jika frame dikunci OMNI_SYS
  reservedLabel?: string;
  mappedPage: PageItem | null; // Null jika frame kosong
}

export interface TranslationChallenge {
  mode: PageSizeMode;
  processId: "A" | "B";
  processName: string;
  logicalAddressKB: number;
  description: string;
  targetPageIndex: number;
  offsetKB: number;
}

export interface TranslationResult {
  isValid: boolean;
  pageIndex: number;
  offsetKB: number;
  frameIndex: number | null;
  expectedPhysicalAddressKB: number | null;
  userAddressKB: number;
  isCorrect: boolean;
  message: string;
}

export interface PagingMetricComparison {
  pageSizeKB: PageSizeMode;
  totalFrames: number;
  reservedFrames: number;
  totalPages: number; // Jumlah entri Page Table
  processAPages: number;
  processBPages: number;
  totalInternalFragKB: number;
  allocatedMemoryKB: number;
  actualUsedMemoryKB: number;
  efficiencyPercentage: number;
  overheadRating: "Tinggi" | "Sedang" | "Rendah";
  fragRating: "Rendah" | "Sedang" | "Tinggi";
}

// ============================================================================
// KONSTANTA SPESIFIKASI STAGE 3
// ============================================================================

export const TOTAL_PHYSICAL_MEMORY_KB = 32;

export const PROCESSES: ProcessInput[] = [
  {
    id: "A",
    name: "Nav-Module",
    sizeKB: 9,
    color: "cyan",
    badgeClass: "border-cyan-400 text-cyan-300 bg-cyan-950/60",
  },
  {
    id: "B",
    name: "Shield-Core",
    sizeKB: 5,
    color: "purple",
    badgeClass: "border-purple-400 text-purple-300 bg-purple-950/60",
  },
];

export const RESERVED_FRAMES_MAP: Record<PageSizeMode, number[]> = {
  2: [1, 4, 9, 13], // 4 frames dikunci dari 16 frames
  4: [1, 5],        // 2 frames dikunci dari 8 frames
  8: [1],           // 1 frame dikunci dari 4 frames
};

export const TRANSLATION_CHALLENGES: Record<PageSizeMode, TranslationChallenge> = {
  2: {
    mode: 2,
    processId: "A",
    processName: "Nav-Module",
    logicalAddressKB: 5,
    description: "Proses A (Nav-Module), Logical Address = 5 KB",
    targetPageIndex: 2, // floor(5 / 2) = 2
    offsetKB: 1,        // 5 % 2 = 1
  },
  4: {
    mode: 4,
    processId: "A",
    processName: "Nav-Module",
    logicalAddressKB: 6,
    description: "Proses A (Nav-Module), Logical Address = 6 KB",
    targetPageIndex: 1, // floor(6 / 4) = 1
    offsetKB: 2,        // 6 % 4 = 2
  },
  8: {
    mode: 8,
    processId: "B",
    processName: "Shield-Core",
    logicalAddressKB: 3,
    description: "Proses B (Shield-Core), Logical Address = 3 KB",
    targetPageIndex: 0, // floor(3 / 8) = 0
    offsetKB: 3,        // 3 % 8 = 3
  },
};

// ============================================================================
// FUNGSI LOGIKA MURNI PAGING
// ============================================================================

/**
 * 1. Memecah seluruh proses menjadi array PageItem sesuai ukuran page.
 * Menghitung kapasitas terpakai (usedKB) dan Fragmentasi Internal (internalFragKB)
 * pada page terakhir setiap proses.
 */
export function generatePagesForProcesses(
  processes: ProcessInput[] = PROCESSES,
  pageSizeKB: PageSizeMode
): PageItem[] {
  const pages: PageItem[] = [];

  for (const proc of processes) {
    const numPages = Math.ceil(proc.sizeKB / pageSizeKB);

    for (let p = 0; p < numPages; p++) {
      const isLastPage = p === numPages - 1;
      let usedKB: number = pageSizeKB;
      let internalFragKB = 0;

      if (isLastPage) {
        // Hitung sisa kapasitas memori aktual proses pada page terakhir
        const remainder = proc.sizeKB % pageSizeKB;
        usedKB = remainder === 0 ? pageSizeKB : remainder;
        internalFragKB = pageSizeKB - usedKB;
      }

      pages.push({
        id: `${proc.id}-P${p}`,
        processId: proc.id,
        processName: proc.name,
        pageIndex: p,
        usedKB,
        internalFragKB,
        color: proc.color,
      });
    }
  }

  return pages;
}

/**
 * 2. Menginisialisasi array Frame fisik berukuran Total 32 KB.
 * Mengunci frame tertentu dengan status isReserved: true (OMNI_SYS).
 */
export function initializeFrames(pageSizeKB: PageSizeMode): FrameItem[] {
  const totalFrames = TOTAL_PHYSICAL_MEMORY_KB / pageSizeKB;
  const reservedIndices = new Set(RESERVED_FRAMES_MAP[pageSizeKB]);
  const frames: FrameItem[] = [];

  for (let f = 0; f < totalFrames; f++) {
    const isReserved = reservedIndices.has(f);
    frames.push({
      frameIndex: f,
      isReserved,
      reservedLabel: isReserved ? "OMNI_SYS" : undefined,
      mappedPage: null,
    });
  }

  return frames;
}

/**
 * 3. Menghitung dan memvalidasi translasi Logical Address ke Physical Address.
 * Rumus:
 * Page Number = Math.floor(Logical Address / Page Size)
 * Offset = Logical Address % Page Size
 * Physical Address = (Frame Number * Page Size) + Offset
 */
export function calculateExpectedPhysicalAddress(
  pageSizeKB: PageSizeMode,
  frames: FrameItem[],
  challenge: TranslationChallenge,
  userEnteredAddress?: number
): TranslationResult {
  const pageIndex = Math.floor(challenge.logicalAddressKB / pageSizeKB);
  const offsetKB = challenge.logicalAddressKB % pageSizeKB;

  // Temukan frame yang menampung page bersangkutan
  const targetPageId = `${challenge.processId}-P${pageIndex}`;
  const mappedFrame = frames.find((f) => f.mappedPage?.id === targetPageId);

  if (!mappedFrame) {
    return {
      isValid: false,
      pageIndex,
      offsetKB,
      frameIndex: null,
      expectedPhysicalAddressKB: null,
      userAddressKB: userEnteredAddress ?? 0,
      isCorrect: false,
      message: `Page ${pageIndex} dari Proses ${challenge.processId} belum dipetakan ke dalam Frame fisik.`,
    };
  }

  const frameIndex = mappedFrame.frameIndex;
  const expectedPhysicalAddressKB = frameIndex * pageSizeKB + offsetKB;
  const isCorrect = userEnteredAddress !== undefined && userEnteredAddress === expectedPhysicalAddressKB;

  let message = "";
  if (isCorrect) {
    message = `OTENTIKASI BERHASIL! Page ${pageIndex} berada di Frame ${frameIndex}. Physical Address = (${frameIndex} × ${pageSizeKB}) + ${offsetKB} = ${expectedPhysicalAddressKB} KB.`;
  } else if (userEnteredAddress !== undefined) {
    message = `ALAMAT FISIK SALAH! Page ${pageIndex} dari Proses ${challenge.processId} saat ini berada di Frame ${frameIndex}. Dengan Offset ${offsetKB} KB, Physical Address seharusnya = (${frameIndex} × ${pageSizeKB}) + ${offsetKB} = ${expectedPhysicalAddressKB} KB.`;
  }

  return {
    isValid: true,
    pageIndex,
    offsetKB,
    frameIndex,
    expectedPhysicalAddressKB,
    userAddressKB: userEnteredAddress ?? 0,
    isCorrect,
    message,
  };
}

/**
 * 4. Komparasi Metrik Kinerja Akademis untuk 3 Mode Ukuran Page.
 * Mengembalikan metrik jumlah entri Page Table, Fragmentasi Internal, dan Efisiensi.
 */
export function getAllPagingMetrics(): PagingMetricComparison[] {
  const modes: PageSizeMode[] = [2, 4, 8];
  const actualUsedMemoryKB = PROCESSES.reduce((sum, p) => sum + p.sizeKB, 0); // 9 + 5 = 14 KB

  return modes.map((mode) => {
    const pages = generatePagesForProcesses(PROCESSES, mode);
    const totalFrames = TOTAL_PHYSICAL_MEMORY_KB / mode;
    const reservedFrames = RESERVED_FRAMES_MAP[mode].length;
    const totalPages = pages.length;

    const processAPages = pages.filter((p) => p.processId === "A").length;
    const processBPages = pages.filter((p) => p.processId === "B").length;

    const totalInternalFragKB = pages.reduce((sum, p) => sum + p.internalFragKB, 0);
    const allocatedMemoryKB = totalPages * mode;
    const efficiencyPercentage = Number(
      ((actualUsedMemoryKB / allocatedMemoryKB) * 100).toFixed(1)
    );

    let overheadRating: "Tinggi" | "Sedang" | "Rendah" = "Sedang";
    if (mode === 2) overheadRating = "Tinggi"; // 8 baris tabel
    if (mode === 8) overheadRating = "Rendah"; // 3 baris tabel

    let fragRating: "Rendah" | "Sedang" | "Tinggi" = "Sedang";
    if (mode === 2) fragRating = "Rendah"; // 2 KB frag
    if (mode === 8) fragRating = "Tinggi"; // 10 KB frag

    return {
      pageSizeKB: mode,
      totalFrames,
      reservedFrames,
      totalPages,
      processAPages,
      processBPages,
      totalInternalFragKB,
      allocatedMemoryKB,
      actualUsedMemoryKB,
      efficiencyPercentage,
      overheadRating,
      fragRating,
    };
  });
}

/**
 * Helper untuk auto-mapping: menempatkan semua page yang belum dipetakan
 * ke frame fisik pertama yang kosong (tidak reserved).
 */
export function autoMapPagesToFrames(
  pages: PageItem[],
  frames: FrameItem[]
): FrameItem[] {
  const updatedFrames: FrameItem[] = frames.map((f) => ({
    ...f,
    mappedPage: f.mappedPage ? { ...f.mappedPage } : null,
  }));

  // Cari page yang belum ada di frames
  const mappedPageIds = new Set(
    updatedFrames.filter((f) => f.mappedPage !== null).map((f) => f.mappedPage!.id)
  );

  const unmappedPages = pages.filter((p) => !mappedPageIds.has(p.id));

  let pageIdx = 0;
  for (let f = 0; f < updatedFrames.length; f++) {
    if (pageIdx >= unmappedPages.length) break;

    // Jika frame kosong dan tidak reserved
    if (!updatedFrames[f].isReserved && updatedFrames[f].mappedPage === null) {
      updatedFrames[f].mappedPage = { ...unmappedPages[pageIdx] };
      pageIdx++;
    }
  }

  return updatedFrames;
}

