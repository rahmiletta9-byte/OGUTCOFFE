import { supabase } from '@/lib/supabaseClient';

export const STOCK_THRESHOLD = {
  OUT_OF_STOCK: 0,
  LOW_STOCK: 5
};

export async function fetchProductsWithStock() {
  try {
    const { data, error } = await supabase.rpc('get_products_with_stock');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching products with stock:', error);
    throw error;
  }
}
