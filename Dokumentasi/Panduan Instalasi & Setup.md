# Panduan Instalasi & Setup Sistem POS Ogut Coffee

Sistem Point of Sales (POS) Ogut Coffee adalah aplikasi *Fullstack* dengan arsitektur **React.js (Frontend)** dan **Flask/Python (Backend AI & Memory)**, dengan **Supabase** bertindak sebagai *Database* dan jembatan asinkron.

Ikuti panduan di bawah ini untuk mengatur dan menjalankan aplikasi di lingkungan pengembangan (Local/Development).

---

## Prasyarat Lingkungan (Prerequisites)
Pastikan komputer Anda sudah terinstal perangkat lunak berikut:
1. **Git** (Untuk *cloning* repositori)
2. **Node.js** (Minimal versi 18+, direkomendasikan versi 20 LTS) & **npm**
3. **Python** (Minimal versi 3.10+) & **pip**
4. Akun **Supabase** (Jika Anda membangun *database* dari awal, namun untuk kolaborasi biasanya kredensial `.env` akan diberikan).

---

## 1. Menggandakan Repositori (Git Clone)

Langkah pertama adalah mengunduh kode sumber dari repositori utama. Buka terminal atau *command prompt*, lalu ketik:

```bash
git clone https://github.com/username-anda/ogut-pos.git
cd ogut-pos
```
*(Ganti URL GitHub di atas sesuai dengan URL repositori aktual Anda).*

Proyek ini menggunakan struktur *Monorepo* sederhana yang memisahkan aplikasi ke dalam dua folder:
- `frontend/` (React/Vite)
- `backend-pos/` (Flask API)

---

## 2. Setup Frontend (React / Vite)

Frontend bertanggung jawab atas UI/UX Kasir, Dashboard Admin, dan interaksi pengguna.

**A. Instalasi Dependensi**
Masuk ke folder frontend dan pasang pustaka yang dibutuhkan:
```bash
cd frontend
npm install
```

**B. Konfigurasi Variabel Lingkungan (.env)**
Buat file bernama `.env.local` di dalam folder `frontend/` dan isi dengan kredensial berikut:
```env
# Koneksi ke Supabase Database
VITE_SUPABASE_URL=https://<KODE_PROYEK_ANDA>.supabase.co
VITE_SUPABASE_ANON_KEY=<KUNCI_ANON_SUPABASE_ANDA>

# Koneksi ke Backend Flask (N-Gram & AI)
VITE_FLASK_API_URL=http://127.0.0.1:5000
```

**C. Menjalankan Frontend**
```bash
npm run dev
```
Aplikasi akan menyala dan bisa diakses di `http://localhost:5173`.

---

## 3. Setup Backend (Flask / Python)

Backend bertugas mengelola In-Memory Cache (N-Gram) untuk kecepatan pengetikan dan Modul *Machine Learning* (K-Means & Regresi Linier) yang berjalan otomatis di malam hari.

**A. Membuat Virtual Environment**
Sangat disarankan menggunakan *virtual environment* agar pustaka Python tidak bentrok.
Buka tab terminal baru (biarkan terminal Frontend tetap jalan).
```bash
cd backend-pos

# Untuk Windows:
python -m venv venv
venv\Scripts\activate

# Untuk Mac/Linux:
python3 -m venv venv
source venv/bin/activate
```

**B. Instalasi Dependensi**
Setelah `(venv)` aktif, instal pustaka dari `requirements.txt`.
```bash
pip install -r requirements.txt
```
*(Catatan: Jika mengalami kendala, jalankan perintah instalasi manual: `pip install Flask flask-cors supabase apscheduler pandas scikit-learn gunicorn python-dotenv`)*

**C. Konfigurasi Variabel Lingkungan (.env)**
Buat file bernama `.env` di dalam folder `backend-pos/` dan isi kredensial Supabase (Wajib menggunakan *Service Role Key* agar memiliki hak admin/bypass RLS).
```env
SUPABASE_URL=https://<KODE_PROYEK_ANDA>.supabase.co
SUPABASE_KEY=<KUNCI_SERVICE_ROLE_SUPABASE_ANDA>
```

Selain itu, pastikan Anda juga memiliki file `config.json` di dalam `backend-pos/` untuk pengaturan login Dasbor IT.
```json
{
  "admin_username": "admin_it",
  "admin_password": "supersecretpassword123"
}
```

**D. Menjalankan Backend Flask**
```bash
python app.py
```
Peladen backend akan menyala di `http://localhost:5000`. Saat pertama kali menyala, peladen akan menarik data dari Supabase ke dalam RAM selama beberapa detik.

---

## 4. Evaluasi & Penggunaan

Setelah kedua server (Frontend di port `5173` dan Backend di port `5000`) menyala:
1. Buka browser dan arahkan ke `http://localhost:5173`.
2. Lakukan simulasi transaksi (Checkout).
3. Anda dapat memantau *Dashboard Control Panel* backend di `http://localhost:5000/admin/login` (Gunakan kredensial dari `config.json`).
4. Untuk memicu AI secara paksa siang hari guna keperluan testing, buka Control Panel tersebut dan tekan tombol **Force Run**.

---

## 5. Panduan Deployment (Produksi)

Jika Anda ingin meng-online-kan sistem ini, harap ikuti aturan arsitektur berikut:

- **Frontend (React)**: Sangat cocok di-*deploy* di layanan *Serverless* atau *Static Hosting* seperti **Vercel**, **Netlify**, atau **Cloudflare Pages**.
- **Backend (Flask)**: **DILARANG KERAS** di-*deploy* di *Serverless* (seperti Vercel Python/AWS Lambda) karena memori N-Gram akan ter-reset pada setiap request dan Cron Job AI tidak akan berjalan. Anda **WAJIB** menggunakan layanan *Platform as a Service (PaaS)* seperti **Render**, **Railway**, atau Server VPS (DigitalOcean/AWS EC2).
  - Gunakan perintah jalankan (Start Command) WSGI berikut di produksi:
    `gunicorn -w 1 --threads 4 app:app` (Gunakan *1 worker* agar memori N-Gram tersentralisasi).
