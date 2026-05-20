# **DOKUMENTASI PERANCANGAN UI/UX FRONTEND**

**Sistem Point of Sales (POS) Ogut Coffee**

Dokumen ini adalah panduan teknis *styling* dan tata letak untuk mengimplementasikan antarmuka Point of Sales (POS) berdasarkan referensi desain ergonomis (struktur 3-Kolom). Implementasi ini memaksimalkan penggunaan **shadcn/ui** dan utilitas **TailwindCSS**, dengan penyesuaian tema khusus menggunakan **Palet Warna Kopi (Coklat Tua, Coklat Muda, dan Aksen Merah)**.

## **1\. Arsitektur Tata Letak (Layouting) & Struktur DOM**

Layar kasir tidak digulir (*scroll*) secara keseluruhan untuk mencegah antarmuka melompat-lompat. Kita menggunakan kontainer tinggi-penuh (h-screen) berbasis *Flexbox*, di mana guliran hanya terjadi pada area spesifik (produk dan keranjang).

**Struktur Layout Global (App.jsx / CashierPage.jsx):**

\<div className="flex h-screen w-full bg-stone-50 overflow-hidden font-sans text-slate-800"\>  
    
  {/\* KOLOM 1: Kiri (Navigasi Utama) \- Fixed Width \*/}  
  \<aside className="w-\[100px\] lg:w-\[240px\] bg-stone-50 flex flex-col p-4 border-r border-stone-200/50"\>  
    {/\* Isi Menu Navigasi (Menu, Table Services, dsb) \*/}  
  \</aside\>

  {/\* KOLOM 2: Tengah (Katalog & Pencarian) \- Flexible Width \*/}  
  \<main className="flex-1 bg-white rounded-3xl m-2 flex flex-col shadow-sm overflow-hidden border border-stone-100"\>  
    {/\* Header (Search Bar) & Scrollable Grid Produk \*/}  
  \</main\>

  {/\* KOLOM 3: Kanan (Panel Order/Keranjang) \- Fixed Width \*/}  
  \<aside className="w-\[350px\] xl:w-\[380px\] bg-white flex flex-col shadow-\[-10px\_0\_30px\_-15px\_rgba(0,0,0,0.05)\] z-10"\>  
    {/\* Header Meja, Tabs Tipe Pesanan, Isi Keranjang, & Checkout \*/}  
  \</aside\>

\</div\>

## **2\. Sistem Desain (Design System) & Pewarnaan**

Estetika desain dimodifikasi dari referensi asli untuk menyesuaikan dengan *branding* **Ogut Coffee**.

### **A. Palet Warna Utama (Color Palette Tailwind)**

* **Primary Dark Brown (Coklat Tua):** bg-amber-900 (Tailwind: \#78350f). Digunakan untuk tombol aksi utama (Place Order), teks harga, dan ikon kategori yang sedang aktif.  
* **Secondary Light Brown (Coklat Muda):** bg-amber-100 (Tailwind: \#fef3c7). Digunakan untuk latar belakang elemen yang disorot, seperti tombol kategori yang sedang aktif atau *hover state*.  
* **Accent Red (Merah):** bg-red-600 (Tailwind: \#dc2626). Digunakan untuk elemen yang menarik perhatian seperti *Badge Promo / Diskon*, indikator peringatan stok, ikon Non-Veg (Daging), atau tombol hapus/kurang item.  
* **Background Utama:** bg-stone-50 (Krem sangat pudar/putih gading) agar kartu putih terlihat menonjol.

### **B. Properti Fisik (Visual Style)**

* **Border Radius:** Mayoritas elemen menggunakan kelengkungan ekstra rounded-2xl atau rounded-3xl (bukan standar shadcn rounded-md).  
* **Shadow:** Gunakan bayangan halus shadow-sm untuk memberikan efek mengambang.  
* **Borders:** Hindari garis *border* tebal. Gunakan tanpa *border* atau *border* pudar border-stone-100.

*(Penting: Tambahkan \--radius: 1rem; pada file src/index.css di block @layer base :root untuk mengubah radius bawaan shadcn).*

## **3\. Rincian Penggunaan Komponen shadcn/ui**

Berikut adalah bedah komponen secara mendetail beserta contoh implementasi JSX-nya yang sudah diadaptasi dengan tema warna Coklat & Merah.

### **3.1. Top Bar & Pencarian (Kolom Tengah Atas)**

* **Komponen:** \<Input /\> bawaan shadcn yang dimodifikasi.  
* **Implementasi:** Membuat input pencarian membulat sempurna (pill-shape) tanpa garis pinggir yang keras.

import { Input } from "@/components/ui/input"  
import { Search, Grid } from "lucide-react"

\<div className="flex gap-4 mb-6 p-6 pb-0"\>  
  \<div className="relative flex-1"\>  
    \<Search className="absolute left-4 top-3.5 h-5 w-5 text-stone-400" /\>  
    \<Input   
      type="text"   
      placeholder="Search Product here..."   
      className="pl-12 h-12 bg-stone-50 border-transparent rounded-full focus-visible:ring-2 focus-visible:ring-amber-900 shadow-none text-base transition-all"  
    /\>  
  \</div\>  
  \<button className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-stone-100 hover:bg-stone-50"\>  
    \<Grid className="w-5 h-5 text-amber-900" /\>  
  \</button\>  
\</div\>

### **3.2. Kartu Kategori Makanan**

* **Saran:** Menggunakan *custom button* (bukan \<Card\>) karena ini adalah elemen *toggle* interaktif.  
* **Implementasi:** Warna Coklat Muda untuk latar dan Coklat Tua untuk ikon/teks saat aktif.

// Contoh Kategori yang sedang AKTIF  
\<button className="flex flex-col items-center justify-center min-w-\[90px\] p-4 bg-amber-100 border border-amber-200 rounded-2xl transition-all shadow-sm"\>  
  \<div className="bg-white p-2 rounded-xl mb-2 shadow-sm"\>  
     {/\* Ikon Kustom Makanan \*/}  
     \<Coffee className="w-6 h-6 text-amber-900" /\>  
  \</div\>  
  \<span className="font-bold text-sm text-amber-950"\>Coffee\</span\>  
  \<span className="text-\[10px\] text-amber-700/70"\>12 Items\</span\>  
\</button\>

// Contoh Kategori TIDAK AKTIF  
\<button className="flex flex-col items-center justify-center min-w-\[90px\] p-4 bg-white border border-stone-100 rounded-2xl hover:bg-stone-50 transition-all"\>  
  \<div className="p-2 mb-2"\>  
     \<Croissant className="w-6 h-6 text-stone-400" /\>  
  \</div\>  
  \<span className="font-bold text-sm text-stone-600"\>Pastry\</span\>  
  \<span className="text-\[10px\] text-stone-400"\>8 Items\</span\>  
\</button\>

### **3.3. Kartu Produk (Product Grid)**

* **Komponen:** \<Card\>, \<CardContent\>, \<Badge\>, \<Button\>  
* **Implementasi:** Kartu produk membulat dengan *badge* diskon berwarna **Merah** dan tombol tambah berwarna **Coklat**.

import { Card, CardContent } from "@/components/ui/card"  
import { Badge } from "@/components/ui/badge"  
import { Button } from "@/components/ui/button"

\<Card className="rounded-3xl border-stone-100 shadow-sm overflow-hidden flex flex-col relative group"\>  
  {/\* Label Diskon Mengambang (Aksen Merah) \*/}  
  \<Badge className="absolute top-3 left-3 bg-red-100 text-red-700 hover:bg-red-100 border-none rounded-md px-2 py-0.5 text-xs font-bold z-10"\>  
    20% OFF  
  \</Badge\>

  {/\* Area Gambar \*/}  
  \<div className="h-40 w-full bg-stone-100 p-2 relative overflow-hidden"\>  
    \<img src="..." alt="Kopi Susu" className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300" /\>  
  \</div\>

  \<CardContent className="p-4 flex-1 flex flex-col bg-white"\>  
    \<h3 className="font-bold text-sm text-stone-800 line-clamp-2 leading-tight mb-2"\>  
      Kopi Susu Gula Aren Spesial  
    \</h3\>  
      
    \<div className="flex items-center justify-between mt-auto mb-4"\>  
      {/\* Harga Coklat Tua \*/}  
      \<span className="font-extrabold text-amber-900"\>Rp 18.000\</span\>  
      \<div className="flex items-center gap-1 text-xs text-stone-500 font-medium"\>  
         {/\* Aksen Merah untuk Non-Veg/Best Seller \*/}  
         \<Flame className="w-3 h-3 text-red-500" /\> Laris  
      \</div\>  
    \</div\>

    {/\* Tombol Add (Coklat Muda) \*/}  
    \<Button variant="outline" className="w-full rounded-xl border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:text-amber-950 font-semibold transition-colors"\>  
      Add to Order  
    \</Button\>  
  \</CardContent\>  
\</Card\>

### **3.4. Tab Tipe Pesanan (Panel Kanan Atas)**

* **Komponen:** \<Tabs\>, \<TabsList\>, \<TabsTrigger\> dari shadcn.  
* **Implementasi:** Mengubah sorotan tab aktif menjadi bayangan putih agar terlihat menyatu dengan panel krem.

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

\<Tabs defaultValue="dine\_in" className="w-full px-6 py-4"\>  
  \<TabsList className="w-full bg-stone-100 p-1 rounded-full h-12"\>  
    \<TabsTrigger value="dine\_in" className="flex-1 rounded-full data-\[state=active\]:bg-white data-\[state=active\]:shadow-sm data-\[state=active\]:text-amber-900 text-stone-500 font-medium"\>  
      Dine in  
    \</TabsTrigger\>  
    \<TabsTrigger value="take\_away" className="flex-1 rounded-full data-\[state=active\]:bg-white data-\[state=active\]:shadow-sm data-\[state=active\]:text-amber-900 text-stone-500 font-medium"\>  
      Take Away  
    \</TabsTrigger\>  
  \</TabsList\>  
\</Tabs\>

### **3.5. Metode Pembayaran & Tombol Checkout (Panel Kanan Bawah)**

* **Komponen:** Kumpulan \<Button\> shadcn di dalam div bawah.  
* **Implementasi:** Tombol utama menggunakan Coklat Tua pekat, sedangkan metode pembayaran aktif menggunakan Coklat Muda. Aksen merah digunakan pada ikon Minus di daftar keranjang jika kasir ingin mengurangi pesanan.

\<div className="p-6 border-t border-dashed border-stone-200 bg-white mt-auto"\>  
  {/\* Ringkasan Harga \*/}  
  \<div className="space-y-2 mb-6"\>  
    \<div className="flex justify-between text-stone-500 text-sm"\>\<span\>Sub Total\</span\>\<span\>Rp 60.000\</span\>\</div\>  
    \<div className="flex justify-between text-stone-500 text-sm"\>\<span\>Tax 10%\</span\>\<span\>Rp 6.000\</span\>\</div\>  
    \<div className="flex justify-between font-bold text-xl mt-4 pt-4 border-t border-dashed border-stone-200 text-amber-950"\>  
      \<span\>Total Amount\</span\>\<span\>Rp 66.000\</span\>  
    \</div\>  
  \</div\>

  {/\* Pilihan Metode Pembayaran \*/}  
  \<div className="grid grid-cols-3 gap-3 mb-6"\>  
    {/\* Metode Aktif (Contoh: Cash) \*/}  
    \<Button variant="default" className="h-16 flex flex-col rounded-2xl bg-amber-100 text-amber-900 hover:bg-amber-200 shadow-none border border-amber-200"\>  
      \<Banknote className="w-6 h-6 mb-1" /\> Cash  
    \</Button\>  
    {/\* Metode Tidak Aktif \*/}  
    \<Button variant="outline" className="h-16 flex flex-col rounded-2xl border-stone-200 text-stone-500 hover:bg-stone-50"\>  
      \<QrCode className="w-6 h-6 mb-1" /\> QRIS  
    \</Button\>  
    \<Button variant="outline" className="h-16 flex flex-col rounded-2xl border-stone-200 text-stone-500 hover:bg-stone-50"\>  
      \<CreditCard className="w-6 h-6 mb-1" /\> Debit  
    \</Button\>  
  \</div\>

  {/\* Tombol Aksi Utama (Place Order) \- Coklat Tua Pekat \*/}  
  \<Button className="w-full h-14 rounded-2xl bg-amber-900 hover:bg-amber-950 text-white font-bold text-lg shadow-\[0\_8px\_20px\_rgba(120,53,15,0.25)\] transition-all"\>  
    Place Order  
  \</Button\>  
\</div\>

## **4\. Dekomposisi Tahap Implementasi UI/UX ke Sistem**

Untuk menerjemahkan perancangan desain di atas ke dalam proyek React nyata, ikuti urutan langkah-langkah implementasi (dekomposisi) berikut agar kode tetap bersih dan minim konflik:

### **Tahap 1: Konfigurasi Tema Global & CSS Override**

1. **Modifikasi Radius shadcn:** Buka fail src/index.css. Pada layer base (@layer base), ubah variabel \--radius menjadi 1rem atau 1.25rem agar seluruh komponen shadcn secara *default* memiliki lengkungan ekstrem (mendekati pill-shape).  
2. **Hapus Border Default:** Di file konfigurasi tailwind.config.js atau CSS, pastikan tidak ada *outline* tebal saat *focus* (mengandalkan focus-visible:ring).

### **Tahap 2: Konstruksi Kerangka Dasar (Skeleton Layout)**

1. **Pembuatan Wrapper Utama:** Di komponen CashierPage.jsx, bangun kontainer div utama dengan properti flex h-screen w-full bg-stone-50 overflow-hidden.  
2. **Pembuatan Kontainer 3 Kolom:** \* Buat \<aside\> pertama untuk navigasi (lebar tetap).  
   * Buat \<main\> untuk area katalog produk (properti flex-1 agar memenuhi sisa layar tengah).  
   * Buat \<aside\> kedua untuk keranjang/checkout (lebar tetap di sisi kanan, atur dengan properti shadow ke arah kiri).

### **Tahap 3: Implementasi Kolom 1 (Sidebar Navigasi)**

1. **Pemasangan Ikon:** Gunakan lucide-react (seperti LayoutDashboard, LogOut, Settings) untuk menu samping.  
2. **Active State:** Terapkan properti kondisional pada kelas Tailwind. Jika menu sedang aktif, berikan bg-amber-100 text-amber-900. Jika tidak, text-stone-500 hover:bg-stone-100.

### **Tahap 4: Implementasi Kolom 2 (Katalog & Pencarian)**

1. **Header & Search Bar:** Letakkan komponen \<Input /\> kustom (Seksi 3.1) di bagian atas \<main\>. Pastikan area ini bersifat *sticky* atau tidak ikut tergulung saat *scroll* ke bawah.  
2. **Kategori Horizontal:** Buat satu baris *flex* dengan overflow-x-auto dan sembunyikan bilah gulir (scrollbar-hide). Petakan daftar kategori (Seksi 3.2) di sini.  
3. **Grid Produk (Scrollable):** Di bawah kategori, buat kontainer dengan flex-1 overflow-y-auto. Terapkan grid grid-cols-2 md:grid-cols-3 untuk meletakkan komponen \<Card\> produk (Seksi 3.3).

### **Tahap 5: Implementasi Kolom 3 (Panel Keranjang & Checkout)**

1. **Header & Tabs:** Letakkan tab tipe pesanan (Seksi 3.4) di bagian teratas *sidebar* kanan.  
2. **Daftar Pesanan (*Cart List*):** Buat area flex-1 overflow-y-auto di bawah tab. Di sini akan dirender daftar item yang telah dipilih. Tambahkan tombol interaktif (+ / \-) dengan warna Coklat/Merah untuk menambah/mengurangi pesanan.  
3. **Footer Checkout:** Di paling bawah (menempel pada dasar), buat div *sticky* yang membungkus komponen Ringkasan Harga, Toggle Metode Pembayaran, dan tombol *Place Order* (Seksi 3.5).