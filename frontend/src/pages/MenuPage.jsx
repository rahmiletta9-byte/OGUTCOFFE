import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ClipboardList, Search, Plus, Coffee, Tag, Banknote, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import MenuForm from '@/features/menu/components/MenuForm';
import PageHeader from '@/components/layout/PageHeader';
import useDebounce from '@/features/pos/hooks/useDebounce';
import { useAuth } from '@/features/auth/context/AuthContext';

export default function MenuPage() {
  const { role } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchProducts = async (searchVal = debouncedSearch) => {
    setIsLoading(true);
    let query = supabase.from('products').select('*');
    if (searchVal) query = query.ilike('name', `%${searchVal}%`);
    const { data } = await query.order('name');
    if (data) setProducts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts(debouncedSearch);
  }, [debouncedSearch]);

  // Efek untuk menutup modal dengan tombol Escape (BUG-21)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setEditingProduct(null);
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id, name) => {
    const isConfirmed = window.confirm(`Apakah Anda yakin ingin menghapus menu "${name}"? Tindakan ini tidak dapat dibatalkan.`);
    if (!isConfirmed) return;

    setIsLoading(true);
    try {
      // 1. Hapus rujukan resep di product_materials
      const { error: recipeErr } = await supabase
        .from('product_materials')
        .delete()
        .eq('product_id', id);
      if (recipeErr) throw recipeErr;

      // 2. Hapus rujukan hasil AI cluster
      const { error: clusterErr } = await supabase
        .from('ai_cluster_results')
        .delete()
        .eq('product_id', id);
      if (clusterErr) throw clusterErr;

      // 3. Hapus produk utama
      const { error: deleteErr } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteErr) {
        if (deleteErr.code === '23503') {
          // Kesalahan foreign key (riwayat transaksi penjualan)
          throw new Error("Menu ini tidak dapat dihapus karena memiliki riwayat transaksi penjualan. Anda hanya dapat mengubah nama, HPP, atau harganya.");
        }
        throw deleteErr;
      }

      alert(`Menu "${name}" berhasil dihapus.`);
      fetchProducts();
    } catch (error) {
      alert('Gagal menghapus menu: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-background overflow-hidden font-sans text-foreground flex">
      <main className="flex-1 flex flex-col min-w-0 clay-card m-4 overflow-hidden">
        <div className="p-10 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
            <PageHeader 
              title="Manajemen Menu" 
              subtitle="Kelola katalog produk, harga, dan resep bahan baku" 
            />

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-30" size={20} />
                <Input 
                  placeholder="Cari menu..."
                  className="clay-input pl-14 h-14"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={openAddModal}
                className="h-14 clay-button-primary px-6 shrink-0 font-bold tracking-widest uppercase text-xs"
              >
                <Plus size={20} className="mr-2" />
                Tambah Menu
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 pt-2 scrollbar-hide bg-muted/5">
          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-pulse">
                {[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-muted/30 rounded-[2rem]"></div>)}
             </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {products.map((item) => (
                <Card key={item.id} className="clay-card overflow-hidden flex flex-col group relative">
                  {/* Container Aksi Edit & Hapus (Fitur Delete Menu) */}
                  <div className="absolute top-4 left-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                    <Button
                      variant="secondary"
                      className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-stone-800 hover:bg-white hover:text-primary shadow-lg p-0 flex items-center justify-center transition-transform hover:scale-105"
                      onClick={() => openEditModal(item)}
                      title="Edit Menu"
                    >
                      <Edit size={16} />
                    </Button>
                    {role === 'admin' && (
                      <Button
                        variant="destructive"
                        className="w-10 h-10 rounded-full bg-red-600/90 text-white hover:bg-red-700 shadow-lg p-0 flex items-center justify-center transition-transform hover:scale-105"
                        onClick={() => handleDeleteProduct(item.id, item.name)}
                        title="Hapus Menu"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                  <div className="h-48 bg-muted/20 relative overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                        <Coffee size={48} strokeWidth={1} />
                      </div>
                    )}
                    <Badge className="absolute top-4 right-4 bg-background/80 backdrop-blur-md text-foreground font-black border-none px-3 py-1 shadow-lg">
                      {item.category}
                    </Badge>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-black text-foreground tracking-tight uppercase mb-2 line-clamp-2" title={item.name}>{item.name}</h3>
                      <div className="flex items-center gap-2 text-primary font-black mb-4">
                        <Banknote size={16} />
                        Rp {(item.price ?? 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs font-bold text-muted-foreground bg-muted/10 p-3 rounded-xl">
                       <span>HPP:</span>
                       <span>Rp {(item.cost_price ?? 0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 py-20">
              <ClipboardList size={100} strokeWidth={1} className="mb-6" />
              <p className="font-black uppercase tracking-[0.3em] text-xl">Tidak ada menu ditemukan</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal / Popup Wizard */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
              setEditingProduct(null);
            }
          }}
        >
          <div className="w-full max-w-xl relative animate-in zoom-in-95 duration-200">
            <Button 
              variant="ghost" 
              className="absolute -top-4 -right-4 z-10 w-10 h-10 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground shadow-lg clay-button"
              onClick={() => { setIsModalOpen(false); setEditingProduct(null); }}
            >
              ✕
            </Button>
            <MenuForm initialData={editingProduct} onSuccess={handleSuccess} />
          </div>
        </div>
      )}
    </div>
  );
}
