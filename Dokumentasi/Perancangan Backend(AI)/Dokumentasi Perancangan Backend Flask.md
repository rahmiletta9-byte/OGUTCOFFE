# **DOKUMENTASI PERANCANGAN BACKEND (FLASK & AI)**

**Sistem Point of Sales (POS) Ogut Coffee Terintegrasi AI**

## **1\. Deskripsi Perancangan**

Backend sistem Ogut Coffee dirancang menggunakan **Python** dan kerangka kerja **Flask** dengan pendekatan *Microservices*. Peladen (*server*) ini beroperasi sepenuhnya di belakang layar dan terisolasi dari proses *rendering* UI (React) maupun penyimpanan data transaksional utama (Supabase).

Tugas utama dari Flask dalam arsitektur ini adalah:

1. Menyediakan *endpoint* API berkecepatan tinggi (latensi \< 50ms) untuk fitur *Smart Input Assistance* menggunakan algoritma N-Gram yang berjalan di atas RAM (In-Memory).  
2. Menjalankan *cron job* (tugas terjadwal) di tengah malam untuk memproses algoritma *Machine Learning* yang berat (K-Means dan Regresi Linier) tanpa mengganggu performa kasir di siang hari.

## **2\. Arsitektur & Pola Desain (Design Pattern)**

Backend Flask distrukturkan menggunakan pola **Layered Architecture** untuk memastikan kode mudah dipelihara dan diuji:

* **API/Routing Layer (api/routes.py):** Bertugas hanya untuk menerima *request* HTTP dari React, memvalidasi input, dan mengembalikan respons JSON. Layer ini tidak boleh berisi rumus AI.  
* **Service/AI Layer (ai\_services/ & memory/):** Jantung dari sistem. Di sinilah model Scikit-Learn dilatih dan struktur data N-Gram dikelola.  
* **Data Access Layer (config/supabase\_client.py):** Modul tunggal penyedia koneksi ke Supabase menggunakan supabase-py. Berbeda dengan React yang menggunakan *anon key*, layer ini menggunakan **service\_role\_key** yang memberikan hak istimewa (Admin Privilege) untuk memotong jalur RLS (Row Level Security) demi keperluan *bulk insert/update* data AI di malam hari.

## **3\. Spesifikasi API (RESTful Endpoints)**

Sistem hanya membuka sedikit *endpoint* yang sangat spesifik untuk diakses oleh *Frontend* React.

### **A. Endpoint 1: Get Suggestions (N-Gram)**

* **URL:** GET /api/suggest  
* **Query Params:** ?q=\<kata\_kunci\> (contoh: ?q=kopi)  
* **Fungsi:** Mengambil maksimal 5 daftar rekomendasi menu dari RAM server berdasarkan kecocokan huruf dan frekuensi pembelian tertinggi.  
* **Response Waktu:** Sangat cepat (\< 50ms).  
* **Response Format:** \["Kopi Susu Gula Aren", "Kopi Hitam", "Kopi Pandan"\]

### **B. Endpoint 2: Increment Frequency (N-Gram Training)**

* **URL:** POST /api/ngram/increment  
* **Body Format (JSON):** { "items": \["Kopi Susu Gula Aren", "Kentang Goreng"\] }  
* **Fungsi:** Menambah nilai statistik popularitas menu setiap kali ada transaksi yang sukses (Fire-and-forget).  
* **Response Code:** 200 OK (Tidak perlu menunggu hasil proses).

### **C. Endpoint 3: Health Check**

* **URL:** GET /api/health  
* **Fungsi:** Digunakan oleh layanan *hosting* atau tim IT untuk memastikan *server* Flask sedang menyala dan tidak *down*.  
* **Response Format:** { "status": "active", "uptime": "12:00:00" }

## **4\. Perancangan Modul Kecerdasan Buatan (AI)**

Logika AI dipisah menjadi tiga modul terisolasi berdasarkan metode komputasinya.

### **4.1. Modul In-Memory N-Gram Cache**

* **Penyimpanan:** Variabel global Dictionary di Python.  
* **Mekanisme *Cold Start*:** Saat server Flask baru pertama kali dinyalakan (atau di-*restart*), fungsi load\_initial\_data() akan berjalan, menarik data histori transaksi dari Supabase, lalu mengisi memori RAM dengan data awal agar N-Gram langsung cerdas sejak menit pertama.

### **4.2. Modul Segmentasi Menu (K-Means Clustering)**

* **Pustaka:** sklearn.cluster.KMeans dan sklearn.preprocessing.MinMaxScaler.  
* **Sumbu (Features):** *Volume Penjualan (Qty)* dan *Rata-rata Margin Keuntungan*.  
* **Parameter AI:** n\_clusters=3 (Laris, Menengah, Kurang Laris).  
* **Evaluasi:** Menggunakan *Silhouette Score* untuk mengukur seberapa solid/akurat hasil pengelompokan yang dibuat mesin.

### **4.3. Modul Prediksi Stok (Regresi Linier)**

* **Pustaka:** sklearn.linear\_model.LinearRegression.  
* **Sumbu (Features):** *Waktu (Sumbu X)* vs *Sisa Stok Akhir Hari (Sumbu Y)*.  
* **Isolasi Proses:** Proses regresi ini dieksekusi di dalam perulangan (*loop*). Jika kafe memiliki 20 bahan baku, AI akan membuat dan melatih 20 model Regresi Linier yang berbeda setiap malam, karena setiap bahan memiliki trennya sendiri-sendiri.  
* **Evaluasi:** Menggunakan *MAPE (Mean Absolute Percentage Error)* untuk memberi tahu manajer seberapa besar persentase melesetnya tebakan mesin tersebut.

## **5\. Penjadwalan Tugas (Background Cron Jobs)**

Untuk memastikan otomatisasi berjalan lancar tanpa intervensi manusia, Backend menggunakan pustaka **APScheduler** (*Advanced Python Scheduler*).

* **Trigger:** Penjadwal diatur menggunakan parameter *cron* hour=23, minute=59.  
* **Alur Eksekusi Malam:**  
  1. Waktu menunjukkan pukul 23:59.  
  2. Fungsi run\_ai\_batch\_processing() terpicu.  
  3. Kueri ke tabel transactions dan inventory\_logs 30 hari terakhir dikumpulkan.  
  4. Modul K-Means dijalankan \-\> *Delete* data lama di ai\_cluster\_results \-\> *Insert* data baru.  
  5. Modul Regresi Linier dijalankan \-\> *Delete* data lama di ai\_prediction\_results \-\> *Insert* data baru.  
  6. Tugas selesai, memori dibebaskan (Garbage Collection), server kembali tidur menanti *request* N-Gram keesokan harinya.

## **6\. Strategi Keamanan & Deployment**

* **CORS (Cross-Origin Resource Sharing):** API Flask akan dikunci agar hanya menerima *request* yang datang dari domain spesifik React (misalnya https://pos-ogut.vercel.app). Segala bentuk *request* dari domain antah-berantah akan otomatis ditolak (403 Forbidden).  
* **Deployment Requirements:** Karena mengandalkan sistem *In-Memory Cache* dan *Background Scheduler*, aplikasi ini **TIDAK BOLEH** di-*deploy* di infrastruktur *Serverless* (seperti Vercel atau AWS Lambda) karena memorinya akan terus tereset.  
* **Infrastruktur Target:** Aplikasi Flask ini dirancang untuk di-*deploy* pada layanan **PaaS (Platform as a Service)** yang menyala terus-menerus (24/7), seperti Render.com (Web Service), Railway, atau peladen Virtual Private Server (VPS) menggunakan Gunicorn.