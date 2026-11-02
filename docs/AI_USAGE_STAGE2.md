# Laporan Penggunaan AI (AI Usage Report)
## Stage 2: Alokasi Memori Kontigu & Mini-Game Cargo Bay Partitioning
**Mata Kuliah:** Sistem Operasi (MK SO) — Ganjil 2026/2027  
**Proyek:** OS-Scape: The Core Simulation Game  
**Tim:** INFINITY  
**Pengembang Modul:** Stage 2 (Alokasi Memori Kontigu)  

---

### 1. Deskripsi Modul & Tujuan Penggunaan AI
Stage 2 bertujuan menyimulasikan konsep **Alokasi Memori Kontigu (Contiguous Memory Allocation)** dengan 3 algoritma utama:
1. **First-Fit** (pencarian slot pertama yang muat)
2. **Best-Fit** (pencarian slot terkecil yang muat guna meminimalkan sisa)
3. **Worst-Fit** (pencarian slot terbesar yang muat)

Kecerdasan Buatan (AI) digunakan sebagai asisten *pair-programming* untuk:
- Merancang struktur data TypeScript murni (*pure functions* tanpa dependensi DOM/React).
- Mengembangkan algoritma alokasi memori, logika pemotongan partisi (*hole split*), dan kalkulasi fragmentasi eksternal.
- Mengembangkan mini-game edukatif 8 jenis misi berbasis tema ruang kargo stasiun luar angkasa (*Cargo Bay Partitioning*).
- Menulis rangkaian pengujian unit otomatis (*unit test suite*) berbasis **Vitest**.

---

### 2. Rincian Prompt & Kontribusi AI vs Manusia

| Komponen / Berkas | Kontribusi AI | Peran & Validasi Manusia |
|---|---|---|
| `utils/memoryLogic.ts` | Mengimplementasikan algoritma `firstFit`, `bestFit`, `worstFit`, fungsi `allocate`, `calculateMetrics`, `runScenario`, dan PRNG generator misi. | Meninjau aturan tie-break alamat terendah, memvalidasi skenario default (First-Fit & Worst-Fit gagal pada kargo 426 KB, Best-Fit sukses 100%). |
| `components/MemoryMaterialModal.tsx` | Menyusun teks penjelasan materi konsep memori kontigu, fragmentasi internal vs eksternal, pemadatan (*compaction*), dan visualisasi bar memori CSS. | Menyesuaikan nada bahasa agar konsisten dengan gaya OMNI kernel datalog, memastikan tidak ada konsep SO yang keliru. |
| `components/MemorySimulatorPanel.tsx` | Menyusun antarmuka visualizer langkah-demi-langkah, form input dinamis, dan tabel komparasi metrik 3 algoritma. | Menguji responsivitas bar partisi, memverifikasi keterbacaan kontras warna dan highlight slot yang sedang diperiksa. |
| `components/CargoBayMiniGame.tsx` | Membuat arsitektur mini-game 8 variasi misi, container aspek rasio 16:9, aset CSS/SVG crate *hazard-stripe*, dan sistem penilaian ramah tanpa timer/game over. | Menguji alur gameplay, memastikan tombol drag & klik bekerja baik di layar sentuh, serta mengevaluasi feedback satu kalimat saat pemain salah. |
| `components/MemoryQuizModal.tsx` | Menyusun 3 pertanyaan evaluasi konsep fragmentasi eksternal, overhead pencarian Best-Fit vs First-Fit, dan pemadatan memori. | Memastikan kunci jawaban dan penjelasan feedback komprehensif serta relevan dengan kurikulum perkuliahan. |
| `app/stage/stage2/page.tsx` | Membangun arena 2D platformer koridor cargo deck lengkap dengan fisika gravitasi, pushable crate, laser barrier, dan rute portal ke Stage 3. | Mengatur koordinat platform agar ramah rintangan dan menguji navigasi tombol `[E]` di dekat terminal. |
| `test/memoryLogic.test.ts` | Menulis unit test komprehensif untuk seluruh fungsi logika dan stabilitas generator misi seed 1 s.d. 200. | Memverifikasi seluruh pengujian berstatus lulus (*passed*) tanpa peringatan (*warnings*). |

---

### 3. Komitmen Integritas Akademik
Seluruh kode yang dihasilkan melalui asistensi AI telah dipelajari, dipahami alur logikanya baris demi baris, diuji kebenarannya, dan dapat dipresentasikan secara mandiri saat sesi demo tugas akhir.

