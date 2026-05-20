import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Package, Search, AlertCircle, Plus } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import UpdateStockModal from '@/features/inventory/components/UpdateStockModal';
import PageHeader from '@/components/layout/PageHeader';

export default function InventoryPage() {
  const [materials, setMaterials] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMaterials = async () => {
    setIsLoading(true);
    let query = supabase.from('materials').select('*');
    if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
    const { data } = await query.order('name');
    if (data) setMaterials(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, [searchQuery]);

  return (
    <div className="flex-1 w-full bg-background overflow-hidden font-sans text-foreground flex">
      <main className="flex-1 flex flex-col min-w-0 clay-card m-4 overflow-hidden">
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
                return (
                  <Card key={item.id} className="clay-card p-8 group">
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
