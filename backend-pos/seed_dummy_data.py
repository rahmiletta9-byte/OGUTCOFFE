import os
import sys
import uuid
import random
from datetime import datetime, timedelta

# Add parent dir to path so we can import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config.supabase_client import db

def generate_dummy_data():
    print("Mulai membuat data dummy...")

    # 1. Clear existing data for a fresh start
    print("Membersihkan data lama untuk simulasi bersih...")
    try:
        # Hapus rujukan dulu (FK constraints)
        db.table('ai_prediction_results').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        db.table('ai_cluster_results').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        db.table('inventory_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        db.table('transaction_items').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        db.table('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        db.table('product_materials').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        db.table('products').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        db.table('materials').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print("Basis data dibersihkan.")
    except Exception as e:
        print(f"Peringatan saat membersihkan data: {e}")

    product_kopi_susu = str(uuid.uuid4())
    product_americano = str(uuid.uuid4())
    product_matcha = str(uuid.uuid4())
    product_kentang = str(uuid.uuid4())

    products = [
        {"id": product_kopi_susu, "name": "Kopi Susu Gula Aren", "price": 20000, "cost_price": 10000, "category": "Kopi"},
        {"id": product_americano, "name": "Americano", "price": 15000, "cost_price": 5000, "category": "Kopi"},
        {"id": product_matcha, "name": "Matcha Latte", "price": 25000, "cost_price": 12000, "category": "Non-Kopi"},
        {"id": product_kentang, "name": "Kentang Goreng", "price": 15000, "cost_price": 8000, "category": "Makanan"}
    ]
    
    db.table('products').insert(products).execute()
    print("Berhasil insert 4 products.")

    material_biji_kopi = str(uuid.uuid4())
    material_susu = str(uuid.uuid4())
    material_matcha = str(uuid.uuid4())
    material_kentang = str(uuid.uuid4())

    materials = [
        {"id": material_biji_kopi, "name": "Biji Kopi", "current_stock": 5000, "unit": "gram"},
        {"id": material_susu, "name": "Susu Fresh Milk", "current_stock": 10000, "unit": "ml"},
        {"id": material_matcha, "name": "Bubuk Matcha", "current_stock": 2000, "unit": "gram"},
        {"id": material_kentang, "name": "Kentang Beku", "current_stock": 5000, "unit": "gram"}
    ]

    db.table('materials').insert(materials).execute()
    print("Berhasil insert 4 materials.")

    # 1.5 Generate Product Materials (Recipe / BoM)
    product_materials = [
        # Kopi Susu Gula Aren
        {"id": str(uuid.uuid4()), "product_id": product_kopi_susu, "material_id": material_biji_kopi, "quantity_used": 20},
        {"id": str(uuid.uuid4()), "product_id": product_kopi_susu, "material_id": material_susu, "quantity_used": 150},
        # Americano
        {"id": str(uuid.uuid4()), "product_id": product_americano, "material_id": material_biji_kopi, "quantity_used": 25},
        # Matcha Latte
        {"id": str(uuid.uuid4()), "product_id": product_matcha, "material_id": material_matcha, "quantity_used": 30},
        {"id": str(uuid.uuid4()), "product_id": product_matcha, "material_id": material_susu, "quantity_used": 200},
        # Kentang Goreng
        {"id": str(uuid.uuid4()), "product_id": product_kentang, "material_id": material_kentang, "quantity_used": 150}
    ]

    db.table('product_materials').insert(product_materials).execute()
    print(f"Berhasil insert {len(product_materials)} product_materials.")

    # 2. Generate Transactions and Transaction Items for the last 30 days
    # This is for K-Means (needs volume and profit_margin)
    transactions = []
    transaction_items = []

    today = datetime.now()
    
    for i in range(30):
        date = today - timedelta(days=30-i)
        
        # 5 transactions per day
        for j in range(5):
            trx_id = str(uuid.uuid4())
            # Randomly select 1-3 products
            selected_products = random.sample(products, random.randint(1, 3))
            
            total_amount = 0
            for prod in selected_products:
                qty = random.randint(1, 3)
                subtotal = qty * prod['price']
                profit = qty * (prod['price'] - prod['cost_price'])
                total_amount += subtotal
                
                transaction_items.append({
                    "id": str(uuid.uuid4()),
                    "transaction_id": trx_id,
                    "product_id": prod['id'],
                    "quantity": qty,
                    "subtotal": subtotal,
                    "profit_margin": profit
                })
            
            transactions.append({
                "id": trx_id,
                "total_amount": total_amount,
                "payment_method": random.choice(["Cash", "QRIS", "Debit"]),
                "created_at": date.isoformat()
            })

    # Chunk insert transactions
    chunk_size = 50
    for i in range(0, len(transactions), chunk_size):
        db.table('transactions').insert(transactions[i:i+chunk_size]).execute()
    
    for i in range(0, len(transaction_items), chunk_size):
        db.table('transaction_items').insert(transaction_items[i:i+chunk_size]).execute()

    print(f"Berhasil insert {len(transactions)} transactions dan {len(transaction_items)} transaction_items.")

    # 3. Generate Inventory Logs for the last 30 days
    # This is for Linear Regression (needs end_of_day_stock)
    inventory_logs = []
    
    stock_kopi = 10000
    stock_susu = 20000
    stock_matcha = 5000
    stock_kentang = 10000

    for i in range(30):
        date_str = (today - timedelta(days=30-i)).strftime('%Y-%m-%d')
        
        # simulate daily usage
        usage_kopi = random.randint(100, 300)
        usage_susu = random.randint(200, 500)
        usage_matcha = random.randint(50, 150)
        usage_kentang = random.randint(100, 300)
        
        stock_kopi = max(0, stock_kopi - usage_kopi)
        stock_susu = max(0, stock_susu - usage_susu)
        stock_matcha = max(0, stock_matcha - usage_matcha)
        stock_kentang = max(0, stock_kentang - usage_kentang)

        inventory_logs.extend([
            {"id": str(uuid.uuid4()), "material_id": material_biji_kopi, "date": date_str, "stock_used": usage_kopi, "end_of_day_stock": stock_kopi},
            {"id": str(uuid.uuid4()), "material_id": material_susu, "date": date_str, "stock_used": usage_susu, "end_of_day_stock": stock_susu},
            {"id": str(uuid.uuid4()), "material_id": material_matcha, "date": date_str, "stock_used": usage_matcha, "end_of_day_stock": stock_matcha},
            {"id": str(uuid.uuid4()), "material_id": material_kentang, "date": date_str, "stock_used": usage_kentang, "end_of_day_stock": stock_kentang}
        ])

    for i in range(0, len(inventory_logs), chunk_size):
        db.table('inventory_logs').insert(inventory_logs[i:i+chunk_size]).execute()

    print(f"Berhasil insert {len(inventory_logs)} inventory_logs.")

    # 4. Generate Initial AI Results (Snapshot)
    # This ensures the Dashboard is not empty on first visit
    print("Menghasilkan hasil AI awal untuk dashboard...")
    
    initial_clusters = [
        {"product_id": product_kopi_susu, "cluster_label": "Laris & Untung Besar", "silhouette_score": 0.85},
        {"product_id": product_americano, "cluster_label": "Menengah", "silhouette_score": 0.85},
        {"product_id": product_matcha, "cluster_label": "Menengah", "silhouette_score": 0.85},
        {"product_id": product_kentang, "cluster_label": "Kurang Laris", "silhouette_score": 0.85},
    ]
    db.table('ai_cluster_results').insert(initial_clusters).execute()

    initial_predictions = [
        {"material_id": material_biji_kopi, "predicted_stock": 4200.5, "mape_score": 5.2},
        {"material_id": material_susu, "predicted_stock": 8500.0, "mape_score": 4.1},
        {"material_id": material_matcha, "predicted_stock": 1800.2, "mape_score": 8.5},
        {"material_id": material_kentang, "predicted_stock": 4000.0, "mape_score": 3.9},
    ]
    db.table('ai_prediction_results').insert(initial_predictions).execute()
    
    print("Berhasil insert hasil AI awal.")
    print("Selesai!")

if __name__ == '__main__':
    generate_dummy_data()
