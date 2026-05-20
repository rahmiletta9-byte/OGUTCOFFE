# **DEKOMPOSISI TAHAP 5: PENGUJIAN KRITIS, OPTIMASI, & DEPLOYMENT**

**Sub-sistem Frontend React.js \- POS Ogut Coffee**

Dokumen ini merinci langkah-langkah akhir sebelum aplikasi POS Ogut Coffee diserahkan kepada klien. Fase ini mencakup simulasi pengujian beban, optimasi kode untuk mempercepat *loading* awal, dan proses rilis (deployment) ke layanan *Cloud Hosting*.

## **5.1. Optimasi Performa (Code Splitting & Lazy Loading)**

Saat aplikasi membesar (memiliki banyak halaman dan fitur), ukuran fail JavaScript akan membengkak, menyebabkan layar putih (*blank screen*) yang lama saat pertama kali dibuka. Kita perlu menerapkan *Lazy Loading* agar React hanya memuat halaman yang sedang dibuka saja.

**Langkah Eksekusi:**

1. Buka fail konfigurasi perutean utama: src/App.jsx.  
2. Ubah cara *import* komponen halaman dari *import* statis menjadi dinamis menggunakan React.lazy dan Suspense:  
   import React, { Suspense, lazy } from 'react';  
   import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';  
   import { AuthProvider } from '@/features/auth/context/AuthContext';  
   import ProtectedRoute from '@/features/auth/components/ProtectedRoute';

   // Lazy load komponen halaman (hanya dimuat saat URL diakses)  
   const LoginPage \= lazy(() \=\> import('@/pages/LoginPage'));  
   const CashierPage \= lazy(() \=\> import('@/pages/CashierPage'));  
   const DashboardPage \= lazy(() \=\> import('@/pages/DashboardPage'));  
   const InventoryPage \= lazy(() \=\> import('@/pages/InventoryPage'));

   // Komponen Loading sederhana  
   const PageLoader \= () \=\> (  
     \<div className="flex h-screen items-center justify-center bg-slate-50"\>  
       \<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"\>\</div\>  
     \</div\>  
   );

   export default function App() {  
     return (  
       \<AuthProvider\>  
         \<BrowserRouter\>  
           \<Suspense fallback={\<PageLoader /\>}\>  
             \<Routes\>  
               \<Route path="/login" element={\<LoginPage /\>} /\>

               \<Route path="/pos" element={  
                 \<ProtectedRoute allowedRoles={\['kasir', 'admin'\]}\>  
                   \<CashierPage /\>  
                 \</ProtectedRoute\>  
               } /\>

               {/\* ... (Rute lainnya tetap sama seperti di Tahap 2\) ... \*/}

             \</Routes\>  
           \</Suspense\>  
         \</BrowserRouter\>  
       \</AuthProvider\>  
     );  
   }

## **5.2. Pengujian Kritis Antarmuka (Quality Assurance)**

Sebelum rilis, pastikan aplikasi melewati skenario pengujian ketat berikut menggunakan Google Chrome DevTools (tekan F12).

**Langkah Eksekusi & Skenario:**

1. **Skenario 1: Uji Debounce API (Mencegah Server Down)**  
   * Buka halaman Kasir (/pos).  
   * Buka DevTools \-\> masuk ke tab **Network**.  
   * Ketik kata "Kopi Susu" secara agresif dan sangat cepat di kolom pencarian N-Gram.  
   * *Ekspektasi:* Anda hanya akan melihat 1 atau maksimal 2 request API yang dikirim ke jaringan, bukan 9 request (sesuai jumlah huruf). Ini membuktikan *hook* useDebounce berfungsi.  
2. **Skenario 2: Uji Jaringan Buruk (3G Throttling)**  
   * Di tab **Network** DevTools, ubah profil jaringan dari *No Throttling* menjadi **Fast 3G** atau **Slow 3G**.  
   * Lakukan transaksi dan tekan "Checkout".  
   * *Ekspektasi:* Antarmuka React tidak boleh membeku (*crash*). Jika koneksi terputus murni (Offline), sistem harus memunculkan fungsi alert() dengan pesan kegagalan secara anggun.  
3. **Skenario 3: Uji Keamanan Rute (Role-Based Access)**  
   * Login sebagai Kasir (kasir@ogut.com).  
   * Ubah URL di address bar secara manual ke http://localhost:5173/dashboard.  
   * *Ekspektasi:* Sistem secara instan melempar kembali kasir ke /pos dan memunculkan peringatan "Anda tidak memiliki akses".

## **5.3. Konfigurasi Variabel Lingkungan (Environment) Produksi**

Aplikasi perlu mengetahui URL mana yang harus dihubungi saat berada di server publik (Production), karena URL localhost tidak akan berlaku lagi.

**Langkah Eksekusi:**

1. Pastikan seluruh panggilan API ke server Flask (Python) tidak di-*hardcode* sebagai http://127.0.0.1:5000.  
2. Gunakan pemanggilan *Environment Variable* seperti:  
   // Contoh pemanggilan API N-Gram (Fire-and-forget)  
   const flaskUrl \= import.meta.env.VITE\_FLASK\_API\_URL;  
   fetch(\`${flaskUrl}/api/ngram/increment\`, { ... });

3. Siapkan 3 nilai variabel yang akan Anda masukkan ke server *Cloud Hosting* nanti:  
   * VITE\_SUPABASE\_URL (URL Publik Supabase Anda)  
   * VITE\_SUPABASE\_ANON\_KEY (Anon Key Publik Supabase Anda)  
   * VITE\_FLASK\_API\_URL (URL Publik Server Render/Railway tempat API Flask ditanam)

## **5.4. Proses Build & Persiapan Rilis**

Mengonversi seluruh fail React (JSX/JS) yang kita buat menjadi fail HTML, CSS, dan JavaScript statis yang terkompresi rapat (Minified) agar siap disajikan secara efisien oleh server.

**Langkah Eksekusi:**

1. Buka terminal di direktori proyek Anda.  
2. Jalankan perintah:  
   npm run build

3. Vite akan mengemas aplikasi dan menghasilkan folder baru bernama dist/.  
4. Untuk memastikan folder *build* tersebut tidak rusak, jalankan pratinjau lokal:  
   npm run preview

   *(Buka tautan yang diberikan, biasanya http://localhost:4173, dan pastikan aplikasi berjalan lancar).*

## **5.5. Deployment ke Cloud Hosting (Vercel / Netlify)**

Aplikasi React SPA (Single Page Application) paling baik dan gratis di-*hosting* di platform seperti Vercel atau Netlify. Kita akan menggunakan **Vercel** sebagai contoh.

**Langkah Eksekusi (Metode Git/GitHub):**

1. Buat repositori baru di GitHub dan *push* proyek lokal Anda ke sana.  
   git add .  
   git commit \-m "Rilis awal POS Ogut Coffee"  
   git push origin main

2. Buka situs [**Vercel.com**](https://vercel.com) dan login menggunakan akun GitHub Anda.  
3. Klik tombol **Add New** \-\> **Project**.  
4. Temukan repositori GitHub proyek POS Anda dan klik **Import**.  
5. Di bagian **Environment Variables**, masukkan 3 kunci rahasia yang telah kita bahas di Langkah 5.3 secara manual satu per satu.  
6. Klik **Deploy**.  
7. Tunggu sekitar 1-2 menit. Vercel akan menghasilkan URL publik (misalnya: https://pos-ogut-coffee.vercel.app).  
8. **SANGAT PENTING (Konfigurasi CORS Supabase & Flask):**  
   * Masuk ke *Dashboard* Supabase \-\> **Authentication** \-\> **URL Configuration**, lalu tambahkan URL Vercel Anda tersebut ke dalam **Site URL** dan **Redirect URLs**. Jika tidak, login di versi publik akan diblokir oleh Supabase.  
   * Lakukan hal yang sama pada konfigurasi CORS di server Flask Anda agar tidak menolak *request* dari domain Vercel Anda.

**Status Penyelesaian Tahap Akhir:** Selamat\! Aplikasi antarmuka POS Ogut Coffee Anda telah sepenuhnya di-*deploy* ke dunia nyata dan kini siap diakses serta digunakan oleh staf secara aman dari *browser* tablet kasir mana pun. Siklus pengembangan *frontend* resmi selesai.