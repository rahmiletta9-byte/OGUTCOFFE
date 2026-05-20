# **DEKOMPOSISI BACKEND FLASK (TAHAP 2 DARI 3\)**

**Tahap 2: Spesifikasi API & In-Memory N-Gram**

**Sistem Point of Sales (POS) Ogut Coffee**

Dokumen ini merinci langkah-langkah untuk membangun "otak" dari fitur *Smart Input Assistance*. Kita akan memanfaatkan RAM peladen (In-Memory Dictionary di Python) untuk menyimpan statistik popularitas menu, sehingga respons API bisa sangat cepat (kurang dari 50 milidetik).

## **2.1. Membangun Logika N-Gram Cache (memory/ngram\_cache.py)**

Langkah ini adalah membuat struktur data *Dictionary* yang menyimpan pasangan nama menu dan skor popularitasnya (frekuensi pembelian).

**Langkah Eksekusi:**

1. Buka file memory/ngram\_cache.py.  
2. Tulis kode berikut untuk mengatur logika pencarian dan pembaruan (*increment*):  
   from config.supabase\_client import db

   \# Ini adalah memori RAM utama kita (Dictionary)  
   \# Format: {"Kopi Susu Gula Aren": 150, "Kentang Goreng": 85}  
   NGRAM\_DATA \= {}

   def load\_initial\_data():  
       """Menarik daftar menu dasar dari Supabase saat server pertama kali menyala."""  
       global NGRAM\_DATA  
       print("Memuat data awal N-Gram dari Supabase...")  
       try:  
           response \= db.table('products').select('name').execute()  
           products \= response.data  
           for p in products:  
               name \= p.get('name')  
               if name and name not in NGRAM\_DATA:  
                   \# Beri skor 0 sebagai awalan jika belum ada  
                   NGRAM\_DATA\[name\] \= 0  
           print(f"Berhasil memuat {len(NGRAM\_DATA)} menu ke dalam RAM.")  
       except Exception as e:  
           print("Gagal memuat data awal N-Gram:", e)

   def get\_suggestions(query):  
       """Mencari menu berdasarkan kata kunci dan mengurutkannya berdasarkan skor tertinggi."""  
       if not query:  
           return \[\]

       query\_lower \= query.lower()  
       results \= \[\]

       \# Cari kecocokan substring  
       for name, score in NGRAM\_DATA.items():  
           if query\_lower in name.lower():  
               results.append({"name": name, "score": score})

       \# Urutkan dari skor tertinggi ke terendah  
       results.sort(key=lambda x: x\['score'\], reverse=True)

       \# Kembalikan hanya 5 nama teratas (buang skornya, cukup namanya saja untuk React)  
       return \[item\['name'\] for item in results\[:5\]\]

   def increment\_frequency(items\_list):  
       """Menambah skor menu saat transaksi terjadi (Fire-and-forget)."""  
       global NGRAM\_DATA  
       for item in items\_list:  
           if item in NGRAM\_DATA:  
               NGRAM\_DATA\[item\] \+= 1  
           else:  
               NGRAM\_DATA\[item\] \= 1

## **2.2. Membuat Jalur Endpoint API (api/routes.py)**

Langkah ini bertugas menerjemahkan fungsi internal di atas menjadi URL (Endpoint) yang bisa dihubungi (*di-fetch*) oleh React. Kita menggunakan Blueprint agar jalur kode lebih rapi.

**Langkah Eksekusi:**

1. Buka file api/routes.py.  
2. Tulis kode rute API berikut:  
   from flask import Blueprint, request, jsonify  
   from memory.ngram\_cache import get\_suggestions, increment\_frequency

   \# Membuat Blueprint untuk grup API  
   api\_bp \= Blueprint('api', \_\_name\_\_)

   @api\_bp.route('/api/suggest', methods=\['GET'\])  
   def suggest():  
       """  
       Endpoint untuk mencari menu.   
       Contoh akses: GET /api/suggest?q=kopi  
       """  
       query \= request.args.get('q', '')

       \# Memanggil fungsi di memori RAM  
       results \= get\_suggestions(query)

       \# Mengembalikan hasil ke React dalam bentuk Array JSON  
       return jsonify(results), 200

   @api\_bp.route('/api/ngram/increment', methods=\['POST'\])  
   def increment():  
       """  
       Endpoint untuk menambah skor (dipanggil diam-diam setelah Checkout).  
       Contoh Body: { "items": \["Kopi Susu Gula Aren"\] }  
       """  
       data \= request.get\_json()

       if not data or 'items' not in data:  
           return jsonify({"error": "Format data salah"}), 400

       items \= data.get('items', \[\])

       \# Memanggil fungsi penambahan skor di RAM  
       increment\_frequency(items)

       return jsonify({"status": "success", "message": "N-Gram berhasil diperbarui"}), 200

## **2.3. Registrasi Rute ke Aplikasi Utama (app.py)**

Modul rute dan memori yang sudah dibuat harus didaftarkan (*didaftarkan ulang*) ke dalam file utama app.py agar dikenali oleh peladen Flask saat menyala.

**Langkah Eksekusi:**

1. Buka file app.py.  
2. Ubah kodenya dengan menambahkan *Blueprint* dan memanggil inisialisasi data:  
   from flask import Flask, jsonify  
   from flask\_cors import CORS

   \# Import rute dan memori yang baru dibuat  
   from api.routes import api\_bp  
   from memory.ngram\_cache import load\_initial\_data

   app \= Flask(\_\_name\_\_)

   \# Mengaktifkan CORS agar React (berbeda port/domain) bisa mengakses  
   CORS(app)

   \# Mendaftarkan rute dari routes.py  
   app.register\_blueprint(api\_bp)

   @app.route('/api/health', methods=\['GET'\])  
   def health\_check():  
       return jsonify({"status": "active"}), 200

   if \_\_name\_\_ \== '\_\_main\_\_':  
       \# Muat data produk dari Supabase ke dalam RAM tepat sebelum server menyala\!  
       load\_initial\_data()

       \# Menyalakan server  
       app.run(host='0.0.0.0', port=5000, debug=True)

## **2.4. Pengujian API (API Testing)**

Untuk memastikan *endpoint* berfungsi dengan baik, jalankan peladen Flask (python app.py) dan lakukan uji coba.

**Skenario Pengujian (Bisa via Browser atau ekstensi Thunder Client/Postman):**

1. **Uji Pengetikan (GET):** Buka peramban (*browser*) dan ketik:  
   http://localhost:5000/api/suggest?q=ko  
   *Ekspektasi Output:* \["Kopi Susu Gula Aren", "Kopi Hitam", ...\]  
2. **Uji Transaksi (POST):** Kirim *request* POST ke http://localhost:5000/api/ngram/increment dengan *body* JSON:  
   { "items": \["Kopi Susu Gula Aren"\] }  
   *Ekspektasi Output:* {"status": "success", "message": "..."}  
3. Lakukan **Uji Pengetikan (GET)** ulang. Seharusnya "Kopi Susu Gula Aren" sekarang naik ke peringkat atas (jika sebelumnya ada menu kopi lain) karena skornya baru saja ditambah.

**Status Penyelesaian Tahap 2:**

Jika simulasi pengujian pada tahap 2.4 berjalan mulus dan merespons dalam hitungan milidetik, maka inti utama sistem untuk mendukung kasir berkecepatan tinggi sudah berfungsi penuh.

Proyek siap dilanjutkan ke **Tahap 3 (Perancangan Modul Kecerdasan Buatan / AI)**.