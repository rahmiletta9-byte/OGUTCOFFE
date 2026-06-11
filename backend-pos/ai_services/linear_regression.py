import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_percentage_error
from config.supabase_client import db

def run_regression():
    print("[AI JOB] Memulai Prediksi Stok (Regresi Linier) berdasarkan Tingkat Konsumsi...")
    try:
        # 1. Ekstraksi Log Inventaris (Minimal butuh data 5 hari ke belakang per bahan baku)
        response = db.table('inventory_logs').select('*').order('date', desc=False).execute()
        data = response.data

        if not data:
            print("[AI JOB] Data inventory_logs kosong.")
            return

        df = pd.DataFrame(data)

        # Bersihkan data prediksi lama
        db.table('ai_prediction_results').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()

        insert_data = []

        # 2. Proses Model untuk SETIAP Bahan Baku (material_id) secara terpisah
        materials = df['material_id'].unique()

        for mat_id in materials:
            mat_df = df[df['material_id'] == mat_id].copy()

            if len(mat_df) < 5:
                continue # Lewati jika histori kurang dari 5 hari

            # X = Indeks Waktu berurutan (1, 2, 3...)
            X = np.array(range(1, len(mat_df) + 1)).reshape(-1, 1)
            # y = Tingkat Pemakaian/Konsumsi (stock_used)
            y = mat_df['stock_used'].values

            # 3. Training Model AI untuk mencari tren konsumsi
            model = LinearRegression()
            model.fit(X, y)

            # Menghitung MAPE secara akurat dengan menyaring y == 0 (menghindari pembagian nol)
            y_pred_train = model.predict(X)
            mask = y > 0
            if mask.sum() > 0:
                mape = mean_absolute_percentage_error(y[mask], y_pred_train[mask]) * 100
            else:
                mape = 0.0

            # 4. Prediksi KONSUMSI 7 Hari ke Depan
            future_days = np.array(range(len(mat_df) + 1, len(mat_df) + 8)).reshape(-1, 1)
            predictions = model.predict(future_days)
            
            # Jangan biarkan prediksi konsumsi minus (minimal 0)
            predictions = np.maximum(predictions, 0)
            
            # Total pemakaian selama 7 hari ke depan
            total_predicted_usage = np.sum(predictions)

            # Ambil stok aktual terakhir
            last_actual_stock = float(mat_df.iloc[-1]['end_of_day_stock'])
            
            # Sisa Stok 7 Hari = Stok Terakhir - Total Prediksi Pemakaian
            # Nilai BISA NEGATIF (minus) sebagai indikator "Kurang Berapa"
            predicted_stock_7d = last_actual_stock - total_predicted_usage

            # 5. Siapkan data untuk disimpan
            insert_data.append({
                "material_id": mat_id,
                "predicted_stock": float(round(predicted_stock_7d, 2)),
                "mape_score": float(round(mape, 2))
            })

        # Simpan Hasil Prediksi
        if insert_data:
            db.table('ai_prediction_results').insert(insert_data).execute()
            print(f"[AI JOB] Regresi Linier selesai untuk {len(insert_data)} bahan baku.")

    except Exception as e:
        print(f"[AI JOB] Error Regresi Linier: {e}")

