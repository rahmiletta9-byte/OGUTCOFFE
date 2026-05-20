import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/lib/logger';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Package, X } from 'lucide-react';

export default function UpdateStockModal({ material, onClose, onUpdated }) {
  const { user } = useAuth();
  const [newStock, setNewStock] = useState(material.current_stock);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('materials')
        .update({ current_stock: parseFloat(newStock) })
        .eq('id', material.id);

      if (error) throw error;

      // Catat Log Aktivitas
      await logActivity(
        user.id, 
        'UPDATE_STOCK', 
        `Memperbarui stok ${material.name} dari ${material.current_stock} menjadi ${newStock} ${material.unit}`
      );

      alert('Stok berhasil diperbarui!');
      onUpdated();
      onClose();
    } catch (error) {
      alert('Gagal perbarui stok: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="clay-card p-8 w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-stone-300 hover:text-stone-500 hover:bg-stone-50 rounded-xl transition-all"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-amber-100 p-3 rounded-2xl text-amber-900 clay-button">
            <Package size={24} />
          </div>
          <div>
            <h3 className="font-bold text-xl text-stone-800">Update Stok</h3>
            <p className="text-sm text-stone-400 font-medium">{material.name}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Jumlah Stok Baru</label>
            <div className="flex items-center gap-4">
              <input 
                type="number" 
                value={newStock} 
                onChange={(e) => setNewStock(e.target.value)} 
                className="clay-input text-lg font-bold" 
              />
              <span className="text-stone-500 font-black text-lg w-16">{material.unit}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose} 
              className="flex-1 px-6 py-4 clay-button text-stone-400 hover:bg-stone-50 transition-all shadow-none"
            >
              Batal
            </button>
            <button 
              onClick={handleUpdate} 
              disabled={isLoading} 
              className="flex-1 px-6 py-4 clay-button-primary bg-amber-900 text-white hover:bg-amber-950 disabled:bg-stone-200"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
