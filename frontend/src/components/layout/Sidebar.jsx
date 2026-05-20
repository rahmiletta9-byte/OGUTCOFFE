import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Coffee, ShoppingCart, LayoutGrid, Package, LogOut, ClipboardList, Users, Activity, History } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function Sidebar() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink to={to} className="w-full">
      {({ isActive }) => (
        <Button 
          variant={isActive ? "secondary" : "ghost"} 
          className={`w-full justify-start gap-4 h-14 clay-button ${isActive ? 'text-primary bg-secondary shadow-none' : 'text-muted-foreground hover:bg-muted/10'}`}
        >
          <Icon size={24} />
          <span className="hidden lg:block font-black uppercase tracking-tight">{label}</span>
        </Button>
      )}
    </NavLink>
  );

  return (
    <aside className="w-20 lg:w-64 flex flex-col p-6 h-screen shrink-0 clay-card" style={{borderRadius: 0, borderRight: '1px solid hsl(var(--border))'}}>
      <div className="flex items-center gap-4 px-2 mb-12">
        <div className="bg-primary p-3 rounded-2xl text-primary-foreground clay-button">
          <Coffee size={24} />
        </div>
        <div className="hidden lg:block leading-none">
          <span className="font-black text-2xl tracking-tighter text-primary uppercase block">Ogut</span>
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-50">Point of Sales</span>
        </div>
      </div>

      <nav className="flex-1 space-y-3">
        {(role === 'admin' || role === 'kasir') && (
          <NavItem to="/pos" icon={ShoppingCart} label="POS Kasir" />
        )}
        
        {role === 'admin' && (
          <NavItem to="/dashboard" icon={LayoutGrid} label="Dashboard" />
        )}

        {(role === 'admin' || role === 'manajemen_bahan') && (
          <>
            <NavItem to="/inventory" icon={Package} label="Gudang Bahan" />
            <NavItem to="/inventory-logs" icon={History} label="Riwayat Stok" />
          </>
        )}

        {role === 'admin' && (
          <>
            <NavItem to="/menus" icon={ClipboardList} label="Manajemen Menu" />
            <NavItem to="/users" icon={Users} label="Manajemen Staf" />
            <NavItem to="/activity-logs" icon={Activity} label="Log Aktivitas" />
          </>
        )}
      </nav>

      {user && (
         <div className="hidden lg:block mb-4 px-2 text-center overflow-hidden">
            {!role && (
              <p className="text-[10px] text-destructive font-black uppercase mb-2 animate-pulse">Role Missing</p>
            )}
            <p className="text-sm font-semibold truncate capitalize text-foreground">{role?.replace('_', ' ') || 'No Role'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            <p className="text-[8px] text-muted-foreground/30 truncate mt-1">ID: {user.id}</p>
         </div>
      )}

      <Button 
        variant="ghost"
        onClick={handleLogout}
        className="w-full justify-start gap-4 h-14 clay-button text-destructive hover:bg-destructive/10 hover:text-destructive mt-auto shrink-0"
      >
        <LogOut size={24} />
        <span className="hidden lg:block font-black uppercase tracking-tight">Logout</span>
      </Button>
    </aside>
  );
}
