/**
 * utils/directoryLogic.ts
 *
 * Logika Murni Simulasi Struktur dan Organisasi Direktori Sistem Operasi
 * Stage 5: Struktur dan Organisasi Direktori
 *
 * Mengimplementasikan perbandingan pencarian pada 3 struktur direktori:
 * 1. Single-Level Directory (Datar/Flat, rentan Name Collision)
 * 2. Two-Level Directory (MFD & UFD, isolasi per pengguna)
 * 3. Tree-Structured Directory (Hierarki pohon modern, arbitrary depth)
 */

export type Owner = "alpha" | "beta" | "system";
export type StructureId = "single" | "two-level" | "tree";

export interface DirFile {
  name: string;
  owner: Owner;
  sub?: string;
}

export interface SearchStep {
  label: string;
  hit: boolean;
}

export interface SearchResult {
  structure: StructureId;
  steps: SearchStep[];
  found: boolean;
  depth: number;
  collisions: number;
  note: string;
}

// Daftar pemilik sistem
export const OWNERS: Owner[] = ["alpha", "beta", "system"];

// Direktori pangkal (Home Directory) untuk masing-masing pemilik
export const OWNER_HOME: Record<Owner, string> = {
  alpha: "/home/alpha",
  beta: "/home/beta",
  system: "/opt/station",
};

// Dataset bersama berisi 8 berkas sesuai spesifikasi
export const FILES: DirFile[] = [
  { name: "flight_log.txt", owner: "alpha" },
  { name: "keys.pem", owner: "alpha" },
  { name: "mission_plan.md", owner: "alpha", sub: "missions" },
  { name: "sensor_data.bin", owner: "beta" },
  { name: "flight_log.txt", owner: "beta" }, // Berkas bernama sama (duplikat), milik pengguna berbeda
  { name: "warp_drive.exe", owner: "system" },
  { name: "life_support.cfg", owner: "system" },
  { name: "core_dump.log", owner: "system" },
];

/**
 * 1. Single-Level Directory:
 * Semua berkas berada dalam satu daftar tunggal (namespace datar).
 * Berkas dengan nama duplikat (yang kedua dan seterusnya) ditolak saat pendaftaran
 * dan dihitung sebagai collision.
 * Pencarian bersifat linier: jika nama cocok tetapi pemilik berbeda,
 * pencarian dinyatakan gagal (found=false) dengan catatan tabrakan nama (name collision).
 */
export function searchSingle(name: string, owner: Owner): SearchResult {
  const steps: SearchStep[] = [];
  const singleEntries: DirFile[] = [];
  let collisions = 0;

  // Bangun tabel direktori tunggal: berkas duplikat ditolak
  for (const f of FILES) {
    const exists = singleEntries.some((e) => e.name === f.name);
    if (!exists) {
      singleEntries.push(f);
    } else {
      collisions++;
    }
  }

  let found = false;
  let note = "";

  for (const entry of singleEntries) {
    if (entry.name === name) {
      if (entry.owner === owner) {
        steps.push({
          label: `Periksa '${entry.name}' (pemilik: ${entry.owner}) → Cocok!`,
          hit: true,
        });
        found = true;
        note = `Berkas '${name}' milik '${owner}' berhasil ditemukan dalam Single-Level Directory.`;
      } else {
        steps.push({
          label: `Periksa '${entry.name}' (pemilik: ${entry.owner}) → Terjadi Name Collision dengan pemilik target '${owner}'!`,
          hit: false,
        });
        found = false;
        note = `Name collision: Berkas '${name}' milik '${owner}' ditolak/tidak dapat diakses karena nama tersebut telah dipakai oleh '${entry.owner}' pada direktori tunggal.`;
      }
      break;
    } else {
      steps.push({
        label: `Periksa '${entry.name}' (pemilik: ${entry.owner}) → Bukan target`,
        hit: false,
      });
    }
  }

  if (!found && !note) {
    note = `Berkas '${name}' milik '${owner}' tidak ditemukan dalam Single-Level Directory setelah menelusuri seluruh entri.`;
  }

  return {
    structure: "single",
    steps,
    found,
    depth: 1,
    collisions,
    note,
  };
}

/**
 * 2. Two-Level Directory:
 * Menggunakan Master File Directory (MFD) di tingkat 1 dan
 * User File Directory (UFD) di tingkat 2.
 * Langkah 1: Scan MFD (OWNERS) secara berurutan hingga pemilik target ditemukan.
 * Langkah 2: Scan UFD milik pengguna itu saja.
 * Depth selalu 2, collisions = 0 karena tiap pengguna memiliki namespace terisolasi.
 */
export function searchTwoLevel(name: string, owner: Owner): SearchResult {
  const steps: SearchStep[] = [];
  let found = false;

  // Langkah 1: Scan MFD sampai pemilik ditemukan
  for (const o of OWNERS) {
    if (o === owner) {
      steps.push({
        label: `Scan MFD: Periksa pengguna '${o}' → Ditemukan! Masuk ke UFD /${o}/`,
        hit: true,
      });
      break;
    } else {
      steps.push({
        label: `Scan MFD: Periksa pengguna '${o}' → Bukan pemilik target`,
        hit: false,
      });
    }
  }

  // Langkah 2: Scan UFD milik pengguna target saja
  const userFiles = FILES.filter((f) => f.owner === owner);

  for (const f of userFiles) {
    if (f.name === name) {
      steps.push({
        label: `Scan UFD /${owner}/: Periksa '${f.name}' → Cocok!`,
        hit: true,
      });
      found = true;
      break;
    } else {
      steps.push({
        label: `Scan UFD /${owner}/: Periksa '${f.name}' → Bukan target`,
        hit: false,
      });
    }
  }

  const note = found
    ? `Berkas '${name}' berhasil ditemukan di UFD /${owner}/ melalui MFD tanpa risiko tabrakan nama dengan pengguna lain.`
    : `Berkas '${name}' tidak ada di dalam UFD /${owner}/.`;

  return {
    structure: "two-level",
    steps,
    found,
    depth: 2,
    collisions: 0,
    note,
  };
}

/**
 * 3. Tree-Structured Directory:
 * Pohon hierarkis dibangun dari FILES.
 * Path direktori berkas = OWNER_HOME[owner] + ("/" + sub bila ada).
 * Jika berkas tidak ada di dataset, jalurnya mengarah ke OWNER_HOME[owner].
 * Penelusuran dilakukan komponen path demi komponen path (scan anak folder di tiap level),
 * lalu menelusuri berkas di folder tujuan.
 * Depth = jumlah komponen path + 1 (termasuk berkas itu sendiri).
 * Collisions = 0.
 */
export function searchTree(name: string, owner: Owner): SearchResult {
  const steps: SearchStep[] = [];

  // Cari apakah berkas ada di dataset FILES
  const existingFile = FILES.find((f) => f.name === name && f.owner === owner);

  // Tentukan path direktori tujuan
  const subPath = existingFile?.sub ? `/${existingFile.sub}` : "";
  const fullDirPath = OWNER_HOME[owner] + subPath;

  // Pecah komponen path (misal "/home/alpha/missions" -> ["home", "alpha", "missions"])
  const pathComponents = fullDirPath.split("/").filter(Boolean);
  const depth = pathComponents.length + 1;

  // Struktur pohon folder sesuai urutan dataset
  // Level 1: Root "/" memiliki anak ["home", "opt"]
  // Level 2 di dalam "/home": ["alpha", "beta"]
  // Level 2 di dalam "/opt": ["station"]
  // Level 3 di dalam "/home/alpha": folder ["missions"]
  const folderTree: Record<string, string[]> = {
    "/": ["home", "opt"],
    "/home": ["alpha", "beta"],
    "/opt": ["station"],
    "/home/alpha": ["missions"],
    "/home/beta": [],
    "/opt/station": [],
    "/home/alpha/missions": [],
  };

  // Kumpulan berkas di masing-masing direktori terminal
  const filesByDir: Record<string, string[]> = {
    "/home/alpha": ["flight_log.txt", "keys.pem"],
    "/home/alpha/missions": ["mission_plan.md"],
    "/home/beta": ["sensor_data.bin", "flight_log.txt"],
    "/opt/station": ["warp_drive.exe", "life_support.cfg", "core_dump.log"],
  };

  let currentPath = "";

  // Telusuri direktori per komponen
  for (let i = 0; i < pathComponents.length; i++) {
    const parentPath = i === 0 ? "/" : currentPath;
    const targetComp = pathComponents[i];
    const siblings = folderTree[parentPath] || [targetComp];

    for (const sib of siblings) {
      if (sib === targetComp) {
        steps.push({
          label: `Telusuri '${parentPath}': Temukan subdirektori '${sib}/' → Masuk`,
          hit: true,
        });
        break;
      } else {
        steps.push({
          label: `Telusuri '${parentPath}': Periksa subdirektori '${sib}/' → Lewati`,
          hit: false,
        });
      }
    }

    currentPath += `/${targetComp}`;
  }

  // Scan berkas di folder tujuan
  const targetDirFiles = filesByDir[fullDirPath] || [];
  let found = false;

  for (const fName of targetDirFiles) {
    if (fName === name) {
      steps.push({
        label: `Scan '${fullDirPath}/': Periksa berkas '${fName}' → Cocok!`,
        hit: true,
      });
      found = true;
      break;
    } else {
      steps.push({
        label: `Scan '${fullDirPath}/': Periksa berkas '${fName}' → Bukan target`,
        hit: false,
      });
    }
  }

  const note = found
    ? `Berkas '${name}' berhasil ditemukan pada path absolut '${fullDirPath}/${name}' (kedalaman level: ${depth}).`
    : `Berkas '${name}' tidak ditemukan di direktori '${fullDirPath}/'.`;

  return {
    structure: "tree",
    steps,
    found,
    depth,
    collisions: 0,
    note,
  };
}

/**
 * Menjalankan pencarian serentak pada ketiga struktur direktori untuk perbandingan metrik
 */
export function searchAll(name: string, owner: Owner): [SearchResult, SearchResult, SearchResult] {
  return [searchSingle(name, owner), searchTwoLevel(name, owner), searchTree(name, owner)];
}

