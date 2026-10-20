# OS-Scape: The Core Simulation Game

Game simulasi sistem operasi berbasis web. Pemain berperan sebagai manusia yang diculik alien dan harus meretas serta mengatur sumber daya komputer kapal (OMNI) melalui 7 *stage* algoritma untuk bisa kabur.

**Final Project Sistem Operasi, Ganjil 2026/2027 (Kategori B: Aplikasi Simulasi).**

## 🚪 Stage Permainan
1. **The Queue Manager:** Penjadwalan proses (FCFS, SJF, Round Robin)
2. **The Data Courier:** Threads dan IPC (Pipe, Message Queue, Socket)
3. **The Parallel Builder:** Konkurensi (begin-end, parbegin-parend)
4. **The Traffic Controller:** Sinkronisasi (Mutex, Semaphore)
5. **The Void Trap:** Penanganan Deadlock (Preemption, Kill Process)
6. **The RAM Tetris:** Alokasi Memori (First-Fit, Best-Fit, Worst-Fit)
7. **The Nav-Core:** Manajemen Memori Lanjut (Paging & Segmentasi)

## 🚀 Cara Menjalankan (Lokal)
Karena proyek ini dibangun menggunakan **Next.js**, pastikan komputermu sudah terinstal [Node.js](https://nodejs.org/).

1. Buka terminal/CMD, lalu masuk ke folder proyek.
2. Jalankan perintah instalasi dependensi (hanya perlu dilakukan sekali di awal):
   ```bash
   npm install
   ```
3. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
4. Buka browser dan akses `http://localhost:3000`.

## 📁 Struktur Direktori Next.js
- `app/stage/` : Folder berisi halaman UI dan gameplay untuk *Stage* 1 hingga 7.
- `components/` : Kumpulan UI yang dipakai berulang (misal: tombol, pop-up terminal, karakter 2D).
- `utils/` : Logika rumus murni perhitungan algoritma dan perbandingan metrik.
- `public/` : Tempat menyimpan aset gambar, sprite karakter, dan tileset ruangan.

## 👥 Anggota Tim INFINITY
| No | Nama | NPM | Peran | Kontribusi |
|----|------|-----|-------|------------|
| 1  |   Rama   |  088   |  Gatau     |       Belum ada     |
| 2  |      |     |       |            |
| 3  |      |     |       |            |
| 4  |      |     |       |            |
| 5  |      |     |       |            |
| 6  |      |     |       |            |

## 🔗 Tautan Penting
- Demo Live (Vercel/GitHub Pages): *(isi nanti)*
- Video Demo Presentasi: *(isi nanti)*

---

## 🛠️ PANDUAN GIT UNTUK TIM (Wajib Baca)

Berikut adalah perintah wajib yang akan sering kita pakai selama pengerjaan proyek agar kode tidak saling bentrok.

### 1. Pertama Kali Clone (Mengambil Repo)
Jalankan ini sekali saja saat baru diundang ke repositori:
```bash
git clone https://github.com/Raivan777/os-scape.git
cd os-scape
npm install
```

### 2. Alur Kerja Harian (Wajib Berurutan!)
Setiap kali kamu mau mulai ngoding atau mau menyimpan kode hasil kerjaanmu, **selalu ikuti 3 langkah ini**:

**Langkah A: Ambil kode terbaru dari teman-teman (Wajib sebelum ngoding)**
```bash
git pull origin main
```
*(Kalau ada pesan error saat pull, kabari di grup ya!)*

**Langkah B: Simpan perubahan kodemu (Commit)**
```bash
git add .
git commit -m "feat: menambah tombol di stage 1" 
```
*(Catatan: Ubah pesan di dalam tanda kutip sesuai dengan apa yang baru saja kamu kerjakan).*

**Langkah C: Kirim kodemu ke GitHub (Push)**
```bash
git push origin main
```
