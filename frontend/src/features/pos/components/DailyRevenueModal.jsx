import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { exportDailyRevenuePDF } from '@/lib/pdfExport';
import { FileText, Download, TrendingUp, X, Banknote, CreditCard, Wallet } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DailyRevenueModal({ onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalGrossRevenue: 0,
    totalTransactions: 0,
    paymentMethods: { Cash: 0, QRIS: 0, Debit: 0 }
  });

  useEffect(() => {
    fetchDailyRevenue();
  }, []);

  const fetchDailyRevenue = async () => {
    setIsLoading(true);
    try {
      // Dapatkan awal hari ini (00:00:00) lokal
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const isoStart = startOfDay.toISOString();

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', isoStart)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setTransactions(data);
        
        let gross = 0;
        let methods = { Cash: 0, QRIS: 0, Debit: 0 };
        
        data.forEach(tx => {
          gross += Number(tx.total_amount) || 0;
          const method = tx.payment_method || 'Cash';
          if (!methods[method]) methods[method] = 0;
          methods[method]++;
        });

        setSummaryData({
          totalGrossRevenue: gross,
          totalTransactions: data.length,
          paymentMethods: methods
        });
      }
    } catch (error) {
      console.error("Gagal memuat rekap:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    exportDailyRevenuePDF(transactions, summaryData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* HEADER */}
        <div className="p-8 pb-6 border-b border-muted/30 flex justify-between items-center bg-muted/5">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-2xl text-primary-foreground shadow-lg shadow-primary/20">
              <FileText size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase text-foreground">Rekap Pendapatan</h2>
              <p className="font-bold text-muted-foreground uppercase tracking-widest text-[10px] opacity-60">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-12 h-12 rounded-full bg-muted/20 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
            onClick={onClose}
          >
            <X size={24} />
          </Button>
        </div>

        {/* CONTENT */}
        <div className="p-8 overflow-y-auto scrollbar-hide flex-1 space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-black uppercase tracking-widest text-muted-foreground text-sm">Menghitung...</p>
            </div>
          ) : (
            <>
              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-green-50/50 border-none p-6 rounded-[2rem] flex items-center gap-5 shadow-none">
                  <div className="bg-green-100 p-4 rounded-2xl text-green-600">
                    <TrendingUp size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Total Pendapatan</p>
                    <p className="font-black text-2xl tracking-tighter text-green-600">
                      Rp {summaryData.totalGrossRevenue.toLocaleString('id-ID')}
                    </p>
                  </div>
                </Card>

                <Card className="bg-muted/10 border-none p-6 rounded-[2rem] flex items-center gap-5 shadow-none">
                  <div className="bg-muted/20 p-4 rounded-2xl text-muted-foreground">
                    <FileText size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Total Transaksi</p>
                    <p className="font-black text-2xl tracking-tighter text-foreground">
                      {summaryData.totalTransactions} Nota
                    </p>
                  </div>
                </Card>
              </div>

              {/* PAYMENT METHODS */}
              <div>
                <h3 className="font-black uppercase tracking-tight text-sm text-muted-foreground mb-4 ml-2 opacity-60">Metode Pembayaran</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted/5 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-muted/20">
                     <Banknote className="text-amber-600" size={24} />
                     <span className="font-black text-lg">{summaryData.paymentMethods.Cash || 0}</span>
                     <span className="text-[10px] font-bold uppercase text-muted-foreground">Cash</span>
                  </div>
                  <div className="bg-muted/5 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-muted/20">
                     <Wallet className="text-blue-600" size={24} />
                     <span className="font-black text-lg">{summaryData.paymentMethods.QRIS || 0}</span>
                     <span className="text-[10px] font-bold uppercase text-muted-foreground">QRIS</span>
                  </div>
                  <div className="bg-muted/5 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-muted/20">
                     <CreditCard className="text-purple-600" size={24} />
                     <span className="font-black text-lg">{summaryData.paymentMethods.Debit || 0}</span>
                     <span className="text-[10px] font-bold uppercase text-muted-foreground">Debit</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-muted/30 bg-muted/5 flex gap-4">
          <Button 
            variant="ghost" 
            className="flex-1 h-14 rounded-[1.5rem] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/20"
            onClick={onClose}
          >
            Tutup
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isLoading || transactions.length === 0}
            className="flex-1 h-14 rounded-[1.5rem] font-black text-sm shadow-xl shadow-primary/20 uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Export Laporan PDF
          </Button>
        </div>

      </div>
    </div>
  );
}
