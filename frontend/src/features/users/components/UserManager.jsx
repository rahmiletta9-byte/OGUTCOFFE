import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/lib/logger';
import { useAuth } from '@/features/auth/context/AuthContext';
import { UserPlus, Shield, User as UserIcon, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function UserManager({ onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '', role: 'kasir' });
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: roleError } = await supabase.from('user_roles').insert([
          { user_id: authData.user.id, role: formData.role }
        ]);
        if (roleError) throw roleError;
      }

      await logActivity(user.id, 'CREATE_USER', `Mendaftarkan staf baru: ${formData.email}`);
      alert('Akun staf berhasil dibuat!');
      setFormData({ email: '', password: '', role: 'kasir' });
      if (onSuccess) onSuccess(); 
    } catch (error) {
      alert('Gagal: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="rounded-[3rem] border-none shadow-xl shadow-stone-200/50 bg-white overflow-hidden">
      <CardHeader className="p-10 pb-4">
        <div className="flex items-center gap-4 mb-2">
            <div className="bg-primary p-3 rounded-2xl text-primary-foreground shadow-lg shadow-primary/20">
                <UserPlus size={24} />
            </div>
            <CardTitle className="text-2xl font-black tracking-tighter uppercase text-foreground">Register Staff</CardTitle>
        </div>
        <CardDescription className="font-bold text-muted-foreground uppercase tracking-widest text-[10px] opacity-60">Authorize new personnel access</CardDescription>
      </CardHeader>

      <CardContent className="p-10 pt-6">
        <form onSubmit={handleCreateUser} className="space-y-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-50">Email Address</label>
            <div className="relative">
              <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
              <Input 
                type="email" 
                placeholder="staff@ogut.com" 
                required 
                className="h-14 pl-14 rounded-[1.25rem] bg-muted/30 border-none focus-visible:ring-primary shadow-inner text-base font-bold"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-50">Temporary Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
              <Input 
                type="password" 
                placeholder="Min. 6 characters" 
                required 
                className="h-14 pl-14 rounded-[1.25rem] bg-muted/30 border-none focus-visible:ring-primary shadow-inner text-base font-bold"
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1 opacity-50">Access Level (Role)</label>
            <div className="relative">
              <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
              <select 
                className="w-full h-14 pl-14 pr-6 bg-muted/30 border-none rounded-[1.25rem] focus:ring-2 focus:ring-primary outline-none transition-all text-base font-bold appearance-none cursor-pointer shadow-inner" 
                value={formData.role} 
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="kasir">Kasir (POS Access)</option>
                <option value="manajemen_bahan">Management (Inventory)</option>
                <option value="admin">Admin (Full Control)</option>
              </select>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full h-16 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20 uppercase tracking-widest mt-4"
          >
            {isLoading ? 'Processing...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
