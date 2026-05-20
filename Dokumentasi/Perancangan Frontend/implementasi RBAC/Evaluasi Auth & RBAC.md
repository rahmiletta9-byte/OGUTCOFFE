# Dokumentasi Evaluasi: Autentikasi & RBAC (Role-Based Access Control)

Dokumen ini disusun sebagai bahan *brainstorming* untuk meninjau ulang, mengevaluasi, dan merencanakan peningkatan pada sistem autentikasi dan manajemen hak akses di aplikasi POS Ogut Coffee.

---

## 1. Topologi Autentikasi Saat Ini (Dual-System)
Sistem saat ini menggunakan dua mekanisme yang berjalan secara terpisah (Siloed):
*   **Frontend (React POS)**: Menggunakan **Supabase Auth** secara native. Mengelola JWT token di browser dan mencocokkan user dengan tabel `user_roles`.
*   **Backend (Flask Control Panel)**: Menggunakan sistem login tradisional berbasis **Flask Session** dengan mengecek *username* dan *password* yang di-*hardcode* di dalam file `config.json`.

**Poin Brainstorming:**
*   Sistem ganda ini menyulitkan pemeliharaan. Jika seorang admin resign, kita harus mencabut aksesnya di Supabase dan juga mengubah `config.json` di server Flask.
*   *Solusi Ideal*: Menyatukan semuanya ke Supabase. Flask backend tidak perlu menyimpan kredensial mandiri, melainkan bertindak sebagai *Resource Server* yang memverifikasi JWT Token dari Supabase ketika ada request masuk.

---

## 2. Permasalahan State Management & UI (Kasus "Processing..." Tertahan)
Dari observasi pada *development environment*, sering terjadi kasus di mana tombol login stuck di **"PROCESSING..."**. Ini adalah masalah *race condition* dan *state management* di React.

**Akar Masalah:**
1.  **React 18 Strict Mode**: Membuat komponen dimuat ulang dua kali di fase *development*. Hal ini memicu fungsi `onAuthStateChange` dan inisialisasi sesi (`getSession`) berjalan tumpang tindih. Jika tidak ditangani menggunakan *closure/cleanup* yang ekstra ketat, state `loading` akan gagal dikembalikan ke `false`.
2.  **Jebakan `isSubmitting`**: Pada `LoginPage.jsx`, jika proses login (`signInWithPassword`) sukses tanpa error jaringan, tetapi kemudian ditolak oleh logika pengecekan Role (user tidak berhak), state `isSubmitting` lupa dikembalikan ke `false`, sehingga tombol mematung di "PROCESSING..." dan memblokir layar.

**Poin Brainstorming:**
*   Perlu *refactoring* dengan *State Machine* (misal: XState) atau reduksi state agar status "Loading", "Success", "Error" menjadi *mutually exclusive* (tidak tumpang tindih).

---

## 3. Evaluasi RBAC (Role-Based Access Control)
Manajemen hak akses saat ini (`admin`, `kasir`, `manajemen_bahan`) bergantung pada tabel `user_roles`.

**Celah yang Ditemukan & Diperbaiki:**
*   **Row Level Security (RLS) Buta**: Sebelumnya RLS tabel `user_roles` menyala tapi tidak punya *Policy*. Akibatnya API Supabase menolak memberikan data role ke user yang sah, dan memicu error massal. (Ini telah ditambal dengan Policy yang membolehkan `auth.uid() = user_id`).
*   **Frontend-Only Protection**: Saat ini pembatasan akses hanya ada di UI (menyembunyikan halaman React). Jika seseorang mengetahui struktur URL API Flask (misal endpoint `/api/ngram/increment`), mereka bisa melakukan request langsung menggunakan Postman/cURL tanpa perlu role `kasir`.

**Poin Brainstorming:**
*   **API Gateway / Middleware**: Flask harus diperbarui agar setiap request API dari React wajib menyertakan *Bearer Token* (JWT dari Supabase). Flask lalu memvalidasi token tersebut dan mengecek *Role*-nya sebelum memproses data N-Gram atau AI.
*   **Custom Claims vs Tabel Database**: Saat ini role disimpan di tabel terpisah (`user_roles`). Setiap kali aplikasi memuat, butuh 1 request ekstra untuk mengambil role. Supabase memungkinkan kita menyimpan role di *JWT Custom Claims*. Keuntungannya: Role langsung melekat di Token, tidak perlu query database berulang kali, mempercepat loading yang "Lama".

---

## 4. Kesimpulan Rekomendasi Jangka Pendek & Menengah
1.  **Segera (Hotfix UI)**: Memperbaiki logika `isSubmitting` di `LoginPage.jsx` agar me-reset statusnya jika user berhasil melewati Auth tapi gagal pada validasi Role.
2.  **Menengah (Penyatuan Auth)**: Mengonversi halaman Admin Flask agar hanya bisa diakses menggunakan login Supabase (Single Sign-On).
3.  **Menengah (Keamanan API)**: Memasang decorator `@jwt_required` (memvalidasi Supabase Token) di seluruh route Flask `/api/*` untuk mencegah serangan manipulasi memori AI.
