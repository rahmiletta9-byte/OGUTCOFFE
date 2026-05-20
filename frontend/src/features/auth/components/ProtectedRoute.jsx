import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role } = useAuth();

  // Lempar ke login jika tidak ada sesi
  if (!user) return <Navigate to="/login" replace />;

  // Jika halaman butuh role tertentu, cek hak akses
  if (allowedRoles) {
    // Jika tidak punya role sama sekali, atau role-nya null
    if (!role) {
      return (
        <div className="flex h-screen items-center justify-center bg-stone-50 p-4">
          <div className="text-center space-y-4 max-w-sm clay-card p-8">
            <h1 className="text-3xl font-black text-red-600 tracking-tighter uppercase">Unauthorized</h1>
            <p className="text-stone-500 font-medium">Akun Anda tidak memiliki hak akses (role) di sistem ini. Silakan hubungi Administrator.</p>
          </div>
        </div>
      );
    }

    // Jika punya role, tapi tidak termasuk di daftar allowedRoles
    if (!allowedRoles.includes(role)) {
      if (role === 'kasir') return <Navigate to="/pos" replace />;
      if (role === 'manajemen_bahan') return <Navigate to="/inventory" replace />;
      if (role === 'admin') return <Navigate to="/dashboard" replace />;
      
      // Jika rolenya tidak dikenali
      return (
        <div className="flex h-screen items-center justify-center bg-stone-50 p-4">
          <div className="text-center space-y-4 max-w-sm clay-card p-8">
            <h1 className="text-3xl font-black text-red-600 tracking-tighter uppercase">Access Denied</h1>
            <p className="text-stone-500 font-medium">Role '{role}' tidak diizinkan mengakses halaman ini.</p>
          </div>
        </div>
      );
    }
  }

  return children;
}
