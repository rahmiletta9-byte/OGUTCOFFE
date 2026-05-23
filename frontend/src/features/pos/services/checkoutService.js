import { supabase } from '@/lib/supabaseClient';

export const processCheckout = async (cartItems, totalAmount, paymentMethod, customerName = '', tableNumber = '') => {
  try {
    // 0. Validasi stok sebelum checkout
    const insufficientStockItems = cartItems.filter(item =>
      item.max_servings !== undefined && (item.max_servings <= 0 || item.qty > item.max_servings)
    );
    if (insufficientStockItems.length > 0) {
      const details = insufficientStockItems.map(i => 
        i.max_servings <= 0 
          ? `${i.name} (HABIS)` 
          : `${i.name} (Tersedia: ${i.max_servings}, Dipesan: ${i.qty})`
      ).join(', ');
      throw new Error(`Stok bahan tidak mencukupi untuk menu: ${details}`);
    }

    // 1. Catat Header Transaksi ke Supabase
    const transactionPayload = { 
      total_amount: totalAmount,
      payment_method: paymentMethod,
    };
    if (customerName.trim()) transactionPayload.customer_name = customerName.trim();
    if (tableNumber.trim()) transactionPayload.table_number = tableNumber.trim();

    const { data: trxData, error: trxError } = await supabase
      .from('transactions')
      .insert([transactionPayload])
      .select('id')
      .single();

    if (trxError) throw trxError;

    // 2. Siapkan detail pesanan (termasuk kalkulasi profit statis)
    const transactionId = trxData.id;
    const orderDetails = cartItems.map(item => ({
      transaction_id: transactionId,
      product_id: item.id,
      quantity: item.qty,
      subtotal: (item.price || 0) * item.qty,
      // profit_margin = (harga jual - harga modal) * qty
      profit_margin: ((item.price || 0) - (item.cost_price || 0)) * item.qty
    }));

    // 3. Catat Item Transaksi (Bulk Insert)
    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(orderDetails);

    if (itemsError) throw itemsError;

    // 4. FIRE-AND-FORGET KE FLASK (AI N-GRAM)
    // Menggunakan fetch asinkron tanpa 'await' agar UI tetap responsif
    const flaskApiUrl = import.meta.env.VITE_FLASK_API_URL;
    if (flaskApiUrl) {
      fetch(`${flaskApiUrl}/api/ngram/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
