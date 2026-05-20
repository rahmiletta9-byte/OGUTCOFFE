import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Kolom 1: Navigasi Kiri */}
      <Sidebar /> 
        
      {/* Kolom 2: Area Konten Dinamis */}
      <main className="flex-1 overflow-auto relative flex">
        {/* <Outlet /> akan digantikan oleh komponen halaman (CashierPage, dll) oleh React Router */}
        <Outlet /> 
      </main>
    </div>
  );
}
