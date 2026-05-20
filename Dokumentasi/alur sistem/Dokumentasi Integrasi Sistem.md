# **DOKUMENTASI INTEGRASI & PENGUJIAN SISTEM (REACT ⇄ FLASK)**

**Sistem Point of Sales (POS) Ogut Coffee**

Dokumen ini merinci skenario pengujian (*Integration Testing*) untuk memastikan bahwa *Frontend* (React) dan *Backend* (Flask) terikat dengan benar dan dapat berkomunikasi tanpa hambatan, baik secara langsung melalui REST API maupun tidak langsung melalui basis data Supabase.

## **1\. Peta Keterikatan Sistem (Integration Map)**

Sebelum melakukan pengujian, pahami dua jalur komunikasi utama dalam sistem ini:

* **Jalur A: API Waktu Nyata (Direct REST API)**  
  * **Arah:** React ⇄ Flask  
  * **Fitur:** *Smart Input Assistance* (N-Gram).  
  * **Karakteristik:** Membutuhkan *Cross-Origin Resource Sharing* (CORS) yang diatur dengan benar di Flask agar tidak menolak *request* dari React.  
* **Jalur B: Jembatan Basis Data (Asynchronous Data Pipeline)**  
  * **Arah:** React ➝ Supabase ➝ Flask (Tengah Malam) ➝ Supabase ➝ React  
  * **Fitur:** Analitik K-Means dan Prediksi Stok Regresi Linier.  
  * **Karakteristik:** React dan Flask tidak pernah "bertemu" langsung untuk fitur ini. Supabase bertindak sebagai kurir pesan (penyimpan *state*).

## **2\. Skenario Pengujian Jalur A (API Waktu Nyata)**

Skenario ini menguji kecepatan dan validitas respons Flask saat kasir sedang mengetik.

### **Pengujian 2.1: Uji Tarik Rekomendasi (GET /api/suggest)**

* **Prasyarat:** Jalankan peladen Flask (python app.py) dan jalankan React (npm run dev). Pastikan ada menu "Kopi Susu" di *database*.  
* **Langkah Eksekusi (React):**  
  1. Buka layar Kasir di aplikasi React.  
  2. Ketik "ko" di kolom pencarian.  
* **Indikator Sukses (Kesiambungan Terjalin):**  
  1. Tab *Network* pada *Chrome DevTools* menunjukkan *request* HTTP GET ke http://localhost:5000/api/suggest?q=ko dengan status 200 OK.  
  2. Layar React seketika menampilkan kartu produk "Kopi Susu".  
* **Solusi Jika Gagal (CORS Error):** Pastikan CORS(app) sudah terpasang di app.py Flask.

### **Pengujian 2.2: Uji Fire-and-Forget N-Gram (POST /api/ngram/increment)**

* **Prasyarat:** Flask memiliki *dashboard* Admin yang menyala (/admin/ngram).  
* **Langkah Eksekusi (React):**  
  1. Pilih menu "Matcha Latte" ke dalam keranjang.  
  2. Tekan tombol "Bayar Pesanan" (*Checkout*).  
* **Indikator Sukses (Kesiambungan Terjalin):**  
  1. Di *Chrome DevTools*, muncul *request* POST ke http://localhost:5000/api/ngram/increment dengan status 200 OK secara asinkron (tidak membuat layar kasir melambat).  
  2. Buka *dashboard* internal Flask (http://localhost:5000/admin/ngram). Anda akan melihat skor "Matcha Latte" bertambah \+1.

## **3\. Skenario Pengujian Jalur B (Jembatan Supabase & AI)**

Skenario ini menguji apakah data yang diinput oleh React di siang hari, benar-benar bisa diolah oleh Flask di malam hari, dan dikembalikan lagi ke React keesokan harinya.

### **Pengujian 3.1: Siklus Penuh Prediksi Stok (End-to-End ML Pipeline)**

* **Prasyarat:** React dan Flask menyala. Buka *tab* Supabase di *browser*.  
* **Langkah Eksekusi (Simulasi Waktu):**  
  1. **\[React\] Siang Hari:** Manajer (lewat akun manajemen\_bahan) memperbarui stok akhir hari untuk "Biji Kopi" di halaman *Inventory* (menyebabkan baris baru masuk ke tabel inventory\_logs di Supabase).  
  2. **\[Flask\] Tengah Malam:** Masuk ke *Control Panel* Flask (http://localhost:5000/admin/dashboard), lalu tekan tombol merah **"Paksa Jalankan AI Sekarang (Force Run)"** untuk mensimulasikan tugas *cron job* jam 23:59.  
  3. **\[Supabase\] Pengecekan Tengah:** Cek tabel ai\_prediction\_results di Supabase. Harus ada baris baru yang berisi predicted\_stock untuk Biji Kopi.  
  4. **\[React\] Pagi Hari:** Buka halaman *Dashboard AI* (/dashboard) menggunakan akun Admin.  
* **Indikator Sukses (Kesiambungan Terjalin):**  
  * Tabel "Peringatan Dini Stok" di React berhasil me- *render* angka prediksi yang persis sama dengan yang dihitung oleh Flask pada langkah 3\.

## **4\. Pengujian Daya Tahan (Edge Cases & Fallback)**

Apa yang terjadi pada React jika peladen Flask tiba-tiba mati atau *error*? Sistem yang baik tidak boleh *crash* (layar putih) hanya karena satu komponen terputus.

### **Pengujian 4.1: Simulasi Peladen Flask Mati (*Server Down*)**

* **Langkah Eksekusi:**  
  1. Matikan terminal yang menjalankan Flask (Tekan Ctrl \+ C).  
  2. Kembali ke aplikasi React (Kasir), ketik sesuatu di pencarian, lalu lakukan satu transaksi *Checkout*.  
* **Indikator Sukses (Toleransi Kesalahan Berhasil):**  
  1. Pencarian React harus menggunakan pencarian lokal (filter array biasa) sebagai cadangan (*fallback*). Layar kasir **tidak boleh membeku**.  
  2. Saat menekan "Checkout", transaksi ke Supabase harus tetap berhasil. Proses *Fire-and-forget* ke Flask (yang mati) akan ditangkap oleh .catch(err \=\> console.error(err)) di kode React tanpa memunculkan *alert* menjengkelkan ke layar pengguna.

## **5\. Daftar Periksa (Checklist) URL Lingkungan (Environment)**

Untuk memastikan integrasi tidak rusak saat dirilis ke publik (*Production*), pastikan variabel lingkungan ini saling terhubung:

* \[ \] **React .env:** VITE\_FLASK\_API\_URL harus menunjuk ke URL publik Flask (cth: https://ogut-flask.onrender.com).  
* \[ \] **Flask .env:** SUPABASE\_URL dan SUPABASE\_KEY (Service Role Key) harus persis sama dengan milik React (tetapi React menggunakan Anon Key).  
* \[ \] **Supabase CORS:** URL publik React (cth: https://ogut-pos.vercel.app) harus didaftarkan di *Authentication \> URL Configuration* Supabase.  
* \[ \] **Flask CORS:** Pastikan CORS(app, origins=\["https://ogut-pos.vercel.app"\]) dikonfigurasi di produksi untuk menolak *request* dari domain asing.