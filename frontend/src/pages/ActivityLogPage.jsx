import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Activity, Search, ShieldAlert, User, Clock, TerminalSquare } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PageHeader from '@/components/layout/PageHeader';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_activity_logs');
      if (error) throw error;
      if (data) setLogs(data);
    } catch (error) {
      console.error("Gagal mengambil log aktivitas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    return (
      (log.description && log.description.toLowerCase().includes(q)) ||
      (log.action_type && log.action_type.toLowerCase().includes(q)) ||
      (log.user_email && log.user_email.toLowerCase().includes(q))
    );
  });

  const getActionColor = (type) => {
    const action = type?.toUpperCase() || '';
    if (action.includes('CREATE') || action.includes('ADD') || action.includes('CHECKOUT')) return 'bg-green-100 text-green-700 border-green-200';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'bg-red-100 text-red-700 border-red-200';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="flex-1 w-full bg-background overflow-hidden font-sans text-foreground flex">
      <main className="flex-1 flex flex-col min-w-0 clay-card m-4 overflow-hidden">
        
        {/* Header Section */}
        <div className="p-10 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
            <PageHeader 
              title="Log Aktivitas" 
              subtitle="Sistem audit trail dan monitoring" 
            />

            <div className="relative w-full lg:w-[450px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40" size={20} />
              <Input 
                placeholder="Cari aktivitas, email, atau tipe tindakan..."
                className="clay-input pl-16 h-16"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
                ) : filteredLogs.length > 0 ? (
                    <div className="relative before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted-foreground/20 before:to-transparent space-y-6">
                        {filteredLogs.map((log) => (
                            <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                {/* Icon */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-8 -translate-x-1/2 md:left-1/2 z-10">
                                    <Activity size={16} />
                                </div>
                                
                                {/* Card */}
                                <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] clay-card overflow-hidden transition-all duration-300 hover:scale-[1.02] border-none ml-auto md:ml-0 shadow-sm p-0 group-odd:bg-white group-even:bg-muted/10">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <Badge variant="outline" className={`clay-badge font-black uppercase tracking-widest text-[10px] ${getActionColor(log.action_type)}`}>
                                                {log.action_type || 'SYSTEM_ACTION'}
                                            </Badge>
                                            <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                                                <Clock size={12} />
                                                <span>{new Date(log.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <p className="text-foreground font-medium leading-relaxed">
                                                {log.description}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 pt-4 border-t border-dashed border-muted-foreground/20 text-xs font-bold text-muted-foreground/80 uppercase tracking-widest">
                                            <User size={14} className="opacity-50" />
                                            <span className="truncate">{log.user_email || 'System / Unknown'}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
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
