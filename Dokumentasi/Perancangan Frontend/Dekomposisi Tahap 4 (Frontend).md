# **DEKOMPOSISI TAHAP 4: PENGEMBANGAN FITUR MANAJEMEN & DASHBOARD AI**

**Sub-sistem Frontend React.js \- POS Ogut Coffee**

Dokumen ini merinci langkah-langkah untuk membangun fitur manajerial (CRUD Manajemen User, Menu, dan Bahan Baku), mengintegrasikan fungsi unggah gambar ke Supabase Storage, mencatat log aktivitas pengguna, dan memvisualisasikan data analitik AI.

## **4.0. Prasyarat: Tabel Log Aktivitas (SQL Editor)**

Sebelum memulai *coding* React, pastikan Anda telah membuat tabel untuk menyimpan riwayat aktivitas. Jalankan perintah ini di SQL Editor Supabase:

CREATE TABLE activity\_logs (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    user\_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  
    action\_type VARCHAR(100) NOT NULL, \-- (cth: 'CREATE\_MENU', 'UPDATE\_STOCK', 'CREATE\_USER')  
    description TEXT NOT NULL,         \-- (cth: 'Admin menambahkan menu Kopi Susu')  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);  
\-- Beri akses INSERT untuk semua staf yang login  
ALTER TABLE activity\_logs ENABLE ROW LEVEL SECURITY;  
CREATE POLICY "Allow insert for auth users" ON activity\_logs FOR INSERT WITH CHECK (auth.role() \= 'authenticated');  
CREATE POLICY "Allow select for admin" ON activity\_logs FOR SELECT USING (get\_user\_role() \= 'admin');

## **4.1. Pembuatan Layanan Utilitas (Log & Storage)**

Membuat fungsi pembantu (*helper functions*) yang dapat dipanggil dari berbagai komponen untuk mencatat log aktivitas dan mengunggah gambar menu.

**Langkah Eksekusi:**

1. **Fungsi Log Aktivitas (src/lib/logger.js)**  
   import { supabase } from './supabaseClient';

   export const logActivity \= async (userId, actionType, description) \=\> {  
     try {  
       await supabase.from('activity\_logs').insert(\[  
         { user\_id: userId, action\_type: actionType, description }  
       \]);  
     } catch (error) {  
       console.error("Gagal mencatat log aktivitas:", error);  
     }  
   };

2. **Fungsi Unggah Gambar (src/features/menu/services/storageService.js)**  
   import { supabase } from '@/lib/supabaseClient';

   export const uploadMenuImage \= async (file) \=\> {  
     if (\!file) return null;

     const fileExt \= file.name.split('.').pop();  
     const fileName \= \`${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}\`;  
     const filePath \= \`public/${fileName}\`;

     const { error: uploadError } \= await supabase.storage  
       .from('menu-images')  
       .upload(filePath, file);

     if (uploadError) throw uploadError;

     const { data: { publicUrl } } \= supabase.storage  
       .from('menu-images')  
       .getPublicUrl(filePath);

     return publicUrl;  
   };

## **4.2. Pembuatan Komponen CRUD Manajemen User**

Fitur ini **khusus untuk Admin**. Komponen ini berfungsi untuk mendaftarkan staf baru ke sistem autentikasi Supabase dan menetapkan jabatannya (role) di tabel user\_roles.

**Langkah Eksekusi:**

1. Buka/buat fail: src/features/users/components/UserManager.jsx.  
2. Tulis logika pendaftaran staf (*User Registration*):  
   import React, { useState } from 'react';  
   import { supabase } from '@/lib/supabaseClient';  
   import { logActivity } from '@/lib/logger';  
   import { useAuth } from '@/features/auth/context/AuthContext';

   export default function UserManager({ onSuccess }) {  
     const { user } \= useAuth();  
     const \[formData, setFormData\] \= useState({ email: '', password: '', role: 'kasir' });  
     const \[isLoading, setIsLoading\] \= useState(false);

     const handleCreateUser \= async (e) \=\> {  
       e.preventDefault();  
       setIsLoading(true);

       try {  
         // 1\. Daftarkan kredensial ke Supabase Auth  
         const { data: authData, error: authError } \= await supabase.auth.signUp({  
           email: formData.email,  
           password: formData.password,  
         });

         if (authError) throw authError;

         // 2\. Tetapkan Role (Jabatan) ke tabel user\_roles  
         if (authData.user) {  
           const { error: roleError } \= await supabase.from('user\_roles').insert(\[  
             { user\_id: authData.user.id, role: formData.role }  
           \]);  
           if (roleError) throw roleError;  
         }

         // 3\. Catat Log Aktivitas  
         await logActivity(  
           user.id,   
           'CREATE\_USER',   
           \`Mendaftarkan staf baru dengan email: ${formData.email} sebagai ${formData.role.toUpperCase()}\`  
         );

         alert('Akun staf berhasil dibuat\!');  
         setFormData({ email: '', password: '', role: 'kasir' });  
         if (onSuccess) onSuccess(); // Refresh daftar staf  
       } catch (error) {  
         alert('Gagal membuat akun staf: ' \+ error.message);  
       } finally {  
         setIsLoading(false);  
       }  
     };

     return (  
       \<form onSubmit={handleCreateUser} className="p-4 border rounded-lg bg-white shadow-sm space-y-4"\>  
         \<h3 className="font-bold text-lg"\>Daftarkan Staf Baru\</h3\>

         \<div\>  
           \<label className="block text-sm text-slate-500 mb-1"\>Email Staf\</label\>  
           \<input type="email" placeholder="contoh@ogut.com" required className="w-full p-2 border rounded"  
             value={formData.email} onChange={(e) \=\> setFormData({...formData, email: e.target.value})} /\>  
         \</div\>

         \<div\>  
           \<label className="block text-sm text-slate-500 mb-1"\>Password Sementara\</label\>  
           \<input type="password" placeholder="Minimal 6 karakter" required className="w-full p-2 border rounded"  
             value={formData.password} onChange={(e) \=\> setFormData({...formData, password: e.target.value})} /\>  
         \</div\>

         \<div\>  
           \<label className="block text-sm text-slate-500 mb-1"\>Jabatan (Role)\</label\>  
           \<select className="w-full p-2 border rounded" value={formData.role}   
             onChange={(e) \=\> setFormData({...formData, role: e.target.value})}\>  
             \<option value="kasir"\>Kasir (Akses POS)\</option\>  
             \<option value="manajemen\_bahan"\>Manajemen Bahan (Akses Gudang)\</option\>  
             \<option value="admin"\>Admin (Akses Penuh)\</option\>  
           \</select\>  
         \</div\>

         \<button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white p-2 rounded hover:bg-slate-800"\>  
           {isLoading ? 'Memproses...' : 'Buat Akun Staf'}  
         \</button\>  
       \</form\>  
     );  
   }

## **4.3. Pembuatan Komponen CRUD Manajemen Menu**

Fitur ini khusus untuk **Admin**. Memungkinkan admin menambah menu baru beserta mengunggah fotonya.

**Langkah Eksekusi:**

1. Buka/buat fail: src/features/menu/components/MenuForm.jsx.  
2. Tulis logika form dengan integrasi file *upload*:  
   import React, { useState } from 'react';  
   import { supabase } from '@/lib/supabaseClient';  
   import { uploadMenuImage } from '../services/storageService';  
   import { logActivity } from '@/lib/logger';  
   import { useAuth } from '@/features/auth/context/AuthContext';

   export default function MenuForm({ onSuccess }) {  
     const { user } \= useAuth();  
     const \[formData, setFormData\] \= useState({ name: '', price: '', cost\_price: '', category: 'Kopi' });  
     const \[imageFile, setImageFile\] \= useState(null);  
     const \[isLoading, setIsLoading\] \= useState(false);

     const handleSubmit \= async (e) \=\> {  
       e.preventDefault();  
       setIsLoading(true);

       try {  
         // 1\. Upload Gambar (Jika Ada)  
         let imageUrl \= null;  
         if (imageFile) {  
           imageUrl \= await uploadMenuImage(imageFile);  
         }

         // 2\. Insert ke Database  
         const { error } \= await supabase.from('products').insert(\[{  
           name: formData.name,  
           price: parseFloat(formData.price),  
           cost\_price: parseFloat(formData.cost\_price),  
           category: formData.category,  
           image\_url: imageUrl  
         }\]);

         if (error) throw error;

         // 3\. Catat Log Aktivitas  
         await logActivity(user.id, 'CREATE\_MENU', \`Menambahkan menu baru: ${formData.name}\`);

         alert('Menu berhasil ditambahkan\!');  
         if (onSuccess) onSuccess(); // Refresh data tabel  
       } catch (error) {  
         alert('Gagal menambah menu: ' \+ error.message);  
       } finally {  
         setIsLoading(false);  
       }  
     };

     return (  
       \<form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-white shadow-sm space-y-4"\>  
         \<h3 className="font-bold text-lg"\>Tambah Menu Baru\</h3\>  
         \<input type="text" placeholder="Nama Menu" required className="w-full p-2 border rounded"  
           onChange={(e) \=\> setFormData({...formData, name: e.target.value})} /\>

         \<div className="flex gap-4"\>  
           \<input type="number" placeholder="Harga Jual (Rp)" required className="w-full p-2 border rounded"  
             onChange={(e) \=\> setFormData({...formData, price: e.target.value})} /\>  
           \<input type="number" placeholder="Harga Modal (Rp)" required className="w-full p-2 border rounded"  
             onChange={(e) \=\> setFormData({...formData, cost\_price: e.target.value})} /\>  
         \</div\>

         \<select className="w-full p-2 border rounded" onChange={(e) \=\> setFormData({...formData, category: e.target.value})}\>  
           \<option value="Kopi"\>Kopi\</option\>  
           \<option value="Non-Kopi"\>Non-Kopi\</option\>  
           \<option value="Makanan"\>Makanan\</option\>  
         \</select\>

         \<div\>  
           \<label className="block text-sm text-slate-500 mb-1"\>Foto Menu (Opsional)\</label\>  
           \<input type="file" accept="image/\*" className="w-full p-2 border rounded"  
             onChange={(e) \=\> setImageFile(e.target.files\[0\])} /\>  
         \</div\>

         \<button type="submit" disabled={isLoading} className="w-full bg-orange-600 text-white p-2 rounded hover:bg-orange-700"\>  
           {isLoading ? 'Menyimpan...' : 'Simpan Menu'}  
         \</button\>  
       \</form\>  
     );  
   }

## **4.4. Pembuatan Komponen CRUD Manajemen Bahan Baku**

Fitur ini dapat diakses oleh **Admin** dan **Manajemen Bahan**. Komponen ini berfungsi untuk mengubah sisa stok (Update Stock).

**Langkah Eksekusi:**

1. Buka/buat fail: src/features/inventory/components/UpdateStockModal.jsx.  
2. Tulis logika pembaruan (*Update*):  
   import React, { useState } from 'react';  
   import { supabase } from '@/lib/supabaseClient';  
   import { logActivity } from '@/lib/logger';  
   import { useAuth } from '@/features/auth/context/AuthContext';

   export default function UpdateStockModal({ material, onClose, onUpdated }) {  
     const { user } \= useAuth();  
     const \[newStock, setNewStock\] \= useState(material.current\_stock);  
     const \[isLoading, setIsLoading\] \= useState(false);

     const handleUpdate \= async () \=\> {  
       setIsLoading(true);  
       try {  
         const { error } \= await supabase  
           .from('materials')  
           .update({ current\_stock: parseFloat(newStock) })  
           .eq('id', material.id);

         if (error) throw error;

         // Catat Log Aktivitas  
         await logActivity(  
           user.id,   
           'UPDATE\_STOCK',   
           \`Memperbarui stok ${material.name} dari ${material.current\_stock} menjadi ${newStock} ${material.unit}\`  
         );

         alert('Stok berhasil diperbarui\!');  
         onUpdated();  
         onClose();  
       } catch (error) {  
         alert('Gagal perbarui stok: ' \+ error.message);  
       } finally {  
         setIsLoading(false);  
       }  
     };

     return (  
       \<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"\>  
         \<div className="bg-white p-6 rounded-lg shadow-xl w-96"\>  
           \<h3 className="font-bold text-lg mb-4"\>Update Stok: {material.name}\</h3\>  
           \<div className="flex items-center gap-2 mb-6"\>  
             \<input type="number" value={newStock} onChange={(e) \=\> setNewStock(e.target.value)}   
               className="w-full p-2 border rounded" /\>  
             \<span className="font-semibold text-slate-500"\>{material.unit}\</span\>  
           \</div\>  
           \<div className="flex gap-2 justify-end"\>  
             \<button onClick={onClose} className="px-4 py-2 border rounded hover:bg-slate-50"\>Batal\</button\>  
             \<button onClick={handleUpdate} disabled={isLoading} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"\>  
               {isLoading ? 'Menyimpan...' : 'Simpan'}  
             \</button\>  
           \</div\>  
         \</div\>  
       \</div\>  
     );  
   }

## **4.5. Pembuatan Halaman Dashboard AI (Visualisasi Analitik)**

Komponen ini khusus untuk **Admin**. Berfungsi menampilkan hasil pemrosesan algoritma Machine Learning yang dijalankan oleh Flask setiap malam.

**Langkah Eksekusi:**

1. Buka/buat fail: src/pages/DashboardPage.jsx.  
2. Tulis logika kueri pengambilan data *Read-Only*:  
   import React, { useEffect, useState } from 'react';  
   import { supabase } from '@/lib/supabaseClient';  
   // Import komponen UI seperti Card, Badge dari folder UI Anda (jika ada)

   export default function DashboardPage() {  
     const \[clusterData, setClusterData\] \= useState(\[\]);  
     const \[predictionData, setPredictionData\] \= useState(\[\]);

     useEffect(() \=\> {  
       const fetchAIData \= async () \=\> {  
         // 1\. Ambil Hasil K-Means (Join dengan nama produk)  
         const { data: clusters } \= await supabase  
           .from('ai\_cluster\_results')  
           .select(\`  
             cluster\_label, silhouette\_score,  
             products ( name, category )  
           \`)  
           .order('evaluation\_date', { ascending: false })  
           .limit(20); // Ambil evaluasi terbaru

         if (clusters) setClusterData(clusters);

         // 2\. Ambil Hasil Prediksi Stok (Join dengan nama material)  
         const { data: predictions } \= await supabase  
           .from('ai\_prediction\_results')  
           .select(\`  
             predicted\_stock, mape\_score, prediction\_date,  
             materials ( name, unit )  
           \`)  
           .order('prediction\_date', { ascending: false })  
           .limit(10);

         if (predictions) setPredictionData(predictions);  
       };

       fetchAIData();  
     }, \[\]);

     return (  
       \<div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen"\>  
         \<h1 className="text-3xl font-bold text-slate-900"\>Dashboard Kecerdasan Buatan\</h1\>

         \<div className="grid grid-cols-1 lg:grid-cols-2 gap-8"\>  
           {/\* SEKSI 1: HASIL K-MEANS CLUSTERING \*/}  
           \<div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"\>  
             \<h2 className="text-xl font-bold mb-4"\>Segmentasi Kinerja Menu (K-Means)\</h2\>  
             \<div className="space-y-3"\>  
               {clusterData.map((item, idx) \=\> (  
                 \<div key={idx} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50"\>  
                   \<span className="font-semibold"\>{item.products.name}\</span\>  
                   \<span className={\`px-3 py-1 rounded-full text-xs font-bold ${  
                     item.cluster\_label.includes('Laris') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'  
                   }\`}\>  
                     {item.cluster\_label}  
                   \</span\>  
                 \</div\>  
               ))}  
               {clusterData.length \=== 0 && \<p className="text-slate-500"\>Belum ada data evaluasi AI.\</p\>}  
             \</div\>  
           \</div\>

           {/\* SEKSI 2: HASIL REGRESI LINIER (EARLY WARNING) \*/}  
           \<div className="bg-white p-6 rounded-xl shadow-sm border border-red-200"\>  
             \<h2 className="text-xl font-bold mb-4 text-red-600"\>Peringatan Dini Stok (7 Hari ke Depan)\</h2\>  
             \<table className="w-full text-left border-collapse"\>  
               \<thead\>  
                 \<tr className="border-b"\>  
                   \<th className="py-2"\>Bahan Baku\</th\>  
                   \<th className="py-2"\>Prediksi Sisa\</th\>  
                   \<th className="py-2"\>Margin Error (MAPE)\</th\>  
                 \</tr\>  
               \</thead\>  
               \<tbody\>  
                 {predictionData.map((item, idx) \=\> (  
                   \<tr key={idx} className={\`border-b ${item.predicted\_stock \<= 100 ? 'bg-red-50' : ''}\`}\>  
                     \<td className="py-3 font-medium"\>{item.materials.name}\</td\>  
                     \<td className={\`py-3 font-bold ${item.predicted\_stock \<= 100 ? 'text-red-600' : ''}\`}\>  
                       {item.predicted\_stock} {item.materials.unit}  
                     \</td\>  
                     \<td className="py-3 text-slate-500"\>{item.mape\_score}%\</td\>  
                   \</tr\>  
                 ))}  
                 {predictionData.length \=== 0 && \<tr\>\<td colSpan="3" className="py-4 text-slate-500"\>Belum ada data prediksi AI.\</td\>\</tr\>}  
               \</tbody\>  
             \</table\>  
           \</div\>  
         \</div\>  
       \</div\>  
     );  
   }

**Status Penyelesaian Tahap 4:** Setelah dokumen ini dieksekusi, aplikasi React Anda telah memiliki kapabilitas *Back-Office* yang sangat kuat. Anda memiliki operasi pembuatan akun staf, CRUD Menu yang terhubung dengan penyimpanan gambar, manajemen inventaris, sistem logging riwayat (audit trail), serta Dashboard AI fungsional.

Proyek kini siap dilanjutkan ke tahap akhir integrasi dan finalisasi\!