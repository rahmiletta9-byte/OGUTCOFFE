import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Users, Search, Plus, User as UserIcon, Shield } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import UserManager from '@/features/users/components/UserManager';
import PageHeader from '@/components/layout/PageHeader';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    // Kita memanggil function RPC yang sudah dibuat
    const { data, error } = await supabase.rpc('get_user_profiles');
    
    if (error) {
      console.error("Error fetching users:", error);
    } else {
      let filtered = data || [];
      if (searchQuery) {
        filtered = filtered.filter(u => 
          (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (u.role && u.role.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      setUsers(filtered);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchUsers();
  };

  return (
    <div className="flex-1 w-full bg-background overflow-hidden font-sans text-foreground flex">
      <main className="flex-1 flex flex-col min-w-0 clay-card m-4 overflow-hidden">
        <div className="p-10 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
            <PageHeader 
              title="Manajemen Staf" 
              subtitle="Kelola akun dan hak akses pengguna sistem" 
            />

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
                <Input 
                  placeholder="Cari email/role..."
                  className="clay-input pl-14 h-14"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="h-14 clay-button-primary px-6 shrink-0 font-bold tracking-widest uppercase text-xs"
              >
                <Plus size={20} className="mr-2" />
                Tambah Staf
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 pt-2 scrollbar-hide bg-muted/5">
          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
                {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-muted/30 rounded-[2rem]"></div>)}
             </div>
          ) : users.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {users.map((item) => (
                <Card key={item.user_id} className="clay-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-[1rem] bg-primary/10 text-primary flex items-center justify-center font-black uppercase text-xl shadow-inner">
                        {item.email?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-lg font-black tracking-tight truncate">{item.email}</p>
                        <p className="text-xs text-muted-foreground truncate opacity-50">ID: {item.user_id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4">
                      <Shield size={16} className="text-muted-foreground opacity-50" />
                      <span className="text-sm font-bold uppercase tracking-wider">
                        {item.role?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 py-20">
              <Users size={100} strokeWidth={1} className="mb-6" />
              <p className="font-black uppercase tracking-[0.3em] text-xl">Tidak ada staf ditemukan</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal / Popup Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg relative animate-in zoom-in-95 duration-200">
            <Button 
              variant="ghost" 
              className="absolute -top-4 -right-4 z-10 w-10 h-10 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground shadow-lg clay-button"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </Button>
            <UserManager onSuccess={handleSuccess} />
          </div>
        </div>
      )}
    </div>
  );
}
