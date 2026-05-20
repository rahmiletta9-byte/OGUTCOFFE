# **DEKOMPOSISI UI BACKEND FLASK (CONTROL PANEL)**

**Dasbor Pemantauan & Explainable AI (XAI)**

**Sistem Point of Sales (POS) Ogut Coffee**

Dokumen ini merinci langkah-langkah untuk membangun antarmuka web internal yang di- *host* langsung oleh peladen Flask. Dasbor ini berfungsi sebagai *Control Panel* bagi tim IT/Admin untuk memantau kesehatan server, mengintip isi memori RAM (N-Gram), dan memahami bagaimana algoritma *Machine Learning* mengambil keputusan. Dasbor ini dilindungi oleh sistem login sederhana menggunakan konfigurasi JSON.

## **TAHAP 1: Konfigurasi Keamanan (Login Berbasis JSON)**

Tahap ini berfokus pada pengamanan rute dasbor Admin. Kita akan membuat file config.json untuk menyimpan kredensial (username & password), membuat halaman Login, dan membuat fungsi pelindung halaman (decorator).

**Langkah Eksekusi:**

1. **Membuat File Konfigurasi Kredensial (config.json):**  
   Buat file config.json di *root* direktori backend-pos/. File ini akan dibaca oleh Flask saat server menyala.  
   {  
     "admin\_username": "admin\_it",  
     "admin\_password": "supersecretpassword123"  
   }

2. **Membuat File templates/login.html:**  
   Buat antarmuka form login sederhana menggunakan TailwindCSS.  
   \<\!DOCTYPE html\>  
   \<html lang="id"\>  
   \<head\>  
       \<title\>Login Control Panel \- Flask\</title\>  
       \<script src="\[https://cdn.tailwindcss.com\](https://cdn.tailwindcss.com)"\>\</script\>  
   \</head\>  
   \<body class="bg-slate-100 flex items-center justify-center h-screen"\>  
       \<div class="bg-white p-8 rounded-xl shadow-md w-96"\>  
           \<h1 class="text-2xl font-bold text-center text-slate-800 mb-6"\>🔒 Flask IT Login\</h1\>

           {% if error %}  
           \<div class="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm"\>{{ error }}\</div\>  
           {% endif %}

           \<form action="/admin/login" method="POST" class="space-y-4"\>  
               \<div\>  
                   \<label class="block text-sm text-slate-600 mb-1"\>Username\</label\>  
                   \<input type="text" name="username" required class="w-full p-2 border rounded focus:ring-2 focus:ring-slate-800"\>  
               \</div\>  
               \<div\>  
                   \<label class="block text-sm text-slate-600 mb-1"\>Password\</label\>  
                   \<input type="password" name="password" required class="w-full p-2 border rounded focus:ring-2 focus:ring-slate-800"\>  
               \</div\>  
               \<button type="submit" class="w-full bg-slate-900 text-white font-bold p-2 rounded hover:bg-slate-800"\>  
                   Masuk Sistem  
               \</button\>  
           \</form\>  
       \</div\>  
   \</body\>  
   \</html\>

3. **Menambahkan Logika Sesi & Dekorator di app.py:**  
   Atur secret\_key untuk keamanan sesi (session), baca file JSON, dan buat *decorator* @login\_required.  
   import json  
   from functools import wraps  
   from flask import Flask, render\_template, request, redirect, session, url\_for

   app \= Flask(\_\_name\_\_)  
   app.secret\_key \= 'kunci\_rahasia\_sesi\_flask\_yang\_sangat\_panjang' \# Ganti dengan string acak yang aman

   \# Memuat Kredensial dari JSON  
   with open('config.json') as f:  
       admin\_config \= json.load(f)

   \# Dekorator untuk Melindungi Rute Admin  
   def login\_required(f):  
       @wraps(f)  
       def decorated\_function(\*args, \*\*kwargs):  
           if 'logged\_in' not in session:  
               return redirect(url\_for('admin\_login'))  
           return f(\*args, \*\*kwargs)  
       return decorated\_function

   \# Rute Login  
   @app.route('/admin/login', methods=\['GET', 'POST'\])  
   def admin\_login():  
       if request.method \== 'POST':  
           username \= request.form\['username'\]  
           password \= request.form\['password'\]

           if username \== admin\_config\['admin\_username'\] and password \== admin\_config\['admin\_password'\]:  
               session\['logged\_in'\] \= True  
               return redirect(url\_for('admin\_dashboard'))  
           else:  
               return render\_template('login.html', error="Username atau Password salah\!")

       return render\_template('login.html')

   \# Rute Logout  
   @app.route('/admin/logout')  
   def admin\_logout():  
       session.pop('logged\_in', None)  
       return redirect(url\_for('admin\_login'))

## **TAHAP 2: Setup Tampilan Dasar & Manajemen Service**

Tahap ini berfokus pada pembuatan halaman utama (*Dashboard*) yang menampilkan status server, penggunaan memori, dan status penjadwalan tugas (APScheduler). **Semua rute di sini wajib dilindungi oleh @login\_required.**

**Langkah Eksekusi:**

1. **Membuat File templates/dashboard.html:**  
   Tambahkan tombol *Logout* dan struktur tata letak menu.  
   \<\!DOCTYPE html\>  
   \<html lang="id"\>  
   \<head\>  
       \<title\>Flask Control Panel \- Ogut Coffee\</title\>  
       \<script src="\[https://cdn.tailwindcss.com\](https://cdn.tailwindcss.com)"\>\</script\>  
   \</head\>  
   \<body class="bg-slate-100 p-8"\>  
       \<div class="max-w-4xl mx-auto"\>  
           \<\!-- Header Navigasi \--\>  
           \<div class="flex justify-between items-center mb-6"\>  
               \<h1 class="text-2xl font-bold text-slate-800"\>⚙️ Manajemen Service Flask\</h1\>  
               \<div class="space-x-4"\>  
                   \<a href="/admin/ngram" class="text-blue-600 hover:underline font-semibold"\>Cek RAM N-Gram\</a\>  
                   \<a href="/admin/ai-reasoning" class="text-purple-600 hover:underline font-semibold"\>Logika AI\</a\>  
                   \<a href="/admin/logout" class="bg-slate-300 text-slate-800 px-3 py-1 rounded hover:bg-slate-400 font-bold"\>Logout\</a\>  
               \</div\>  
           \</div\>

           \<\!-- Kartu Status \--\>  
           \<div class="bg-white p-6 rounded-xl shadow-md"\>  
               \<div class="grid grid-cols-2 gap-4 mb-6"\>  
                   \<div class="p-4 border rounded-lg bg-green-50"\>  
                       \<h3 class="font-bold text-green-800"\>Status Server\</h3\>  
                       \<p class="text-2xl"\>{{ server\_status }}\</p\>  
                   \</div\>  
                   \<div class="p-4 border rounded-lg bg-blue-50"\>  
                       \<h3 class="font-bold text-blue-800"\>Jadwal AI Selanjutnya\</h3\>  
                       \<p class="text-xl"\>{{ next\_run\_time }}\</p\>  
                   \</div\>  
               \</div\>

               \<form action="/admin/force-run-ai" method="POST"\>  
                   \<button type="submit" class="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700 w-full md:w-auto"\>  
                       ⚠️ Paksa Jalankan AI Sekarang (Force Run)  
                   \</button\>  
               \</form\>  
           \</div\>  
       \</div\>  
   \</body\>  
   \</html\>

2. **Menambahkan Rute UI (Dilindungi) di app.py:**  
   @app.route('/admin/dashboard')  
   @login\_required \# \<--- Tambahkan ini untuk melindungi rute  
   def admin\_dashboard():  
       \# Mengambil status jadwal dari scheduler  
       jobs \= scheduler.get\_jobs()  
       next\_run \= jobs\[0\].next\_run\_time.strftime("%Y-%m-%d %H:%M:%S") if jobs else "Tidak ada jadwal"

       return render\_template('dashboard.html',   
                              server\_status="Aktif (Online)",   
                              next\_run\_time=next\_run)

   @app.route('/admin/force-run-ai', methods=\['POST'\])  
   @login\_required  
   def force\_run\_ai():  
       run\_nightly\_ai\_jobs()  
       return redirect(url\_for('admin\_dashboard'))

## **TAHAP 3: Pengecekan "Healthy" & Visualisasi Memori N-Gram**

Tahap ini bertujuan untuk melihat apa saja yang sedang disimpan oleh Flask di dalam RAM (Dictionary N-Gram).

**Langkah Eksekusi:**

1. **Menambahkan Fungsi Eksport Memori di memory/ngram\_cache.py:**  
   def get\_memory\_stats():  
       """Mengembalikan isi RAM saat ini untuk dipantau Admin"""  
       global NGRAM\_DATA  
       \# Urutkan dari yang paling sering diketik  
       sorted\_data \= dict(sorted(NGRAM\_DATA.items(), key=lambda item: item\[1\], reverse=True))  
       return {  
           "total\_items": len(NGRAM\_DATA),  
           "data": sorted\_data  
       }

2. **Membuat Template templates/ngram\_view.html:**  
   *(Gunakan struktur kerangka Tailwind yang sama, tambahkan tombol kembali ke Dashboard).*  
   \<body class="bg-slate-100 p-8"\>  
       \<div class="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md"\>  
           \<div class="flex justify-between items-center mb-6"\>  
               \<h1 class="text-2xl font-bold"\>🧠 Pemantauan Memori N-Gram (RAM)\</h1\>  
               \<a href="/admin/dashboard" class="text-blue-600 hover:underline font-semibold"\>← Kembali\</a\>  
           \</div\>

           \<p class="mb-4"\>Total Menu dalam Cache: \<b\>{{ stats.total\_items }}\</b\>\</p\>

           \<table class="w-full text-left border"\>  
               \<tr class="bg-slate-100 border-b"\>\<th class="p-2"\>Nama Menu\</th\>\<th class="p-2"\>Skor Popularitas (Hits)\</th\>\</tr\>  
               {% for nama, skor in stats.data.items() %}  
               \<tr class="border-b"\>  
                   \<td class="p-2"\>{{ nama }}\</td\>  
                   \<td class="p-2 font-mono text-orange-600"\>{{ skor }}\</td\>  
               \</tr\>  
               {% endfor %}  
           \</table\>  
       \</div\>  
   \</body\>

3. **Menambahkan Rute di app.py:**  
   from memory.ngram\_cache import get\_memory\_stats

   @app.route('/admin/ngram')  
   @login\_required  
   def admin\_ngram():  
       stats \= get\_memory\_stats()  
       return render\_template('ngram\_view.html', stats=stats)

## **TAHAP 4: Rekapan "Pemikiran" Machine Learning (Explainable AI)**

Menjabarkan **"Alasan Matematis"** di balik hasil K-Means dan Regresi agar tim IT bisa melakukan evaluasi performa model AI.

**Langkah Eksekusi:**

1. **Modifikasi Kode AI (ai\_services/kmeans\_clustering.py):**  
   LAST\_AI\_THOUGHTS \= {}

   \# ... di dalam fungsi run\_kmeans() ...  
   cluster\_centers \= kmeans.cluster\_centers\_

   global LAST\_AI\_THOUGHTS  
   LAST\_AI\_THOUGHTS\['kmeans'\] \= {  
       "alasan": f"AI menemukan 3 titik pusat. Cluster Terbaik berada di koordinat Volume={cluster\_centers\[best\_cluster\]\[0\]:.2f} dan Margin={cluster\_centers\[best\_cluster\]\[1\]:.2f}",  
       "silhouette": score  
   }

2. **Membuat Template templates/ai\_reasoning.html:**  
   \<body class="bg-slate-100 p-8"\>  
       \<div class="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md space-y-6"\>  
           \<div class="flex justify-between items-center mb-2"\>  
               \<h1 class="text-2xl font-bold text-slate-800"\>🤖 Rekapan Logika & Alur Data AI\</h1\>  
               \<a href="/admin/dashboard" class="text-blue-600 hover:underline font-semibold"\>← Kembali\</a\>  
           \</div\>

           \<\!-- K-MEANS REASONING \--\>  
           \<div class="p-4 border border-purple-200 bg-purple-50 rounded-lg"\>  
               \<h2 class="text-xl font-bold text-purple-800"\>Logika K-Means (Segmentasi)\</h2\>  
               \<p class="mt-2 text-sm text-slate-600"\>\<b\>Cara Kerja AI:\</b\> AI mengubah volume dan margin ke skala 0-1, lalu mencari 3 titik keseimbangan (Centroid).\</p\>  
               \<div class="mt-4 p-3 bg-white border rounded font-mono text-sm"\>  
                   \<p\>» Silhouette Score: {{ thoughts.kmeans.silhouette }}\</p\>  
                   \<p\>» Alasan Matematis: {{ thoughts.kmeans.alasan }}\</p\>  
               \</div\>  
           \</div\>

           \<\!-- LINEAR REGRESSION REASONING \--\>  
           \<div class="p-4 border border-red-200 bg-red-50 rounded-lg"\>  
               \<h2 class="text-xl font-bold text-red-800"\>Logika Regresi Linier (Prediksi Stok)\</h2\>  
               \<p class="mt-2 text-sm text-slate-600"\>\<b\>Cara Kerja AI:\</b\> AI menarik garis lurus (y \= mx \+ c) melintasi data historis sisa stok malam hari selama 30 hari terakhir.\</p\>  
               \<div class="mt-4 p-3 bg-white border rounded font-mono text-sm"\>  
                   \<p\>» Model menggunakan fungsi: y\_pred \= model.predict(future\_days)\</p\>  
                   \<p\>» Rata-rata kemelesetan (MAPE): Disimpan per bahan baku di Database.\</p\>  
               \</div\>  
           \</div\>  
       \</div\>  
   \</body\>

3. **Menambahkan Rute di app.py:**  
   from ai\_services.kmeans\_clustering import LAST\_AI\_THOUGHTS

   @app.route('/admin/ai-reasoning')  
   @login\_required  
   def admin\_ai\_reasoning():  
       return render\_template('ai\_reasoning.html', thoughts=LAST\_AI\_THOUGHTS)  
