import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { user, role } = useAuth();

  // Redirect otomatis jika user yang sudah login mengakses /login
  useEffect(() => {
    if (user && role) {
      if (role === 'admin') navigate('/dashboard', { replace: true });
      else if (role === 'kasir') navigate('/pos', { replace: true });
      else if (role === 'manajemen_bahan') navigate('/inventory', { replace: true });
    }
  }, [user, role, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const userId = authData.user.id;
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles').select('role').eq('user_id', userId).single();

      if (roleError || !roleData || !roleData.role) {
        // Jika gagal, paksa sign out agar tidak ada sisa sesi
        await supabase.auth.signOut();
        throw new Error("Role pengguna tidak ditemukan. Silakan hubungi Admin.");
      }

      // Jika berhasil, navigate akan dipanggil
      const userRole = roleData.role;
      if (userRole === 'admin') navigate('/dashboard');
      else if (userRole === 'kasir') navigate('/pos');
      else if (userRole === 'manajemen_bahan') navigate('/inventory');
      else {
        await supabase.auth.signOut();
        throw new Error("Role tidak dikenali.");
      }

    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsSubmitting(false); // Reset di semua kondisi
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4 overflow-hidden">
      <Card className="w-full max-w-md clay-card">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="mx-auto bg-primary p-3 rounded-2xl text-primary-foreground w-fit mb-2 clay-button">
            <Coffee size={32} />
          </div>
          <CardTitle className="text-3xl font-black text-primary tracking-tighter uppercase">Ogut Coffee</CardTitle>
          <CardDescription className="font-medium text-muted-foreground">Point of Sales System</CardDescription>
        </CardHeader>
        
        <CardContent>
          {errorMsg && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl font-bold clay-card" style={{borderRadius: '1rem', boxShadow: 'none', background: 'transparent'}}>
                {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
              <Input 
                type="email" 
                placeholder="name@company.com" 
                required 
                className="clay-input" 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Password</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                required 
                className="clay-input" 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full h-16 clay-button-primary text-lg font-bold"
            >
              {isSubmitting ? 'Memproses...' : 'SIGN IN'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t border-dashed mt-4 pt-8">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black opacity-50">Authorized Personnel Only</p>
        </CardFooter>
      </Card>
    </div>
  );
}
