import React, { useState, useEffect } from 'react';
import { ShoppingCart, Minus, Plus, Trash2, Banknote, QrCode, CreditCard, User, Hash, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export default function OrderCart({ 
  cart, 
  orderType, 
  setOrderType, 
  updateQty, 
  removeFromCart, 
  subtotal, 
  tax, 
  totalAmount, 
  paymentMethod, 
  setPaymentMethod, 
  handleCheckout, 
  isCheckingOut,
  customerName,
  setCustomerName,
  tableNumber,
  setTableNumber,
}) {
  const [isFinalizing, setIsFinalizing] = useState(false);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  // Auto-collapse when cart is emptied
  useEffect(() => {
    if (cart.length === 0) {
      setIsFinalizing(false);
    }
  }, [cart.length]);

  return (
    <aside className="w-96 xl:w-[32rem] flex flex-col z-10 clay-card overflow-hidden" style={{borderRadius: 0}}>
      {/* 1. CART MODE (isFinalizing === false) */}
      {!isFinalizing ? (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
          {/* Header */}
          <div className="p-8 pb-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Current Order</h2>
              {cart.length > 0 && (
                <Badge variant="secondary" className="clay-badge bg-secondary text-primary">
                  {totalItems} Items
                </Badge>
              )}
            </div>

            <Tabs value={orderType} onValueChange={setOrderType} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 rounded-2xl bg-muted/40 p-1.5 clay-input" style={{padding: '4px', height: '3.5rem'}}>
                <TabsTrigger value="Dine In" className="rounded-xl font-black text-xs uppercase tracking-widest transition-all data-[state=active]:shadow-sm data-[state=active]:bg-white">Dine In</TabsTrigger>
                <TabsTrigger value="Take Away" className="rounded-xl font-black text-xs uppercase tracking-widest transition-all data-[state=active]:shadow-sm data-[state=active]:bg-white">Take Away</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Cart Items Area */}
          <div className="flex-1 overflow-y-auto px-8 py-4 space-y-3 scrollbar-hide min-h-0">
            {cart.length > 0 ? (
              cart.map(item => (
                <div 
                  key={item.id} 
                  className="flex items-center gap-4 p-3 rounded-2xl bg-white/60 group animate-in fade-in slide-in-from-right-4 duration-300"
                  style={{
                    boxShadow: '3px 3px 8px rgba(0,0,0,0.02), inset 2px 2px 4px rgba(255,255,255,0.5), inset -2px -2px 4px rgba(0,0,0,0.01)'
                  }}
                >
                  <Card className="h-14 w-14 rounded-xl overflow-hidden flex-shrink-0" style={{boxShadow: 'none', borderRadius: '0.75rem'}}>
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  </Card>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground text-xs truncate uppercase tracking-tight leading-none mb-1">{item.name}</h4>
                    <p className="text-primary font-black text-sm">
                      Rp {(item.price * item.qty).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl clay-input" style={{width: 'fit-content', padding: '4px'}}>
                    <Button variant="ghost" size="icon" onClick={() => updateQty(item.id, -1)} className="h-8 w-8 rounded-lg hover:bg-white text-muted-foreground transition-all">
                      <Minus size={12} strokeWidth={3} />
                    </Button>
                    <span className="w-6 text-center font-black text-xs">{item.qty}</span>
                    <Button variant="ghost" size="icon" onClick={() => updateQty(item.id, 1)} className="h-8 w-8 rounded-lg hover:bg-white text-primary transition-all">
                      <Plus size={12} strokeWidth={3} />
                    </Button>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeFromCart(item.id)} 
                    className="h-8 w-8 text-destructive/30 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 text-center py-20">
                <ShoppingCart size={80} strokeWidth={1} className="mb-4 animate-bounce" />
                <p className="text-xs font-black uppercase tracking-[0.2em]">Cart is empty</p>
              </div>
            )}
          </div>

          {/* Simple Accumulation Footer */}
          <div className="p-8 bg-muted/10 border-t border-dashed border-border/50">
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Total Accumulation</span>
                <span className="text-3xl font-black text-primary tracking-tighter">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
              {cart.length > 0 && (
                <Badge className="bg-secondary text-primary font-black uppercase text-[10px] py-1 px-3 clay-badge">
                  {totalItems} Items
                </Badge>
              )}
            </div>

            <Button 
              onClick={() => setIsFinalizing(true)}
              disabled={cart.length === 0}
              className="w-full h-16 clay-button-primary text-base font-black uppercase tracking-wider flex items-center justify-center gap-2"
              style={{borderRadius: '1.5rem'}}
            >
              Proses Pembayaran
              <ArrowRight size={18} strokeWidth={3} />
            </Button>
          </div>
        </div>
      ) : (
        /* 2. FINALIZATION / CHECKOUT MODE (isFinalizing === true) */
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-8 pb-4 space-y-6">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsFinalizing(false)}
                className="h-10 w-10 rounded-xl hover:bg-muted/40 transition-all shrink-0"
              >
                <ArrowLeft size={20} strokeWidth={3} />
              </Button>
              <div>
                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Finalisasi Pesanan</h2>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Complete checkout details</p>
              </div>
            </div>
          </div>

          {/* Form & Pricing Breakdown */}
          <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6 scrollbar-hide min-h-0">
            {/* Customer Inputs */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Customer Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                  <Input 
                    placeholder="Nama Pelanggan"
                    className="clay-input pl-11 h-12 text-sm"
                    style={{ borderRadius: '1rem', padding: '0.5rem 0.5rem 0.5rem 2.75rem' }}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                  <Input 
                    placeholder="No. Meja"
                    className="clay-input pl-11 h-12 text-sm"
                    style={{ borderRadius: '1rem', padding: '0.5rem 0.5rem 0.5rem 2.75rem' }}
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-3 p-4 rounded-2xl bg-white/60" style={{ boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.5), inset -2px -2px 4px rgba(0,0,0,0.01)' }}>
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Pricing Summary</h3>
              <div className="flex justify-between text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                <span>Subtotal ({totalItems} items)</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                <span>Service Tax (10%)</span>
                <span>Rp {tax.toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-3 mt-1 border-t border-dashed border-border/60 flex justify-between items-center">
                <span className="font-black text-foreground text-sm uppercase tracking-tighter">Total Due</span>
                <span className="text-xl font-black text-primary tracking-tighter">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Select Payment Method</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'Cash', icon: Banknote, label: 'Cash' },
                  { id: 'QRIS', icon: QrCode, label: 'QRIS' },
                  { id: 'Debit', icon: CreditCard, label: 'Debit' }
                ].map(method => (
                  <Button
                    key={method.id}
                    variant={paymentMethod === method.id ? "secondary" : "outline"}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 h-20 clay-button ${
                      paymentMethod === method.id ? 'bg-secondary text-primary shadow-none' : 'bg-white hover:bg-muted/10'
                    }`}
                    style={{borderRadius: '1.25rem'}}
                  >
                    <method.icon size={20} />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em]">{method.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-8 bg-muted/10 border-t border-dashed border-border/50 space-y-3">
            <Button 
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full h-16 clay-button-primary text-base font-black uppercase tracking-wider"
              style={{borderRadius: '1.5rem'}}
            >
              {isCheckingOut ? (
                <div className="animate-spin rounded-full h-7 w-7 border-4 border-white/30 border-t-white"></div>
              ) : (
                'Konfirmasi Transaksi'
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsFinalizing(false)}
              disabled={isCheckingOut}
              className="w-full h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/30 rounded-xl"
            >
              Kembali ke Keranjang
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
