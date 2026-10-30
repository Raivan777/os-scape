# OS-Scape: The Core Simulation Game

Game simulasi sistem operasi berbasis web yang memvisualisasikan cara kerja mekanisme inti sistem operasi, langkah demi langkah, dalam bentuk petualangan melarikan diri dari kapal alien.

Final Project Mata Kuliah Sistem Operasi, Ganjil 2026/2027 (Kategori B: Aplikasi Simulasi Fungsi Sistem Operasi)
Program Studi Informatika, Fakultas Teknik, Universitas Siliwangi
Dosen Pengampu: Muhammad Sidik Asyaky, S.T., M.T.

---

## 1. Deskripsi

### Latar Belakang
Konsep sistem operasi seperti penjadwalan CPU, manajemen memori, dan deadlock bersifat abstrak dan sulit dibayangkan jika hanya dibaca dari teori. OS-Scape mengubah konsep-konsep tersebut menjadi simulasi interaktif yang bisa dijalankan, diubah inputnya, dan dibandingkan hasilnya.

### Visi dan Tujuan
- Membuat konsep sistem operasi mudah dipahami lewat visualisasi dan permainan.
- Memperlihatkan perbedaan kinerja antar algoritma/mekanisme secara langsung lewat metrik yang bisa dibandingkan.
- Menguji pemahaman pemain melalui mini-game di setiap stage.

### Sasaran Pengguna
Mahasiswa informatika dan pemula yang sedang belajar sistem operasi, serta dosen atau asisten yang membutuhkan media peraga di kelas.

### Cerita Singkat
Pemain adalah manusia yang diculik alien. Untuk kabur, pemain harus meretas dan mengatur sumber daya komputer kapal (OMNI) melalui 6 stage. Tiap stage mewakili satu modul sistem operasi.

### Fitur Utama
- Visualisasi langkah demi langkah pada setiap algoritma/mekanisme.
- Input yang dapat diubah pengguna (daftar proses, ukuran memori, ukuran page, dan sebagainya).
- Perbandingan metrik kinerja antar algoritma/mekanisme.
- Minimal 3 algoritma/mekanisme di setiap stage.
- Mini-game bertema alien di setiap stage.

### Cakupan Stage

| Stage | Modul | 3 Algoritma/Mekanisme | Metrik Pembanding | Mini-game |
|---|---|---|---|---|
| 1 | Penjadwalan CPU | FCFS, SJF, Round Robin | Waiting time, turnaround time | Alien Reactor Power Distributor |
| 2 | Alokasi Memori Kontigu | First-Fit, Best-Fit, Worst-Fit | Sisa fragmentasi, pemanfaatan memori | Cargo Bay Partitioning |
| 3 | Paging (Non-Contiguous) | Tiga ukuran page berbeda dengan translasi address, page table, dan fragmentasi internal | Fragmentasi internal, ukuran page table | Page Frame Mapper |
| 4 | Deadlock | Banker's Safety Check, Banker's Resource-Request, Deadlock Detection (dengan skenario Dining Philosophers) | Jumlah langkah, status aman/tidak aman | Alien Life-Support Banker |
| 5 | Struktur Direktori | Single-Level, Two-Level, Tree-Structured | Jumlah langkah pencarian file | Directory Architect |
| 6 | File dan File System | Create/Write, Read/Reposition, Delete/Truncate | Jumlah blok dan operasi yang dipakai | Data Fragment Rebuilder |

### Teknologi
Next.js 14 (App Router), React 18, TypeScript, dan Tailwind CSS.

---

## 2. Cara Instalasi

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18 atau lebih baru (sudah termasuk npm)
- [Git](https://git-scm.com/)
- Browser modern (Chrome, Edge, atau Firefox) di perangkat desktop atau laptop

### Langkah Instalasi
1. Clone repositori:
   ```bash
   git clone https://github.com/Raivan777/os-scape.git
   cd os-scape
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
4. Buka `http://localhost:3000` di browser.

### Build Produksi (opsional)
```bash
npm run build
npm run start
```

### Jika Terjadi Masalah
- Pastikan versi Node.js sesuai (`node -v`).
- Jika port 3000 sudah dipakai, jalankan `npm run dev -- -p 3001` lalu buka `http://localhost:3001`.
- Jika dependensi bermasalah, hapus folder `node_modules` dan jalankan `npm install` lagi.

---

## 3. Cara Penggunaan

### Alur Umum
1. Buka halaman utama dan mulai permainan dari Stage 1.
2. Baca materi singkat di terminal data log OMNI untuk memahami konsep pada stage tersebut.
3. Jalankan simulasi: ubah input yang tersedia, lalu amati prosesnya berjalan langkah demi langkah.
4. Bandingkan hasil ketiga algoritma/mekanisme lewat tabel metrik.
5. Selesaikan mini-game atau kuis di akhir stage untuk membuka portal ke stage berikutnya.
6. Selesaikan seluruh stage untuk kabur dari kapal alien.

### Panduan Per Stage

**Stage 1 - Penjadwalan CPU.** Tentukan daftar proses beserta burst time (dan time quantum untuk Round Robin), lalu jalankan FCFS, SJF, dan RR. Bandingkan waiting time dan turnaround time rata-rata. Di mini-game, alokasikan proses ke CPU reaktor sebelum batas waktu habis.

**Stage 2 - Alokasi Memori Kontigu.** Atur ukuran hole memori dan urutan permintaan proses, lalu lihat penempatan oleh First-Fit, Best-Fit, dan Worst-Fit. Bandingkan sisa fragmentasi dan pemanfaatan memori. Di mini-game, tempatkan kargo proses ke slot partisi yang tepat.

**Stage 3 - Paging.** Atur total memori fisik, daftar proses beserta ukurannya, dan tiga ukuran page yang dibandingkan. Amati proses dipecah menjadi page, dipetakan ke frame kosong, dan page table terisi. Masukkan satu alamat logis untuk melihat translasi menjadi alamat fisik (page number, offset, nomor frame). Di mini-game, seret page ke frame kosong yang benar dan jawab pertanyaan translasi alamat.

**Stage 4 - Deadlock.** Isi matriks Available, Max, dan Allocation, lalu jalankan Safety Check untuk mencari safe sequence. Ajukan permintaan resource untuk menguji Resource-Request Algorithm, dan jalankan Deadlock Detection untuk melihat proses yang terjebak. Skenario Dining Philosophers menunjukkan terjadinya deadlock beserta solusi mutex dan semaphore. Di mini-game, putuskan apakah alokasi sumber daya aman atau tidak.

**Stage 5 - Struktur Direktori.** Buat dan cari file pada struktur Single-Level, Two-Level, dan Tree-Structured, lalu bandingkan jumlah langkah pencarian serta kemudahan penamaan dan pengelompokan. Di mini-game, tempatkan berkas ke direktori yang tepat berdasarkan path-nya.

**Stage 6 - File dan File System.** Jalankan operasi dasar file (create, write, read, reposition, delete, truncate) dan lihat penggunaan blok penyimpanan. Di mini-game, rekonstruksi berkas dengan menyambungkan blok penyimpanan.

### Ringkasan Struktur Kode
- `app/stage/` berisi halaman UI dan gameplay tiap stage.
- `components/` berisi komponen UI yang dipakai ulang (modal materi, kuis, karakter).
- `utils/` berisi logika murni algoritma dan perhitungan metrik.
- `public/` berisi aset gambar dan sprite.

---

## 4. Anggota Tim INFINITY

| No | Nama | NPM | Peran | Rincian Tugas dan Kontribusi |
|----|------|-----|-------|------------------------------|
| 1 | Rafi NurRaivan | 103 | Manajer Proyek, Pengembang Inti | Stage 1 Penjadwalan CPU; mengelola repositori, integrasi alur antar-stage, memantau progres tim |
| 2 | Lalita Bela | 101 | Pengembang Inti Alokasi Memori | Stage 2 Alokasi Memori Kontigu |
| 3 | Rama Morista Pratama| 088 | Ketua Kelompok, Pengembang Inti Modul Paging | Stage 3 Paging (translasi address, page table, fragmentasi internal) |
| 4 | Diana Ardelia| 064 | Pengembang Antarmuka dan Logika Deadlock | Stage 4 Deadlock (Banker's Algorithm, Deadlock Detection, skenario Dining Philosophers) |
| 5 | Fibrilla Putri Aulia Rahman | 096 | Pengembang Inti Struktur Direktori | Stage 5 Struktur dan Organisasi Direktori |
| 6 | Gemmy Dwirismariyan Hagi|074 | Integrasi Sistem, QA, dan Dokumentasi | Stage 6 File dan File System; pengujian seluruh stage, integrasi akhir, laporan dan dokumentasi |

---

## Tautan

- Repositori: https://github.com/Raivan777/os-scape
- Demo Live: *(isi nanti)*
- Video Demo (3-5 menit): *(isi nanti)*
- Laporan Proyek (PDF): *(isi nanti)*
