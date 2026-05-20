import React from 'react';
import { Coffee, Plus, Flame } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function ProductCard({ product, onAddToCart }) {
  const fallbackImg = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000&auto=format&fit=crop"; 

  return (
    <Card className="group clay-card overflow-hidden flex flex-col relative">
      {/* Badges Area */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Badge variant="secondary" className="clay-badge bg-white/90">
          {product.category || 'Coffee'}
        </Badge>
        {/* Laris Badge */}
        <Badge variant="destructive" className="clay-badge bg-destructive/90 text-destructive-foreground">
          <Flame size={10} fill="currentColor" /> LARIS
        </Badge>
      </div>

      {/* Image Area */}
      <div className="h-44 w-full bg-muted/30 overflow-hidden relative">
        <img 
          src={product.image_url || fallbackImg} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = fallbackImg }}
        />
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
            onClick={() => onAddToCart(product)}
            className="h-12 w-12 clay-button bg-secondary hover:bg-primary text-secondary-foreground hover:text-primary-foreground"
          >
            <Plus size={20} strokeWidth={3} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
