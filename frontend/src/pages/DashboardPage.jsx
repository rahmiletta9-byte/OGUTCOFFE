import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fetchProductsWithStock } from '@/features/pos/services/stockService';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Layers, 
  ArrowRight,
  TrendingDown,
  Info,
  FileText
} from 'lucide-react';

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Feature Components
import PageHeader from '@/components/layout/PageHeader';
import DailyRevenueModal from '@/features/pos/components/DailyRevenueModal';

export default function DashboardPage() {
  const [clusterData, setClusterData] = useState([]);
  const [predictionData, setPredictionData] = useState([]);
  const [stockAlertProducts, setStockAlertProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);

  // State Metrik Dinamis (BUG-15)
  const [silhouetteScore, setSilhouetteScore] = useState(0.68);
  const [modelAccuracy, setModelAccuracy] = useState(94.2);
  const [totalForecasts, setTotalForecasts] = useState(128);

  useEffect(() => {
    const fetchAIData = async () => {
      setIsLoading(true);
      try {
        const { data: clusters } = await supabase
          .from('ai_cluster_results')
          .select(`cluster_label, silhouette_score, products ( name, category )`)
          .order('id', { ascending: false }).limit(10);
        
        if (clusters) {
          setClusterData(clusters);
          if (clusters.length > 0 && clusters[0].silhouette_score !== null) {
            setSilhouetteScore(clusters[0].silhouette_score);
          }
        }

        const { data: predictions } = await supabase
          .from('ai_prediction_results')
          .select(`predicted_stock, mape_score, materials ( name, unit, current_stock )`)
          .order('id', { ascending: false }).limit(8);
        
        if (predictions) {
          setPredictionData(predictions);
          // Hitung total forecast secara dinamis berdasarkan jumlah bahan baku yang diprediksi
          setTotalForecasts(predictions.length);
          
          if (predictions.length > 0) {
            const avgMape = predictions.reduce((sum, p) => sum + (parseFloat(p.mape_score) || 0), 0) / predictions.length;
            // Akurasi = 100% - MAPE (Rata-rata Tingkat Error)
            setModelAccuracy(100 - avgMape);
          }
        }

        // Fetch Stock Alert Products
        try {
          const products = await fetchProductsWithStock();
          const alerts = products.filter(p => p.max_servings !== undefined && p.max_servings <= 5);
          setStockAlertProducts(alerts);
        } catch (stockErr) {
          console.error("Stock alert data fetch error:", stockErr);
        }
      } catch (err) {
        console.error("AI Data fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAIData();
  }, []);

  return (
    <div className="flex-1 w-full bg-background overflow-hidden font-sans text-foreground flex">
      {/* Main Analytics Content */}
      <main className="flex-1 overflow-y-auto p-10 scrollbar-hide">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
          <PageHeader 
            title={<>AI <span className="text-primary italic">Analytics</span></>}
            subtitle="Intelligence Dashboard" 
            titleClassName="text-5xl font-black text-foreground tracking-tighter uppercase leading-none"
          />
          
          <div className="flex items-center gap-4">
              <Button 
                onClick={() => setIsRevenueModalOpen(true)}
                variant="outline"
                className="h-16 px-6 rounded-[2rem] font-black uppercase tracking-widest text-primary border-primary hover:bg-primary/5 bg-white/50 backdrop-blur-md shadow-sm border border-primary/20 flex shrink-0"
              >
                  <FileText size={20} className="mr-2" />
                  Rekap Pendapatan Harian
              </Button>
              
              <Card className="bg-white/50 backdrop-blur-md border-none shadow-sm rounded-[2rem] p-5 flex items-center gap-5 border border-white/20">
                  <div className="bg-green-100 p-3 rounded-2xl text-green-600 shadow-inner">
                      <TrendingUp size={24} />
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">System Status</p>
                      <p className="font-black text-sm tracking-tight text-green-600">OPTIMAL PERFORMANCE</p>
                  </div>
              </Card>
          </div>
        </div>

        {/* SEKSI ALERT: STOCK WARNINGS */}
        {stockAlertProducts.length > 0 && (
          <div className="mb-12">
            <Card className="clay-card border-none overflow-hidden bg-gradient-to-r from-amber-500/10 via-destructive/5 to-amber-500/10 backdrop-blur-md border border-amber-500/20">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-foreground flex items-center gap-4 tracking-tighter uppercase">
                    <div className="bg-amber-500 p-2 rounded-xl text-white animate-pulse shadow-md">
                      <AlertTriangle size={24} />
                    </div>
                    Stock Alerts
                  </h2>
                  <Badge variant="destructive" className="clay-badge animate-pulse bg-destructive text-destructive-foreground">
                    ATTENTION REQUIRED
                  </Badge>
                </div>
                
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                  {stockAlertProducts.map((product) => {
                    const isOut = product.max_servings === 0;
                    return (
                      <div 
                        key={product.id} 
                        className={`min-w-[280px] p-6 rounded-[2rem] clay-card flex flex-col justify-between border transition-all hover:scale-102 ${
                          isOut 
                            ? 'bg-destructive/10 border-destructive/20 hover:bg-destructive/15' 
                            : 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15'
                        }`}
                        style={{ boxShadow: 'none' }}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h4 className="font-black text-foreground text-lg tracking-tight line-clamp-1 uppercase">{product.name}</h4>
                            <Badge 
                              variant={isOut ? "destructive" : "default"} 
                              className={`clay-badge shrink-0 ${!isOut ? 'bg-amber-500 text-white' : ''}`}
                            >
                              {isOut ? 'HABIS' : 'MENIPIS'}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                            Category: {product.category}
                          </p>
                        </div>
                        
                        <div className="mt-6 flex items-baseline justify-between">
                          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Ketersediaan</span>
                          <span className={`text-2xl font-black ${isOut ? 'text-destructive' : 'text-amber-600'}`}>
                            {product.max_servings} Porsi
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* SEKSI 1: CLUSTERING (Left Column) */}
          <section className="lg:col-span-5 space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-4 tracking-tighter uppercase">
                <div className="bg-primary p-2 rounded-xl text-primary-foreground clay-button">
                  <Layers size={20} />
                </div>
                Menu Segmentation
              </h2>
              <Button variant="link" className="text-primary font-black uppercase text-xs tracking-widest">View All</Button>
            </div>

            <Card className="clay-card overflow-hidden">
              <CardContent className="p-8 space-y-5">
                {isLoading ? (
                  [...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted/20 rounded-[2rem] animate-pulse" />)
                ) : clusterData.length > 0 ? (
                  clusterData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-muted/5 hover:bg-muted/10 rounded-[2rem] transition-all group cursor-pointer clay-card" style={{boxShadow: 'none', borderRadius: '1.5rem'}}>
                      <div className="flex items-center gap-5">
                          <div className={`h-14 w-14 clay-button flex items-center justify-center text-white font-black text-xl ${
                              item.cluster_label === 'Laris & Untung Besar' ? 'bg-green-500' : 
                              item.cluster_label === 'Kurang Laris' ? 'bg-destructive' : 'bg-primary'
                          }`}>
                              {item.products?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                              <h4 className="font-black text-foreground tracking-tight">{item.products?.name}</h4>
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">{item.products?.category}</p>
                          </div>
                      </div>
                      <Badge variant={item.cluster_label === 'Laris & Untung Besar' ? "secondary" : item.cluster_label === 'Kurang Laris' ? "destructive" : "default"} className="clay-badge">
                          {item.cluster_label}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center text-muted-foreground opacity-20">
                      <BarChart3 size={80} className="mx-auto mb-4" strokeWidth={1} />
                      <p className="font-black uppercase tracking-widest">No Data Available</p>
                  </div>
                )}
              </CardContent>
              <div className="bg-muted/10 p-6 flex items-center gap-3 border-t border-dashed">
                  <Info size={16} className="text-primary opacity-50" />
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">AI Model updated daily at 00:00 WIB</p>
              </div>
            </Card>
          </section>

          {/* SEKSI 2: PREDICTION (Right Column) */}
          <section className="lg:col-span-7 space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-foreground flex items-center gap-4 tracking-tighter uppercase">
                <div className="bg-destructive p-2 rounded-xl text-destructive-foreground clay-button">
                  <AlertTriangle size={20} />
                </div>
                Stock Predictions
              </h2>
              <Badge variant="destructive" className="clay-badge bg-destructive text-destructive-foreground">7-Day Forecast</Badge>
            </div>

            <Card className="clay-card overflow-hidden">
              <CardContent className="p-8">
                <div className="space-y-4">
                    {isLoading ? (
                      [...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted/20 rounded-[2rem] animate-pulse" />)
                    ) : predictionData.length > 0 ? (
                      predictionData.map((item, idx) => {
                        const isCritical = item.predicted_stock <= (item.materials?.current_stock * 0.2);
                        return (
                          <div key={idx} className={`flex items-center justify-between p-6 rounded-[2.5rem] transition-all ${isCritical ? 'bg-destructive/5 clay-card' : 'bg-muted/10 hover:bg-muted/30 clay-card shadow-none'}`}>
                            <div className="flex flex-col">
                              <span className="font-black text-foreground text-lg tracking-tight uppercase">{item.materials?.name}</span>
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Current: {item.materials?.current_stock} {item.materials?.unit}</span>
                            </div>
                            
                            <div className="flex items-center gap-8">
                              <div className="text-right">
                                  <p className={`text-2xl font-black tracking-tighter ${isCritical ? 'text-destructive' : 'text-primary'}`}>
                                      {item.predicted_stock} {item.materials?.unit}
                                  </p>
                                  <div className="flex items-center justify-end gap-1 opacity-60">
                                      {isCritical ? <TrendingDown size={14} className="text-destructive" /> : <TrendingUp size={14} className="text-green-500" />}
                                      <span className="text-[10px] font-black uppercase tracking-tighter">Predicted</span>
                                  </div>
                              </div>
                              <Button size="sm" variant={isCritical ? "destructive" : "outline"} className="rounded-2xl font-black uppercase tracking-tighter px-6 h-10 shadow-sm">
                                  Restock
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-20 text-center text-muted-foreground opacity-20">
                          <AlertTriangle size={80} className="mx-auto mb-4" strokeWidth={1} />
                          <p className="font-black uppercase tracking-widest">No Predictions</p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <Card className="bg-primary p-10 text-primary-foreground relative overflow-hidden clay-card" style={{backgroundColor: 'hsl(var(--primary))'}}>
                    <div className="relative z-10 space-y-2">
                        <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.3em]">Model Accuracy</p>
                        <h4 className="text-5xl font-black tracking-tighter italic leading-none">{modelAccuracy.toFixed(1)}%</h4>
                        <Badge variant="secondary" className="mt-6 clay-badge">Silhouette Score: {silhouetteScore.toFixed(2)}</Badge>
                    </div>
                    <BarChart3 className="absolute -bottom-6 -right-6 opacity-10 h-48 w-48 rotate-12" />
                </Card>
                <Card className="p-10 relative overflow-hidden clay-card">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">Total Forecasts</p>
                        <h4 className="text-5xl font-black tracking-tighter text-foreground leading-none">{totalForecasts} <span className="text-xs font-black opacity-30 tracking-tight">Items</span></h4>
                        <div className="flex items-center gap-2 mt-6 text-green-500 font-black text-xs uppercase tracking-tighter">
                            <TrendingUp size={16} />
                            <span>+12.5% Month Growth</span>
                        </div>
                    </div>
                    <Layers className="absolute -bottom-6 -right-6 opacity-5 h-48 w-48 -rotate-12 text-primary" />
                </Card>
            </div>
          </section>

        </div>
      </main>

      {isRevenueModalOpen && (
        <DailyRevenueModal onClose={() => setIsRevenueModalOpen(false)} />
      )}
    </div>
  );
}
