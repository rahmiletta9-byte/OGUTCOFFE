# **DEKOMPOSISI BACKEND FLASK (TAHAP 1 DARI 3\)**

**Tahap 1: Setup Flask & Konfigurasi Awal**

**Sistem Point of Sales (POS) Ogut Coffee**

Dokumen ini merinci langkah-langkah teknis operasional untuk membangun fondasi peladen (backend) menggunakan Python dan Flask. Tahap ini berfokus pada persiapan lingkungan kerja, struktur arsitektur modular, dan pembuatan jembatan koneksi ke basis data Supabase sebelum logika API dan AI ditulis.

## **1.1. Persiapan Virtual Environment**

Praktik terbaik dalam pengembangan Python adalah menggunakan *Virtual Environment* (Lingkungan Virtual) agar pustaka (library) yang diinstal untuk proyek ini tidak bentrok dengan proyek Python lain di komputer Anda.

**Langkah Eksekusi:**

1. Buka terminal/Command Prompt.  
2. Buat direktori baru untuk *backend* dan masuk ke dalamnya:  
   mkdir backend-pos  
   cd backend-pos

3. Buat lingkungan virtual bernama venv:  
   * **Windows:** python \-m venv venv  
   * **Mac/Linux:** python3 \-m venv venv  
4. Aktifkan lingkungan virtual tersebut:  
   * **Windows:** venv\\Scripts\\activate  
   * **Mac/Linux:** source venv/bin/activate  
     *(Indikator berhasil: Akan muncul tulisan (venv) di awal baris terminal Anda).*

## **1.2. Instalasi Pustaka Utama (Dependencies)**

Mengunduh seluruh modul yang diperlukan untuk membangun *server* API, menghubungkan ke basis data, dan menjalankan komputasi *Machine Learning*.

**Langkah Eksekusi:**

1. Pastikan (venv) masih aktif.  
2. Jalankan perintah instalasi berikut:  
   pip install Flask flask-cors supabase apscheduler pandas scikit-learn python-dotenv gunicorn

3. Simpan daftar pustaka tersebut ke dalam file requirements.txt agar mudah di- *deploy* ke peladen produksi nantinya:  
   pip freeze \> requirements.txt

## **1.3. Konfigurasi Variabel Lingkungan (.env)**

Menyimpan kunci rahasia (*secret keys*) secara aman agar tidak terekspos di dalam kode sumber (*source code*).

**Langkah Eksekusi:**

1. Buat file baru bernama .env tepat di direktori *root* (backend-pos/).  
2. Isi dengan konfigurasi berikut:  
   \# URL Proyek Supabase Anda  
   SUPABASE\_URL=https://\<ganti-dengan-project-ref-anda\>.supabase.co

   \# PENTING: Gunakan service\_role\_key (Secret), JANGAN gunakan anon/public key\!  
   SUPABASE\_KEY=\<ganti-dengan-service-role-key-anda\>

   FLASK\_ENV=development  
   PORT=5000

   *(Catatan: service\_role\_key digunakan agar Flask memiliki hak istimewa / Admin Privilege untuk mem-bypass Row Level Security (RLS) saat memproses data AI di malam hari).*

## **1.4. Pembentukan Struktur Direktori Modular**

Membangun hierarki folder (*Layered Architecture*) untuk memisahkan antara pengatur koneksi, jalur API, dan logika Kecerdasan Buatan.

**Langkah Eksekusi:**

Buat susunan folder dan file (kosong) berikut di dalam direktori backend-pos/:

backend-pos/  
├── .env  
├── requirements.txt  
├── app.py                \# File utama (Entry point)  
│  
├── config/               \# Folder untuk konfigurasi eksternal  
│   └── supabase\_client.py   
│  
├── api/                  \# Folder untuk rute/jalur API  
│   └── routes.py           
│  
├── memory/               \# Folder khusus In-Memory Cache (N-Gram)  
│   └── ngram\_cache.py      
│  
└── ai\_services/          \# Folder khusus algoritma Machine Learning  
    ├── kmeans\_clustering.py   
    └── linear\_regression.py 

## **1.5. Konfigurasi Koneksi Supabase**

Membuat modul tunggal yang bertugas membaca file .env dan membuka jalur komunikasi resmi ke basis data Supabase.

**Langkah Eksekusi:**

1. Buka file config/supabase\_client.py.  
2. Tulis kode inisialisasi berikut:  
   import os  
   from dotenv import load\_dotenv  
   from supabase import create\_client, Client

   \# Memuat variabel dari file .env  
   load\_dotenv()

   url: str \= os.environ.get("SUPABASE\_URL")  
   key: str \= os.environ.get("SUPABASE\_KEY")

   \# Membuat instance Supabase Client yang akan di-import oleh file lain  
   db: Client \= create\_client(url, key)

## **1.6. Inisialisasi Kerangka Aplikasi Utama (app.py)**

Membangun file utama yang akan menyatukan semua modul dan menyalakan peladen web Flask. Untuk tahap awal, kita buat kerangka dasarnya beserta pengecekan kesehatan server (*Health Check*).

**Langkah Eksekusi:**

1. Buka file app.py.  
2. Tulis kode dasar berikut:  
   from flask import Flask, jsonify  
   from flask\_cors import CORS

   app \= Flask(\_\_name\_\_)

   \# Mengaktifkan CORS agar React (berbeda port/domain) bisa mengakses API ini  
   CORS(app)

   \# Endpoint sementara untuk memastikan server menyala  
   @app.route('/api/health', methods=\['GET'\])  
   def health\_check():  
       return jsonify({  
           "status": "active",  
           "message": "Backend POS Ogut Coffee Flask Server is running\!"  
       }), 200

   if \_\_name\_\_ \== '\_\_main\_\_':  
       \# Menyalakan server pada port 5000  
       app.run(host='0.0.0.0', port=5000, debug=True)

**Status Penyelesaian Tahap 1:**

Untuk menguji apakah tahap ini berhasil, jalankan perintah python app.py di terminal Anda. Jika server menyala tanpa *error*, buka browser dan akses http://localhost:5000/api/health. Jika muncul pesan JSON *"status": "active"*, maka kerangka peladen Anda sudah siap\!

Proyek siap dilanjutkan ke **Tahap 2 (Spesifikasi API & Endpoints)**.