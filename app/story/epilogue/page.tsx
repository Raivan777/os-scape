import React from "react";
import StoryCutscene, { StoryScene, CreditMember } from "@/components/StoryCutscene";

const EPILOGUE_SCENES: StoryScene[] = [
  {
    id: 1,
    title: "Hangar Kapsul Pelarian",
    speaker: "Mahasiswa Informatika",
    narration:
      "Setelah berhasil meretas 6 modul pertahanan OMNI dan merekonstruksi fragmen sistem file, aku akhirnya menemukan ruang hangar pelarian! Sebuah pesawat kecil tampak terparkir siap pakai. Tanpa ragu, aku melompat masuk ke dalam ruang kemudi...",
    image: "/story/epilog-1.png",
    altImage: "/story/epilog-1.jpg",
    emoji: "🚀",
  },
  {
    id: 2,
    title: "Tombol Merah & Ledakan Kapal OMNI",
    speaker: "Mahasiswa Informatika",
    narration:
      "Panel kemudi alien dipenuhi tuas dan tombol holografik yang membingungkan. Karena panik dikejar alien, aku asal menekan tombol merah besar yang paling menyala! Tak terduga, meriam laser kapal menembak lurus ke reaktor kapal induk OMNI! Ledakan dahsyat membakar kapal induk alien itu, dan pesawat kecilku terpental melesat di angkasa!",
    image: "/story/epilog-2.png",
    altImage: "/story/epilog-2.jpg",
    emoji: "💥",
  },
  {
    id: 3,
    title: "Terbangun Kaget di Meja Belajar",
    speaker: "Mahasiswa Informatika",
    narration:
      "HAHH!! Aku tersentak kaget dengan napas terengah-engah dan dada berdegup kencang. Saat pandanganku mulai jernih... aku tidak sedang melayang di ruang hampa luar angkasa. Aku berada di kamar tidurku sendiri di rumah, tertidur di atas meja belajar!",
    image: "/story/epilog-3.png",
    altImage: "/story/epilog-3.jpg",
    emoji: "🛏️",
  },
  {
    id: 4,
    title: "Semua Hanyalah Bunga Tidur",
    speaker: "Mahasiswa Informatika",
    narration:
      "Di depanku, layar laptop masih menyala menampilkan slide materi Sistem Operasi, ditemani buku catatan dan cangkir kopi. Aku tersenyum lega sambil menghela napas panjang... Semua petualangan kosmik melarikan diri dari alien tadi hanyalah mimpi karena ketiduran sehabis belajar matkul Sistem Operasi sampai larut malam!",
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
      completeButtonText="Tim Pembuat (Credits)"
      credits={TEAM_CREDITS}
    />
  );
}
