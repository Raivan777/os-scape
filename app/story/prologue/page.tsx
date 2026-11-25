import React from "react";
import StoryCutscene, { StoryScene } from "@/components/StoryCutscene";

const PROLOGUE_SCENES: StoryScene[] = [
  {
    id: 1,
    title: "Ruang Kuliah Sistem Operasi",
    speaker: "Mahasiswa",
    narration:
      "Dosen masih menerangkan materi Sistem Operasi di depan kelas. Suasana kelas tenang, tapi kepala rasanya mulai berat mendengarkan teori dari tadi.",
    image: "/story/prolog-1.png",
    altImage: "/story/prolog-1.jpg",
    emoji: "🏫",
  },
  {
    id: 2,
    title: "Langkah Pulang Menuruni Tangga",
    speaker: "Mahasiswa",
    narration:
      "Kuliah akhirnya selesai. Beres-beres laptop masuk ke dalam tas, lalu turun tangga kampus dan jalan santai pulang ke rumah.",
    image: "/story/prolog-2.png",
    altImage: "/story/prolog-2.jpg",
    emoji: "🎒",
  },
  {
    id: 3,
    title: "Cahaya Traktor Alien",
    speaker: "Mahasiswa",
    narration:
      "Pas lagi jalan di jalanan yang sepi, tiba-tiba ada cahaya terang menyorot dari atas dan sebuah pesawat asing langsung mengangkatku ke atas.",
    image: "/story/prolog-3.png",
    altImage: "/story/prolog-3.jpg",
    emoji: "🛸",
  },
  {
    id: 4,
    title: "Ruang Kargo Kapal Alien",
    speaker: "Mahasiswa",
    narration:
      "Tiba-tiba sudah ada di dalam pesawat alien. Banyak alien berlalu-lalang, jadi aku langsung sembunyi ke sebuah ruangan. Di sini ada setelan baju luar angkasa... aku pakai dulu buat cari jalan kabur.",
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
