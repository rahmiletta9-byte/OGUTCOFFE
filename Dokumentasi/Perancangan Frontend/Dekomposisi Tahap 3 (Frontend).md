# **DEKOMPOSISI TAHAP 3: PENGEMBANGAN FITUR KASIR (POS)**

**Sub-sistem Frontend React.js \- POS Ogut Coffee**

Dokumen ini merinci langkah-langkah operasional untuk membangun fitur utama aplikasi, yakni halaman Point of Sales (POS). Fitur ini berfokus pada kecepatan transaksi, manipulasi keranjang belanja (*cart state*), dan integrasi API *Fire-and-Forget* ke *backend* Flask.

## **3.1. Pembuatan Custom Hook: useDebounce**

Langkah pertama adalah membuat mekanisme pengaman (*throttle/debounce*) untuk kolom pencarian. Ini sangat krusial agar React tidak menembakkan API (kueri pencarian) setiap kali kasir menekan satu tombol huruf, melainkan menunggu hingga kasir selesai mengetik.

**Langkah Eksekusi:**

1. Buat fail baru: src/features/pos/hooks/useDebounce.js.  
2. Tulis logika timer berikut:  
   import { useState, useEffect } from 'react';

   export default function useDebounce(value, delay) {  
     const \[debouncedValue, setDebouncedValue\] \= useState(value);

     useEffect(() \=\> {  
       // Pasang timer yang akan mengubah debouncedValue setelah \[delay\] milidetik  
       const handler \= setTimeout(() \=\> {  
         setDebouncedValue(value);  
       }, delay);

       // Cleanup function: Batalkan timer jika 'value' berubah sebelum delay selesai  
       return () \=\> {  
         clearTimeout(handler);  
       };  
     }, \[value, delay\]);

     return debouncedValue;  
   }

## **3.2. Pembuatan Komponen Moduler (UI Kasir)**

Memecah antarmuka kasir menjadi beberapa komponen kecil agar mudah dikelola dan dirender ulang (re-render) secara efisien.

**Langkah Eksekusi:**

1. **Buat Komponen Kartu Produk (ProductCard.jsx)**  
   * Lokasi: src/features/pos/components/ProductCard.jsx  
   * Fungsi: Menampilkan gambar, nama menu, dan harga. Menangani interaksi onClick untuk masuk ke keranjang. Dilengkapi *fallback* jika URL gambar Supabase rusak/kosong.

import React from 'react';

export default function ProductCard({ product, onAddToCart }) {  
  const fallbackImg \= "/assets/placeholder-coffee.png"; // Pastikan gambar ini ada di folder public/assets

  return (  
    \<div   
      onClick={() \=\> onAddToCart(product)}   
      className="cursor-pointer border rounded-xl overflow-hidden hover:shadow-md transition-all group bg-white"  
    \>  
      \<div className="h-32 bg-slate-200 w-full relative overflow-hidden"\>  
        \<img   
          src={product.image\_url || fallbackImg}   
          alt={product.name}   
          onError={(e) \=\> { e.target.src \= fallbackImg }}  
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"   
        /\>  
        \<span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-xs px-2 py-1 rounded-full font-semibold border"\>  
          {product.category}  
        \</span\>  
      \</div\>  
      \<div className="p-4"\>  
        \<h3 className="font-semibold text-slate-800 line-clamp-1"\>{product.name}\</h3\>  
        \<p className="text-orange-600 font-bold mt-1"\>Rp {product.price.toLocaleString('id-ID')}\</p\>  
      \</div\>  
    \</div\>  
  );  
}

## **3.3. Logika Transaksi & *Fire-and-Forget* API**

Membuat fungsi khusus yang menangani proses penyimpanan transaksi yang kompleks. Data harus disimpan ke tabel transactions (induk) lalu ID-nya digunakan untuk menyimpan ke transaction\_items (anak).

**Langkah Eksekusi:**

1. Buat fail utilitas: src/features/pos/services/checkoutService.js.  
2. Tulis logika transaksi asinkron berikut:  
   import { supabase } from '@/lib/supabaseClient';

   export const processCheckout \= async (cartItems, totalAmount, paymentMethod) \=\> {  
     try {  
       // 1\. Catat Header Transaksi ke Supabase  
       const { data: trxData, error: trxError } \= await supabase  
         .from('transactions')  
         .insert(\[{ total\_amount: totalAmount, payment\_method: paymentMethod }\])  
         .select('id')  
         .single();

       if (trxError) throw trxError;

       // 2\. Siapkan detail pesanan (termasuk kalkulasi profit statis)  
       const transactionId \= trxData.id;  
       const orderDetails \= cartItems.map(item \=\> ({  
         transaction\_id: transactionId,  
         product\_id: item.id,  
         quantity: item.qty,  
         subtotal: item.price \* item.qty,  
         profit\_margin: (item.price \- item.cost\_price) \* item.qty  
       }));

       // 3\. Catat Item Transaksi (Bulk Insert)  
       const { error: itemsError } \= await supabase  
         .from('transaction\_items')  
         .insert(orderDetails);

       if (itemsError) throw itemsError;

       // \==========================================  
       // 4\. FIRE-AND-FORGET KE FLASK (AI N-GRAM)  
       // \==========================================  
       // Request dikirim TANPA await, agar UI React langsung merespons "Sukses"  
       // meskipun server Flask butuh waktu tambahan untuk memproses N-Gram.  
       fetch(\`${import.meta.env.VITE\_FLASK\_API\_URL}/api/ngram/increment\`, {  
         method: 'POST',  
         headers: { 'Content-Type': 'application/json' },  
         body: JSON.stringify({ items: cartItems.map(item \=\> item.name) })  
       }).catch(err \=\> console.error("Flask Background Task Failed:", err));

       return { success: true };  
     } catch (error) {  
       console.error("Checkout gagal:", error);  
       return { success: false, error: error.message };  
     }  
   };

## **3.4. Perakitan Halaman Utama Kasir (CashierPage)**

Menggabungkan kolom pencarian, logika *debounce*, daftar produk, dan *state* keranjang ke dalam satu komponen halaman utama.

**Langkah Eksekusi:**

1. Buka/buat fail: src/pages/CashierPage.jsx.  
2. Susun komponen lengkap berikut:  
   import React, { useState, useEffect } from 'react';  
   import { supabase } from '@/lib/supabaseClient';  
   import ProductCard from '@/features/pos/components/ProductCard';  
   import useDebounce from '@/features/pos/hooks/useDebounce';  
   import { processCheckout } from '@/features/pos/services/checkoutService';  
   // (Import ikon Lucide jika diperlukan seperti Search, ShoppingCart, Plus, Minus)

   export default function CashierPage() {  
     const \[products, setProducts\] \= useState(\[\]);  
     const \[cart, setCart\] \= useState(\[\]);  
     const \[searchQuery, setSearchQuery\] \= useState('');  
     const \[paymentMethod, setPaymentMethod\] \= useState('Cash');  
     const \[isCheckingOut, setIsCheckingOut\] \= useState(false);

     // Menerapkan debounce 300ms pada input pencarian  
     const debouncedSearch \= useDebounce(searchQuery, 300);

     // Tarik data produk dari Supabase (terpengaruh oleh debouncedSearch)  
     useEffect(() \=\> {  
       const fetchProducts \= async () \=\> {  
         let query \= supabase.from('products').select('\*');  
         if (debouncedSearch) {  
           query \= query.ilike('name', \`%${debouncedSearch}%\`);  
         }  
         const { data } \= await query.limit(20);  
         if (data) setProducts(data);  
       };  
       fetchProducts();  
     }, \[debouncedSearch\]);

     // \--- Logika Cart \---  
     const handleAddToCart \= (product) \=\> {  
       setCart(prev \=\> {  
         const exists \= prev.find(item \=\> item.id \=== product.id);  
         if (exists) return prev.map(item \=\> item.id \=== product.id ? { ...item, qty: item.qty \+ 1 } : item);  
         return \[...prev, { ...product, qty: 1 }\];  
       });  
     };

     const updateQty \= (id, delta) \=\> {  
       setCart(prev \=\> prev.map(item \=\> {  
         if (item.id \=== id) {  
           const newQty \= item.qty \+ delta;  
           return newQty \> 0 ? { ...item, qty: newQty } : item;  
         }  
         return item;  
       }).filter(item \=\> item.qty \> 0)); // Otomatis hapus jika qty \= 0  
     };

     const totalAmount \= cart.reduce((sum, item) \=\> sum \+ (item.price \* item.qty), 0);

     // \--- Logika Checkout \---  
     const handleCheckout \= async () \=\> {  
       if (cart.length \=== 0\) return;  
       setIsCheckingOut(true);

       const result \= await processCheckout(cart, totalAmount, paymentMethod);

       if (result.success) {  
         alert(\`Transaksi Berhasil (Metode: ${paymentMethod})\!\`);  
         setCart(\[\]); // Reset Cart Instan  
         setSearchQuery('');  
       } else {  
         alert("Gagal memproses transaksi: " \+ result.error);  
       }  
       setIsCheckingOut(false);  
     };

     return (  
       \<div className="flex h-screen bg-slate-100 overflow-hidden"\>  
         {/\* AREA KIRI: KATALOG & PENCARIAN \*/}  
         \<div className="flex-1 flex flex-col p-6 overflow-hidden"\>  
           \<div className="mb-6"\>  
             \<input   
               type="text"   
               placeholder="Cari nama menu..."   
               value={searchQuery}  
               onChange={(e) \=\> setSearchQuery(e.target.value)}  
               className="w-full max-w-md p-3 rounded-lg border border-slate-200 shadow-sm focus:ring-2 focus:ring-orange-600 outline-none"  
             /\>  
           \</div\>

           {/\* Grid Produk \*/}  
           \<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-auto pb-20"\>  
             {products.map(product \=\> (  
               \<ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} /\>  
             ))}  
           \</div\>  
         \</div\>

         {/\* AREA KANAN: SIDEBAR KERANJANG (CART) \*/}  
         \<div className="w-96 bg-white border-l shadow-xl flex flex-col z-10"\>  
           \<div className="p-5 border-b bg-slate-50"\>  
             \<h2 className="text-xl font-bold text-slate-800"\>Keranjang Kasir\</h2\>  
           \</div\>

           {/\* Daftar Item \*/}  
           \<div className="flex-1 overflow-auto p-4 space-y-3"\>  
             {cart.map(item \=\> (  
               \<div key={item.id} className="flex justify-between items-center p-3 border rounded-lg"\>  
                 \<div\>  
                   \<h4 className="font-semibold text-sm line-clamp-1"\>{item.name}\</h4\>  
                   \<p className="text-orange-600 font-bold text-sm"\>Rp {(item.price \* item.qty).toLocaleString('id-ID')}\</p\>  
                 \</div\>  
                 \<div className="flex items-center gap-2 border rounded"\>  
                   \<button onClick={() \=\> updateQty(item.id, \-1)} className="px-2 py-1 hover:bg-slate-100 text-lg"\>-\</button\>  
                   \<span className="w-6 text-center text-sm"\>{item.qty}\</span\>  
                   \<button onClick={() \=\> updateQty(item.id, 1)} className="px-2 py-1 hover:bg-slate-100 text-lg"\>+\</button\>  
                 \</div\>  
               \</div\>  
             ))}  
           \</div\>

           {/\* Ringkasan & Tombol Bayar \*/}  
           \<div className="p-5 border-t bg-slate-50"\>  
             \<div className="mb-4"\>  
               \<label className="text-xs font-semibold text-slate-500 uppercase"\>Metode Pembayaran\</label\>  
               \<select   
                 value={paymentMethod}   
                 onChange={(e) \=\> setPaymentMethod(e.target.value)}  
                 className="w-full mt-1 p-2 border rounded bg-white"  
               \>  
                 \<option value="Cash"\>Tunai (Cash)\</option\>  
                 \<option value="QRIS"\>QRIS\</option\>  
                 \<option value="Debit"\>Kartu Debit\</option\>  
               \</select\>  
             \</div\>

             \<div className="flex justify-between items-center mb-4"\>  
               \<span className="text-slate-500 font-bold"\>Total\</span\>  
               \<span className="text-2xl font-bold text-slate-900"\>Rp {totalAmount.toLocaleString('id-ID')}\</span\>  
             \</div\>

             \<button   
               onClick={handleCheckout}   
               disabled={cart.length \=== 0 || isCheckingOut}  
               className="w-full h-12 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed"  
             \>  
               {isCheckingOut ? 'Memproses...' : 'Selesaikan Pembayaran'}  
             \</button\>  
           \</div\>  
         \</div\>  
       \</div\>  
     );  
   }

**Status Penyelesaian Tahap 3:** Jika Anda telah merangkai komponen di atas, fitur kasir Anda sudah dapat berjalan penuh. Kasir dapat melakukan pencarian menu, melihat gambar, memasukkan menu ke keranjang, memilih metode pembayaran, dan melakukan *checkout* di mana datanya langsung tersimpan di Supabase secara *real-time*.

Proyek siap dilanjutkan ke **Tahap 4 (Pengembangan Fitur CRUD Manajemen dan Dashboard AI)**.