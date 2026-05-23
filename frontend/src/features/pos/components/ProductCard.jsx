import React from 'react';
import { Coffee, Utensils, CupSoda, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { STOCK_THRESHOLD } from '@/features/pos/services/stockService';

export default function ProductCard({ product, onAddToCart }) {
  const isOutOfStock = product.max_servings !== undefined && product.max_servings <= STOCK_THRESHOLD.OUT_OF_STOCK;
  const isLowStock = product.max_servings !== undefined && product.max_servings > 0 && product.max_servings <= STOCK_THRESHOLD.LOW_STOCK;

  const getCategoryIcon = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('kopi') || cat.includes('coffee')) {
      return <Coffee className="h-16 w-16 text-primary/30" strokeWidth={1.5} />;
    }
    if (cat.includes('makanan') || cat.includes('food')) {
      return <Utensils className="h-16 w-16 text-primary/30" strokeWidth={1.5} />;
    }
    return <CupSoda className="h-16 w-16 text-primary/30" strokeWidth={1.5} />;
  };

  return (
    <Card className="group clay-card overflow-hidden flex flex-col relative rounded-[2rem]">
      {/* Overlay HABIS */}
      {isOutOfStock && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-20 flex items-center justify-center rounded-[2rem]">
          <Badge variant="destructive" className="text-lg font-black uppercase py-2 px-6 tracking-widest shadow-md">
            HABIS
          </Badge>
        </div>
      )}

      {/* Badges Area */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Badge variant="secondary" className="clay-badge bg-white/90">
          {product.category || 'Coffee'}
        </Badge>
        
        {/* Dynamic Stock Badge */}
        {isLowStock ? (
          <Badge className="clay-badge bg-amber-100 text-amber-700 border border-amber-300 font-bold">
            Sisa {product.max_servings} Porsi
          </Badge>
        ) : !isOutOfStock ? (
          <Badge className="clay-badge bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold">
            Tersedia: {product.max_servings} Porsi
          </Badge>
        ) : null}
      </div>

      {/* Image Area */}
      <div className="h-44 w-full bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden relative flex items-center justify-center border-b border-muted/10">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center">
            {getCategoryIcon(product.category)}
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-foreground text-sm line-clamp-2 leading-tight mb-3 h-10">
          {product.name}
        </h3>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Price</span>
            <span className="font-black text-primary text-lg">
              Rp {product.price?.toLocaleString('id-ID')}
            </span>
          </div>

          <Button 
            size="icon"
            onClick={() => !isOutOfStock && onAddToCart(product)}
            disabled={isOutOfStock}
            className="h-12 w-12 clay-button bg-secondary hover:bg-primary text-secondary-foreground hover:text-primary-foreground disabled:opacity-50 disabled:pointer-events-none"
          >
            <Plus size={20} strokeWidth={3} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
