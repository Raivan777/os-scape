/**
 * Algoritma Deadlock dan Penanganannya (Deadlock & Handling Algorithms)
 * Stage 4: The Void Trap / The Deadlock Chamber
 *
 * Tiga Algoritma Utama:
 * 1. Banker's Safety Check Algorithm (Pengecekan Status Aman / Safe State)
 * 2. Banker's Resource-Request Algorithm (Evaluasi Permintaan Alokasi Sumber Daya)
 * 3. Deadlock Detection Algorithm (Deteksi Deadlock Multi-Resource & Skenario Dining Philosophers)
 */

export interface BankerSafetyStep {
  step: number;
  processIndex: number;
  processName: string;
  workBefore: number[];
  need: number[];
  allocation: number[];
  workAfter: number[];
  canAllocate: boolean;
  explanation: string;
  safeSequenceSoFar: number[];
}

export interface BankerSafetyResult {
  isSafe: boolean;
  safeSequence: number[];
  steps: BankerSafetyStep[];
  unfinishedProcesses: number[];
  finalWork: number[];
  summary: string;
}

export interface ResourceRequestResult {
  isValidRequest: boolean;
  canImmediatelyAllocate: boolean;
  decision: "GRANTED" | "WAIT_INSUFFICIENT" | "WAIT_UNSAFE" | "ERROR_EXCEED_NEED";
  processIndex: number;
  request: number[];
  message: string;
  detailedSteps: string[];
  tentativeState?: {
    available: number[];
    allocation: number[][];
    need: number[][];
  };
  safetyResult?: BankerSafetyResult;
}

export interface DeadlockDetectionStep {
  step: number;
  processIndex: number;
  processName: string;
  workBefore: number[];
  request: number[];
  allocation: number[];
  workAfter: number[];
  canFinish: boolean;
  explanation: string;
}

export interface DeadlockDetectionResult {
  hasDeadlock: boolean;
  deadlockedProcesses: number[];
  finishedProcesses: number[];
  steps: DeadlockDetectionStep[];
  summary: string;
}

export type PhilosopherState =
  | "THINKING"
  | "HUNGRY"
  | "HOLDING_ONE"
  | "EATING"
  | "DEADLOCKED";

export interface Philosopher {
  id: number;
  name: string;
  state: PhilosopherState;
  leftFork: number;
  rightFork: number;
  heldForks: number[];
  eatCount: number;
  waitingTicks: number;
}

export interface DiningPhilosophersSnapshot {
  philosophers: Philosopher[];
  forkOwners: (number | null)[]; // index philosopher yang sedang memegang fork, atau null
  hasDeadlock: boolean;
  explanation: string;
  activeStrategy: "NAIVE_DEADLOCK" | "ASYMMETRIC" | "RESOURCE_LIMITER" | "TIMEOUT_PREEMPTION";
}

// ─────────────────────────────────────────────────────────────
// 1. BANKER'S SAFETY CHECK ALGORITHM
// ─────────────────────────────────────────────────────────────

/**
 * Memeriksa apakah keadaan alokasi saat ini berada dalam kondisi aman (Safe State)
 * Menggunakan Work vector, Finish boolean array, dan mencari Safe Sequence.
 */
export function calculateBankerSafety(
  allocation: number[][],
  max: number[][],
  available: number[],
  processNames?: string[],
  resourceNames?: string[]
): BankerSafetyResult {
  const n = allocation.length; // jumlah proses
  const m = available.length; // jumlah jenis sumber daya

  const pNames = processNames || Array.from({ length: n }, (_, i) => `P${i}`);
  const rNames = resourceNames || Array.from({ length: m }, (_, j) => `R${j}`);

  // Hitung Need = Max - Allocation
  const need: number[][] = [];
  for (let i = 0; i < n; i++) {
    need[i] = [];
    for (let j = 0; j < m; j++) {
      need[i][j] = Math.max(0, max[i][j] - allocation[i][j]);
    }
  }

  // 1. Inisialisasi: Work = Available, Finish[i] = false
  const work: number[] = [...available];
  const finish: boolean[] = new Array(n).fill(false);
  const safeSequence: number[] = [];
  const steps: BankerSafetyStep[] = [];

  let foundProcessInRound = true;
  let stepNumber = 1;

  // 2. Loop pencarian proses yang dapat dipenuhi kebutuhannya: Need_i <= Work
  while (foundProcessInRound && safeSequence.length < n) {
    foundProcessInRound = false;

    for (let i = 0; i < n; i++) {
      if (!finish[i]) {
        // Cek apakah Need[i][j] <= Work[j] untuk semua j
        let canAllocate = true;
        for (let j = 0; j < m; j++) {
          if (need[i][j] > work[j]) {
            canAllocate = false;
            break;
          }
        }

        const workBefore = [...work];

        if (canAllocate) {
          // Proses ini dapat selesai dan mengembalikan alokasinya ke Work
          for (let j = 0; j < m; j++) {
            work[j] += allocation[i][j];
          }
          finish[i] = true;
          safeSequence.push(i);
          foundProcessInRound = true;

          const needStr = need[i].map((v, idx) => `${v}${rNames[idx]}`).join(", ");
          const allocStr = allocation[i].map((v, idx) => `${v}${rNames[idx]}`).join(", ");
          const workBeforeStr = workBefore.map((v, idx) => `${v}${rNames[idx]}`).join(", ");
          const workAfterStr = work.map((v, idx) => `${v}${rNames[idx]}`).join(", ");

          steps.push({
            step: stepNumber++,
            processIndex: i,
            processName: pNames[i],
            workBefore,
            need: [...need[i]],
            allocation: [...allocation[i]],
            workAfter: [...work],
            canAllocate: true,
            explanation: `${pNames[i]} membutuhkan [${needStr}] <= Work saat ini [${workBeforeStr}]. Kebutuhan terpenuhi! ${pNames[i]} menyelesaikan tugasnya dan mengembalikan alokasi [${allocStr}]. Work baru: [${workAfterStr}].`,
            safeSequenceSoFar: [...safeSequence],
          });
        }
      }
    }
  }

  const isSafe = safeSequence.length === n;
  const unfinishedProcesses: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!finish[i]) {
      unfinishedProcesses.push(i);
    }
  }

  let summary = "";
  if (isSafe) {
    const seqStr = safeSequence.map((idx) => pNames[idx]).join(" ➔ ");
    summary = `Sistem berada dalam KONDISI AMAN (Safe State)! Ditemukan urutan eksekusi aman: < ${seqStr} >. Tidak ada risiko deadlock.`;
  } else {
    const unfinishedStr = unfinishedProcesses.map((idx) => pNames[idx]).join(", ");
    summary = `Sistem berada dalam KONDISI TIDAK AMAN (Unsafe State)! Proses yang macet: [ ${unfinishedStr} ]. Sumber daya tidak mencukupi untuk menjamin penyelesaian semua proses tanpa risiko deadlock.`;
  }

  return {
    isSafe,
    safeSequence,
    steps,
    unfinishedProcesses,
    finalWork: work,
    summary,
  };
}

// ─────────────────────────────────────────────────────────────
// 2. BANKER'S RESOURCE-REQUEST ALGORITHM
// ─────────────────────────────────────────────────────────────

/**
 * Mengevaluasi permintaan sumber daya dari suatu proses.
 * Apakah permintaan boleh langsung diberikan (GRANT), atau proses harus menunggu (WAIT),
 * atau permintaan tidak sah karena melebihi batas maksimum (ERROR).
 */
export function evaluateResourceRequest(
  allocation: number[][],
  max: number[][],
  available: number[],
  processIndex: number,
  request: number[],
  processNames?: string[],
  resourceNames?: string[]
): ResourceRequestResult {
  const n = allocation.length;
  const m = available.length;
  const pNames = processNames || Array.from({ length: n }, (_, i) => `P${i}`);
  const rNames = resourceNames || Array.from({ length: m }, (_, j) => `R${j}`);

  const pName = pNames[processIndex] || `P${processIndex}`;
  const reqStr = request.map((v, idx) => `${v} ${rNames[idx]}`).join(", ");
  const detailedSteps: string[] = [];

  // Hitung Need saat ini
  const currentNeed: number[] = [];
  for (let j = 0; j < m; j++) {
    currentNeed[j] = Math.max(0, max[processIndex][j] - allocation[processIndex][j]);
  }
  const needStr = currentNeed.map((v, idx) => `${v} ${rNames[idx]}`).join(", ");
  const availStr = available.map((v, idx) => `${v} ${rNames[idx]}`).join(", ");

  detailedSteps.push(
    `[Langkah 0] ${pName} mengajukan permintaan sumber daya: [ ${reqStr} ].`
  );

  // Langkah 1: Cek apakah Request <= Need
  for (let j = 0; j < m; j++) {
    if (request[j] > currentNeed[j]) {
      const msg = `Permintaan DITOLAK! ${pName} meminta ${request[j]} unit ${rNames[j]}, melebihi sisa kebutuhan maksimumnya (${currentNeed[j]} unit ${rNames[j]}).`;
      detailedSteps.push(`[Langkah 1 Gagal] Request [${reqStr}] > Need [${needStr}]. Proses melanggar batas klaim maksimum!`);
      return {
        isValidRequest: false,
        canImmediatelyAllocate: false,
        decision: "ERROR_EXCEED_NEED",
        processIndex,
        request,
        message: msg,
        detailedSteps,
      };
    }
  }
  detailedSteps.push(
    `[Langkah 1 Lolos] Request [${reqStr}] <= Need [${needStr}]. Permintaan sah dalam batas maksimum.`
  );

  // Langkah 2: Cek apakah Request <= Available
  for (let j = 0; j < m; j++) {
    if (request[j] > available[j]) {
      const msg = `${pName} HARUS MENUNGGU! Permintaan [${reqStr}] melebihi sumber daya yang tersedia di sistem [${availStr}].`;
      detailedSteps.push(`[Langkah 2 Gagal] Request [${reqStr}] > Available [${availStr}]. Sumber daya bebas tidak mencukupi saat ini.`);
      return {
        isValidRequest: true,
        canImmediatelyAllocate: false,
        decision: "WAIT_INSUFFICIENT",
        processIndex,
        request,
        message: msg,
        detailedSteps,
      };
    }
  }
  detailedSteps.push(
    `[Langkah 2 Lolos] Request [${reqStr}] <= Available [${availStr}]. Sumber daya mencukupi untuk dialokasikan sementara.`
  );

  // Langkah 3: Alokasi Tentatif (Simulasi Uji Coba)
  detailedSteps.push(
    `[Langkah 3: Alokasi Percobaan] Mengurangi Available dan menambah Allocation sementara untuk diuji keamanannya.`
  );

  const tentativeAvailable = [...available];
  const tentativeAllocation = allocation.map((row) => [...row]);
  const tentativeMax = max.map((row) => [...row]);
  const tentativeNeed = allocation.map((row, i) =>
    row.map((val, j) => Math.max(0, max[i][j] - val))
  );

  for (let j = 0; j < m; j++) {
    tentativeAvailable[j] -= request[j];
    tentativeAllocation[processIndex][j] += request[j];
    tentativeNeed[processIndex][j] -= request[j];
  }

  // Langkah 4: Uji Keselamatan (Banker's Safety Test) pada status tentatif
  detailedSteps.push(
    `[Langkah 4: Banker's Safety Test] Menjalankan algoritma keselamatan pada keadaan baru...`
  );
  const safetyResult = calculateBankerSafety(
    tentativeAllocation,
    tentativeMax,
    tentativeAvailable,
    pNames,
    rNames
  );

  if (safetyResult.isSafe) {
    const seqStr = safetyResult.safeSequence.map((i) => pNames[i]).join(" ➔ ");
    const msg = `Permintaan DISETUJUI (Granted)! Alokasi aman untuk diberikan kepada ${pName}. Ditemukan urutan keselamatan: < ${seqStr} >.`;
    detailedSteps.push(
      `[Kesimpulan] SISTEM TETAP AMAN (Safe State). Permintaan resmi disahkan dan dialokasikan ke ${pName}!`
    );
    return {
      isValidRequest: true,
      canImmediatelyAllocate: true,
      decision: "GRANTED",
      processIndex,
      request,
      message: msg,
      detailedSteps,
      tentativeState: {
        available: tentativeAvailable,
        allocation: tentativeAllocation,
        need: tentativeNeed,
      },
      safetyResult,
    };
  } else {
    const msg = `Permintaan DITANGGUHKAN / DITOLAK (Wait)! Memberikan [${reqStr}] kepada ${pName} akan menjerumuskan sistem ke KONDISI TIDAK AMAN (Unsafe State / Deadlock Trap). Alokasi dibatalkan (Rollback) dan ${pName} harus menunggu.`;
    detailedSteps.push(
      `[Kesimpulan Bahaya] SISTEM TIDAK AMAN! Jika dialokasikan sekarang, sistem berisiko macet permanen (Deadlock). Status dikembalikan (Rollback) ke semula!`
    );
    return {
      isValidRequest: true,
      canImmediatelyAllocate: false,
      decision: "WAIT_UNSAFE",
      processIndex,
      request,
      message: msg,
      detailedSteps,
      tentativeState: {
        available: tentativeAvailable,
        allocation: tentativeAllocation,
        need: tentativeNeed,
      },
      safetyResult,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 3. DEADLOCK DETECTION ALGORITHM (MULTI-RESOURCE)
// ─────────────────────────────────────────────────────────────

/**
 * Mendeteksi apakah sistem yang sedang berjalan saat ini telah mengalami Deadlock.
 * Berbeda dari Banker (yang menghindari), algoritma ini mendeteksi setelah request terjadi.
 */
export function detectDeadlock(
  allocation: number[][],
  request: number[][],
  available: number[],
  processNames?: string[],
  resourceNames?: string[]
): DeadlockDetectionResult {
  const n = allocation.length;
  const m = available.length;
  const pNames = processNames || Array.from({ length: n }, (_, i) => `P${i}`);
  const rNames = resourceNames || Array.from({ length: m }, (_, j) => `R${j}`);

  // 1. Inisialisasi: Work = Available
  const work = [...available];
  const finish: boolean[] = new Array(n).fill(false);
  const steps: DeadlockDetectionStep[] = [];

  // Jika suatu proses tidak memiliki alokasi apapun (allocation[i] == 0),
  // proses tersebut tidak memegang sumber daya sehingga Finish[i] = true
  for (let i = 0; i < n; i++) {
    const holdsNothing = allocation[i].every((val) => val === 0);
    if (holdsNothing) {
      finish[i] = true;
    }
  }

  let found = true;
  let stepNumber = 1;

  while (found) {
    found = false;
    for (let i = 0; i < n; i++) {
      if (!finish[i]) {
        // Cek apakah Request[i][j] <= Work[j]
        let canFinish = true;
        for (let j = 0; j < m; j++) {
          if (request[i][j] > work[j]) {
            canFinish = false;
            break;
          }
        }

        if (canFinish) {
          const workBefore = [...work];
          for (let j = 0; j < m; j++) {
            work[j] += allocation[i][j];
          }
          finish[i] = true;
          found = true;

          const reqStr = request[i].map((v, idx) => `${v}${rNames[idx]}`).join(", ");
          const allocStr = allocation[i].map((v, idx) => `${v}${rNames[idx]}`).join(", ");
          const workBeforeStr = workBefore.map((v, idx) => `${v}${rNames[idx]}`).join(", ");
          const workAfterStr = work.map((v, idx) => `${v}${rNames[idx]}`).join(", ");

          steps.push({
            step: stepNumber++,
            processIndex: i,
            processName: pNames[i],
            workBefore,
            request: [...request[i]],
            allocation: [...allocation[i]],
            workAfter: [...work],
            canFinish: true,
            explanation: `${pNames[i]} meminta [${reqStr}] <= Work [${workBeforeStr}]. Permintaan dapat dipenuhi! ${pNames[i]} selesai dan melepas alokasi [${allocStr}]. Work bertambah menjadi [${workAfterStr}].`,
          });
        }
      }
    }
  }

  const deadlockedProcesses: number[] = [];
  const finishedProcesses: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!finish[i]) {
      deadlockedProcesses.push(i);
    } else {
      finishedProcesses.push(i);
    }
  }

  const hasDeadlock = deadlockedProcesses.length > 0;
  let summary = "";
  if (hasDeadlock) {
    const deadStr = deadlockedProcesses.map((idx) => pNames[idx]).join(", ");
    summary = `DEADLOCK TERDETEKSI! Proses ${deadStr} saling mengunci dan tidak pernah dapat menyelesaikan eksekusinya karena tidak ada cukup sumber daya bebas!`;
  } else {
    summary = `TIDAK ADA DEADLOCK! Semua proses dapat menyelesaikan eksekusi mereka secara berurutan.`;
  }

  return {
    hasDeadlock,
    deadlockedProcesses,
    finishedProcesses,
    steps,
    summary,
  };
}

// ─────────────────────────────────────────────────────────────
// 4. DINING PHILOSOPHERS SIMULATION ENGINE
// ─────────────────────────────────────────────────────────────

export const DEFAULT_PHILOSOPHER_NAMES = [
  "Alien Zen (P0)",
  "Alien Plato (P1)",
  "Alien Gauss (P2)",
  "Alien Turing (P3)",
  "Alien Dijkstra (P4)",
];

/**
 * Membuat state awal 5 filsuf alien dan 5 garpu/selang plasma
 */
export function createInitialDiningState(
  strategy: "NAIVE_DEADLOCK" | "ASYMMETRIC" | "RESOURCE_LIMITER" | "TIMEOUT_PREEMPTION" = "NAIVE_DEADLOCK"
): DiningPhilosophersSnapshot {
  const philosophers: Philosopher[] = DEFAULT_PHILOSOPHER_NAMES.map((name, i) => ({
    id: i,
    name,
    state: "THINKING",
    leftFork: i,
    rightFork: (i + 1) % 5,
    heldForks: [],
    eatCount: 0,
    waitingTicks: 0,
  }));

  const forkOwners: (number | null)[] = [null, null, null, null, null];

  return {
    philosophers,
    forkOwners,
    hasDeadlock: false,
    explanation: "Semua filsuf alien sedang bermeditasi (THINKING). Garpu selang energi di atas meja bebas.",
    activeStrategy: strategy,
  };
}

/**
 * Memicu kondisi deadlock instan: semua 5 filsuf serentak lapar dan mengambil garpu kiri mereka
 * Mengilustrasikan Circular Wait, Hold-and-Wait, Mutual Exclusion, & No Preemption!
 */
export function triggerDeadlockScenario(
  current: DiningPhilosophersSnapshot
): DiningPhilosophersSnapshot {
  const philosophers: Philosopher[] = current.philosophers.map((p) => {
    return {
      ...p,
      state: "DEADLOCKED" as PhilosopherState,
      heldForks: [p.leftFork],
      waitingTicks: 5,
    };
  });

  // Semua garpu kiri dipegang oleh masing-masing filsuf (garpu 0 oleh P0, garpu 1 oleh P1, ...)
  const forkOwners: (number | null)[] = [0, 1, 2, 3, 4];

  return {
    philosophers,
    forkOwners,
    hasDeadlock: true,
    explanation:
      "KONDISI DEADLOCK KOPLIT! Kelima filsuf serentak mengambil garpu kiri mereka masing-masing. Saat mencoba mengambil garpu kanan, garpu tersebut sedang dipegang oleh tetangganya! Terjadi CIRCULAR WAIT (P0 menunggu P1, P1 menunggu P2, ..., P4 menunggu P0). Tidak ada yang bisa makan!",
    activeStrategy: "NAIVE_DEADLOCK",
  };
}

/**
 * Melangkah satu tick dalam simulasi Dining Philosophers dengan strategi tertentu
 */
export function stepDiningSimulation(
  current: DiningPhilosophersSnapshot,
  strategy: "NAIVE_DEADLOCK" | "ASYMMETRIC" | "RESOURCE_LIMITER" | "TIMEOUT_PREEMPTION"
): DiningPhilosophersSnapshot {
  // Jika sedang deadlock pada naive mode dan tidak ganti strategi, tetap deadlock
  if (current.hasDeadlock && strategy === "NAIVE_DEADLOCK") {
    return {
      ...current,
      explanation: "Sistem masih terkunci dalam Deadlock! Pilih solusi (Asymmetric / Limiter / Timeout) untuk memecahkan deadlock.",
    };
  }

  const philosophers = current.philosophers.map((p) => ({
    ...p,
    heldForks: [...p.heldForks],
  }));
  const forkOwners = [...current.forkOwners];
  const logs: string[] = [];

  // Strategi 1: Naive (rentan deadlock jika semua lapar serentak)
  if (strategy === "NAIVE_DEADLOCK") {
    // Jalankan siklus acak biasa
    for (let i = 0; i < 5; i++) {
      const p = philosophers[i];

      if (p.state === "DEADLOCKED") {
        p.state = "HUNGRY";
      }

      if (p.state === "THINKING") {
        if (Math.random() < 0.6) {
          p.state = "HUNGRY";
          logs.push(`${p.name} mulai lapar (HUNGRY).`);
        }
      } else if (p.state === "HUNGRY") {
        if (forkOwners[p.leftFork] === null) {
          forkOwners[p.leftFork] = p.id;
          p.heldForks.push(p.leftFork);
          p.state = "HOLDING_ONE";
          logs.push(`${p.name} mengambil garpu kiri #${p.leftFork}.`);
        } else {
          p.waitingTicks++;
        }
      } else if (p.state === "HOLDING_ONE") {
        if (forkOwners[p.rightFork] === null) {
          forkOwners[p.rightFork] = p.id;
          p.heldForks.push(p.rightFork);
          p.state = "EATING";
          p.waitingTicks = 0;
          logs.push(`${p.name} berhasil mengambil garpu kanan #${p.rightFork} dan mulai MAKAN (EATING)!`);
        } else {
          p.waitingTicks++;
        }
      } else if (p.state === "EATING") {
        forkOwners[p.leftFork] = null;
        forkOwners[p.rightFork] = null;
        p.heldForks = [];
        p.eatCount++;
        p.state = "THINKING";
        logs.push(`${p.name} selesai makan, melepas garpu #${p.leftFork} & #${p.rightFork}, lalu kembali THINKING.`);
      }
    }

    const allHoldingOne = philosophers.every((p) => p.heldForks.length === 1);
    const hasDeadlock = allHoldingOne;
    if (hasDeadlock) {
      philosophers.forEach((p) => (p.state = "DEADLOCKED"));
      logs.push("SEMUA FILSUF MEMEGANG 1 GARPU! DEADLOCK TERBENTUK!");
    }

    return {
      philosophers,
      forkOwners,
      hasDeadlock,
      explanation: logs.length > 0 ? logs.join(" | ") : "Simulasi berlangsung stabil.",
      activeStrategy: strategy,
    };
  }

  // Strategi 2: Solusi Asimetris (Ganjil ambil Kiri dulu, Genap ambil Kanan dulu)
  if (strategy === "ASYMMETRIC") {
    for (let i = 0; i < 5; i++) {
      const p = philosophers[i];
      const isEven = p.id % 2 === 0;
      const firstFork = isEven ? p.rightFork : p.leftFork;
      const secondFork = isEven ? p.leftFork : p.rightFork;

      if (p.state === "DEADLOCKED") p.state = "HUNGRY";

      if (p.state === "THINKING") {
        if (Math.random() < 0.7) {
          p.state = "HUNGRY";
          logs.push(`${p.name} lapar.`);
        }
      } else if (p.state === "HUNGRY") {
        if (forkOwners[firstFork] === null) {
          forkOwners[firstFork] = p.id;
          p.heldForks.push(firstFork);
          p.state = "HOLDING_ONE";
          logs.push(`${p.name} (ID genap/ganjil) mengambil garpu pertama #${firstFork}.`);
        }
      } else if (p.state === "HOLDING_ONE") {
        if (forkOwners[secondFork] === null) {
          forkOwners[secondFork] = p.id;
          p.heldForks.push(secondFork);
          p.state = "EATING";
          logs.push(`${p.name} mengambil garpu kedua #${secondFork} dan MAKAN.`);
        }
      } else if (p.state === "EATING") {
        forkOwners[p.leftFork] = null;
        forkOwners[p.rightFork] = null;
        p.heldForks = [];
        p.eatCount++;
        p.state = "THINKING";
        logs.push(`${p.name} kenyang dan melepas kedua garpu.`);
      }
    }

    return {
      philosophers,
      forkOwners,
      hasDeadlock: false,
      explanation: "Solusi Asimetris Aktif: Siklus Circular Wait dipatahkan secara matematis karena filsuf genap & ganjil mengambil garpu dengan prioritas berlawanan. Deadlock mustahil terjadi!",
      activeStrategy: strategy,
    };
  }

  // Strategi 3: Resource Limiter / Semaphore Max 4
  if (strategy === "RESOURCE_LIMITER") {
    const activeContenders = philosophers.filter(
      (p) => p.state === "HOLDING_ONE" || p.state === "EATING"
    ).length;

    for (let i = 0; i < 5; i++) {
      const p = philosophers[i];
      if (p.state === "DEADLOCKED") p.state = "HUNGRY";

      if (p.state === "THINKING") {
        if (Math.random() < 0.7) p.state = "HUNGRY";
      } else if (p.state === "HUNGRY") {
        if (activeContenders < 4 && forkOwners[p.leftFork] === null) {
          forkOwners[p.leftFork] = p.id;
          p.heldForks.push(p.leftFork);
          p.state = "HOLDING_ONE";
          logs.push(`${p.name} diizinkan masuk ke meja makan (kuota < 4) dan mengambil garpu #${p.leftFork}.`);
        }
      } else if (p.state === "HOLDING_ONE") {
        if (forkOwners[p.rightFork] === null) {
          forkOwners[p.rightFork] = p.id;
          p.heldForks.push(p.rightFork);
          p.state = "EATING";
          logs.push(`${p.name} melengkapi garpu #${p.rightFork} dan mulai MAKAN.`);
        }
      } else if (p.state === "EATING") {
        forkOwners[p.leftFork] = null;
        forkOwners[p.rightFork] = null;
        p.heldForks = [];
        p.eatCount++;
        p.state = "THINKING";
      }
    }

    return {
      philosophers,
      forkOwners,
      hasDeadlock: false,
      explanation: "Solusi Semaphore / Limiter Aktif: Meja dibatasi maksimal 4 filsuf yang boleh berebut sumber daya. Dijamin selalu ada minimal 1 filsuf yang mendapatkan kedua garpu!",
      activeStrategy: strategy,
    };
  }

  // Strategi 4: Timeout & Preemption
  if (strategy === "TIMEOUT_PREEMPTION") {
    for (let i = 0; i < 5; i++) {
      const p = philosophers[i];
      if (p.state === "DEADLOCKED") p.state = "HUNGRY";

      if (p.state === "THINKING") {
        p.waitingTicks = 0;
        if (Math.random() < 0.6) p.state = "HUNGRY";
      } else if (p.state === "HUNGRY") {
        if (forkOwners[p.leftFork] === null) {
          forkOwners[p.leftFork] = p.id;
          p.heldForks.push(p.leftFork);
          p.state = "HOLDING_ONE";
          p.waitingTicks = 0;
        }
      } else if (p.state === "HOLDING_ONE") {
        p.waitingTicks++;
        if (forkOwners[p.rightFork] === null) {
          forkOwners[p.rightFork] = p.id;
          p.heldForks.push(p.rightFork);
          p.state = "EATING";
          p.waitingTicks = 0;
        } else if (p.waitingTicks >= 2) {
          forkOwners[p.leftFork] = null;
          p.heldForks = [];
          p.state = "THINKING";
          p.waitingTicks = 0;
          logs.push(`${p.name} mengalami Timeout! Garpu kiri #${p.leftFork} dilepaskan untuk memecahkan Hold-and-Wait.`);
        }
      } else if (p.state === "EATING") {
        forkOwners[p.leftFork] = null;
        forkOwners[p.rightFork] = null;
        p.heldForks = [];
        p.eatCount++;
        p.state = "THINKING";
      }
    }

    return {
      philosophers,
      forkOwners,
      hasDeadlock: false,
      explanation: "Solusi Timeout & Preemption Aktif: Filsuf yang gagal mendapatkan garpu kedua dalam batas waktu wajib melepaskan garpu pertama (No Preemption dilanggar secara sengaja untuk mencegah deadlock).",
      activeStrategy: strategy,
    };
  }

  return current;
}

