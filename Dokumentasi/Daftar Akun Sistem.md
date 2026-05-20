# Daftar Akun & Kredensial Sistem Ogut Coffee

Dokumen ini berisi daftar akun yang digunakan untuk mengakses berbagai bagian dari sistem POS Ogut Coffee, baik di sisi Frontend maupun Backend Control Panel.

---

## 1. Akun Aplikasi POS (Frontend - React)
Akun-akun ini digunakan untuk login di halaman utama aplikasi Kasir. Autentikasi dikelola langsung oleh **Supabase Auth**.

**Password Default:** `password123`

| Email | Peran (Role) | Hak Akses Utama |
| :--- | :--- | :--- |
| **admin@ogut.com** | `admin` | Seluruh fitur (POS, Dashboard AI, Inventory) |
| **kasir@ogut.com** | `kasir` | Halaman Kasir (POS) & Transaksi |
| **kasir@ogutcoffee.com** | `kasir` | Halaman Kasir (POS) & Transaksi |
| **bahan@ogut.com** | `manajemen_bahan` | Halaman Inventory & Manajemen Stok |

---

## 2. Akun Control Panel IT (Backend - Flask)
Akun ini digunakan khusus untuk mengakses panel kontrol backend (misalnya untuk memantau status RAM N-Gram atau menjalankan paksa AI Batch).

**Lokasi Akses:** `http://localhost:5000/admin/login`

- **Username:** `admin_it`
- **Password:** `supersecretpassword123`

---

## 3. Catatan Keamanan
1. **Dilarang keras** membagikan file `.env` atau `config.json` ke publik.
2. Segera ubah password default setelah sistem di-deploy ke lingkungan produksi.
3. Hak akses (RBAC) dikelola melalui tabel `public.user_roles` di database Supabase.
