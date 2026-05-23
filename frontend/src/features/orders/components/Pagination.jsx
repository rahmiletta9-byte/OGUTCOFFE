import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function Pagination({ 
  currentPage, 
  totalPages, 
  totalCount, 
  pageSize, 
  onPageChange,
  label = "Transaksi"
}) {
  if (totalPages <= 1) return null;

  const startRange = (currentPage - 1) * pageSize + 1;
  const endRange = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-dashed border-muted-foreground/20">
      {/* Teks Informasi Data */}
      <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
        Menampilkan <span className="text-foreground font-black">{startRange}-{endRange}</span> dari <span className="text-foreground font-black">{totalCount}</span> {label}
      </p>

      {/* Navigasi Pagination */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-12 px-5 rounded-2xl font-black uppercase tracking-widest text-xs border-muted/20 hover:bg-muted/10 transition-all flex items-center gap-1 shrink-0 clay-button"
        >
          <ChevronLeft size={16} strokeWidth={3} />
          Prev
        </Button>

        <div className="bg-white/50 backdrop-blur-md px-5 h-12 flex items-center justify-center rounded-2xl font-black text-xs uppercase tracking-widest border border-muted/20 shadow-sm">
          Hal {currentPage} / {totalPages}
        </div>

        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-12 px-5 rounded-2xl font-black uppercase tracking-widest text-xs border-muted/20 hover:bg-muted/10 transition-all flex items-center gap-1 shrink-0 clay-button"
        >
          Next
          <ChevronRight size={16} strokeWidth={3} />
        </Button>
      </div>
    </div>
  );
}
