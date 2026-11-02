# Matriks Skenario Pengujian (Test Scenarios)
## Stage 2: Alokasi Memori Kontigu & Mini-Game Cargo Bay
**Pustaka Pengujian:** Vitest  
**Berkas Uji:** `test/memoryLogic.test.ts`  

---

### Tabel Matriks Kasus Uji (Test Matrix)

| No | Kategori Uji | Deskripsi Kasus Uji | Input Data | Hasil yang Diharapkan | Hasil Aktual | Status |
|:--:|---|---|---|---|---|:--:|
| 1 | **First-Fit Dasar** | Berhenti di slot pertama yang muat | Holes: `[100, 500, 200, 300, 600]`<br>Cargo: `212 KB` | Memilih Slot #2 (500 KB), memeriksa hanya 2 slot (Hole 1 & 2), langsung berhenti. | Slot #2 terpilih, slot diperiksa = 2. | **LULUS** |
| 2 | **First-Fit Slot Pertama** | Slot pertama langsung cukup besar | Holes: `[100, 500, 200, 300, 600]`<br>Cargo: `80 KB` | Memilih Slot #1 (100 KB), memeriksa hanya 1 slot. | Slot #1 terpilih, slot diperiksa = 1. | **LULUS** |
| 3 | **First-Fit Tolak** | Kargo melebihi semua kapasitas slot | Holes: `[100, 500, 200, 300, 600]`<br>Cargo: `700 KB` | Memeriksa seluruh 5 slot, mengembalikan `selectedHole: null`. | Seluruh 5 slot diperiksa, `selectedHole: null`. | **LULUS** |
| 4 | **First-Fit Tie-break** | Dua slot muat berukuran sama | Holes: `[A: 300 KB @0, B: 300 KB @500]`<br>Cargo: `250 KB` | Memilih Slot A (karena alamat `start` lebih rendah / indeks lebih awal). | Slot A terpilih. | **LULUS** |
| 5 | **Best-Fit Dasar** | Memilih partisi terkecil yang muat | Holes: `[100, 500, 200, 300, 600]`<br>Cargo: `212 KB` | Memilih Slot #4 (300 KB, sisa 88 KB). Memeriksa seluruh 5 slot. | Slot #4 terpilih, 5 slot diperiksa. | **LULUS** |
| 6 | **Best-Fit Pas Persis** | Ukuran kargo tepat sama dengan salah satu slot | Holes: `[100, 500, 200, 300, 600]`<br>Cargo: `200 KB` | Memilih Slot #3 (200 KB, sisa 0 KB). Memeriksa seluruh 5 slot. | Slot #3 terpilih, sisa = 0 KB. | **LULUS** |
| 7 | **Best-Fit Tie-break** | Dua slot terkecil berukuran sama | Holes: `[X: 400, Y: 250 @400, Z: 250 @700]`<br>Cargo: `200 KB` | Memilih Slot Y (alamat awal lebih kecil dibandingkan Z). | Slot Y terpilih. | **LULUS** |
| 8 | **Worst-Fit Dasar** | Memilih partisi terbesar yang muat | Holes: `[100, 500, 200, 300, 600]`<br>Cargo: `212 KB` | Memilih Slot #5 (600 KB, sisa 388 KB). Memeriksa seluruh 5 slot. | Slot #5 terpilih, 5 slot diperiksa. | **LULUS** |
| 9 | **Worst-Fit Tie-break** | Dua slot terbesar berukuran sama | Holes: `[M1: 500 @0, M2: 500 @600, M3: 300]`<br>Cargo: `150 KB` | Memilih Slot M1 (karena alamat awal lebih kecil). | Slot M1 terpilih. | **LULUS** |
| 10 | **Pemotongan Partisi (Split)** | Sisa memori diperbarui sebagai hole baru | Hole: `500 KB @100`<br>Cargo: `200 KB` | Hole dipotong: kargo menempati alamat `100` (200 KB), sisa hole berukuran `300 KB` di alamat `300`. | Sisa = 300 KB, alamat baru = 300. | **LULUS** |
| 11 | **Hole Habis Sempurna** | Kargo pas persis menghabiskan hole | Holes: `[H1: 200 KB, H2: 400 KB]`<br>Cargo: `200 KB` | H1 habis (sisa 0 KB) dan dihapus dari daftar. Hanya H2 yang tersisa. | H1 terhapus, sisa hanya H2. | **LULUS** |
| 12 | **Skenario Standar: First-Fit** | Studi kasus buku ajar Sistem Operasi | Holes: `[100, 500, 200, 300, 600]`<br>Cargos: `[212, 417, 112, 426]` | Kargo 1, 2, 3 tertempatkan. Kargo 4 (426 KB) GAGAL ditolak karena fragmentasi eksternal. | 3 berhasil, 1 gagal, sisa fragmentasi = 659 KB. | **LULUS** |
| 13 | **Skenario Standar: Best-Fit** | Studi kasus buku ajar Sistem Operasi | Holes: `[100, 500, 200, 300, 600]`<br>Cargos: `[212, 417, 112, 426]` | SELURUH 4 kargo berhasil ditempatkan (100% sukses). | 4 berhasil, 0 gagal, utilisasi = 68.65%. | **LULUS** |
| 14 | **Skenario Standar: Worst-Fit** | Studi kasus buku ajar Sistem Operasi | Holes: `[100, 500, 200, 300, 600]`<br>Cargos: `[212, 417, 112, 426]` | Kargo 1, 2, 3 tertempatkan. Kargo 4 (426 KB) GAGAL ditolak. | 3 berhasil, 1 gagal. | **LULUS** |
| 15 | **Generator Misi: Stabilitas** | Pengujian determinisme PRNG seed | Seed: `1 s.d. 200` | Setiap seed menghasilkan 6 misi valid, variasi 3 algoritma lengkap, dan tidak ada jenis sama berurutan. | 200 seed teruji valid 100%. | **LULUS** |

