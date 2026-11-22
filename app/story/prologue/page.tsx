import React from "react";
import StoryCutscene, { StoryScene } from "@/components/StoryCutscene";

const PROLOGUE_SCENES: StoryScene[] = [
  {
    id: 1,
    title: "Ruang Kuliah Sistem Operasi",
    speaker: "Mahasiswa Informatika",
    narration:
      "Jam perkuliahan terasa panjang. Dari barisan depan ruang kelas, aku memperhatikan dosen yang sedang menerangkan mekanisme inti sistem operasi di papan tulis. Di sekitarku, beberapa teman sudah mulai menahan kantuk...",
    image: "/story/prolog-1.png",
    altImage: "/story/prolog-1.jpg",
    emoji: "🏫",
  },
  {
    id: 2,
    title: "Langkah Pulang Menuruni Tangga",
    speaker: "Mahasiswa Informatika",
    narration:
      "Mata kuliah akhirnya selesai. Aku segera membereskan laptop ke dalam tas ransel, lalu bergegas menuruni anak tangga gedung fakultas. Angin malam berhembus sejuk saat aku melangkah di trotoar sepi menuju rumah...",
    image: "/story/prolog-2.png",
    altImage: "/story/prolog-2.jpg",
    emoji: "🎒",
  },
  {
    id: 3,
    title: "Cahaya Traktor Alien Menyilaukan",
    speaker: "Mahasiswa Informatika",
    narration:
      "Tiba-tiba langit malam bergetar hebat dengan dengungan mesin kosmik! Sebuah piring terbang raksasa muncul membelah kegelapan, menembakkan berkas cahaya traktor cyan menyilaukan yang seketika mengangkat tubuhku melayang ke angkasa!",
    image: "/story/prolog-3.png",
    altImage: "/story/prolog-3.jpg",
    emoji: "🛸",
  },
  {
    id: 4,
    title: "Ruang Kargo Kapal Induk OMNI",
    speaker: "Mahasiswa Informatika",
    narration:
      "Aku terbangun di dalam kapal induk alien OMNI yang mencekam. Terdengar derap langkah patroli alien di luar! Beruntung, di sudut ruang kargo ini tersimpan setelan baju astronot lengkap dengan jetpack portabel... Aku harus memakainya dan meretas modul OMNI untuk kabur!",
    image: "/story/prolog-4.png",
    altImage: "/story/prolog-4.jpg",
    emoji: "👨‍🚀",
  },
];

export default function ProloguePage() {
  return (
    <StoryCutscene
      mode="prologue"
      scenes={PROLOGUE_SCENES}
      targetHref="/stage/stage1"
      skipHref="/stage/stage1"
      completeButtonText="Mulai Melarikan Diri! (Stage 1) 🚀"
      requireStartOnFirstScene={true}
    />
  );
}
