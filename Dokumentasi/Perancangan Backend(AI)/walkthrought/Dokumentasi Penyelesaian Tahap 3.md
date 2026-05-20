# Dokumentasi Penyelesaian Tahap 3: Modul Kecerdasan Buatan (AI) & Penjadwalan

Tahap 3 dari perancangan backend Flask (AI) POS Ogut Coffee telah berhasil diimplementasikan sepenuhnya. Tahap ini berfokus pada pekerjaan _background_ (di belakang layar) yang memproses data untuk kebutuhan analitik bisnis tingkat lanjut tanpa mengganggu performa kasir harian. Berikut adalah rincian pekerjaan yang telah dilakukan.

## 1. Modul Segmentasi Menu (K-Means Clustering)
File [`ai_services/kmeans_clustering.py`](file:///c:/laragon/www/Ogut-POS/backend-pos/ai_services/kmeans_clustering.py) telah diimplementasikan untuk melakukan klastering performa penjualan menu.
- **Library**: `scikit-learn` (`KMeans`, `MinMaxScaler`, `silhouette_score`) dan `pandas`.
- **Ekstraksi Data**: Mengambil data `product_id`, `quantity`, dan `profit_margin` dari tabel `transaction_items`.
- **Transformasi**: Mengagregasikan data untuk mendapatkan _Total Volume_ dan _Rata-rata Margin_ per produk, kemudian menormalisasi skala data menjadi 0-1.
- **Model Training**: Menjalankan K-Means dengan `n_clusters=3`.
- **Logika Bisnis (Pelabelan)**: Otomatis membandingkan titik keseimbangan (centroid) untuk melabeli menu menjadi "Laris & Untung Besar", "Menengah", atau "Kurang Laris".
- **Evaluasi & Simpan**: Mengukur `silhouette_score` lalu menghapus hasil prediksi usang dan menyimpan hasil pelabelan yang baru ke tabel `ai_cluster_results`.

## 2. Modul Prediksi Stok (Regresi Linier)
File [`ai_services/linear_regression.py`](file:///c:/laragon/www/Ogut-POS/backend-pos/ai_services/linear_regression.py) telah diimplementasikan untuk meramalkan sisa stok 7 hari ke depan.
- **Library**: `scikit-learn` (`LinearRegression`, `mean_absolute_percentage_error`), `pandas`, dan `numpy`.
- **Ekstraksi Data**: Mengambil riwayat inventaris `end_of_day_stock` dari tabel `inventory_logs`.
- **Training Per-Bahan**: Algoritma AI dirancang berjalan secara terisolasi (satu model Regresi untuk setiap satu jenis `material_id`) jika memiliki minimal 5 data historis harian.
- **Evaluasi MAPE**: Mengkalkulasi _Mean Absolute Percentage Error_ (MAPE) untuk mengukur tingkat melesetnya prediksi sistem pada data latih.
- **Prediksi**: Melakukan peramalan (*forecasting*) untuk 7 hari ke depan dan mencari titik stok paling terendah sebagai batas aman manajer.
- **Simpan**: Hasil prediksi `predicted_stock` beserta skor `mape_score` diperbarui ke dalam tabel `ai_prediction_results`.

## 3. Penjadwalan Tugas Otomatis (APScheduler)
Sistem sekarang bersifat otonom. Pembaruan file [`app.py`](file:///c:/laragon/www/Ogut-POS/backend-pos/app.py) telah mengintegrasikan modul AI dengan _cron scheduler_:
- **`run_nightly_ai_jobs()`**: Fungsi pembungkus (wrapper) yang menjalankan rutin `run_kmeans()` disusul `run_regression()`.
- **`BackgroundScheduler`**: Jadwal telah diaktifkan untuk berjalan secara asinkron (di luar thread API) setiap pukul **23:59** (`trigger="cron", hour=23, minute=59`).
- **Mode Rilis**: `debug=False` telah di-set agar saat _deployment_, peladen tidak mengalami muat-ulang (_auto-reload_) yang bisa memicu *double job execution*. Sistem dimatikan dengan aman berkat `atexit.register(lambda: scheduler.shutdown())`.

## 4. Persiapan Produksi
Dengan selesainya tahap 3, backend server sudah berada di level _Production Ready_ 100%. Untuk proses rilis, sesuai rancangan:
1. Jalankan aplikasi menggunakan WSGI: `gunicorn -w 1 --threads 4 app:app`
2. Batasi *worker* (`-w 1`) demi integritas memori RAM untuk In-Memory Dictionary (`NGRAM_DATA`).
3. Deploy pada *Platform as a Service (PaaS)* seperti Render atau Virtual Machine (VPS).

---
**Status: SELESAI ✅**
Semua logika inti Machine Learning dan In-Memory Cache sudah berdiri dan siap bekerja. Selanjutnya, proses dapat beralih ke pembuatan UI Internal (Control Panel Admin) di backend atau menyelaraskan integrasi UI Frontend.
