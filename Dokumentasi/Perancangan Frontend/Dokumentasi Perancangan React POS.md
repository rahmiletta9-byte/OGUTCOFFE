# **DOKUMENTASI PERANCANGAN ANTARMUKA (FRONTEND) REACT.JS**

**Sistem Point of Sales (POS) Ogut Coffee Terintegrasi AI**

## **1\. Deskripsi Perancangan**

Aplikasi *Frontend* POS Ogut Coffee dirancang sebagai *Single Page Application* (SPA) menggunakan pustaka **React.js**. Aplikasi ini bertindak sebagai jembatan interaksi utama antara staf (Kasir, Admin, Manajemen Bahan) dengan sistem basis data (Supabase) dan mesin analitik Kecerdasan Buatan (Flask).

Antarmuka dibangun mengadopsi pola desain **shadcn/ui** yang dikombinasikan dengan kerangka kerja **TailwindCSS**. Pemilihan *shadcn/ui* bertujuan untuk menciptakan komponen antarmuka yang modern, minimalis, dapat diakses (accessible), dan sangat responsif tanpa mengorbankan performa aplikasi.

## **2\. Fungsi Utama Aplikasi**

Aplikasi *frontend* ini memiliki empat fungsi krusial dalam arsitektur *microservices*:

1. **Fasilitator Transaksi Real-time:** Menyediakan antarmuka yang sangat responsif (bebas *lag*) bagi kasir untuk melayani pelanggan secepat mungkin.  
2. **Manajemen Operasional Komprehensif (CRUD):** Menyediakan antarmuka pengelolaan data terpusat bagi manajemen, meliputi pengelolaan staf (pengguna), katalog menu, serta pembaruan data fisik inventaris (stok bahan baku).  
3. **Visualisasi Kecerdasan Bisnis & Pemantauan:** Menerjemahkan angka-angka rumit hasil komputasi algoritma AI (K-Means dan Regresi Linier) menjadi grafik dan tabel peringatan dini, serta memfasilitasi audit melalui log aktivitas seluruh sistem.  
4. **Manajemen Otorisasi Cerdas (RBAC):** Mengelola sesi pengguna dan membatasi akses halaman (Routing) secara dinamis berdasarkan jabatan (*Role-Based Access Control*).

## **3\. Rincian Fitur Aplikasi**

Aplikasi dibagi secara spesifik berdasarkan hak akses 3 peran (*role*) pengguna:

### **A. Fitur Global (Semua Peran)**

* **Otentikasi Aman:** Sistem *Login* dan *Logout* terenkripsi menggunakan Supabase Auth.  
* **Auto-Redirect:** Mengarahkan pengguna secara otomatis ke halaman yang sesuai dengan jabatan mereka setelah *login*.

### **B. Fitur Kasir (Halaman POS)**

* **Katalog Produk Dinamis:** Menampilkan kartu menu beserta gambar yang diunduh langsung dari Supabase Storage Bucket.  
* **Smart Input Assistance (Debounce):** Kolom pencarian menu yang menahan *request* selama 300ms untuk mencegah *server overload*, lalu memberikan saran otomatis dari memori N-Gram.  
* **Manajemen Keranjang (Cart):** Fitur menambah item, mengurangi porsi, menghapus item, dan kalkulasi *Grand Total* secara instan.  
* **Fire-and-Forget Checkout:** Logika pemrosesan pembayaran yang mereset layar seketika setelah berhasil, dan diam-diam mengirim riwayat pesanan ke *backend* Flask di latar belakang.

### **C. Fitur Admin / Manajer (Halaman Dashboard & Manajemen)**

Admin memiliki hak akses penuh (*All Access*) ke seluruh sistem operasional dan analitik:

* **Dashboard Kecerdasan Buatan (AI):**  
  * **Metrik Ringkasan:** Menampilkan total pendapatan dan total transaksi hari/bulan ini.  
  * **Visualisasi Klaster (K-Means):** Daftar menu yang dilengkapi dengan *badge* warna (Hijau untuk Laris/Untung, Merah untuk Kurang Laris).  
  * **Tabel Peringatan Dini Stok (Regresi Linier):** Tabel yang secara otomatis menyorot pada bahan baku yang diprediksi akan habis dalam 7 hari ke depan.  
* **Manajemen User:** Antarmuka (CRUD) untuk menambah, mengubah, menonaktifkan akun staf, dan menetapkan peran mereka (Admin, Kasir, atau Manajemen Bahan).  
* **Manajemen Menu (Katalog):** Fitur CRUD untuk mengelola data menu yang dijual. Dilengkapi dengan fungsi pengunggahan (*upload*) dan pratinjau gambar langsung ke Supabase Storage Bucket.  
* **Manajemen Stok Keseluruhan:** Admin memiliki otorisasi penuh untuk mengawasi dan melakukan CRUD terhadap data bahan baku sama seperti bagian Manajemen Bahan.  
* **Log Aktivitas (Activity Log):** Dasbor pemantauan *real-time* yang mencatat semua tindakan pengguna (misal: "Kasir A melakukan transaksi", "Bahan B diubah oleh Manajemen Bahan", "Menu C ditambahkan oleh Admin").

### **D. Fitur Manajemen Bahan (Halaman Gudang)**

* **Manajemen Stok (CRUD):** Antarmuka khusus untuk menambah daftar bahan baku baru, mengubah takaran/jumlah stok (stok masuk/keluar), dan menghapus data bahan baku yang tidak lagi digunakan.  
* **Monitoring Stok Real-time:** Tabel pemantauan sisa bahan baku secara aktual beserta metrik satuannya (gram, mililiter, pcs).

## **4\. Tahapan Implementasi Perancangan (Dekomposisi Teknis)**

Berikut adalah urutan sistematis beserta langkah operasional yang dibagi ke dalam **5 Tahapan Utama** untuk membangun aplikasi *frontend* dari inisialisasi hingga siap produksi:

### **Tahap 1: Inisialisasi Proyek dan Kerangka Kerja**

Fokus pada penyiapan lingkungan dasar aplikasi dan hierarki direktori *Feature-Based*.

1. **Inisialisasi Vite & TailwindCSS:** Membangun kerangka aplikasi menggunakan Vite (npm create vite) untuk performa kompilasi yang cepat, serta melakukan instalasi dan konfigurasi pustaka TailwindCSS untuk keperluan penataan gaya (*styling*).  
2. **Instalasi Pustaka Pendukung:** Mengunduh modul utama seperti react-router-dom (navigasi), lucide-react (ikon), dan @supabase/supabase-js (konektivitas basis data).  
3. **Struktur Direktori Berbasis Fitur:** Membentuk hierarki folder modular (Feature-Based Architecture) di dalam direktori src/, membaginya ke dalam sub-folder seperti auth, pos, menu, inventory, dan dashboard agar kode lebih mudah dipelihara (scalable).

### **Tahap 2: State Management dan Otentikasi (Auth)**

Fokus pada pengamanan akses halaman (*Role-Based Access Control*) dan integrasi sesi pengguna.

1. **Klien Supabase & Environment:** Membuat fail konfigurasi koneksi (supabaseClient.js) dengan merujuk pada kredensial aman di fail .env.local.  
2. **Manajemen Sesi (AuthContext):** Membangun pembungkus konteks global (*React Context Provider*) untuk melacak status *login* dan mengidentifikasi hak akses (jabatan) pengguna secara *real-time*.  
3. **Pelindung Rute (ProtectedRoute):** Membangun komponen keamanan yang mencegat upaya navigasi ilegal berdasarkan peran, serta menyusun arsitektur rute utama di dalam App.jsx.  
4. **Halaman Autentikasi:** Merancang antarmuka LoginPage.jsx untuk memfasilitasi proses verifikasi *login* dan melakukan *redirect* otomatis ke *dashboard* yang sesuai dengan jabatan pengguna.

### **Tahap 3: Pengembangan Fitur Kasir (POS)**

Fokus pada interaktivitas dan performa transaksi *Point of Sales* utama.

1. **Asisten Pengetikan Cerdas:** Mengimplementasikan *custom hook* useDebounce dengan jeda 300ms pada bilah pencarian guna mencegah beban berlebih pada peladen (*server overload*).  
2. **Manajemen Antarmuka Keranjang:** Membangun antarmuka kasir yang memfasilitasi penambahan produk (Katalog UI), penyesuaian kuantitas, dan perhitungan *Grand Total* secara instan di sisi klien (in-memory state).  
3. **Siklus Transaksi (*Fire-and-Forget*):** Membangun layanan *checkout* yang menyimpan data ke basis data secara berurut (*header* lalu *bulk insert* item), diakhiri dengan pemanggilan API secara asinkron ke *backend* Flask untuk melatih model algoritma N-Gram tanpa memblokir layar kasir.

### **Tahap 4: Pengembangan Fitur Manajemen dan Dashboard AI**

Fokus pada operasi manajerial *Back-Office* (CRUD) dan asimilasi hasil Kecerdasan Buatan.

1. **Utilitas Log & Storage:** Membuat layanan pembantu (*helper*) untuk mencatat *Activity Log* ke basis data dan layanan untuk mengunggah berkas gambar menu ke Supabase Storage.  
2. **Manajemen Pengguna (User):** Membangun form bagi Admin untuk mendaftarkan kredensial staf baru dan menetapkan otorisasi peran (Kasir/Bahan/Admin).  
3. **Manajemen Katalog & Inventaris:** Mengimplementasikan form antarmuka untuk menambah produk menu baru dan memperbarui sisa persediaan fisik (*stock update*) bahan baku secara *real-time*.  
4. **Visualisasi AI (Dashboard):** Melakukan kueri *Read-Only* dari basis data untuk memetakan hasil *K-Means Clustering* ke dalam daftar berlabel warna, serta memproyeksikan hasil *Regresi Linier* ke dalam tabel peringatan dini persediaan bahan baku.

### **Tahap 5: Pengujian Kritis, Optimasi, dan Deployment**

Fokus pada ketahanan aplikasi (Quality Assurance) dan peluncuran produk akhir.

1. **Optimasi Kinerja (Code Splitting):** Mengonfigurasi React.lazy dan Suspense untuk memecah berkas aplikasi (Lazy Loading), sehingga proses *loading* halaman awal berjalan lebih ringan dan cepat.  
2. **Pengujian Kritis (QA):** Melakukan simulasi skenario ekstrem, seperti menguji fungsionalitas transaksi pada kondisi jaringan lambat (*3G Throttling*) dan menguji kekebalan pelindung rute dari manipulasi URL peramban.  
3. **Proses Build & Konfigurasi:** Mendaftarkan variabel lingkungan publik (seperti URL Flask & URL Supabase) serta mengompilasi kode program menjadi aset statis (npm run build).  
4. **Rilis Produksi (Deployment):** Mendistribusikan aset statis ke penyedia layanan *Cloud Hosting* (seperti Vercel atau Netlify), memastikan aturan keamanan CORS dan pengalihan (*redirect*) telah selaras dengan domain publik.