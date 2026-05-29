import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/lib/logger';


export const processCheckout = async (cartItems, totalAmount, paymentMethod, customerName = '', tableNumber = '') => {
  try {
    // Siapkan payload produk untuk dikirim ke RPC database
    const itemsPayload = cartItems.map(item => ({
      product_id: item.id,
      qty: item.qty,
      price: item.price || 0,
      cost_price: item.cost_price || 0
    }));

    // Panggil stored procedure process_checkout secara atomik
    const { data, error } = await supabase.rpc('process_checkout', {
      p_items: itemsPayload,
      p_total: totalAmount,
      p_payment: paymentMethod,
      p_customer: customerName.trim() || null,
      p_table: tableNumber.trim() || null
    });

    if (error) throw error;

    // Periksa apakah stored procedure mengembalikan status sukses
    if (data && !data.success) {
      throw new Error(data.error || 'Gagal memproses checkout (kemungkinan stok bahan baku habis)');
    }

    // 3.5. CATAT AKTIVITAS CHECKOUT
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      logActivity(
        session.user.id,
        'CHECKOUT',
        `Transaksi senilai Rp ${totalAmount.toLocaleString('id-ID')} (${paymentMethod}) - ${cartItems.length} item`
      ).catch(err => console.error("Failed to log activity:", err));
    }

    // 4. FIRE-AND-FORGET KE FLASK (AI N-GRAM)
    // Menggunakan fetch asinkron tanpa 'await' agar UI tetap responsif
    const flaskApiUrl = import.meta.env.VITE_FLASK_API_URL;
    if (flaskApiUrl) {
      fetch(`${flaskApiUrl}/api/ngram/increment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_INTERNAL_API_KEY || ''
        },
        body: JSON.stringify({ 
          items: cartItems.map(item => item.name) 
        })
      }).catch(err => console.error("Flask AI Update Failed (Background):", err));
    }

    return { success: true };
  } catch (error) {
    console.error("Checkout process failed:", error);
    return { success: false, error: error.message };
  }
};
