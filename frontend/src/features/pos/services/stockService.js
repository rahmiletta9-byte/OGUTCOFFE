import { supabase } from '@/lib/supabaseClient';

export const STOCK_THRESHOLD = {
  OUT_OF_STOCK: 0,
  LOW_STOCK: 5
};

export async function fetchProductsWithStock() {
  if (import.meta.env.DEV) {
    console.log("StockService: Fetching products with active ingredients stock...");
  }
  try {
    const { data, error } = await supabase.rpc('get_products_with_stock');
    if (error) {
      console.error('StockService: Fetching products with stock failed:', error);
      throw error;
    }
    if (import.meta.env.DEV) {
      console.log(`StockService: Successfully fetched ${data?.length || 0} products with active stock.`);
    }
    return data || [];
  } catch (error) {
    console.error('StockService: Exception during stock fetching:', error);
    throw error;
  }
}
