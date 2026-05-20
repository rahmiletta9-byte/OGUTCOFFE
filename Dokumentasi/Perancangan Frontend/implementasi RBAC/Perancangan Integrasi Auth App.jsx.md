# **PERANCANGAN REFACTORING APP.JSX (INTEGRASI SUPABASE AUTH)**

**Sistem Point of Sales (POS) Ogut Coffee**

Dokumen ini merinci skenario perubahan kode pada *file* src/App.jsx untuk berpindah dari sistem *dummy login* berbasis useState menuju sistem autentikasi nyata menggunakan **Supabase Auth** dan **React Router DOM**.

## **1\. Tujuan Perombakan (Refactoring Goals)**

1. **Memisahkan Kode (Separation of Concerns):** Memindahkan komponen tampilan (POSView, DashboardView, InventoryView, dan LoginScreen) keluar dari App.jsx ke dalam *file* terpisah di folder src/pages/.  
2. **Menerapkan React Router:** Mengganti logika navigasi bersyarat (if activeTab \=== 'pos') menjadi URL fisik yang bisa diakses (misal: /pos, /dashboard).  
3. **Mengaktifkan Keamanan (RBAC):** Membungkus halaman-halaman tersebut dengan ProtectedRoute agar peretas tidak bisa melompati halaman *login*.

## **2\. Langkah-langkah Eksekusi**

### **Langkah 1: Ekstraksi (Pemisahan) Halaman**

Buat file-file baru di dalam folder src/pages/ dan pindahkan kode dari App.jsx lama Anda ke dalamnya:

* Buat src/pages/LoginPage.jsx (Gunakan kode dari panduan *Implementasi Auth React*).  
* Buat src/pages/CashierPage.jsx (Pindahkan kode POSView ke sini).  
* Buat src/pages/DashboardPage.jsx (Pindahkan kode DashboardView ke sini).  
* Buat src/pages/InventoryPage.jsx (Pindahkan kode InventoryView ke sini).

### **Langkah 2: Ekstraksi Komponen UI (Opsional tapi Disarankan)**

Pindahkan komponen palsu (Mock Components) seperti Card, Button, Input, Badge ke dalam folder src/components/ui/. Nantinya komponen ini akan diganti dengan instalasi asli dari shadcn/ui.

### **Langkah 3: Menyiapkan Pembungkus Layout (Layout Wrapper)**

Karena App.jsx lama memiliki *Sidebar* yang mengapit halaman-halaman utama, kita harus membuat komponen Layout baru agar *Sidebar* tidak hilang saat kita menggunakan React Router.

Buat file **src/components/layout/MainLayout.jsx**:

import { Outlet } from 'react-router-dom';  
import Sidebar from './Sidebar'; // Pindahkan kode \<aside\> navigasi ke komponen ini

export default function MainLayout() {  
  return (  
    \<div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden"\>  
      {/\* Sidebar akan selalu tampil \*/}  
      \<Sidebar /\>   
        
      {/\* Outlet adalah tempat di mana halaman (POS/Dashboard) akan dirender (ditampilkan) \*/}  
      \<main className="flex-1 overflow-auto"\>  
        \<Outlet /\>   
      \</main\>  
    \</div\>  
  );  
}

### **Langkah 4: Menulis Ulang App.jsx**

Setelah semua halaman dan *sidebar* diekstraksi, App.jsx kini menjadi sangat bersih dan hanya berfungsi sebagai **Pengatur Lalu Lintas (Traffic Controller)**.

Ubah isi **src/App.jsx** Anda menjadi persis seperti ini:

import React, { Suspense, lazy } from 'react';  
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 1\. Import Context & Security Guard  
import { AuthProvider } from './context/AuthContext';  
import ProtectedRoute from './components/auth/ProtectedRoute';  
import MainLayout from './components/layout/MainLayout';

// 2\. Import Halaman secara Lazy (Optimasi Kecepatan Loading)  
const LoginPage \= lazy(() \=\> import('./pages/LoginPage'));  
const CashierPage \= lazy(() \=\> import('./pages/CashierPage'));  
const DashboardPage \= lazy(() \=\> import('./pages/DashboardPage'));  
const InventoryPage \= lazy(() \=\> import('./pages/InventoryPage'));

// 3\. Komponen Loading Sederhana saat transisi antar halaman  
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
            {/\* RUTE PUBLIK \*/}  
            \<Route path="/login" element={\<LoginPage /\>} /\>  
              
            {/\* RUTE TERLINDUNGI (Menggunakan Layout Sidebar) \*/}  
            \<Route element={\<MainLayout /\>}\>  
                
              {/\* Rute Kasir: Boleh diakses Kasir dan Admin \*/}  
              \<Route path="/pos" element={  
                \<ProtectedRoute allowedRoles={\['kasir', 'admin'\]}\>  
                  \<CashierPage /\>  
                \</ProtectedRoute\>  
              } /\>  
                
              {/\* Rute Dashboard AI: HANYA boleh diakses Admin \*/}  
              \<Route path="/dashboard" element={  
                \<ProtectedRoute allowedRoles={\['admin'\]}\>  
                  \<DashboardPage /\>  
                \</ProtectedRoute\>  
              } /\>

              {/\* Rute Gudang: Boleh diakses Manajemen Bahan dan Admin \*/}  
              \<Route path="/inventory" element={  
                \<ProtectedRoute allowedRoles={\['manajemen\_bahan', 'admin'\]}\>  
                  \<InventoryPage /\>  
                \</ProtectedRoute\>  
              } /\>  
                
            \</Route\>

            {/\* REDIRECT DEFAULT: Jika mengetik URL ngawur, kembalikan ke /login \*/}  
            \<Route path="/" element={\<Navigate to="/login" replace /\>} /\>  
            \<Route path="\*" element={\<Navigate to="/login" replace /\>} /\>  
              
          \</Routes\>  
        \</Suspense\>  
      \</BrowserRouter\>  
    \</AuthProvider\>  
  );  
}

## **3\. Hasil dari Perombakan Ini**

1. **Keamanan Total:** Aplikasi sekarang mendengarkan sesi dari AuthContext. Jika Anda memuat ulang (refresh) halaman /dashboard, sistem akan mengecek token Supabase. Jika token hilang atau kedaluwarsa, layar akan langsung teralihkan ke /login.  
2. **Kerapian Kode:** App.jsx turun dari 400+ baris menjadi kurang dari 70 baris. Perawatan aplikasi (maintenance) menjadi jauh lebih mudah.  
3. **Optimasi Performa:** Dengan menggunakan React.lazy, ketika pengguna pertama kali memuat web, *browser* hanya akan mengunduh kode untuk LoginPage. Kode untuk DashboardPage tidak akan diunduh sampai Admin benar-benar sukses *login*, menghemat pemakaian *bandwidth* internet secara signifikan.