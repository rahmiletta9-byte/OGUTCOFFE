# **DOKUMENTASI SOLUSI & PENINGKATAN AUTH & RBAC**

**Sistem Point of Sales (POS) Ogut Coffee**

Dokumen ini adalah cetak biru (blueprint) perbaikan dan peningkatan sistem autentikasi dan *Role-Based Access Control* (RBAC) berdasarkan evaluasi yang telah dilakukan. Perbaikan dibagi menjadi dua fase: **Fase Hotfix (Segera)** dan **Fase Peningkatan Arsitektur (Menengah)**.

## **FASE 1: HOTFIX (SEGERA DILAKUKAN)**

Fase ini bertujuan untuk menyelesaikan *bug* yang saat ini mengganggu operasional atau proses *development*, yaitu error RLS saat menarik data *role* dan tombol login yang mematung ("Processing...").

### **1.1. Perbaikan RLS Tabel user\_roles (SQL)**

Masalah RLS buta yang membuat Supabase menolak memberikan data *role* ke user yang sah dapat diselesaikan dengan menambahkan *Policy* SELECT.

**Tindakan:** Jalankan skrip ini di SQL Editor Supabase.

\-- Pastikan RLS menyala pada tabel user\_roles  
ALTER TABLE user\_roles ENABLE ROW LEVEL SECURITY;

\-- Buat policy yang mengizinkan user membaca rolenya sendiri saat login  
CREATE POLICY "Izinkan user membaca rolenya sendiri"   
ON user\_roles FOR SELECT   
USING (auth.uid() \= user\_id);

### **1.2. Perbaikan State "Processing..." (React)**

Masalah tombol login yang tertahan akibat *race condition* atau kegagalan validasi *role* dapat diatasi dengan memastikan fungsi reset state tereksekusi sebelum navigasi atau saat *error* tertangkap.

**Tindakan:** Modifikasi blok try-catch pada handleLogin di src/pages/LoginPage.jsx.

  const handleLogin \= async (e) \=\> {  
    e.preventDefault();  
    setIsLoading(true); // Mulai proses

    try {  
      const { data: authData, error: authError } \= await supabase.auth.signInWithPassword({ email, password });  
      if (authError) throw authError;

      const userId \= authData.user.id;  
      const { data: roleData, error: roleError } \= await supabase  
        .from('user\_roles').select('role').eq('user\_id', userId).single();

      if (roleError || \!roleData) {  
        throw new Error("Role pengguna tidak ditemukan. Silakan hubungi Admin.");  
      }

      // Jika berhasil, navigate akan dipanggil (komponen akan unmount)  
      const userRole \= roleData.role;  
      if (userRole \=== 'admin') navigate('/dashboard');  
      else if (userRole \=== 'kasir') navigate('/pos');  
      else if (userRole \=== 'manajemen\_bahan') navigate('/inventory');  
      else throw new Error("Role tidak dikenali.");

    } catch (error) {  
      alert("Login Gagal: " \+ error.message);  
      setIsLoading(false); // Reset hanya saat gagal. Jika sukses, biarkan komponen unmount.  
    }   
  };  
