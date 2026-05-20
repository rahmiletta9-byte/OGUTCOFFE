# **DEKOMPOSISI TAHAP 2: STATE MANAGEMENT & OTENTIKASI (AUTH)**

**Sub-sistem Frontend React.js \- POS Ogut Coffee**

Dokumen ini merinci langkah-langkah operasional untuk membangun gerbang keamanan aplikasi. Tahap ini berfokus pada integrasi Supabase Auth, manajemen sesi pengguna secara global (menggunakan *React Context*), dan pembatasan akses halaman berdasarkan peran (*Role-Based Access Control / RBAC*).

## **2.1. Konfigurasi Variabel Lingkungan (Environment Variables)**

Sebelum menulis kode, kredensial koneksi ke Supabase harus disimpan dengan aman agar tidak ikut terunggah ke *repository* publik (seperti GitHub).

**Langkah Eksekusi:**

1. Buat fail baru bernama .env.local di *root* direktori proyek (sejajar dengan package.json).  
2. Buka *dashboard* Supabase \-\> Project Settings \-\> API. Salin URL dan Anon Key.  
3. Tempelkan kredensial tersebut ke dalam fail .env.local:  
   VITE\_SUPABASE\_URL=https://\<ganti-dengan-project-id-anda\>.supabase.co  
   VITE\_SUPABASE\_ANON\_KEY=\<ganti-dengan-anon-public-key-anda\>

## **2.2. Inisialisasi Klien Supabase**

Membuat fail utilitas tunggal (Singleton) yang akan digunakan oleh seluruh komponen aplikasi untuk berkomunikasi dengan basis data Supabase.

**Langkah Eksekusi:**

1. Buat fail baru: src/lib/supabaseClient.js.  
2. Tulis kode inisialisasi berikut:  
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl \= import.meta.env.VITE\_SUPABASE\_URL;  
   const supabaseAnonKey \= import.meta.env.VITE\_SUPABASE\_ANON\_KEY;

   export const supabase \= createClient(supabaseUrl, supabaseAnonKey);

## **2.3. Pembuatan Context Otorisasi (AuthContext)**

Membangun *state* global untuk menyimpan status sesi (apakah pengguna sedang *login*) dan peran/jabatan mereka. State ini ditempatkan di dalam folder fitur auth.

**Langkah Eksekusi:**

1. Buat fail baru: src/features/auth/context/AuthContext.jsx.  
2. Tulis logika *Context Provider* berikut:  
   import React, { createContext, useContext, useState, useEffect } from 'react';  
   import { supabase } from '@/lib/supabaseClient';

   const AuthContext \= createContext({});

   export const AuthProvider \= ({ children }) \=\> {  
     const \[user, setUser\] \= useState(null);  
     const \[role, setRole\] \= useState(null);  
     const \[loading, setLoading\] \= useState(true);

     useEffect(() \=\> {  
       // Fungsi menarik role dari database  
       const fetchRole \= async (userId) \=\> {  
         const { data, error } \= await supabase  
           .from('user\_roles')  
           .select('role')  
           .eq('user\_id', userId)  
           .single();  
         if (data) setRole(data.role);  
       };

       // Pengecekan sesi awal (saat reload halaman)  
       supabase.auth.getSession().then(({ data: { session } }) \=\> {  
         if (session?.user) {  
           setUser(session.user);  
           fetchRole(session.user.id);  
         }  
         setLoading(false);  
       });

       // Listener jika ada event login/logout  
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

## **2.4. Pembuatan Pelindung Rute (ProtectedRoute)**

Membuat komponen *High-Order* yang bertugas mencegat (*intercept*) navigasi pengguna. Jika mereka tidak berhak mengakses halaman tersebut, komponen ini akan memblokirnya.

**Langkah Eksekusi:**

1. Buat fail baru: src/features/auth/components/ProtectedRoute.jsx.  
2. Tulis logika *guarding* berikut:  
   import { Navigate } from 'react-router-dom';  
   import { useAuth } from '../context/AuthContext';

   export default function ProtectedRoute({ children, allowedRoles }) {  
     const { user, role, loading } \= useAuth();

     if (loading) return \<div className="flex h-screen items-center justify-center"\>Memuat...\</div\>;

     // Lempar ke login jika tidak ada sesi  
     if (\!user) return \<Navigate to="/login" replace /\>;

     // Lempar ke halaman yang sesuai jika perannya ditolak  
     if (allowedRoles && role && \!allowedRoles.includes(role)) {  
       if (role \=== 'kasir') return \<Navigate to="/pos" replace /\>;  
       if (role \=== 'manajemen\_bahan') return \<Navigate to="/inventory" replace /\>;  
       if (role \=== 'admin') return \<Navigate to="/dashboard" replace /\>;  
     }

     return children;  
   }

## **2.5. Pembuatan Antarmuka Halaman Login**

Membuat halaman tempat staf memasukkan email dan *password*. Halaman ini akan memanggil Supabase Auth dan melakukan *redirect*.

**Langkah Eksekusi:**

1. Buat fail baru: src/pages/LoginPage.jsx.  
2. Tulis logika formulir *login*:  
   import React, { useState } from 'react';  
   import { useNavigate } from 'react-router-dom';  
   import { supabase } from '@/lib/supabaseClient';

   export default function LoginPage() {  
     const \[email, setEmail\] \= useState('');  
     const \[password, setPassword\] \= useState('');  
     const \[isLoading, setIsLoading\] \= useState(false);  
     const navigate \= useNavigate();

     const handleLogin \= async (e) \=\> {  
       e.preventDefault();  
       setIsLoading(true);  
       try {  
         const { data, error } \= await supabase.auth.signInWithPassword({ email, password });  
         if (error) throw error;

         // Ambil role untuk menentukan arah redirect  
         const { data: roleData } \= await supabase  
           .from('user\_roles')  
           .select('role')  
           .eq('user\_id', data.user.id)  
           .single();

         if (roleData?.role \=== 'admin') navigate('/dashboard');  
         else if (roleData?.role \=== 'kasir') navigate('/pos');  
         else if (roleData?.role \=== 'manajemen\_bahan') navigate('/inventory');

       } catch (error) {  
         alert("Login Gagal: " \+ error.message);  
       } finally {  
         setIsLoading(false);  
       }  
     };

     return (  
       \<div className="flex h-screen items-center justify-center bg-slate-100"\>  
         \<form onSubmit={handleLogin} className="p-8 bg-white shadow-md rounded-xl w-96"\>  
           \<h2 className="text-2xl font-bold mb-6 text-center text-orange-600"\>Ogut Coffee POS\</h2\>  
           \<input type="email" placeholder="Email" required className="w-full mb-4 p-2 border rounded" onChange={e \=\> setEmail(e.target.value)} /\>  
           \<input type="password" placeholder="Password" required className="w-full mb-6 p-2 border rounded" onChange={e \=\> setPassword(e.target.value)} /\>  
           \<button type="submit" disabled={isLoading} className="w-full bg-orange-600 text-white p-2 rounded hover:bg-orange-700"\>  
             {isLoading ? 'Memproses...' : 'Login'}  
           \</button\>  
         \</form\>  
       \</div\>  
     );  
   }

## **2.6. Konfigurasi Perutean Utama (React Router)**

Langkah terakhir adalah mengikat semuanya ke dalam fail utama aplikasi.

**Langkah Eksekusi:**

1. Buat beberapa *dummy component* (komponen kosong sementara) di folder src/pages/ untuk CashierPage.jsx, DashboardPage.jsx, dan InventoryPage.jsx.  
   *(Contoh isi: export default function CashierPage() { return \<div\>Halaman POS\</div\> })*  
2. Buka fail src/App.jsx.  
3. Timpa isi App.jsx dengan konfigurasi *Routing* berikut:  
   import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';  
   import { AuthProvider } from '@/features/auth/context/AuthContext';  
   import ProtectedRoute from '@/features/auth/components/ProtectedRoute';

   import LoginPage from '@/pages/LoginPage';  
   import CashierPage from '@/pages/CashierPage';  
   import DashboardPage from '@/pages/DashboardPage';  
   import InventoryPage from '@/pages/InventoryPage';

   export default function App() {  
     return (  
       \<AuthProvider\>  
         \<BrowserRouter\>  
           \<Routes\>  
             \<Route path="/login" element={\<LoginPage /\>} /\>

             {/\* Rute Kasir & Admin \*/}  
             \<Route path="/pos" element={  
               \<ProtectedRoute allowedRoles={\['kasir', 'admin'\]}\>  
                 \<CashierPage /\>  
               \</ProtectedRoute\>  
             } /\>

             {/\* Rute Khusus Admin \*/}  
             \<Route path="/dashboard" element={  
               \<ProtectedRoute allowedRoles={\['admin'\]}\>  
                 \<DashboardPage /\>  
               \</ProtectedRoute\>  
             } /\>

             {/\* Rute Manajemen Bahan & Admin \*/}  
             \<Route path="/inventory" element={  
               \<ProtectedRoute allowedRoles={\['manajemen\_bahan', 'admin'\]}\>  
                 \<InventoryPage /\>  
               \</ProtectedRoute\>  
             } /\>

             {/\* Fallback Route \*/}  
             \<Route path="\*" element={\<Navigate to="/login" replace /\>} /\>  
           \</Routes\>  
         \</BrowserRouter\>  
       \</AuthProvider\>  
     );  
   }

**Status Penyelesaian Tahap 2:** Jika tahap ini telah dieksekusi, Anda sudah memiliki sistem gerbang keamanan yang solid. Anda dapat menjalankan aplikasi (npm run dev) dan menguji cobanya dengan mencoba mengakses /dashboard secara langsung di URL; sistem seharusnya akan otomatis menendang Anda kembali ke halaman /login.

Proyek kini siap dilanjutkan ke **Tahap 3 (Pengembangan Fitur POS / Kasir)**.