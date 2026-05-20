# **DEKOMPOSISI TAHAP 1: INISIALISASI PROYEK & KERANGKA KERJA**

**Sub-sistem Frontend React.js \- POS Ogut Coffee**

Dokumen ini merinci langkah-langkah teknis fundamental yang harus dilakukan pada tahap awal pengembangan aplikasi *frontend* sebelum mulai menulis logika bisnis atau desain antarmuka.

## **1.1. Persiapan Lingkungan Pengembangan (Environment Setup)**

Sebelum menginisialisasi proyek, pastikan lingkungan pengembang (*development environment*) telah memenuhi prasyarat berikut:

* **Node.js & NPM:** Pastikan Node.js (versi 18.x LTS atau lebih baru) telah terinstal. Verifikasi melalui terminal dengan perintah node \-v dan npm \-v.  
* **Code Editor:** Menggunakan Visual Studio Code (VS Code) dengan ekstensi yang direkomendasikan seperti *ESLint*, *Prettier*, dan *Tailwind CSS IntelliSense*.

## **1.2. Inisialisasi Proyek Menggunakan Vite**

Vite dipilih sebagai *build tool* untuk menggantikan *Create React App* (CRA) karena kemampuannya dalam melakukan *Hot Module Replacement* (HMR) secara instan.

**Langkah Eksekusi:**

1. Buka terminal/Command Prompt.  
2. Jalankan perintah pembuatan proyek:  
   npm create vite@latest pos-ogut-coffee \-- \--template react

3. Masuk ke dalam direktori proyek yang baru dibuat:  
   cd pos-ogut-coffee

4. Lakukan instalasi dependensi bawaan React:  
   npm install

5. **Pembersihan Awal:** Hapus fail bawaan yang tidak diperlukan (seperti App.css) dan bersihkan isi App.jsx menjadi komponen kosong (kerangka dasar) agar siap digunakan.

## **1.3. Instalasi dan Konfigurasi TailwindCSS**

TailwindCSS digunakan sebagai mesin pembuat gaya (*styling engine*) utama untuk mendukung integrasi komponen *shadcn/ui*.

**Langkah Eksekusi:**

1. Instal Tailwind dan dependensinya (*PostCSS* & *Autoprefixer*) sebagai *devDependencies*:  
   npm install \-D tailwindcss postcss autoprefixer

2. Buat fail konfigurasi otomatis:  
   npx tailwindcss init \-p

   *(Perintah ini akan menghasilkan fail tailwind.config.js dan postcss.config.js)*.  
3. Konfigurasi jalur templat pada fail tailwind.config.js. Tambahkan jalur src agar Tailwind memindai nama kelas CSS di seluruh fail React:  
   /\*\* @type {import('tailwindcss').Config} \*/  
   export default {  
     content: \[  
       "./index.html",  
       "./src/\*\*/\*.{js,ts,jsx,tsx}",  
     \],  
     theme: {  
       extend: {},  
     },  
     plugins: \[\],  
   }

4. Tambahkan direktif Tailwind ke dalam fail src/index.css (hapus semua kode bawaan sebelumnya):  
   @tailwind base;  
   @tailwind components;  
   @tailwind utilities;

## **1.4. Konfigurasi Alias Path (Persiapan shadcn/ui)**

Komponen *shadcn/ui* mensyaratkan penggunaan *path alias* (misalnya import menggunakan @/components/... daripada ../../components/...) agar kode lebih rapi.

**Langkah Eksekusi:**

1. Instal utilitas Node.js untuk resolusi *path*:  
   npm install \-D @types/node

2. Modifikasi fail vite.config.js untuk mendaftarkan alias @:  
   import { defineConfig } from 'vite'  
   import react from '@vitejs/plugin-react'  
   import path from "path"

   export default defineConfig({  
     plugins: \[react()\],  
     resolve: {  
       alias: {  
         "@": path.resolve(\_\_dirname, "./src"),  
       },  
     },  
   })

3. Buat atau perbarui fail jsconfig.json di *root* direktori agar VS Code mengenali alias tersebut:  
   {  
     "compilerOptions": {  
       "baseUrl": ".",  
       "paths": {  
         "@/\*": \["./src/\*"\]  
       }  
     }  
   }

## **1.5. Instalasi Pustaka Pendukung Eksternal**

Mengunduh paket-paket utama yang akan digunakan untuk perutean, ikon, dan konektivitas basis data.

**Langkah Eksekusi:**

1. **React Router DOM:** Untuk perpindahan halaman (*Routing* SPA) tanpa *reload*.  
   npm install react-router-dom

2. **Lucide React:** Koleksi ikon SVG berukuran ringan dan *scalable* yang menjadi standar *shadcn/ui*.  
   npm install lucide-react

3. **Supabase JS Client:** Pustaka resmi (SDK) untuk melakukan transaksi otentikasi dan kueri data ke server Supabase.  
   npm install @supabase/supabase-js

## **1.6. Pembentukan Struktur Direktori Modular (Feature-Based)**

Membangun hierarki folder secara manual di dalam direktori src/ menggunakan pendekatan **Feature-Based Architecture**. Pendekatan ini mengelompokkan kode berdasarkan *domain bisnis* atau *fitur* (misalnya fitur pos, auth, inventory) alih-alih berdasarkan jenis filenya (menggabungkan semua *hooks* atau *components* di satu tempat). Hal ini membuat aplikasi lebih mudah diskalakan.

**Langkah Eksekusi:**

Buat susunan folder berikut di dalam direktori src/:

src/  
├── assets/                 \# Gambar statis, logo kafe, placeholder image  
├── components/  
│   └── ui/                 \# Komponen GLOBAL yang dapat dipakai ulang (shadcn/ui: Button, Input, Modal)  
├── lib/                    \# Konfigurasi eksternal & utilitas global (misal: supabaseClient.js)  
│  
├── features/               \# KUMPULAN MODUL BERDASARKAN FITUR BISNIS  
│   │  
│   ├── auth/               \# FITUR: Otorisasi & Manajemen Sesi  
│   │   ├── components/     \# \-\> misal: ProtectedRoute.jsx, LoginForm.jsx  
│   │   └── context/        \# \-\> misal: AuthContext.jsx  
│   │  
│   ├── pos/                \# FITUR: Sistem Kasir (Point of Sales)  
│   │   ├── components/     \# \-\> misal: ProductCard.jsx, CartSidebar.jsx, SearchNgram.jsx  
│   │   └── hooks/          \# \-\> misal: useDebounce.js (khusus dipakai di POS)  
│   │  
│   ├── dashboard/          \# FITUR: Analitik Kecerdasan Buatan (Admin)  
│   │   └── components/     \# \-\> misal: KmeansChartCard.jsx, PredictionWarningTable.jsx  
│   │  
│   ├── menu/               \# FITUR: Manajemen Katalog Menu Kafe (Admin)  
│   │   └── components/     \# \-\> misal: MenuForm.jsx, MenuTable.jsx  
│   │  
│   └── inventory/          \# FITUR: Manajemen Gudang & Bahan Baku  
│       └── components/     \# \-\> misal: StockTable.jsx, RestockForm.jsx  
│  
├── pages/                  \# KOMPONEN LEVEL HALAMAN (Menggabungkan komponen-komponen dari fitur)  
│   ├── LoginPage.jsx  
│   ├── CashierPage.jsx  
│   ├── DashboardPage.jsx  
│   ├── MenuManagerPage.jsx  
│   └── InventoryPage.jsx  
│  
├── App.jsx                 \# Pengaturan Routing utama (react-router-dom)  
└── main.jsx                \# Entry point aplikasi React

**Status Penyelesaian Tahap 1:** Jika seluruh sub-langkah di atas telah dieksekusi tanpa pesan *error* pada terminal, struktur *folder* sudah rapi berdasarkan fitur, dan aplikasi dapat dijalankan menggunakan perintah npm run dev dengan tampilan layar putih kosong (tanpa *error console*), maka proyek siap dilanjutkan ke **Tahap 2 (Implementasi State Management & Auth Feature)**.