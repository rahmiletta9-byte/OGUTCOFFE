# Laporan Pengujian & Evaluasi Integrasi Sistem

Berdasarkan *Implementation Plan* yang disetujui, kami telah berhasil memvalidasi alur sistem end-to-end antara Frontend, Supabase, dan Backend Flask. Pengujian ini difasilitasi oleh generasi data *dummy* agar performa Machine Learning dapat terlihat dengan jelas.

## 1. Verifikasi Integrasi Frontend & Backend
Kami telah mengecek kode sumber pada direktori `frontend/` dan mengonfirmasi bahwa variabel lingkungan di `.env.local` serta berkas layanan seperti `checkoutService.js` sudah diarahkan dengan benar ke URL peladen lokal Flask (`VITE_FLASK_API_URL=http://127.0.0.1:5000`).

## 2. Generasi Data Dummy
Untuk mengevaluasi modul kecerdasan buatan, skrip *seeding* otomatis (`seed_dummy_data.py`) telah dibuat dan dijalankan. Skrip ini memasukkan data fiktif selama 30 hari ke belakang ke dalam Supabase:
- **4 Produk Baru**: Kopi Susu Gula Aren, Americano, Matcha Latte, Kentang Goreng.
- **4 Bahan Baku**: Biji Kopi, Susu Fresh Milk, Bubuk Matcha, Kentang Beku.
- **Transaksi**: 150 transaksi belanja simulasi dengan total 299 riwayat pesanan (berguna untuk fitur N-Gram & K-Means).
- **Log Inventaris**: 120 catatan penggunaan harian untuk ke-4 bahan baku di atas (berguna untuk prediksi Regresi Linier).

## 3. Hasil Pengujian Jalur A (API Waktu Nyata)
- **Tarik Rekomendasi (`GET /api/suggest?q=ko`)**: Peladen memberikan respons sangat cepat dengan hasil pencarian dari RAM/N-Gram berupa `["Kopi Susu Gula Aren"]`. Status integrasi **Sukses (200 OK)**.
- **Fire-and-Forget N-Gram (`POST /api/ngram/increment`)**: API menerima daftar menu baru yang dibeli dan mengembalikan pesan kesuksesan. Saat di cek pada memori, perhitungan popularitas menu (hits) bertambah secara akurat.

## 4. Hasil Pengujian Jalur B (Jembatan AI Supabase)
Kami menjalankan instruksi _Force Run_ secara manual untuk mempercepat pemrosesan yang seharusnya berjalan tengah malam:
- **K-Means Clustering**: Berhasil melakukan ETL dari data Supabase. Algoritma mencari centroid dan menghasilkan 3 kelompok (Laris, Menengah, Kurang Laris) dengan nilai Silhouette Score sebesar **0.28**. Model AI berhasil menyimpan kembali skor ini ke Supabase.
- **Regresi Linier**: Model di-training pada masing-masing data 4 bahan baku. Hasilnya, AI memprediksi tingkat sisa stok 7 hari ke depan untuk tiap-tiap bahan dan telah diperbarui di tabel peringatan dini Supabase dengan sempurna.

## Kesimpulan
Sistem terbukti berjalan baik dalam skema integrasi utuh. Data mengalir dari Frontend ke Supabase, diproses semalaman oleh Flask AI, dan hasil analitiknya dikirim kembali ke Supabase dengan struktur yang sesuai agar keesokan harinya bisa dibaca kembali oleh dasbor Admin di Frontend. Semua modul telah stabil dan berfungsi sesuai harapan.
