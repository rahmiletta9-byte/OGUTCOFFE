# **KODE IMPLEMENTASI REFACTORING (AUTH & ROUTING)**

**Sistem Point of Sales (POS) Ogut Coffee**

Dokumen ini berisi kode sumber (*source code*) lengkap untuk memisahkan logika autentikasi dan tata letak dari App.jsx lama ke dalam struktur arsitektur yang baru.

## **1\. Logika Penyimpan Sesi Global (Auth Context)**

File ini bertugas memantau status login ke Supabase secara *real-time* dan menyimpannya di memori global agar bisa diakses oleh semua komponen (termasuk Sidebar dan ProtectedRoute).

**Buat/Timpa file src/context/AuthContext.jsx:**

import React, { createContext, useContext, useState, useEffect } from 'react';  
import { supabase } from '../services/supabaseClient'; // Sesuaikan path jika berbeda

const AuthContext \= createContext({});

export const AuthProvider \= ({ children }) \=\> {  
  const \[user, setUser\] \= useState(null);  
  const \[role, setRole\] \= useState(null);  
  const \[loading, setLoading\] \= useState(true);

  useEffect(() \=\> {  
    const fetchRole \= async (userId) \=\> {  
      const { data, error } \= await supabase  
        .from('user\_roles')  
        .select('role')  
        .eq('user\_id', userId)  
        .single();  
        
      if (data) setRole(data.role);  
    };

    // Cek sesi saat web pertama kali dimuat  
    supabase.auth.getSession().then(({ data: { session } }) \=\> {  
      if (session?.user) {  
        setUser(session.user);  
        fetchRole(session.user.id);  
      } else {  
        setLoading(false);  
      }  
    });

    // Dengarkan perubahan login/logout  
    const { data: { subscription } } \= supabase.auth.onAuthStateChange(  
      async (\_event, session) \=\> {  
        if (session?.user) {  
          setUser(session.user);  
          await fetchRole(session.user.id);  
        } else {  
          setUser(null);  
          setRole(null);  
        }  
        setLoading(false);  
      }  
    );

    return () \=\> subscription.unsubscribe();  
  }, \[\]);

  return (  
    \<AuthContext.Provider value={{ user, role, loading }}\>  
      {\!loading && children}  
    \</AuthContext.Provider\>  
  );  
};

export const useAuth \= () \=\> useContext(AuthContext);

## **2\. Logika Pelindung Halaman (Protected Route)**

File ini berfungsi sebagai "Satpam". Jika Kasir mencoba mengetik URL /dashboard milik Admin, file ini akan memblokirnya.

**Buat/Timpa file src/components/auth/ProtectedRoute.jsx:**

import React from 'react';  
import { Navigate } from 'react-router-dom';  
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {  
  const { user, role } \= useAuth();

  // 1\. Jika belum login sama sekali, tendang ke halaman login  
  if (\!user) {  
    return \<Navigate to="/login" replace /\>;  
  }

  // 2\. Jika role belum termuat dari Supabase, tampilkan loading  
  if (\!role) {  
    return (  
      \<div className="flex h-screen items-center justify-center bg-slate-50"\>  
        \<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600"\>\</div\>  
      \</div\>  
    );  
  }

  // 3\. Jika Role tidak diizinkan, kembalikan ke halaman default masing-masing  
  if (allowedRoles && \!allowedRoles.includes(role)) {  
    if (role \=== 'kasir') return \<Navigate to="/pos" replace /\>;  
    if (role \=== 'manajemen\_bahan') return \<Navigate to="/inventory" replace /\>;  
    if (role \=== 'admin') return \<Navigate to="/dashboard" replace /\>;  
  }

  // 4\. Jika aman, izinkan masuk ke halaman yang dituju  
  return children;  
}

## **3\. Ekstraksi Logika Navigasi (Sidebar)**

Karena React Router menggunakan URL untuk berpindah halaman, kita harus mengganti tag \<button\> pada Sidebar menjadi \<NavLink\> dari react-router-dom. Sidebar juga akan menyembunyikan menu yang tidak boleh diakses oleh *role* tertentu.

**Buat file src/components/layout/Sidebar.jsx:**

import React from 'react';  
import { NavLink, useNavigate } from 'react-router-dom';  
import { Coffee, ShoppingCart, LayoutDashboard, Package, LogOut } from 'lucide-react';  
import { useAuth } from '../../context/AuthContext';  
import { supabase } from '../../services/supabaseClient';

export default function Sidebar() {  
  const { user, role } \= useAuth();  
  const navigate \= useNavigate();

  const handleLogout \= async () \=\> {  
    await supabase.auth.signOut();  
    navigate('/login');  
  };

  // Komponen NavLink Kustom agar warnanya berubah saat aktif  
  const SidebarItem \= ({ to, icon: Icon, label }) \=\> (  
    \<NavLink  
      to={to}  
      className={({ isActive }) \=\>  
        \`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${  
          isActive   
            ? 'bg-orange-50 text-orange-600'   
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'  
        }\`  
      }  
    \>  
      \<Icon className="w-5 h-5" /\>  
      {label}  
    \</NavLink\>  
  );

  return (  
    \<aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20"\>  
      \<div className="p-6 flex items-center gap-3 text-orange-600 font-bold text-xl border-b"\>  
        \<Coffee className="w-8 h-8" /\>  
        \<span\>Ogut Coffee\</span\>  
      \</div\>  
        
      \<nav className="flex-1 p-4 flex flex-col gap-2"\>  
        \<div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider"\>Menu Utama\</div\>  
          
        {/\* Render Menu berdasarkan Role \*/}  
        {(role \=== 'admin' || role \=== 'kasir') && (  
          \<SidebarItem to="/pos" icon={ShoppingCart} label="Kasir (POS)" /\>  
        )}  
          
        {role \=== 'admin' && (  
          \<SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard AI" /\>  
        )}  
          
        {(role \=== 'admin' || role \=== 'manajemen\_bahan') && (  
          \<SidebarItem to="/inventory" icon={Package} label="Gudang Bahan" /\>  
        )}  
      \</nav\>

      \<div className="p-4 border-t border-slate-200"\>  
        \<div className="flex items-center gap-3 mb-4 px-2"\>  
          \<div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold uppercase"\>  
            {user?.email?.charAt(0) || 'U'}  
          \</div\>  
          \<div className="overflow-hidden"\>  
            \<p className="text-sm font-semibold truncate capitalize"\>{role?.replace('\_', ' ')}\</p\>  
            \<p className="text-xs text-slate-500 truncate"\>{user?.email}\</p\>  
          \</div\>  
        \</div\>  
        \<button   
          onClick={handleLogout}  
          className="flex items-center justify-center w-full h-10 px-4 py-2 text-sm font-medium transition-colors border border-slate-200 bg-white hover:bg-red-50 text-red-600 rounded-md"  
        \>  
          \<LogOut className="w-4 h-4 mr-2" /\> Keluar  
        \</button\>  
      \</div\>  
    \</aside\>  
  );  
}

## **4\. Pembungkus Layout Utama (Main Layout)**

Komponen ini memastikan bahwa Sidebar selalu berada di sebelah kiri, sementara halaman yang diklik (POS/Dashboard/Inventory) akan dirender di area sebelah kanan.

**Buat file src/components/layout/MainLayout.jsx:**

import React from 'react';  
import { Outlet } from 'react-router-dom';  
import Sidebar from './Sidebar';

export default function MainLayout() {  
  return (  
    \<div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden"\>  
      {/\* Kolom 1: Navigasi Kiri \*/}  
      \<Sidebar /\>   
        
      {/\* Kolom 2: Area Konten Dinamis \*/}  
      \<main className="flex-1 overflow-auto relative"\>  
        {/\* \<Outlet /\> akan digantikan oleh komponen halaman (CashierPage, dll) oleh React Router \*/}  
        \<Outlet /\>   
      \</main\>  
    \</div\>  
  );  
}

## **5\. File Utama App.jsx (Pengatur Lalu Lintas)**

Setelah semuanya dipisah, App.jsx Anda kini menjadi sangat ramping dan profesional.

**Timpa seluruh isi src/App.jsx Anda dengan kode ini:**

import React, { Suspense, lazy } from 'react';  
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Provider & Layout  
import { AuthProvider } from './context/AuthContext';  
import ProtectedRoute from './components/auth/ProtectedRoute';  
import MainLayout from './components/layout/MainLayout';

// Lazy Load Halaman untuk mempercepat waktu muat awal (Code Splitting)  
const LoginPage \= lazy(() \=\> import('./pages/LoginPage'));  
const CashierPage \= lazy(() \=\> import('./pages/CashierPage'));  
const DashboardPage \= lazy(() \=\> import('./pages/DashboardPage'));  
const InventoryPage \= lazy(() \=\> import('./pages/InventoryPage'));

// Animasi Loading Halaman  
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
              
            {/\* RUTE TERLINDUNGI (Dibungkus dengan MainLayout agar ada Sidebar) \*/}  
            \<Route element={\<MainLayout /\>}\>  
                
              \<Route path="/pos" element={  
                \<ProtectedRoute allowedRoles={\['kasir', 'admin'\]}\>  
                  \<CashierPage /\>  
                \</ProtectedRoute\>  
              } /\>  
                
              \<Route path="/dashboard" element={  
                \<ProtectedRoute allowedRoles={\['admin'\]}\>  
                  \<DashboardPage /\>  
                \</ProtectedRoute\>  
              } /\>

              \<Route path="/inventory" element={  
                \<ProtectedRoute allowedRoles={\['manajemen\_bahan', 'admin'\]}\>  
                  \<InventoryPage /\>  
                \</ProtectedRoute\>  
              } /\>  
                
            \</Route\>

            {/\* RUTE FALLBACK (Nyasar) \*/}  
            \<Route path="/" element={\<Navigate to="/login" replace /\>} /\>  
            \<Route path="\*" element={\<Navigate to="/login" replace /\>} /\>  
              
          \</Routes\>  
        \</Suspense\>  
      \</BrowserRouter\>  
    \</AuthProvider\>  
  );  
}  
