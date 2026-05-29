import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/features/auth/context/AuthContext';
import { logActivity } from '@/lib/logger';
import { User, KeyRound, Mail, ShieldAlert, ShieldCheck, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from '@/components/layout/PageHeader';

export default function ProfilePage() {
  const { user, role } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Sinkronisasi data user saat mount
  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    } else if (user?.email) {
      // Potong bagian email sebelum @ sebagai default display_name
      setDisplayName(user.email.split('@')[0]);
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });

      if (error) throw error;

      await logActivity(user.id, 'UPDATE_PROFILE', `Memperbarui nama tampilan profil menjadi: ${displayName}`);
      setProfileSuccess('Nama profil berhasil diperbarui!');
    } catch (error) {
      setProfileError(error.message || 'Gagal memperbarui profil.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('Kata sandi baru harus minimal 6 karakter.');
      setIsUpdatingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok.');
      setIsUpdatingPassword(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      await logActivity(user.id, 'CHANGE_PASSWORD', 'Memperbarui kata sandi akun');
      setPasswordSuccess('Kata sandi berhasil diperbarui!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error.message || 'Gagal memperbarui kata sandi.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const displayRoleName = (roleVal) => {
    if (roleVal === 'admin') return 'Administrator IT';
    if (roleVal === 'kasir') return 'Staff Kasir';
    if (roleVal === 'manajemen_bahan') return 'Manajer Stok Gudang';
    return roleVal || 'Karyawan';
  };

  return (
    <div className="flex-1 w-full bg-background overflow-hidden font-sans text-foreground flex animate-in fade-in duration-300">
      <main className="flex-1 flex flex-col min-w-0 clay-card m-4 overflow-y-auto p-10 scrollbar-hide">
        
        {/* Page Header */}
        <div className="pb-8 border-b border-muted/20">
          <PageHeader 
            title="Profil Saya" 
            subtitle="Atur informasi akun pribadi dan konfigurasi kata sandi Anda" 
          />
        </div>

        {/* Content Columns */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Account Details & Profile Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-muted/10 border border-muted/20 rounded-[2rem] p-8 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <User size={120} />
              </div>
              
              <h3 className="text-xl font-black text-foreground capitalize tracking-tight leading-none mb-1 mt-4">
                {displayName || 'Karyawan'}
              </h3>
              
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/10 border border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest rounded-2xl mb-6">
                <ShieldCheck size={12} />
                {displayRoleName(role)}
              </div>

              {/* Readonly Account Details */}
              <div className="w-full space-y-4 border-t border-dashed border-muted/20 pt-6 text-left text-xs font-bold text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Alamat Email</span>
                  <span className="text-foreground select-all">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>ID Pengguna</span>
                  <span className="text-foreground font-mono select-all truncate max-w-[150px]">{user?.id}</span>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 text-xs text-amber-800/90 leading-relaxed font-bold flex items-start gap-3">
              <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="block font-black uppercase tracking-wider text-amber-900 mb-1">Keamanan Akun</span>
                Untuk keamanan operasional POS, penggantian email atau tingkat hak akses (*role*) hanya dapat dilakukan oleh Administrator IT melalui menu Manajemen Staf.
              </div>
            </div>
          </div>

          {/* Right Column: Settings Forms */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Form 1: Edit Display Name */}
            <div className="bg-white border border-muted/20 rounded-[2.5rem] p-8 shadow-sm flex flex-col">
              <h4 className="text-sm font-black text-foreground uppercase tracking-widest border-b border-muted/10 pb-4 mb-6 flex items-center gap-2">
                <User size={16} className="text-primary" />
                Informasi Umum Profil
              </h4>

              {profileSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-bold rounded-xl mb-4">
                  {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="p-3 bg-red-50 text-red-800 border border-red-100 text-xs font-bold rounded-xl mb-4">
                  {profileError}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    Nama Tampilan
                  </label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30 group-focus-within:text-primary transition-colors" size={18} />
                    <Input 
                      type="text" 
                      value={displayName}
                      placeholder="Masukkan nama tampilan Anda" 
                      required 
                      className="clay-input pl-14 h-14 font-bold text-base" 
                      onChange={(e) => setDisplayName(e.target.value)} 
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isUpdatingProfile} 
                  className="clay-button-primary h-14 px-8 rounded-2xl self-start font-black text-xs uppercase tracking-widest flex items-center gap-2"
                >
                  {isUpdatingProfile ? (
                    <Loader2 size={16} className="animate-spin text-primary-foreground" />
                  ) : (
                    <Save size={16} />
                  )}
                  Simpan Perubahan
                </Button>
              </form>
            </div>

            {/* Form 2: Change Password */}
            <div className="bg-white border border-muted/20 rounded-[2.5rem] p-8 shadow-sm flex flex-col">
              <h4 className="text-sm font-black text-foreground uppercase tracking-widest border-b border-muted/10 pb-4 mb-6 flex items-center gap-2">
                <KeyRound size={16} className="text-primary" />
                Perbarui Kata Sandi
              </h4>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-bold rounded-xl mb-4">
                  {passwordSuccess}
                </div>
              )}
              {passwordError && (
                <div className="p-3 bg-red-50 text-red-800 border border-red-100 text-xs font-bold rounded-xl mb-4">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-6">
                
                {/* New Password Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    Kata Sandi Baru
                  </label>
                  <div className="relative group">
                    <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30 group-focus-within:text-primary transition-colors" size={18} />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      value={newPassword}
                      placeholder="Min. 6 karakter" 
                      required 
                      className="clay-input pl-14 pr-12 h-14 font-bold text-base" 
                      onChange={(e) => setNewPassword(e.target.value)} 
                    />
                    
                    {/* Toggle password visible */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative group">
                    <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30 group-focus-within:text-primary transition-colors" size={18} />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      value={confirmPassword}
                      placeholder="Ulangi kata sandi baru" 
                      required 
                      className="clay-input pl-14 pr-12 h-14 font-bold text-base" 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isUpdatingPassword} 
                  className="clay-button-primary h-14 px-8 rounded-2xl self-start font-black text-xs uppercase tracking-widest flex items-center gap-2"
                >
                  {isUpdatingPassword ? (
                    <Loader2 size={16} className="animate-spin text-primary-foreground" />
                  ) : (
                    <Save size={16} />
                  )}
                  Ubah Kata Sandi
                </Button>
              </form>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
