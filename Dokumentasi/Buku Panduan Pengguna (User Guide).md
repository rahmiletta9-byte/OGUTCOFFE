# Buku Panduan Pengguna (User Guide) - POS Ogut Coffee

Selamat datang di Sistem Point of Sales (POS) Cerdas Ogut Coffee. Aplikasi ini terbagi menjadi antarmuka Kasir, antarmuka Manajemen/Admin, dan Control Panel khusus IT. Panduan ini dirancang untuk membantu setiap divisi dalam menjalankan tugasnya masing-masing.

---

## 1. Panduan untuk KASIR (Front-End)

Bagian ini digunakan oleh staf kasir yang melayani pelanggan secara langsung.

### Melakukan Transaksi (Smart Input Assistance)
Sistem kasir Ogut Coffee dilengkapi dengan **Smart Input Assistance** bertenaga N-Gram. Sistem ini akan mengingat menu apa saja yang paling sering di-klik/diketik sehingga pencarian menjadi secepat kilat.

1. Buka layar **Kasir / POS** di aplikasi.
2. Di kolom pencarian (Search Bar), ketik minimal satu atau dua huruf (misal: "ko").
3. Berkat memori RAM pintar, sistem akan langsung memunculkan "Kopi Susu" atau menu paling laku lainnya di urutan teratas secara instan.
4. Klik kartu menu tersebut untuk memasukkannya ke Keranjang Belanja.
5. Atur kuantitas (jumlah) pesanan.
6. Klik **Bayar / Checkout** dan pilih metode pembayaran (Cash/QRIS).
7. Setelah transaksi berhasil, secara otomatis (*di belakang layar*) sistem akan menambah popularitas/skor menu yang baru saja Anda jual agar besok pencariannya semakin pintar.

---

## 2. Panduan untuk MANAJER / ADMIN TOKO

Bagian ini berfokus pada manajemen stok, pengelolaan menu, dan membaca laporan analitik yang di- *generate* oleh Kecerdasan Buatan (AI) setiap tengah malam.

### Manajemen Inventaris & Pembaruan Stok
1. Buka menu **Inventaris / Stok Bahan**.
2. Masukkan sisa stok bahan baku fisik (misal: Biji Kopi, Susu) di akhir hari sebelum tutup toko (Tutup Buku).
3. Simpan data. Data ini (Sisa Stok Akhir Hari) sangat penting untuk dibaca oleh AI dalam meramalkan kebutuhan stok minggu depan.

### Membaca Laporan AI (Dashboard)
Setiap pagi hari ketika Manajer membuka Dashboard, akan ada dua fitur utama berbasis AI:

1. **Segmentasi Menu (K-Means Clustering)**
   - Anda akan melihat daftar menu yang secara otomatis telah dikelompokkan ke dalam label:
     - **Laris & Untung Besar**: Produk yang penjualannya tinggi dan margin profitnya besar (fokuskan promo pada menu ini).
     - **Menengah**: Produk dengan performa stabil.
     - **Kurang Laris**: Produk yang jarang laku (pertimbangkan untuk menghapus/mengganti resep menu ini).

2. **Peringatan Dini Stok (Regresi Linier)**
   - Di bagian Inventaris, sistem akan menampilkan tabel **Prediksi Sisa Stok Terendah 7 Hari ke Depan**.
   - Angka ini dihasilkan oleh AI dengan mempelajari tren penggunaan bahan Anda sebulan terakhir.
   - **Tindakan**: Jika AI memprediksi "Biji Kopi" akan sisa 0 atau menipis minggu depan, segeralah lakukan pemesanan (Restock) kepada *Supplier*.

---

## 3. Panduan untuk ADMIN IT (Control Panel Backend)

Bagian ini khusus untuk teknisi/tim IT yang bertugas menjaga kesehatan server Flask.

### Login ke Dasbor IT
1. Buka URL peladen backend Anda ditambah `/admin/login` (Contoh lokal: `http://localhost:5000/admin/login`).
2. Masukkan Username dan Password yang telah diatur di dalam file `config.json`.

### Pemantauan Memori N-Gram (RAM)
1. Setelah login, klik menu **Cek RAM N-Gram**.
2. Di sini Anda bisa melihat secara langsung isi memori *Cache* (RAM) peladen.
3. Anda bisa memverifikasi menu apa yang memiliki "Skor Popularitas (Hits)" tertinggi yang saat ini memengaruhi sistem pencarian Kasir.

### Pemantauan Logika AI (Explainable AI / XAI)
Untuk menghindari "Black Box" (ketidaktahuan mengapa AI mengambil suatu keputusan), Anda bisa mengecek logikanya:
1. Klik menu **Logika AI**.
2. **K-Means**: Menampilkan *Silhouette Score* (tingkat kepadatan/akurasi clustering) dan koordinat matematis mengapa menu tertentu dilabeli "Laris".
3. **Regresi Linier**: Menampilkan informasi *Mean Absolute Percentage Error (MAPE)* yang mengukur seberapa akurat tebakan stok AI dibandingkan data nyata.

### Force Run AI (Menjalankan AI di Siang Hari)
Normalnya, tugas *Machine Learning* berjalan otomatis pada **Pukul 23:59** setiap hari menggunakan penjadwalan (*Background Scheduler*). Namun, jika ada urgensi atau sedang tahap pengujian:
1. Kembali ke Dashboard utama IT.
2. Tekan tombol merah peringatan **"⚠️ Paksa Jalankan AI Sekarang (Force Run)"**.
3. Sistem akan menghentikan sejenak pekerjaan lain dan memfokuskan CPU untuk memproses AI secara instan.

---
*Panduan ini ditujukan agar adaptasi terhadap fitur canggih Ogut POS dapat dilakukan secara lancar oleh semua elemen pegawai.*
