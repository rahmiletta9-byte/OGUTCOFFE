import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/lib/logger';


export const processCheckout = async (cartItems, totalAmount, paymentMethod, customerName = '', tableNumber = '') => {
  if (import.meta.env.DEV) {
    console.log("Checkout: Initiating transaction process...", { cartItems, totalAmount, paymentMethod, customerName, tableNumber });
  }
  try {
    // Siapkan payload produk untuk dikirim ke RPC database
    const itemsPayload = cartItems.map(item => ({
      product_id: item.id,
      qty: item.qty,
      price: item.price || 0,
      cost_price: item.cost_price || 0
    }));

    if (import.meta.env.DEV) {
      console.log("Checkout: Prepared items payload for Database RPC:", itemsPayload);
    }

    // Panggil stored procedure process_checkout secara atomik
    const { data, error } = await supabase.rpc('process_checkout', {
      p_items: itemsPayload,
      p_total: totalAmount,
      p_payment: paymentMethod,
      p_customer: customerName.trim() || null,
      p_table: tableNumber.trim() || null
    });

    if (error) {
      console.error("Checkout: Database RPC returned a hard error:", error);
      throw error;
    }

    if (import.meta.env.DEV) {
      console.log("Checkout: Database RPC response received:", data);
    }

    // Periksa apakah stored procedure mengembalikan status sukses
    if (data && !data.success) {
      console.warn("Checkout: Database validation failed (e.g., out of stock):", data.error);
      throw new Error(data.error || 'Gagal memproses checkout (kemungkinan stok bahan baku habis)');
    }

    // 3.5. CATAT AKTIVITAS CHECKOUT
    try {
      const token = localStorage.getItem('pos_token');
      if (token) {
        // Parse payload user_id secara lokal
        const base64Url = token.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
          const payload = JSON.parse(jsonPayload);
          if (payload?.sub) {
            logActivity(
              payload.sub,
              'CHECKOUT',
              `Transaksi senilai Rp ${totalAmount.toLocaleString('id-ID')} (${paymentMethod}) - ${cartItems.length} item`
            ).catch(err => console.error("Checkout: Failed to log activity:", err));
          }
        }
      }
    } catch (e) {
      console.warn("Checkout: Failed to parse user id from token:", e);
    }

    // 4. FIRE-AND-FORGET KE FLASK (AI N-GRAM)
    // Menggunakan apiClient tanpa 'await' agar UI tetap responsif
    const itemsList = cartItems.map(item => item.name);
    if (import.meta.env.DEV) {
      console.log("Checkout: Dispatching background N-Gram trigger to Flask:", itemsList);
    }
    
    // Import or call apiClient dynamically or directly
    fetch(`${import.meta.env.VITE_FLASK_API_URL || 'http://127.0.0.1:5000'}/api/ngram/increment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('pos_token') || ''}`
      },
      body: JSON.stringify({ items: itemsList })
    }).then(res => {
      if (import.meta.env.DEV) console.log("Checkout: Flask background N-Gram response status:", res.status);
    }).catch(err => console.error("Flask AI Update Failed (Background):", err));

    return { success: true };
  } catch (error) {
    console.error("Checkout process failed:", error);
    return { success: false, error: error.message };
  }
};
