/**
 * Algoritma Penjadwalan Head Disk (Disk Scheduling Algorithms)
 * Stage 5: Pengembang Inti Storage dan Disk
 *
 * Tiga Algoritma Utama:
 * 1. FCFS (First-Come First-Served)
 * 2. SSTF (Shortest Seek Time First)
 * 3. SCAN (Elevator Algorithm)
 */

export interface DiskStep {
  from: number;
  to: number;
  distance: number;
  direction?: "up" | "down" | "stationary";
}

export interface DiskAlgorithmResult {
  algorithm: string;
  sequence: number[]; // Urutan silinder yang dikunjungi (dimulai dari initialHead)
  steps: DiskStep[];
  totalSeekDistance: number;
  averageSeekDistance: number;
  description: string;
}

/**
 * 1. FCFS (First-Come First-Served Disk Scheduling)
 * Melayani antrean request silinder tepat sesuai urutan kedatangan.
 */
export function calculateFCFS(
  requests: number[],
  initialHead: number
): DiskAlgorithmResult {
  const sequence: number[] = [initialHead, ...requests];
  const steps: DiskStep[] = [];
  let totalSeekDistance = 0;

  for (let i = 0; i < requests.length; i++) {
    const from = sequence[i];
    const to = sequence[i + 1];
    const distance = Math.abs(to - from);
    const direction = to > from ? "up" : to < from ? "down" : "stationary";

    steps.push({ from, to, distance, direction });
    totalSeekDistance += distance;
  }

  const averageSeekDistance =
    requests.length > 0 ? Number((totalSeekDistance / requests.length).toFixed(2)) : 0;

  return {
    algorithm: "FCFS (First-Come First-Served)",
    sequence,
    steps,
    totalSeekDistance,
    averageSeekDistance,
    description:
      "Melayani permintaan persis sesuai urutan kedatangan tanpa reorganisasi. Sangat adil tetapi sering kali menghasilkan gerakan head bolak-balik yang boros (seek time tinggi).",
  };
}

/**
 * 2. SSTF (Shortest Seek Time First)
 * Memilih request silinder yang paling dekat dengan posisi head saat ini.
 */
export function calculateSSTF(
  requests: number[],
  initialHead: number
): DiskAlgorithmResult {
  const pending = [...requests];
  const sequence: number[] = [initialHead];
  const steps: DiskStep[] = [];
  let currentHead = initialHead;
  let totalSeekDistance = 0;

  while (pending.length > 0) {
    let nearestIdx = 0;
    let minDistance = Math.abs(pending[0] - currentHead);

    for (let i = 1; i < pending.length; i++) {
      const dist = Math.abs(pending[i] - currentHead);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    const nextCylinder = pending.splice(nearestIdx, 1)[0];
    const distance = minDistance;
    const direction =
      nextCylinder > currentHead ? "up" : nextCylinder < currentHead ? "down" : "stationary";

    steps.push({
      from: currentHead,
      to: nextCylinder,
      distance,
      direction,
    });

    totalSeekDistance += distance;
    sequence.push(nextCylinder);
    currentHead = nextCylinder;
  }

  const averageSeekDistance =
    requests.length > 0 ? Number((totalSeekDistance / requests.length).toFixed(2)) : 0;

  return {
    algorithm: "SSTF (Shortest Seek Time First)",
    sequence,
    steps,
    totalSeekDistance,
    averageSeekDistance,
    description:
      "Memprioritaskan silinder terdekat dari posisi head saat ini untuk meminimalkan seek time. Sangat efisien, namun rentan menyebabkan starvation pada silinder yang jauh.",
  };
}

/**
 * 3. SCAN (Elevator Algorithm)
 * Head disk bergerak dalam satu arah melayani silinder di jalurnya hingga batas disk,
 * lalu membalik arah untuk melayani sisa silinder di arah berlawanan.
 */
export function calculateSCAN(
  requests: number[],
  initialHead: number,
  diskSize: number = 200,
  direction: "up" | "down" = "up"
): DiskAlgorithmResult {
  if (requests.length === 0) {
    return {
      algorithm: "SCAN (Elevator)",
      sequence: [initialHead],
      steps: [],
      totalSeekDistance: 0,
      averageSeekDistance: 0,
      description: "Tidak ada antrean request.",
    };
  }

  const maxCylinder = diskSize - 1; // e.g. 199 jika diskSize = 200
  const minCylinder = 0;

  const left = requests.filter((r) => r < initialHead).sort((a, b) => a - b);
  const right = requests.filter((r) => r >= initialHead).sort((a, b) => a - b);

  const visitOrder: number[] = [];

  if (direction === "up") {
    // Bergerak ke kanan / atas hingga ujung jika masih ada di kiri
    visitOrder.push(...right);
    if (left.length > 0) {
      if (!right.includes(maxCylinder)) {
        visitOrder.push(maxCylinder); // Sentuh batas disk atas
      }
      // Berbalik arah ke kiri
      visitOrder.push(...left.reverse());
    }
  } else {
    // Bergerak ke kiri / bawah hingga ujung 0 jika masih ada di kanan
    visitOrder.push(...left.reverse());
    if (right.length > 0) {
      if (!left.includes(minCylinder)) {
        visitOrder.push(minCylinder); // Sentuh batas disk bawah
      }
      // Berbalik arah ke kanan
      visitOrder.push(...right);
    }
  }

  const sequence: number[] = [initialHead, ...visitOrder];
  const steps: DiskStep[] = [];
  let totalSeekDistance = 0;

  for (let i = 0; i < visitOrder.length; i++) {
    const from = sequence[i];
    const to = sequence[i + 1];
    const distance = Math.abs(to - from);
    const dir = to > from ? "up" : to < from ? "down" : "stationary";

    steps.push({ from, to, distance, direction: dir });
    totalSeekDistance += distance;
  }

  const averageSeekDistance =
    requests.length > 0 ? Number((totalSeekDistance / requests.length).toFixed(2)) : 0;

  return {
    algorithm: "SCAN (Elevator)",
    sequence,
    steps,
    totalSeekDistance,
    averageSeekDistance,
    description:
      "Bekerja seperti lift gedung: bergerak ke satu arah melayani semua silinder di depannya sampai tepi disk, lalu berbalik arah. Mencegah starvation dan memberikan waktu tunggu yang terprediksi.",
  };
}

/**
 * Membandingkan ketiga algoritma secara serentak
 */
export function compareAllDiskAlgorithms(
  requests: number[],
  initialHead: number,
  diskSize: number = 200,
  scanDirection: "up" | "down" = "up"
) {
  const fcfs = calculateFCFS(requests, initialHead);
  const sstf = calculateSSTF(requests, initialHead);
  const scan = calculateSCAN(requests, initialHead, diskSize, scanDirection);

  return { fcfs, sstf, scan };
}

