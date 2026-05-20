import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/features/auth/context/AuthContext';
import useDebounce from '@/features/pos/hooks/useDebounce';
import { processCheckout } from '@/features/pos/services/checkoutService';

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText } from 'lucide-react';

// Feature Components
import ProductCard from '@/features/pos/components/ProductCard';
import OrderCart from '@/features/pos/components/OrderCart';
import PageHeader from '@/components/layout/PageHeader';
import DailyRevenueModal from '@/features/pos/components/DailyRevenueModal';

const CATEGORIES = [
  { id: 'All', name: 'All Menu' },
  { id: 'Kopi', name: 'Coffee' },
  { id: 'Non-Kopi', name: 'Non-Coffee' },
  { id: 'Makanan', name: 'Food' },
];

export default function CashierPage() {
  const { user, role } = useAuth();
  
  // State
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [orderType, setOrderType] = useState('Dine In');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Data Fetching
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let query = supabase.from('products').select('*');
        if (debouncedSearch) query = query.ilike('name', `%${debouncedSearch}%`);
        if (activeCategory !== 'All') query = query.eq('category', activeCategory);
        
        const { data } = await query.order('name');
        if (data) setProducts(data);
      } catch (err) {
        console.error("Fetch products failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedSearch, activeCategory]);

  // Handlers
  const handleAddToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * item.qty), 0);
  const tax = subtotal * 0.1;
  const totalAmount = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    
    const result = await processCheckout(cart, totalAmount, paymentMethod, customerName, tableNumber);
    if (result.success) {
      alert(`Transaksi Berhasil! Total: Rp ${totalAmount.toLocaleString('id-ID')}`);
      setCart([]);
      setCustomerName('');
      setTableNumber('');
    } else {
      alert("Gagal memproses transaksi: " + result.error);
    }
    setIsCheckingOut(false);
  };
  return (
    <div className="flex-1 w-full bg-background overflow-hidden font-sans text-foreground flex">
      {/* COLUMN 2: Catalog & Search */}
      <main className="flex-1 flex flex-col min-w-0 clay-card m-4 overflow-hidden">
        {/* Search & Filter Header */}
        <div className="p-10 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
            <PageHeader 
              title="Menu Katalog" 
              subtitle="Discover Ogut's Special Roasts" 
            />

            <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-[450px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40" size={20} />
                <Input 
                    placeholder="Search coffee, food, or drinks..."
                    className="clay-input pl-16 h-16"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                </div>
                
                <Button 
                    onClick={() => setIsRevenueModalOpen(true)}
                    variant="outline"
                    className="h-16 px-6 rounded-[1.5rem] font-black uppercase tracking-widest text-primary border-primary hover:bg-primary/5 hidden sm:flex shrink-0 shadow-sm"
                >
                    <FileText size={20} className="mr-2" />
                    Rekap Harian
                </Button>
            </div>
          </div>

          {/* Categories Tab-like buttons */}
          <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "secondary" : "ghost"}
                onClick={() => setActiveCategory(cat.id)}
                className={`h-14 px-8 clay-button ${
                  activeCategory === cat.id ? 'bg-secondary text-primary shadow-none' : 'text-muted-foreground hover:bg-muted/10'
                }`}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Display Area */}
        <div className="flex-1 overflow-y-auto p-10 pt-2 scrollbar-hide bg-muted/5">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 animate-pulse">
               {[...Array(8)].map((_, i) => <div key={i} className="h-80 bg-muted/30 rounded-[2rem]"></div>)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={handleAddToCart} 
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-20">
              <ShoppingCart size={100} strokeWidth={1} className="mb-6" />
              <p className="font-black uppercase tracking-[0.3em] text-xl">Catalog Empty</p>
            </div>
          )}
        </div>
      </main>

      {/* COLUMN 3: Current Order / Cart Panel */}
      <OrderCart 
        cart={cart}
        orderType={orderType}
        setOrderType={setOrderType}
        updateQty={updateQty}
        removeFromCart={removeFromCart}
        subtotal={subtotal}
        tax={tax}
        totalAmount={totalAmount}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        handleCheckout={handleCheckout}
        isCheckingOut={isCheckingOut}
        customerName={customerName}
        setCustomerName={setCustomerName}
        tableNumber={tableNumber}
        setTableNumber={setTableNumber}
      />

      {/* MODAL REKAP HARIAN */}
      {isRevenueModalOpen && (
        <DailyRevenueModal onClose={() => setIsRevenueModalOpen(false)} />
      )}
    </div>
  );
}
