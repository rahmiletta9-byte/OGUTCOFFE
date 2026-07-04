-- 1. Perbarui Kebijakan RLS pada tabel public.products
-- Mengizinkan role 'manajemen_bahan' untuk membaca produk untuk pengecekan resep
DROP POLICY IF EXISTS "Kasir Read Products" ON public.products;
CREATE POLICY "Staff Read Products" ON public.products
  FOR SELECT
  TO public
  USING ((get_user_role())::text = ANY (ARRAY['kasir'::text, 'admin'::text, 'manajemen_bahan'::text]));

-- 2. Perbarui Kebijakan RLS pada tabel public.product_materials
-- Mengizinkan role 'manajemen_bahan' untuk membaca resep bahan
DROP POLICY IF EXISTS "Kasir read product_materials" ON public.product_materials;
CREATE POLICY "Staff read product_materials" ON public.product_materials
  FOR SELECT
  TO public
  USING ((get_user_role())::text = ANY (ARRAY['kasir'::text, 'admin'::text, 'manajemen_bahan'::text]));


-- 3. Pengamanan RPC get_user_profiles (Hanya boleh dipanggil oleh Admin)
CREATE OR REPLACE FUNCTION public.get_user_profiles()
 RETURNS TABLE(user_id uuid, role character varying, email character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  IF COALESCE(public.get_user_role(), '') != 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Hanya Admin yang dapat mengakses profil pengguna.';
  END IF;

  RETURN QUERY
  SELECT ur.user_id, ur.role, au.email::VARCHAR
  FROM public.user_roles ur
  LEFT JOIN auth.users au ON ur.user_id = au.id;
END;
$function$;


-- 4. Pengamanan RPC get_activity_logs (Hanya boleh dipanggil oleh Admin)
CREATE OR REPLACE FUNCTION public.get_activity_logs()
 RETURNS TABLE(id uuid, action_type character varying, description text, created_at timestamp with time zone, user_email character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF COALESCE(public.get_user_role(), '') != 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Hanya Admin yang dapat mengakses log aktivitas.';
  END IF;

  RETURN QUERY
  SELECT 
    al.id,
    al.action_type,
    al.description,
    al.created_at,
    au.email::VARCHAR
  FROM public.activity_logs al
  LEFT JOIN auth.users au ON al.user_id = au.id
  ORDER BY al.created_at DESC;
END;
$function$;


-- 5. Pengamanan RPC get_activity_logs_paginated (Hanya boleh dipanggil oleh Admin)
CREATE OR REPLACE FUNCTION public.get_activity_logs_paginated(p_page integer, p_page_size integer, p_search text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, action_type character varying, description text, created_at timestamp with time zone, user_email character varying, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_offset int;
  v_total_count bigint;
BEGIN
  IF COALESCE(public.get_user_role(), '') != 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Hanya Admin yang dapat mengakses log aktivitas.';
  END IF;

  -- Hitung offset
  v_offset := (p_page - 1) * p_page_size;

  -- Hitung total count dengan filter search jika ada
  SELECT COUNT(*) INTO v_total_count
  FROM public.activity_logs al
  LEFT JOIN auth.users au ON al.user_id = au.id
  WHERE p_search IS NULL 
     OR p_search = '' 
     OR al.description ILIKE '%' || p_search || '%'
     OR al.action_type ILIKE '%' || p_search || '%'
     OR au.email ILIKE '%' || p_search || '%';

  -- Kembalikan rows terpaginasi
  RETURN QUERY
  SELECT 
    al.id,
    al.action_type,
    al.description,
    al.created_at,
    au.email::VARCHAR,
    v_total_count
  FROM public.activity_logs al
  LEFT JOIN auth.users au ON al.user_id = au.id
  WHERE p_search IS NULL 
     OR p_search = '' 
     OR al.description ILIKE '%' || p_search || '%'
     OR al.action_type ILIKE '%' || p_search || '%'
     OR au.email ILIKE '%' || p_search || '%'
  ORDER BY al.created_at DESC
  LIMIT p_page_size
  OFFSET v_offset;
END;
$function$;


-- 6. Pengamanan RPC get_order_history (Hanya boleh dipanggil oleh Admin dan Kasir)
CREATE OR REPLACE FUNCTION public.get_order_history(p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_payment_method character varying DEFAULT NULL::character varying, p_search text DEFAULT NULL::text, p_page integer DEFAULT 1, p_page_size integer DEFAULT 10)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_offset INT;
  v_total_count BIGINT;
  v_transactions JSON;
BEGIN
  IF NOT (COALESCE(public.get_user_role(), '') IN ('admin', 'kasir')) THEN
    RAISE EXCEPTION 'Access Denied: Hanya Admin dan Kasir yang dapat mengakses riwayat pesanan.';
  END IF;

  v_offset := (p_page - 1) * p_page_size;

  -- Count total matching
  SELECT COUNT(*) INTO v_total_count
  FROM public.transactions t
  WHERE
    (p_start_date IS NULL OR t.created_at >= p_start_date) AND
    (p_end_date IS NULL OR t.created_at <= p_end_date) AND
    (p_payment_method IS NULL OR t.payment_method = p_payment_method) AND
    (p_search IS NULL OR t.customer_name ILIKE '%' || p_search || '%');

  -- Get paginated transactions with items
  SELECT json_agg(row_to_json(trx_with_items))
  INTO v_transactions
  FROM (
    SELECT
      t.id,
      t.total_amount,
      t.payment_method,
      t.customer_name,
      t.table_number,
      t.created_at,
      (
        SELECT json_agg(json_build_object(
          'product_name', p.name,
          'quantity', ti.quantity,
          'subtotal', ti.subtotal
        ))
        FROM public.transaction_items ti
        LEFT JOIN public.products p ON p.id = ti.product_id
        WHERE ti.transaction_id = t.id
      ) AS items
    FROM public.transactions t
    WHERE
      (p_start_date IS NULL OR t.created_at >= p_start_date) AND
      (p_end_date IS NULL OR t.created_at <= p_end_date) AND
      (p_payment_method IS NULL OR t.payment_method = p_payment_method) AND
      (p_search IS NULL OR t.customer_name ILIKE '%' || p_search || '%')
    ORDER BY t.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset
  ) trx_with_items;

  RETURN json_build_object(
    'data', COALESCE(v_transactions, '[]'::json),
    'total_count', v_total_count,
    'page', p_page,
    'page_size', p_page_size,
    'total_pages', CEIL(v_total_count::FLOAT / p_page_size)
  );
END;
$function$;


-- 7. Pengamanan RPC process_checkout (Hanya boleh dipanggil oleh Admin dan Kasir)
CREATE OR REPLACE FUNCTION public.process_checkout(p_items jsonb, p_total numeric, p_payment text, p_customer text DEFAULT NULL::text, p_table text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_trx_id uuid;
  v_item jsonb;
  v_prod_id uuid;
  v_qty int;
  v_price numeric;
  v_cost_price numeric;
  v_subtotal numeric;
  v_profit numeric;
  v_recipe_row record;
  v_curr_stock numeric;
  v_required numeric;
BEGIN
  IF NOT (COALESCE(public.get_user_role(), '') IN ('admin', 'kasir')) THEN
    RAISE EXCEPTION 'Access Denied: Hanya Admin dan Kasir yang dapat melakukan checkout.';
  END IF;

  -- 1. Insert ke tabel transactions
  INSERT INTO transactions (total_amount, payment_method, customer_name, table_number)
  VALUES (p_total, p_payment, p_customer, p_table)
  RETURNING id INTO v_trx_id;

  -- 2. Loop setiap item di cart
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;
    v_price := (v_item->>'price')::numeric;
    v_cost_price := (v_item->>'cost_price')::numeric;
    v_subtotal := v_price * v_qty;
    v_profit := (v_price - COALESCE(v_cost_price, 0)) * v_qty;

    -- 2.1. Validasi stok (jika produk memiliki bahan baku di product_materials)
    FOR v_recipe_row IN 
      SELECT pm.material_id, pm.quantity_used, m.name as mat_name
      FROM product_materials pm
      JOIN materials m ON m.id = pm.material_id
      WHERE pm.product_id = v_prod_id
    LOOP
      v_required := v_recipe_row.quantity_used * v_qty;
      
      -- LOCK baris di tabel materials untuk mencegah race condition (Concurrency Lock)
      SELECT current_stock INTO v_curr_stock 
      FROM materials 
      WHERE id = v_recipe_row.material_id 
      FOR UPDATE;

      -- Validasi kecukupan stok
      IF v_curr_stock IS NULL OR v_curr_stock < v_required THEN
        RAISE EXCEPTION 'Stok tidak mencukupi untuk bahan % (Dibutuhkan: %, Tersedia: %)', 
          v_recipe_row.mat_name, v_required, COALESCE(v_curr_stock, 0);
      END IF;

      -- CATATAN: Update stok bahan baku sengaja DIHAPUS dari sini karena 
      -- sudah ditangani secara otomatis oleh database trigger 'on_transaction_item_insert'
      -- yang terpicu saat data dimasukkan ke 'transaction_items' di bawah.
    END LOOP;

    -- 2.2. Insert ke tabel transaction_items
    INSERT INTO transaction_items (transaction_id, product_id, quantity, subtotal, profit_margin)
    VALUES (v_trx_id, v_prod_id, v_qty, v_subtotal, v_profit);
  END LOOP;

  -- Kembalikan respons sukses
  RETURN jsonb_build_object('success', true, 'transaction_id', v_trx_id);
EXCEPTION WHEN OTHERS THEN
  -- PostgreSQL akan secara otomatis me-rollback seluruh transaksi jika ada error/exception
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;


-- 8. Pengamanan RPC get_products_with_stock (Hanya boleh dipanggil oleh Admin dan Kasir)
CREATE OR REPLACE FUNCTION public.get_products_with_stock()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NOT (COALESCE(public.get_user_role(), '') IN ('admin', 'kasir')) THEN
    RAISE EXCEPTION 'Access Denied: Hanya Admin dan Kasir yang dapat mengakses stok menu.';
  END IF;

  RETURN (
    SELECT json_agg(row_to_json(product_stock))
    FROM (
      SELECT
        p.*,
        COALESCE(
          (
            SELECT MIN(FLOOR(m.current_stock / pm.quantity_used))
            FROM product_materials pm
            JOIN materials m ON m.id = pm.material_id
            WHERE pm.product_id = p.id
              AND pm.quantity_used > 0
          ),
          0
        )::INT AS max_servings
      FROM products p
      ORDER BY p.name
    ) product_stock
  );
END;
$function$;
