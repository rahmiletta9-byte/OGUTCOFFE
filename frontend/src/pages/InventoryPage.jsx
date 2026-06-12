import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Package, Search, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import UpdateStockModal from '@/features/inventory/components/UpdateStockModal';
import PageHeader from '@/components/layout/PageHeader';
import useDebounce from '@/features/pos/hooks/useDebounce';
import { useAuth } from '@/features/auth/context/AuthContext';
import { logActivity } from '@/lib/logger';

export default function InventoryPage() {
  const { user, role } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchMaterials = async (searchVal = debouncedSearch) => {
    setIsLoading(true);
    let query = supabase.from('materials').select('*');
    if (searchVal) query = query.ilike('name', `%${searchVal}%`);
    const { data } = await query.order('name');
    if (data) setMaterials(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMaterials(debouncedSearch);
  }, [debouncedSearch]);

  const handleDeleteMaterial = async (id, name) => {
    const isConfirmed = window.confirm(`Apakah Anda yakin ingin menghapus bahan baku "${name}"? Tindakan ini tidak dapat dibatalkan.`);
    if (!isConfirmed) return;

    setIsLoading(true);
    try {
      // 1. Pre-flight check: apakah bahan baku ini digunakan di product_materials (resep menu)
      const { data: pmData, error: pmErr } = await supabase
        .from('product_materials')
        .select('product_id')
        .eq('material_id', id);

      if (pmErr) throw pmErr;

      if (pmData && pmData.length > 0) {
        // Ambil nama menu yang terhubung
        const productIds = pmData.map(pm => pm.product_id);
        const { data: productsData, error: prodErr } = await supabase
          .from('products')
          .select('name')
          .in('id', productIds);

        if (prodErr) throw prodErr;

        const menuNames = productsData.map(p => p.name).join(', ');
        throw new Error(`Bahan baku ini tidak dapat dihapus karena masih digunakan sebagai resep pada menu: ${menuNames}. Hapus bahan ini dari resep menu tersebut terlebih dahulu.`);
      }

      // 2. Cascade delete manual
      // Hapus di inventory_logs
      const { error: logErr } = await supabase
        .from('inventory_logs')
        .delete()
        .eq('material_id', id);
      if (logErr) throw logErr;

      // Hapus di ai_prediction_results
      const { error: predErr } = await supabase
        .from('ai_prediction_results')
        .delete()
        .eq('material_id', id);
      if (predErr) throw predErr;

      // Hapus di materials utama
      const { error: deleteErr } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);
      if (deleteErr) throw deleteErr;

      // 3. Catat log aktivitas
      await logActivity(
        user?.id,
        'DELETE_MATERIAL',
        `Menghapus bahan baku: ${name}`
      );

      alert(`Bahan baku "${name}" berhasil dihapus.`);
      // Bersihkan selection jika item dihapus
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
      fetchMaterials();
    } catch (error) {
      alert('Gagal menghapus bahan: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    const isConfirmed = window.confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} bahan baku terpilih?`);
    if (!isConfirmed) return;

    setIsLoading(true);
    try {
      // 1. Ambil info keterkaitan product_materials untuk seluruh selectedIds
      const { data: pmData, error: pmErr } = await supabase
        .from('product_materials')
        .select('material_id, product_id')
        .in('material_id', selectedIds);

      if (pmErr) throw pmErr;

      // Kelompokkan bahan terpilih
      const boundMaterialIds = Array.from(new Set(pmData?.map(pm => pm.material_id) || []));

      // Jika ada setidaknya satu bahan yang terikat resep menu
      if (boundMaterialIds.length > 0) {
        // Ambil nama-nama bahan yang terikat
        const { data: boundMaterialsData } = await supabase
          .from('materials')
          .select('id, name')
          .in('id', boundMaterialIds);

        // Ambil nama menu pengikat
        const productIds = pmData.map(pm => pm.product_id);
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);

        // Map nama menu ke bahan
        const materialToMenus = {};
        pmData.forEach(pm => {
          const matName = boundMaterialsData?.find(m => m.id === pm.material_id)?.name || 'Unknown';
          const prodName = productsData?.find(p => p.id === pm.product_id)?.name || 'Unknown';
          if (!materialToMenus[matName]) {
            materialToMenus[matName] = [];
          }
          materialToMenus[matName].push(prodName);
        });

        const errorDetails = Object.entries(materialToMenus)
          .map(([mat, menus]) => `- ${mat} (terikat di menu: ${menus.join(', ')})`)
          .join('\n');

        throw new Error(`Penghapusan massal dibatalkan karena beberapa bahan terpilih masih digunakan di resep menu:\n${errorDetails}\n\nSilakan hapus bahan tersebut dari resep menu terlebih dahulu.`);
      }

      // 2. Jalankan bulk delete untuk seluruh selectedIds (karena semuanya aman)
      const namesToDelete = materials
        .filter(m => selectedIds.includes(m.id))
        .map(m => m.name);

      // Delete from inventory_logs
      const { error: logErr } = await supabase
        .from('inventory_logs')
        .delete()
        .in('material_id', selectedIds);
      if (logErr) throw logErr;

      // Delete from ai_prediction_results
      const { error: predErr } = await supabase
        .from('ai_prediction_results')
        .delete()
        .in('material_id', selectedIds);
      if (predErr) throw predErr;

      // Delete from materials
      const { error: deleteErr } = await supabase
        .from('materials')
        .delete()
        .in('id', selectedIds);
      if (deleteErr) throw deleteErr;

      // 3. Catat log aktivitas
      await logActivity(
        user?.id,
        'DELETE_MULTIPLE_MATERIALS',
        `Menghapus massal bahan baku: ${namesToDelete.join(', ')}`
      );

      alert(`Berhasil menghapus ${selectedIds.length} bahan baku.`);
      setSelectedIds([]);
      fetchMaterials();
    } catch (error) {
      alert('Gagal menghapus bahan massal: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-background overflow-hidden font-sans text-foreground flex">
      <main className="flex-1 flex flex-col min-w-0 clay-card m-4 overflow-hidden relative">
        <div className="p-10 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
            <PageHeader 
              title="Inventory Stock" 
              subtitle="Manage raw materials and supplies" 
            />

            <div className="relative w-full lg:w-[400px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
              <Input 
                placeholder="Search materials..."
                className="clay-input pl-14 h-16"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 pt-2 scrollbar-hide bg-muted/5">
          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
                {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-muted/30 rounded-[2rem]"></div>)}
             </div>
          ) : materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {materials.map((item) => {
                const isLow = item.current_stock <= (item.min_stock || 10);
                const isSelected = selectedIds.includes(item.id);
                return (
                  <Card key={item.id} className={`relative clay-card p-8 group border-2 transition-all ${isSelected ? 'border-primary' : 'border-transparent'}`}>
                    {/* Checkbox Multi-selection */}
                    {(role === 'admin' || role === 'manajemen_bahan') && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, item.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== item.id));
                          }
                        }}
                        className="absolute top-4 right-4 h-6 w-6 rounded border-stone-300 text-primary focus:ring-primary accent-amber-900 cursor-pointer z-10 transition-all opacity-40 group-hover:opacity-100 checked:opacity-100"
                      />
                    )}

                    {/* Container Aksi Edit & Hapus (Fitur Delete Bahan) */}
                    {(role === 'admin' || role === 'manajemen_bahan') && (
                      <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                        <Button
                          variant="destructive"
                          className="w-10 h-10 rounded-full bg-red-600/90 text-white hover:bg-red-700 shadow-lg p-0 flex items-center justify-center transition-transform hover:scale-105"
                          onClick={() => handleDeleteMaterial(item.id, item.name)}
                          title="Hapus Bahan"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-4 clay-button ${isLow ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-900 shadow-none'}`}>
                        <Package size={28} />
                      </div>
                      {isLow && (
                        <Badge variant="destructive" className="clay-badge bg-destructive text-destructive-foreground animate-pulse">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-black text-foreground tracking-tight uppercase mb-1">{item.name}</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className={`text-3xl font-black ${isLow ? 'text-red-600' : 'text-primary'}`}>{item.current_stock}</span>
                      <span className="text-sm font-bold text-muted-foreground uppercase">{item.unit}</span>
                    </div>

                    <Button 
                      onClick={() => setSelectedMaterial(item)}
                      variant="secondary"
                      className="w-full h-12 clay-button group-hover:bg-primary group-hover:text-primary-foreground"
                    >
                      Update Stock
                    </Button>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 py-20">
              <Package size={100} strokeWidth={1} className="mb-6" />
              <p className="font-black uppercase tracking-[0.3em] text-xl">No Materials Found</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md shadow-2xl border border-stone-200 p-4 px-8 rounded-full flex items-center gap-6 z-30 animate-in slide-in-from-bottom-8 fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 bg-amber-900 rounded-full animate-pulse" />
            <p className="text-sm font-black uppercase tracking-wider text-stone-700">
              {selectedIds.length} bahan terpilih
            </p>
          </div>
          <div className="h-6 w-px bg-stone-200" />
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedIds(materials.map(m => m.id));
              }}
              className="h-10 rounded-full font-bold text-xs uppercase tracking-widest px-4 border-muted hover:bg-muted/10 bg-transparent text-stone-700"
            >
              Pilih Semua
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="h-10 rounded-full font-bold text-xs uppercase tracking-widest px-4 text-stone-400 hover:bg-muted/10 bg-transparent"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="h-10 rounded-full font-black text-xs uppercase tracking-widest px-6 shadow-lg shadow-red-500/10 flex items-center gap-2 text-white bg-red-600 hover:bg-red-700 border-none"
            >
              <Trash2 size={14} />
              Hapus Terpilih
            </Button>
          </div>
        </div>
      )}

      {selectedMaterial && (
        <UpdateStockModal 
          material={selectedMaterial} 
          onClose={() => setSelectedMaterial(null)} 
          onUpdated={fetchMaterials} 
        />
      )}
    </div>
  );
}
