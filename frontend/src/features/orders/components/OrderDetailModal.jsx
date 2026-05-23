import React from 'react';
import { X, Calendar, User, Hash, CreditCard, Banknote, QrCode, Receipt } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OrderDetailModal({ transaction, onClose }) {
  if (!transaction) return null;

  const getPaymentIcon = (method) => {
    const m = method?.toUpperCase() || 'CASH';
    if (m.includes('QRIS')) return <QrCode className="text-blue-600" size={16} />;
    if (m.includes('DEBIT')) return <CreditCard className="text-purple-600" size={16} />;
    return <Banknote className="text-amber-600" size={16} />;
  };

  const getPaymentColor = (method) => {
    const m = method?.toUpperCase() || 'CASH';
    if (m.includes('QRIS')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (m.includes('DEBIT')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const formattedDate = new Date(transaction.created_at).toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-muted/20">
        
        {/* HEADER */}
        <div className="p-8 pb-6 border-b border-muted/30 flex justify-between items-center bg-muted/5">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-2xl text-primary-foreground shadow-lg shadow-primary/20">
              <Receipt size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter uppercase text-foreground">Detail Transaksi</h2>
              <p className="font-bold text-muted-foreground uppercase tracking-widest text-[9px] opacity-60">
                ID: {transaction.id.substring(0, 8)}...
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-12 h-12 rounded-full bg-muted/20 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </div>

        {/* CONTENT */}
        <div className="p-8 overflow-y-auto scrollbar-hide flex-1 space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-muted/5 border-none shadow-none rounded-2xl flex flex-col gap-1">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                <User size={12} /> Pelanggan
              </span>
              <span className="font-black text-foreground text-sm uppercase truncate">
                {transaction.customer_name || 'Pelanggan Umum'}
              </span>
            </Card>
            <Card className="p-4 bg-muted/5 border-none shadow-none rounded-2xl flex flex-col gap-1">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                <Hash size={12} /> No. Meja
              </span>
              <span className="font-black text-foreground text-sm">
                {transaction.table_number ? `Meja ${transaction.table_number}` : 'Take Away'}
              </span>
            </Card>
          </div>

          {/* Time & Payment Method */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground/80 uppercase tracking-widest bg-muted/10 p-3 rounded-xl border border-muted/20">
              <Calendar size={14} className="text-primary opacity-60" />
              <span>{formattedDate} WIB</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-muted/20">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Metode Bayar</span>
              <Badge variant="outline" className={`clay-badge font-black uppercase tracking-widest text-[10px] px-3 py-1 flex items-center gap-1.5 ${getPaymentColor(transaction.payment_method)}`}>
                {getPaymentIcon(transaction.payment_method)}
                {transaction.payment_method}
              </Badge>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="font-black uppercase tracking-tight text-xs text-muted-foreground mb-3 ml-1 opacity-60">Item Pesanan</h3>
            <div className="bg-white rounded-2xl border border-muted/20 overflow-hidden shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/10 border-b border-muted/20 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    <th className="p-3 pl-4">Menu</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 pr-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/10 text-xs font-medium">
                  {transaction.items && transaction.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/5 transition-colors">
                      <td className="p-3 pl-4 font-bold text-foreground uppercase tracking-tight leading-tight">
                        {item.product_name || 'Menu Terhapus'}
                      </td>
                      <td className="p-3 text-center font-black">
                        {item.quantity}
                      </td>
                      <td className="p-3 pr-4 text-right font-black text-primary">
                        Rp {Number(item.subtotal).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-muted/30 bg-muted/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Total Pembayaran</span>
            <span className="text-2xl font-black text-primary tracking-tighter">
              Rp {Number(transaction.total_amount).toLocaleString('id-ID')}
            </span>
          </div>
          <Button 
            className="h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/20"
            onClick={onClose}
          >
            Tutup
          </Button>
        </div>

      </div>
    </div>
  );
}
