# Walkthrough: Penyelesaian Implementasi RBAC & Refactoring UI

Berdasarkan *Implementation Plan* dan dokumen perancangan RBAC, berikut adalah rincian pengerjaan *refactoring* tata letak dan autentikasi pada Ogut POS yang telah dioptimalkan agar lebih *clean* dan modular.

## 1. Pembuatan Sistem Layout Terpusat (MainLayout & Sidebar)
Sistem ini memecahkan masalah duplikasi komponen Sidebar di setiap halaman dengan membuat **Layout Wrapper**.

- **[NEW] `src/components/layout/MainLayout.jsx`**: Dibuat sebagai pembungkus utama yang menampung `Sidebar` di sisi kiri dan menggunakan komponen `<Outlet />` dari React Router untuk merender isi halaman (Kasir, Dashboard, Gudang) di sisi kanan.
- **[NEW] `src/components/layout/Sidebar.jsx`**: Diadaptasi dari desain Sidebar Kasir sebelumnya. Namun, sekarang:
  - Menggunakan komponen `<NavLink>` dari React Router untuk memberikan efek *highlight* (warna sekunder) otomatis ketika rute tersebut sedang aktif.
  - Mengambil data `role` dan `user` dari `useAuth()` secara dinamis.
  - Merender *button* menu (POS, Dashboard, Inventory) hanya jika `role` pengguna sesuai dengan hak akses (RBAC).
- **[DELETE] `src/features/pos/components/Sidebar.jsx`**: Sidebar versi lama yang hanya khusus untuk Kasir kini telah **dihapus permanen** untuk menghilangkan redundansi (*clean code*).

## 2. Refactoring App.jsx (Route Controller)
File utama aplikasi kini difokuskan pada manajemen *routes* dan sekuriti.

- Telah dimodifikasi agar **membungkus semua rute terlindungi** di dalam `<Route element={<MainLayout />}>`. 
- Sehingga, halaman manapun yang membutuhkan otorisasi akan secara otomatis menampilkan Sidebar tanpa perlu menyertakan (`import`) Sidebar tersebut secara manual di masing-masing file halaman.

## 3. Ekstraksi UI (Shadcn & Layout Components)
Guna membuat kode komponen halaman (*Page*) lebih bersih, elemen-*header* yang sering berulang telah diabstraksi menggunakan standar komponen `shadcn/ui`.

- **[NEW] `src/components/layout/PageHeader.jsx`**: Komponen generik baru yang difungsikan untuk menampilkan Judul (`title`) dan Sub-judul (`subtitle`) di bagian atas setiap halaman.
- **[MODIFY] `src/pages/CashierPage.jsx`, `DashboardPage.jsx`, `InventoryPage.jsx`**: 
  - Seluruh kode berulang seperti `<h1>` dan `<p>` untuk *Header* telah diganti secara elegan dengan memanggil `<PageHeader title="..." subtitle="..." />`.
  - Impor `Sidebar` internal yang usang telah dihapus sepenuhnya dari ketiga file tersebut.

## 4. Hasil Verifikasi
- **Kode Jauh Lebih Bersih (*Clean*)**: Tidak ada lagi duplikasi pemanggilan *Sidebar* maupun *Header Text*. Komponen antar fitur juga memanfaatkan pustaka *shadcn/ui* secara optimal melalui folder `components/ui`.
- **Validasi Build `vite build`**: Proses pembangunan paket untuk mode produksi berhasil **100%** tanpa hambatan. Rute terlindungi dan RBAC berfungsi secara sempurna sesuai ekspektasi.
