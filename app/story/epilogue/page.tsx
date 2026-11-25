import React from "react";
import StoryCutscene, { StoryScene, CreditMember } from "@/components/StoryCutscene";

const EPILOGUE_SCENES: StoryScene[] = [
  {
    id: 1,
    title: "Hangar Kapsul Pelarian",
    speaker: "Mahasiswa",
    narration:
      "Setelah berhasil melewati ruangan demi ruangan, akhirnya nemu hanggar dengan pesawat kecil untuk kabur. Langsung naik, tapi agak bingung cara mengoperasikannya.",
    image: "/story/epilog-1.png",
    altImage: "/story/epilog-1.jpg",
    emoji: "🚀",
  },
  {
    id: 2,
    title: "Tombol Merah & Ledakan Kapal OMNI",
    speaker: "Mahasiswa",
    narration:
      "Karena bingung, asal pencet tombol yang ada. Malah kepencet tombol laser yang bikin kapal induk alien meledak, dan pesawat kecilku terpental keluar.",
    image: "/story/epilog-2.png",
    altImage: "/story/epilog-2.jpg",
    emoji: "💥",
  },
  {
    id: 3,
    title: "Terbangun di Kamar Tidur",
    speaker: "Mahasiswa",
    narration:
      "Tiba-tiba terbangun kaget di kamar tidur rumah. Ternyata dari tadi ketiduran di depan laptop yang masih menyala.",
    image: "/story/epilog-3.png",
    altImage: "/story/epilog-3.jpg",
    emoji: "🛏️",
  },
  {
    id: 4,
    title: "Ternyata Cuma Mimpi",
    speaker: "Mahasiswa",
    narration:
      "Melihat buku catatan Sistem Operasi yang masih terbuka di meja, ternyata semua petualangan tadi cuma mimpi gara-gara seharian mikirin materi kuliah.",
    image: "/story/epilog-4.png",
    altImage: "/story/epilog-4.jpg",
    emoji: "☕",
  },
];

const TEAM_CREDITS: CreditMember[] = [
  {
    name: "Rafi NurRaivan",
    npm: "103",
    role: "Project Manager & Dev",
    task: "Stage 1 CPU Scheduling (FCFS, SJF, Round Robin), alur integrasi repositori & game flow",
  },
  {
    name: "Lalita Bela",
    npm: "101",
    role: "Core Developer",
    task: "Stage 2 Alokasi Memori Kontigu (First-Fit, Best-Fit, Worst-Fit) & Cargo Bay Mini-Game",
  },
  {
    name: "Rama Morista Pratama",
    npm: "088",
    role: "Ketua Kelompok & Dev",
    task: "Stage 3 Paging (Translasi MMU, Page Frame Mapper, Lab 3-Ukuran Page) & story",
  },
  {
    name: "Diana Ardelia",
    npm: "064",
    role: "Core Developer",
    task: "Stage 4 Deadlock (Banker's Algorithm, Deadlock Detection, Dining Philosophers)",
  },
  {
    name: "Fibrilla Putri Aulia Rahman",
    npm: "096",
    role: "Core Developer",
    task: "Stage 5 Struktur Direktori (Single-Level, Two-Level, Tree-Structured) & Search Lab",
  },
  {
    name: "Gemmy Dwirismariyan Hagi",
    npm: "074",
    role: "Integrasi & QA Lead",
    task: "Stage 6 File System & Fragmen Blok",
  },
];

export default function EpiloguePage() {
  return (
    <StoryCutscene
      mode="epilogue"
      scenes={EPILOGUE_SCENES}
      targetHref="/"
      skipHref="/"
      completeButtonText="Lihat Tim Pembuat (Credits) 🏆"
      credits={TEAM_CREDITS}
    />
  );
}
