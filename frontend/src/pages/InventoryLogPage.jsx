import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, PackageOpen, Calendar, ArrowDownRight, FilterX } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from '@/components/layout/PageHeader';
import Pagination from '@/features/orders/components/Pagination';
import useDebounce from '@/features/pos/hooks/useDebounce';

export default function InventoryLogPage() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Ref untuk menghindari dobel fetch
  const lastLoadedRef = React.useRef({ page: null, debouncedSearch: null, startDateStr: null, endDateStr: null });

  // Trigger fetch data saat filter atau halaman berubah (BUG-08)
  useEffect(() => {
    const last = lastLoadedRef.current;
    const filterChanged = last.debouncedSearch !== debouncedSearch ||
                          last.startDateStr !== startDateStr ||
                          last.endDateStr !== endDateStr;

    let pageToLoad = currentPage;
    if (filterChanged) {
      pageToLoad = 1;
      setCurrentPage(1);
    }

    if (filterChanged || currentPage !== last.page) {
      fetchLogs(pageToLoad);
      lastLoadedRef.current = {
        page: pageToLoad,
        debouncedSearch,
        startDateStr,
        endDateStr
      };
    }
  }, [currentPage, debouncedSearch, startDateStr, endDateStr]);

  const fetchLogs = async (pageParam) => {
    setIsLoading(true);
    try {
      const pageToUse = pageParam !== undefined ? pageParam : currentPage;
      const from = (pageToUse - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('inventory_logs')
        .select(`
          id,
          date,
          stock_used,
          end_of_day_stock,
          materials!inner (
            name,
            unit,
            category
          )
        `, { count: 'exact' });

      if (debouncedSearch) {
        query = query.ilike('materials.name', `%${debouncedSearch}%`);
      }
      if (startDateStr) {
        query = query.gte('date', startDateStr);
      }
      if (endDateStr) {
        query = query.lte('date', endDateStr);
      }

      const { data, count, error } = await query
        .order('date', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Gagal mengambil log inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStartDateStr('');
    setEndDateStr('');
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedLogs = logs; // Karena sudah di-fetch ter-paginasi dari server


  return (
    <div className="flex-1 w-full bg-background overflow-hidden font-sans text-foreground flex animate-in fade-in duration-300">
      <main className="flex-1 flex flex-col min-w-0 clay-card m-4 overflow-hidden">
        
        {/* Header Section */}
        <div className="p-10 pb-4 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <PageHeader 
              title="Riwayat Stok Harian" 
              subtitle="Monitoring pergerakan pemakaian bahan baku" 
            />

            {/* Reset Filter Button */}
            {(searchQuery || startDateStr || endDateStr) && (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-destructive hover:bg-destructive/5 border-destructive/20 flex items-center gap-2 self-start lg:self-auto transition-all"
              >
                <FilterX size={16} />
                Reset Filter
              </Button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="relative md:col-span-6 xl:col-span-8">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40" size={20} />
              <Input 
                placeholder="Cari nama bahan baku..."
                className="clay-input pl-16 h-14"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Date Pickers */}
            <div className="md:col-span-6 xl:col-span-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/45 pointer-events-none" size={14} />
                <input
                  type="date"
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  className="w-full clay-input pl-11 pr-3 h-14 text-xs font-black uppercase text-muted-foreground tracking-widest bg-transparent border border-muted/20 rounded-2xl focus:outline-none"
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">s/d</span>
              <div className="relative flex-1">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/45 pointer-events-none" size={14} />
                <input
                  type="date"
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  className="w-full clay-input pl-11 pr-3 h-14 text-xs font-black uppercase text-muted-foreground tracking-widest bg-transparent border border-muted/20 rounded-2xl focus:outline-none"
                />
              </div>
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
          ) : paginatedLogs.length > 0 ? (
            <div className="bg-white rounded-[2rem] border border-muted/20 shadow-sm overflow-hidden clay-card shadow-none flex flex-col justify-between min-h-full">
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
                            {paginatedLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-muted/5 transition-colors group">
                                    <td className="p-5">
                                        <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                                            <Calendar size={14} className="text-muted-foreground/50" />
                                            {log.date}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="font-black text-foreground tracking-tight">{log.materials?.name || 'Unknown'}</span>
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

                {/* Pagination Controls */}
                <div className="p-6 bg-muted/5 border-t border-dashed border-muted/20">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    label="Item"
                  />
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
