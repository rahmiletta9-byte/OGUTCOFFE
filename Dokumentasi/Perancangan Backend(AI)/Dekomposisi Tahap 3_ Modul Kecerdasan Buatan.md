# **DEKOMPOSISI BACKEND FLASK (TAHAP 3 DARI 3\)**

**Tahap 3: Perancangan Modul Kecerdasan Buatan (AI) & Penjadwalan**

**Sistem Point of Sales (POS) Ogut Coffee**

Dokumen ini merinci langkah-langkah implementasi algoritma *Machine Learning* menggunakan pustaka scikit-learn dan pandas. Modul ini tidak akan diakses melalui API oleh kasir, melainkan akan dieksekusi secara otomatis oleh peladen (server) pada malam hari untuk menghasilkan wawasan bisnis bagi manajer.

## **3.1. Membangun Logika Segmentasi Menu (ai\_services/kmeans\_clustering.py)**

Langkah ini bertujuan mengelompokkan menu menjadi 3 kategori (Laris & Untung Besar, Menengah, Kurang Laris) berdasarkan volume penjualan dan rata-rata margin profit selama 30 hari terakhir.

**Langkah Eksekusi:**

1. Buka file ai\_services/kmeans\_clustering.py.  
2. Tulis kode logika ekstraksi, pelatihan (*training*), dan penyimpanan berikut:  
   import pandas as pd  
   from sklearn.preprocessing import MinMaxScaler  
   from sklearn.cluster import KMeans  
   from sklearn.metrics import silhouette\_score  
   from config.supabase\_client import db

   def run\_kmeans():  
       print("\[AI JOB\] Memulai K-Means Clustering...")  
       try:  
           \# 1\. Ekstraksi Data (ETL) dari Supabase  
           \# (Asumsi: Mengambil rekap penjualan per produk dari transaksi 30 hari terakhir)  
           \# Untuk simplifikasi, kita asumsikan kita memiliki view/query yang menghasilkan:  
           \# \[{'product\_id': '...', 'volume': 150, 'profit\_margin': 1500000}, ...\]

           response \= db.table('transaction\_items').select('product\_id, quantity, profit\_margin').execute()  
           data \= response.data

           if not data or len(data) \< 10:  
               print("\[AI JOB\] Data transaksi belum cukup untuk K-Means.")  
               return

           df \= pd.DataFrame(data)

           \# Agregasi data (Total volume & Rata-rata margin per produk)  
           agg\_df \= df.groupby('product\_id').agg(  
               volume=('quantity', 'sum'),  
               margin=('profit\_margin', 'mean')  
           ).reset\_index()

           \# 2\. Transformasi & Normalisasi Data  
           scaler \= MinMaxScaler()  
           agg\_df\[\['vol\_scaled', 'margin\_scaled'\]\] \= scaler.fit\_transform(agg\_df\[\['volume', 'margin'\]\])

           \# 3\. Training Model K-Means  
           kmeans \= KMeans(n\_clusters=3, random\_state=42, n\_init=10)  
           agg\_df\['cluster'\] \= kmeans.fit\_predict(agg\_df\[\['vol\_scaled', 'margin\_scaled'\]\])

           \# Evaluasi Kualitas Cluster  
           score \= silhouette\_score(agg\_df\[\['vol\_scaled', 'margin\_scaled'\]\], agg\_df\['cluster'\])

           \# 4\. Melabeli Cluster (Logika Bisnis)  
           \# (Cluster dengan rata-rata volume & margin tertinggi \= Laris & Untung Besar)  
           cluster\_centers \= agg\_df.groupby('cluster')\[\['vol\_scaled', 'margin\_scaled'\]\].mean().sum(axis=1)  
           best\_cluster \= cluster\_centers.idxmax()  
           worst\_cluster \= cluster\_centers.idxmin()

           def get\_label(c):  
               if c \== best\_cluster: return 'Laris & Untung Besar'  
               elif c \== worst\_cluster: return 'Kurang Laris'  
               else: return 'Menengah'

           agg\_df\['label'\] \= agg\_df\['cluster'\].apply(get\_label)

           \# 5\. Load (Simpan kembali ke Supabase)  
           \# Kosongkan hasil evaluasi lama  
           db.table('ai\_cluster\_results').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()

           \# Insert hasil baru  
           insert\_data \= \[\]  
           for \_, row in agg\_df.iterrows():  
               insert\_data.append({  
                   "product\_id": row\['product\_id'\],  
                   "cluster\_label": row\['label'\],  
                   "silhouette\_score": float(score)  
               })

           db.table('ai\_cluster\_results').insert(insert\_data).execute()  
           print(f"\[AI JOB\] K-Means selesai. Silhouette Score: {score:.2f}")

       except Exception as e:  
           print(f"\[AI JOB\] Error K-Means: {e}")

## **3.2. Membangun Logika Prediksi Stok (ai\_services/linear\_regression.py)**

Langkah ini melatih algoritma regresi untuk setiap bahan baku guna memprediksi sisa stok 7 hari ke depan berdasarkan pola konsumsi masa lalu.

**Langkah Eksekusi:**

1. Buka file ai\_services/linear\_regression.py.  
2. Tulis kode *Time-Series Regression* berikut:  
   import pandas as pd  
   import numpy as np  
   from sklearn.linear\_model import LinearRegression  
   from sklearn.metrics import mean\_absolute\_percentage\_error  
   from config.supabase\_client import db

   def run\_regression():  
       print("\[AI JOB\] Memulai Prediksi Stok (Regresi Linier)...")  
       try:  
           \# 1\. Ekstraksi Log Inventaris (Minimal butuh data 7-14 hari ke belakang)  
           response \= db.table('inventory\_logs').select('\*').order('date', desc=False).execute()  
           data \= response.data

           if not data:  
               print("\[AI JOB\] Data inventory\_logs kosong.")  
               return

           df \= pd.DataFrame(data)

           \# Bersihkan data lama  
           db.table('ai\_prediction\_results').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()

           insert\_data \= \[\]

           \# 2\. Proses Model untuk SETIAP Bahan Baku (material\_id) secara terpisah  
           materials \= df\['material\_id'\].unique()

           for mat\_id in materials:  
               mat\_df \= df\[df\['material\_id'\] \== mat\_id\].copy()

               if len(mat\_df) \< 5:  
                   continue \# Lewati jika data histori kurang dari 5 hari

               \# X \= Indeks Waktu (1, 2, 3...) | y \= Sisa Stok Aktual  
               X \= np.array(range(1, len(mat\_df) \+ 1)).reshape(-1, 1\)  
               y \= mat\_df\['end\_of\_day\_stock'\].values

               \# 3\. Training Model AI  
               model \= LinearRegression()  
               model.fit(X, y)

               \# Hitung MAPE (Tingkat Error)  
               y\_pred\_train \= model.predict(X)  
               \# Hindari pembagian dengan nol jika stok \= 0  
               mape \= mean\_absolute\_percentage\_error(y \+ 0.001, y\_pred\_train) \* 100 

               \# 4\. Prediksi 7 Hari ke Depan  
               future\_days \= np.array(range(len(mat\_df) \+ 1, len(mat\_df) \+ 8)).reshape(-1, 1\)  
               predictions \= model.predict(future\_days)

               \# Cari titik terendah stok dalam minggu depan (Jangan sampai minus)  
               lowest\_stock\_7d \= max(0, min(predictions))

               \# 5\. Siapkan data untuk disimpan  
               insert\_data.append({  
                   "material\_id": mat\_id,  
                   "predicted\_stock": float(lowest\_stock\_7d),  
                   "mape\_score": float(mape)  
               })

           \# Simpan Hasil Prediksi  
           if insert\_data:  
               db.table('ai\_prediction\_results').insert(insert\_data).execute()  
               print(f"\[AI JOB\] Regresi Linier selesai untuk {len(insert\_data)} bahan baku.")

       except Exception as e:  
           print(f"\[AI JOB\] Error Regresi Linier: {e}")

## **3.3. Mengatur Penjadwalan Tugas (app.py)**

Agar fungsi AI di atas tidak perlu dijalankan secara manual, kita menggunakan APScheduler untuk mengeksekusinya secara otomatis di *background* setiap pukul 23:59.

**Langkah Eksekusi:**

1. Buka kembali file utama app.py.  
2. Integrasikan BackgroundScheduler ke dalam kerangka Flask yang sudah ada:  
   from flask import Flask, jsonify  
   from flask\_cors import CORS  
   import atexit

   \# Import rute, cache, dan modul AI  
   from api.routes import api\_bp  
   from memory.ngram\_cache import load\_initial\_data  
   from ai\_services.kmeans\_clustering import run\_kmeans  
   from ai\_services.linear\_regression import run\_regression

   \# Import Scheduler  
   from apscheduler.schedulers.background import BackgroundScheduler

   app \= Flask(\_\_name\_\_)  
   CORS(app)

   \# Mendaftarkan API  
   app.register\_blueprint(api\_bp)

   \# Fungsi pembungkus untuk menjalankan semua Job AI  
   def run\_nightly\_ai\_jobs():  
       print("\\n--- MEMULAI BATCH PROCESSING AI MALAM HARI \---")  
       run\_kmeans()  
       run\_regression()  
       print("--- BATCH PROCESSING SELESAI \---\\n")

   if \_\_name\_\_ \== '\_\_main\_\_':  
       \# 1\. Muat data N-Gram ke RAM (Hanya jalan sekali saat server menyala)  
       load\_initial\_data()

       \# 2\. Konfigurasi dan Nyalakan Scheduler  
       scheduler \= BackgroundScheduler()  
       \# Jadwalkan fungsi AI jalan setiap hari pukul 23:59  
       scheduler.add\_job(func=run\_nightly\_ai\_jobs, trigger="cron", hour=23, minute=59)  
       scheduler.start()

       \# Pastikan scheduler dimatikan dengan aman saat server dihentikan paksa (Ctrl+C)  
       atexit.register(lambda: scheduler.shutdown())

       \# 3\. Nyalakan server Flask  
       print("Server Flask berjalan. Menunggu API Call dan Jadwal AI...")  
       app.run(host='0.0.0.0', port=5000, debug=False)   
       \# Note: Set debug=False saat menggunakan Scheduler agar job tidak jalan 2x (dobel) karena auto-reload.

## **3.4. Persiapan Deployment (Server Produksi)**

Skrip Flask sudah selesai 100%. Untuk membawa proyek ini dari komputer lokal Anda (localhost) menuju server publik internet (Production), perhatikan hal berikut:

1. **Gunakan Gunicorn (WSGI):** Saat dirilis, Flask tidak boleh dijalankan dengan perintah python app.py. Jalankan melalui Gunicorn agar mampu menangani banyak *request* kasir secara bersamaan.  
   **Perintah Rilis:**  
   gunicorn \-w 1 \--threads 4 app:app

   *(Penting: Batasi pekerja/worker \-w 1 agar cache N-Gram Dictionary di RAM tidak terbelah menjadi beberapa memori yang terpisah, namun tingkatkan \--threads 4 agar antrean cepat).*  
2. **Syarat Layanan Hosting:**  
   Anda **WAJIB** menggunakan layanan *hosting* tipe *Platform as a Service (PaaS)* atau Virtual Machine (VPS) yang menyala secara terus-menerus (24/7), contohnya: **Render.com (Web Services)** atau **Railway.app**.  
   Anda **TIDAK BOLEH** menggunakan layanan *Serverless* (seperti Vercel, Netlify, atau AWS Lambda) karena fungsi APScheduler tidak akan pernah berjalan dan memori RAM N-Gram akan terus tereset.

**Status Penyelesaian Tahap 3:**

Selamat\! Backend Microservice Anda telah lengkap. Peladen ini sekarang tidak hanya melayani fitur ketik cepat (N-Gram) di siang hari, tetapi juga secara otonom bekerja di malam hari memproses jutaan komputasi AI demi menyajikan dasbor analitik bisnis yang cerdas bagi Ogut Coffee di keesokan harinya.