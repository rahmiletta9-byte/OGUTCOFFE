import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Activity, Search, ShieldAlert, User, Clock, FilterX } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from '@/components/layout/PageHeader';
import Pagination from '@/features/orders/components/Pagination';
import useDebounce from '@/features/pos/hooks/useDebounce';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Ref untuk menghindari dobel fetch
  const lastLoadedRef = React.useRef({ page: null, debouncedSearch: null });

  // Trigger fetch data saat filter atau halaman berubah (BUG-09)
  useEffect(() => {
    const last = lastLoadedRef.current;
    const filterChanged = last.debouncedSearch !== debouncedSearch;

    let pageToLoad = currentPage;
    if (filterChanged) {
      pageToLoad = 1;
      setCurrentPage(1);
    }

    if (filterChanged || currentPage !== last.page) {
      fetchLogs(pageToLoad);
      lastLoadedRef.current = {
        page: pageToLoad,
        debouncedSearch
      };
    }
  }, [currentPage, debouncedSearch]);

  const fetchLogs = async (pageParam) => {
    setIsLoading(true);
    try {
      const pageToUse = pageParam !== undefined ? pageParam : currentPage;
      
      const { data, error } = await supabase.rpc('get_activity_logs_paginated', {
        p_page: pageToUse,
        p_page_size: pageSize,
        p_search: debouncedSearch || null
      });

      if (error) throw error;
      setLogs(data || []);
      
      // Ambil total_count dari baris pertama jika ada
      const count = data && data.length > 0 ? parseInt(data[0].total_count) : 0;
      setTotalCount(count);
    } catch (error) {
      console.error("Gagal mengambil log aktivitas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedLogs = logs; // Karena sudah di-fetch ter-paginasi dari server


  const getActionColor = (type) => {
    const action = type?.toUpperCase() || '';
    if (action.includes('CREATE') || action.includes('ADD') || action.includes('CHECKOUT')) return 'bg-green-100 text-green-700 border-green-200';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'bg-red-100 text-red-700 border-red-200';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="flex-1 w-full bg-background overflow-hidden font-sans text-foreground flex animate-in fade-in duration-300">
      <main className="flex-1 flex flex-col min-w-0 clay-card m-4 overflow-hidden">
        
        {/* Header Section */}
        <div className="p-10 pb-4 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <PageHeader 
              title="Log Aktivitas" 
              subtitle="Sistem audit trail dan monitoring" 
            />

            {/* Reset Filter Button */}
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
                className="h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-destructive hover:bg-destructive/5 border-destructive/20 flex items-center gap-2 self-start lg:self-auto transition-all"
              >
                <FilterX size={16} />
                Reset Filter
              </Button>
            )}
          </div>

          <div className="relative w-full lg:w-[450px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40" size={20} />
            <Input 
              placeholder="Cari aktivitas, email, atau tipe tindakan..."
              className="clay-input pl-16 h-14"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-10 pt-2 scrollbar-hide bg-muted/5 relative">
            <div className="max-w-4xl mx-auto">
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-24 bg-muted/30 rounded-[1.5rem] animate-pulse w-full"></div>
                        ))}
                    </div>
                ) : paginatedLogs.length > 0 ? (
                    <div className="space-y-6 min-h-full flex flex-col justify-between">
                        <div className="space-y-4">
                            {paginatedLogs.map((log) => (
                                <Card key={log.id} className="clay-card overflow-hidden transition-all duration-300 hover:scale-[1.01] border-none shadow-sm p-0 bg-white">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                                                    <Activity size={18} />
                                                </div>
                                                <Badge variant="outline" className={`clay-badge font-black uppercase tracking-widest text-[9px] ${getActionColor(log.action_type)}`}>
                                                    {log.action_type || 'SYSTEM_ACTION'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                                                <Clock size={12} />
                                                <span>{new Date(log.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mb-4 pl-0 sm:pl-13">
                                            <p className="text-foreground font-medium leading-relaxed">
                                                {log.description}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 pt-4 border-t border-dashed border-muted-foreground/20 text-xs font-bold text-muted-foreground/80 uppercase tracking-widest pl-0 sm:pl-13">
                                            <User size={14} className="opacity-50" />
                                            <span className="truncate">{log.user_email || 'System / Unknown'}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        <div className="p-6 bg-muted/5 border-t border-dashed border-muted/20">
                          <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalCount={totalCount}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            label="Log"
                          />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-20">
                        <ShieldAlert size={100} strokeWidth={1} className="mb-6" />
                        <p className="font-black uppercase tracking-[0.3em] text-xl">Tidak Ada Log Aktivitas</p>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
