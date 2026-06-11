import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';

import MainLayout from '@/components/layout/MainLayout';

// Lazy load komponen halaman untuk optimasi performa (Code Splitting)
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const CashierPage = lazy(() => import('@/pages/CashierPage'));
const OrderHistoryPage = lazy(() => import('@/pages/OrderHistoryPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const InventoryPage = lazy(() => import('@/pages/InventoryPage'));
const InventoryLogPage = lazy(() => import('@/pages/InventoryLogPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const MenuPage = lazy(() => import('@/pages/MenuPage'));
const ActivityLogPage = lazy(() => import('@/pages/ActivityLogPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

// Komponen Loading Skeleton
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-stone-50">
    <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-900"></div>
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest animate-pulse">Loading System...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Rute Terlindungi dibungkus MainLayout */}
            <Route element={<MainLayout />}>
              {/* Rute Kasir & Admin */}
              <Route path="/pos" element={
                <ProtectedRoute allowedRoles={['kasir', 'admin']}>
                  <CashierPage />
                </ProtectedRoute>
              } />

              <Route path="/order-history" element={
                <ProtectedRoute allowedRoles={['kasir', 'admin']}>
                  <OrderHistoryPage />
                </ProtectedRoute>
              } />

              {/* Rute Khusus Admin */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardPage />
                </ProtectedRoute>
              } />

              {/* Rute Manajemen Bahan & Admin */}
              <Route path="/inventory" element={
                <ProtectedRoute allowedRoles={['manajemen_bahan', 'admin']}>
                  <InventoryPage />
                </ProtectedRoute>
              } />

              <Route path="/inventory-logs" element={
                <ProtectedRoute allowedRoles={['manajemen_bahan', 'admin']}>
                  <InventoryLogPage />
                </ProtectedRoute>
              } />

              {/* Rute Menu & Admin */}
              <Route path="/menus" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MenuPage />
                </ProtectedRoute>
              } />

              {/* Rute Pengguna & Admin */}
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersPage />
                </ProtectedRoute>
              } />

              {/* Rute Log Aktivitas (Admin) */}
              <Route path="/activity-logs" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ActivityLogPage />
                </ProtectedRoute>
              } />

              {/* Rute Profil Pengguna (Semua Role Terautentikasi) */}
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['admin', 'kasir', 'manajemen_bahan']}>
                  <ProfilePage />
                </ProtectedRoute>
              } />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
