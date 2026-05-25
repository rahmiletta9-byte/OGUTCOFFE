import { supabase } from '@/lib/supabaseClient';

/**
 * Mengambil riwayat transaksi dari database menggunakan RPC get_order_history.
 * 
 * @param {Object} options
 * @param {string} [options.startDate] - ISO date string
 * @param {string} [options.endDate] - ISO date string
 * @param {string} [options.paymentMethod] - 'Cash', 'QRIS', 'Debit', atau 'All'
 * @param {string} [options.search] - Pencarian nama pelanggan
 * @param {number} [options.page] - Halaman aktif (1-indexed)
 * @param {number} [options.pageSize] - Jumlah data per halaman
 */
export async function fetchOrderHistory({ 
  startDate, 
  endDate, 
  paymentMethod, 
  search, 
  page = 1, 
  pageSize = 10 
}) {
  try {
    const params = {
      p_page: page,
      p_page_size: pageSize
    };

    if (startDate) params.p_start_date = startDate;
    if (endDate) params.p_end_date = endDate;
    if (paymentMethod && paymentMethod !== 'All') params.p_payment_method = paymentMethod;
    if (search && search.trim()) params.p_search = search.trim();

    const { data, error } = await supabase.rpc('get_order_history', params);

    if (error) throw error;

    // RPC mengembalikan struktur JSON:
    // { data: [...], total_count, page, page_size, total_pages }
    return {
      success: true,
      data: data.data || [],
      totalCount: data.total_count || 0,
      page: data.page || page,
      pageSize: data.page_size || pageSize,
      totalPages: data.total_pages || 0
    };
  } catch (error) {
    console.error("Gagal memuat riwayat transaksi:", error);
    return {
      success: false,
      error: error.message,
      data: [],
      totalCount: 0,
      page: page,
      pageSize: pageSize,
      totalPages: 0
    };
  }
}
