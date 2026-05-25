import React, { useState, useEffect } from 'react';
import { Search, Calendar, CreditCard, Banknote, QrCode, FilterX, Receipt, Eye } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from '@/components/layout/PageHeader';
import useDebounce from '@/features/pos/hooks/useDebounce';

// Feature Components & Services
import { fetchOrderHistory } from '@/features/orders/services/orderHistoryService';
import Pagination from '@/features/orders/components/Pagination';
import OrderDetailModal from '@/features/orders/components/OrderDetailModal';

const PAYMENT_METHODS = ['All', 'Cash', 'QRIS', 'Debit'];

export default function OrderHistoryPage() {
  // State Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [activePaymentMethod, setActivePaymentMethod] = useState('All');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  
  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Sesuai instruksi: 10 transaksi per halaman

  // State Data
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // State Modal Detail
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Trigger fetch data saat filter berubah
  useEffect(() => {
    // Reset ke halaman 1 jika ada filter yang berubah untuk menghindari bug offset
    setCurrentPage(1);
  }, [debouncedSearch, activePaymentMethod, startDateStr, endDateStr]);

  useEffect(() => {
    loadOrderHistory();
  }, [currentPage, debouncedSearch, activePaymentMethod, startDateStr, endDateStr]);

  const loadOrderHistory = async () => {
    setIsLoading(true);
    try {
      let isoStart = null;
      let isoEnd = null;

      // Konversi tanggal filter ke ISO format dengan timezone boundaries yang tepat
      if (startDateStr) {
        const d = new Date(startDateStr);
        d.setHours(0, 0, 0, 0);
        isoStart = d.toISOString();
      }
      
      if (endDateStr) {
        const d = new Date(endDateStr);
        d.setHours(23, 59, 59, 999);
        isoEnd = d.toISOString();
      }

      const result = await fetchOrderHistory({
        startDate: isoStart,
        endDate: isoEnd,
        paymentMethod: activePaymentMethod,
        search: debouncedSearch,
        page: currentPage,
        pageSize
      });

      if (result.success) {
        setOrders(result.data);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      console.error("Gagal memuat transaksi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActivePaymentMethod('All');
    setStartDateStr('');
    setEndDateStr('');
    setCurrentPage(1);
  };

  const getPaymentIcon = (method) => {
    const m = method?.toUpperCase() || 'CASH';
    if (m.includes('QRIS')) return <QrCode size={12} />;
    if (m.includes('DEBIT')) return <CreditCard size={12} />;
    return <Banknote size={12} />;
  };

  const getPaymentColor = (method) => {
    const m = method?.toUpperCase() || 'CASH';
    if (m.includes('QRIS')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (m.includes('DEBIT')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="flex-1 w-full bg-background overflow-hidden font-sans text-foreground flex animate-in fade-in duration-300">
      <main className="flex-1 flex flex-col min-w-0 clay-card m-4 overflow-hidden">
        
        {/* HEADER & FILTER */}
        <div className="p-8 pb-4 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <PageHeader 
              title="Riwayat Order" 
              subtitle="Catatan transaksi penjualan & pembayaran" 
            />

            {/* Tombol Reset Filter Cepat */}
            {(searchQuery || activePaymentMethod !== 'All' || startDateStr || endDateStr) && (
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

          {/* BARIS FILTER INTERAKTIF */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="relative xl:col-span-4">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40" size={18} />
              <Input 
                placeholder="Cari nama pelanggan..."
                className="clay-input pl-14 h-14"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Payment Method Toggles */}
            <div className="xl:col-span-4 flex gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-hide">
              {PAYMENT_METHODS.map((method) => (
                <Button
                  key={method}
                  variant={activePaymentMethod === method ? "secondary" : "ghost"}
                  onClick={() => setActivePaymentMethod(method)}
                  className={`h-14 px-6 clay-button uppercase tracking-widest text-[10px] font-black shrink-0 ${
                    activePaymentMethod === method ? 'bg-secondary text-primary shadow-none' : 'text-muted-foreground hover:bg-muted/10'
                  }`}
                >
                  {method === 'All' ? 'Semua Metode' : method}
                </Button>
              ))}
            </div>

            {/* Date Pickers */}
            <div className="xl:col-span-4 flex items-center gap-2">
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

        {/* TABEL DATA */}
        <div className="flex-1 overflow-y-auto p-8 pt-2 scrollbar-hide bg-muted/5 relative">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-muted/30 rounded-[1.5rem] animate-pulse w-full"></div>
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="bg-white rounded-[2rem] border border-muted/20 shadow-sm overflow-hidden clay-card shadow-none flex flex-col justify-between min-h-full">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/10 border-b border-muted/20">
                      <th className="p-5 font-black uppercase tracking-widest text-[9px] text-muted-foreground w-16">No</th>
                      <th className="p-5 font-black uppercase tracking-widest text-[9px] text-muted-foreground">Waktu Penjualan</th>
                      <th className="p-5 font-black uppercase tracking-widest text-[9px] text-muted-foreground">Pelanggan</th>
                      <th className="p-5 font-black uppercase tracking-widest text-[9px] text-muted-foreground">Meja</th>
                      <th className="p-5 font-black uppercase tracking-widest text-[9px] text-muted-foreground">Metode Bayar</th>
                      <th className="p-5 font-black uppercase tracking-widest text-[9px] text-muted-foreground text-right">Total Transaksi</th>
                      <th className="p-5 font-black uppercase tracking-widest text-[9px] text-muted-foreground text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/10">
                    {orders.map((order, index) => (
                      <tr 
                        key={order.id} 
                        className="hover:bg-muted/5 transition-colors group cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="p-5 font-black text-xs text-muted-foreground/60">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="p-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground">
                              {new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                              {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                          </div>
                        </td>
                        <td className="p-5">
                          <span className="font-black text-foreground tracking-tight text-sm uppercase">
                            {order.customer_name || 'Pelanggan Umum'}
                          </span>
                        </td>
                        <td className="p-5">
                          {order.table_number ? (
                            <Badge variant="secondary" className="clay-badge font-bold uppercase text-[9px] tracking-widest bg-stone-100 text-stone-700">
                              Meja {order.table_number}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="clay-badge font-bold uppercase text-[9px] tracking-widest text-muted-foreground">
                              Take Away
                            </Badge>
                          )}
                        </td>
                        <td className="p-5">
                          <Badge variant="outline" className={`clay-badge font-black uppercase tracking-widest text-[9px] px-2.5 py-0.5 flex items-center gap-1.5 w-fit ${getPaymentColor(order.payment_method)}`}>
                            {getPaymentIcon(order.payment_method)}
                            {order.payment_method}
                          </Badge>
                        </td>
                        <td className="p-5 text-right">
                          <span className="font-black text-primary text-sm">
                            Rp {Number(order.total_amount).toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl hover:bg-primary hover:text-primary-foreground text-primary/40 transition-all flex items-center justify-center mx-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                          >
                            <Eye size={16} strokeWidth={2.5} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION PANEL */}
              <div className="p-6 bg-muted/5 border-t border-dashed border-muted/20">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-28">
              <Receipt size={100} strokeWidth={1} className="mb-6 animate-pulse" />
              <p className="font-black uppercase tracking-[0.3em] text-lg">Tidak Ada Transaksi Ditemukan</p>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mt-2">Coba sesuaikan filter atau kata pencarian Anda</p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DETAIL PEMBELIAN */}
      {selectedOrder && (
        <OrderDetailModal 
          transaction={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
}
