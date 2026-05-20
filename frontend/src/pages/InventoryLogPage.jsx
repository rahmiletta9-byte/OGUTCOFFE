import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, ClipboardList, PackageOpen, Calendar, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PageHeader from '@/components/layout/PageHeader';

export default function InventoryLogPage() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_logs')
        .select(`
          id,
          date,
          stock_used,
          end_of_day_stock,
          materials (
            name,
            unit,
            category
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      if (data) setLogs(data);
    } catch (error) {
      console.error("Gagal mengambil log inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const materialName = log.materials?.name?.toLowerCase() || '';
    const dateStr = log.date || '';
    return materialName.includes(q) || dateStr.includes(q);
  });

  return (
    <div className="flex-1 w-full bg-background overflow-hidden font-sans text-foreground flex">
      <main className="flex-1 flex flex-col min-w-0 clay-card m-4 overflow-hidden">
        
        {/* Header Section */}
        <div className="p-10 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
            <PageHeader 
              title="Riwayat Stok Harian" 
              subtitle="Monitoring pergerakan pemakaian bahan baku" 
            />

            <div className="relative w-full lg:w-[400px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40" size={20} />
              <Input 
                placeholder="Cari nama bahan atau YYYY-MM-DD..."
                className="clay-input pl-16 h-16"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-10 pt-2 scrollbar-hide bg-muted/5 relative">
          {isLoading ? (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 bg-muted/30 rounded-[1.5rem] animate-pulse w-full"></div>
                ))}
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="bg-white rounded-[2rem] border border-muted/20 shadow-sm overflow-hidden clay-card shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/10 border-b border-muted/20">
                                <th className="p-5 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Tanggal</th>
                                <th className="p-5 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Bahan Baku</th>
                                <th className="p-5 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Kategori</th>
                                <th className="p-5 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right">Terpakai</th>
                                <th className="p-5 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right">Sisa Stok Akhir</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted/10">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-muted/5 transition-colors group">
                                    <td className="p-5">
                                        <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                                            <Calendar size={14} className="text-muted-foreground/50" />
                                            {log.date}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                                                {log.materials?.name?.charAt(0) || '?'}
                                            </div>
                                            <span className="font-black text-foreground tracking-tight">{log.materials?.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <Badge variant="outline" className="clay-badge uppercase text-[10px] tracking-widest">
                                            {log.materials?.category || 'General'}
                                        </Badge>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex items-center justify-end gap-1 font-black text-destructive">
                                            <ArrowDownRight size={14} />
                                            {Number(log.stock_used).toLocaleString('id-ID')} <span className="text-[10px] uppercase opacity-50">{log.materials?.unit}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="font-black text-foreground">
                                            {Number(log.end_of_day_stock).toLocaleString('id-ID')} <span className="text-[10px] uppercase opacity-50">{log.materials?.unit}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-20">
                <PackageOpen size={100} strokeWidth={1} className="mb-6" />
                <p className="font-black uppercase tracking-[0.3em] text-xl">Tidak Ada Riwayat Stok</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
