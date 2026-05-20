# **DOKUMENTASI STRUKTUR BASIS DATA & RELASI (SUPABASE)**

**Sistem Point of Sales (POS) Ogut Coffee Terintegrasi AI**

## **1\. Tinjauan Arsitektur Data**

Sistem ini menggunakan basis data relasional **PostgreSQL** yang di- *hosting* melalui layanan **Supabase**. Arsitektur data dirancang untuk memenuhi empat kebutuhan utama:

1. **Otentikasi & Otorisasi:** Mengelola siapa saja staf yang bisa masuk ke sistem beserta tingkat hak aksesnya (Admin, Kasir, Manajemen Bahan).  
2. **Kecepatan Transaksional (OLTP):** Struktur dinormalisasi untuk memastikan kasir dapat melakukan pencatatan pesanan dengan sangat cepat.  
3. **Kebutuhan Analitik (OLAP) & AI:** Menyimpan riwayat perubahan stok dan snapshot keuntungan untuk kebutuhan komputasi *Machine Learning* di malam hari.  
4. **Audit Trail:** Mencatat log aktivitas setiap pengguna untuk keamanan sistem.

## **2\. Fungsi Basis Data (Database Functions)**

Sistem menggunakan fungsi kustom (*Stored Procedure*) PostgreSQL untuk mempermudah pengecekan hak akses di seluruh basis data.

* **Fungsi: get\_user\_role()**  
  * **Tujuan:** Mengambil jabatan/peran (*role*) dari pengguna yang saat ini sedang *login* (berdasarkan token sesi/JWT).  
  * **Cara Kerja:** Fungsi ini mengekstrak ID pengguna dari sistem autentikasi (auth.uid()), lalu mencari peran yang cocok di dalam tabel user\_roles.  
  * **Penggunaan:** Digunakan secara ekstensif di dalam *Row Level Security* (RLS) Policies untuk menentukan apakah sebuah *query* (SELECT/INSERT/UPDATE) diizinkan atau ditolak.

## **3\. Relasi Antar Entitas (Entity Relationship)**

Skema basis data ini memiliki alur relasi sebagai berikut:

* **Relasi Autentikasi:**  
  * Tabel bawaan Supabase **auth.users** memiliki relasi *One-to-One* dengan **user\_roles** (Setiap staf punya 1 peran).  
  * **auth.users** memiliki relasi *One-to-Many* dengan **activity\_logs** (Satu staf bisa melakukan banyak aktivitas).  
* **Relasi Katalog & Gudang:**  
  * **products** memiliki relasi *Many-to-Many* dengan **materials** melalui tabel *pivot* **product\_materials** (Satu menu menggunakan banyak bahan, satu bahan dipakai banyak menu).  
* **Relasi Transaksional:**  
  * **transactions** memiliki relasi *One-to-Many* dengan **transaction\_items** (Satu struk belanja terdiri dari banyak menu).  
  * **products** memiliki relasi *One-to-Many* dengan **transaction\_items** (Menu ditautkan ke detail transaksi).  
* **Relasi Historis & AI:**  
  * **materials** memiliki relasi *One-to-Many* dengan **inventory\_logs** (Satu bahan dicatat sisa stoknya setiap hari).  
  * Tabel **ai\_cluster\_results** merujuk pada products, dan **ai\_prediction\_results** merujuk pada materials.

## **4\. Kamus Data (Data Dictionary)**

Berikut adalah rincian detail struktur kolom untuk masing-masing tabel:

### **A. KELOMPOK PENGGUNA & LOG (USERS & AUDIT)**

#### **1\. Tabel user\_roles**

Mengelola jabatan staf.

| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :---- | :---- | :---- | :---- |
| user\_id | UUID | PK, FK | Merujuk ke auth.users(id). ON DELETE CASCADE. |
| role | VARCHAR(50) | NOT NULL | Jabatan staf (Hanya boleh diisi: 'admin', 'kasir', 'manajemen\_bahan'). |

#### **2\. Tabel activity\_logs**

Mencatat riwayat aktivitas pengguna untuk audit sistem.

| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :---- | :---- | :---- | :---- |
| id | UUID | PRIMARY KEY | ID unik log. |
| user\_id | UUID | FK | Merujuk ke auth.users(id). ON DELETE SET NULL. |
| action\_type | VARCHAR(100) | NOT NULL | Jenis aksi (cth: 'CREATE\_MENU', 'UPDATE\_STOCK'). |
| description | TEXT | NOT NULL | Detail teks aktivitas (cth: "Admin menambah menu X"). |
| created\_at | TIMESTAMPZ | DEFAULT NOW() | Waktu aktivitas dilakukan. |

### **B. KELOMPOK DATA MASTER (PRODUK & BAHAN)**

#### **3\. Tabel products**

Katalog menu yang dijual.

| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :---- | :---- | :---- | :---- |
| id | UUID | PRIMARY KEY | ID unik produk. |
| name | VARCHAR(255) | NOT NULL | Nama menu. |
| price | DECIMAL(10,2) | NOT NULL | Harga jual. |
| cost\_price | DECIMAL(10,2) | NOT NULL | Harga modal (untuk kalkulasi AI). |
| category | VARCHAR(100) | NOT NULL | Kategori menu (Kopi, Non-Kopi, Makanan). |
| image\_url | TEXT | NULLABLE | Tautan URL gambar. |

#### **4\. Tabel materials**

Data persediaan bahan baku mentah.

| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :---- | :---- | :---- | :---- |
| id | UUID | PRIMARY KEY | ID unik bahan baku. |
| name | VARCHAR(255) | NOT NULL | Nama bahan. |
| current\_stock | DECIMAL(10,2) | DEFAULT 0 | Jumlah stok fisik saat ini (real-time). |
| unit | VARCHAR(50) | NOT NULL | Satuan ukur (gram, ml, pcs). |

#### **5\. Tabel product\_materials (Resep / BoM)**

| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :---- | :---- | :---- | :---- |
| id | UUID | PRIMARY KEY | ID unik relasi. |
| product\_id | UUID | FK | Merujuk ke products(id). |
| material\_id | UUID | FK | Merujuk ke materials(id). |
| quantity\_used | DECIMAL(10,2) | NOT NULL | Takaran bahan yang dikurangi tiap 1 porsi terjual. |

### **C. KELOMPOK DATA TRANSAKSIONAL**

#### **6\. Tabel transactions**

Kepala (header) dari struk transaksi pembayaran.

| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :---- | :---- | :---- | :---- |
| id | UUID | PRIMARY KEY | ID unik struk belanja. |
| total\_amount | DECIMAL(12,2) | NOT NULL | Total yang dibayar pelanggan. |
| payment\_method | VARCHAR(50) | NOT NULL | Jenis pembayaran (Cash, QRIS, Debit). |
| created\_at | TIMESTAMPZ | DEFAULT NOW() | Waktu transaksi. **Krusial untuk filter AI.** |

#### **7\. Tabel transaction\_items**

Rincian menu yang dibeli di dalam transaksi.

| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :---- | :---- | :---- | :---- |
| id | UUID | PRIMARY KEY | ID unik detail transaksi. |
| transaction\_id | UUID | FK | Merujuk ke transactions(id). |
| product\_id | UUID | FK | Merujuk ke products(id). |
| quantity | INT | NOT NULL | Jumlah porsi yang dipesan. |
| subtotal | DECIMAL(12,2) | NOT NULL | price x quantity. |
| profit\_margin | DECIMAL(10,2) | NOT NULL | Keuntungan statis yang di-*snapshot* hari itu. |

#### **8\. Tabel inventory\_logs**

Bahan bakar untuk algoritma Regresi Linier. Menyimpan snapshot stok harian.

| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :---- | :---- | :---- | :---- |
| id | UUID | PRIMARY KEY | ID log unik. |
| material\_id | UUID | FK | Merujuk ke materials(id). |
| date | DATE | DEFAULT TODAY | Tanggal pencatatan. |
| stock\_used | DECIMAL(10,2) | DEFAULT 0 | Bahan yang terpakai pada hari tersebut. |
| end\_of\_day\_stock | DECIMAL(10,2) | NOT NULL | Sisa stok akhir hari (**Sumbu Y** regresi AI). |

### **D. KELOMPOK HASIL KECERDASAN BUATAN (AI)**

#### **9\. Tabel ai\_cluster\_results**

Kesimpulan K-Means Clustering.

| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :---- | :---- | :---- | :---- |
| id | UUID | PRIMARY KEY | ID hasil AI. |
| product\_id | UUID | FK | Merujuk ke products(id). |
| cluster\_label | VARCHAR(50) | NOT NULL | Label kesimpulan (cth: "Laris & Untung Besar"). |
| silhouette\_score | DECIMAL(5,4) | NULLABLE | Skor metrik evaluasi cluster. |

#### **10\. Tabel ai\_prediction\_results**

Ramalan stok bahan baku (Regresi Linier).

| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :---- | :---- | :---- | :---- |
| id | UUID | PRIMARY KEY | ID hasil AI. |
| material\_id | UUID | FK | Merujuk ke materials(id). |
| predicted\_stock | DECIMAL(10,2) | NOT NULL | Ramalan sisa stok di hari ke-7 ke depan. |
| mape\_score | DECIMAL(5,2) | NOT NULL | Margin error prediksi AI. |

## **5\. Keamanan Basis Data (RLS Policies)**

Seluruh tabel di atas dikunci menggunakan **Row Level Security (RLS)** dengan arsitektur sebagai berikut:

* **Admin:** Memiliki akses baca, tulis, ubah, dan hapus (ALL) ke seluruh tabel yang ada di dalam database.  
* **Kasir:** Hanya diberikan akses INSERT ke tabel transactions, transaction\_items, dan activity\_logs. Mereka bisa membaca (SELECT) tabel products namun dilarang keras mengubah harganya.  
* **Manajemen Bahan:** Hanya memiliki akses untuk membaca dan mengubah data di dalam tabel materials, inventory\_logs, dan mencatat di activity\_logs.