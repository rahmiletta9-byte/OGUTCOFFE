# Dokumentasi Resolusi Bug Ogut POS

Tanggal: 13 Mei 2026

## Ringkasan Eksekutif
Dokumen ini merangkum perbaikan untuk berbagai bug (error 400 dan error JavaScript) yang terjadi pada sistem Ogut POS, terutama pada modul Kasir (POS), Inventory, dan Laporan.

## Detail Perbaikan Bug

### 1. RLS Policies (Row Level Security) Kosong
**Masalah:** Frontend mendapatkan error `400 Bad Request` saat mencoba mengambil log inventory atau data AI karena tabel-tabel di database tidak memiliki RLS policy yang mengizinkan akses `SELECT`. Selain itu, Kasir tidak dapat melihat transaksi sebelumnya.
**Solusi:** Menambahkan RLS policies pada Supabase untuk tabel-tabel berikut:
- `inventory_logs`: Izinkan `admin` dan `manajemen_bahan` untuk `SELECT` dan `INSERT`.
- `ai_cluster_results` & `ai_prediction_results`: Izinkan `admin` untuk `SELECT`.
- `product_materials`: Izinkan `admin` (ALL) dan `kasir` (`SELECT`).
- `transactions` & `transaction_items`: Izinkan `kasir` untuk `SELECT` (sebelumnya hanya `INSERT`).

### 2. Error Ekspor PDF (`doc.autoTable is not a function`)
**Masalah:** Tombol ekspor PDF pada Modal Rekap Harian menghasilkan error `TypeError: doc.autoTable is not a function`.
**Solusi:** Memperbarui kode di `frontend/src/lib/pdfExport.js` untuk mengakomodasi perubahan API di `jspdf-autotable` v5.x.
- Mengubah import: `import autoTable from 'jspdf-autotable';`
- Mengubah pemanggilan: `autoTable(doc, { ... })` alih-alih `doc.autoTable({ ... })`.
- Memperbarui accessor deprecation: `result.finalY` alih-alih `doc.lastAutoTable.finalY`.

### 3. Kolom `category` Hilang di Tabel `materials`
**Masalah:** `InventoryLogPage` mencoba melakukan SELECT kolom `category` dari tabel `materials` yang menyebabkan error karena kolom tersebut tidak ada.
**Solusi:** Menjalankan migrasi SQL untuk menambahkan kolom `category`:
```sql
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'General';
```

### 4. Ketidaksesuaian Label Metode Pembayaran (Transfer vs Debit)
**Masalah:** Pada keranjang kasir (`OrderCart`), opsi pembayaran yang digunakan adalah "Debit", sedangkan pada Modal Rekap Harian (`DailyRevenueModal`), sistem mencari dan menampilkan "Transfer". Ini menyebabkan transaksi Debit tidak terhitung di rekap.
**Solusi:** Mengubah semua referensi "Transfer" menjadi "Debit" pada `DailyRevenueModal.jsx` untuk konsistensi dengan data yang dikirim oleh keranjang kasir.

## Status Sistem
Sistem kini dapat:
1. Memuat daftar inventory tanpa error 400.
2. Mengekspor laporan pendapatan harian ke PDF dengan rincian transaksi lengkap.
3. Menampilkan jumlah transaksi berdasarkan metode pembayaran yang benar.
4. Menampilkan modal Rekap Pendapatan Harian tanpa masalah pemuatan data untuk role Kasir.
