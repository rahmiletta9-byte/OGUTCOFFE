import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from config.supabase_client import db

LAST_AI_THOUGHTS = {}

def run_kmeans():
    print("[AI JOB] Memulai K-Means Clustering...")
    try:
        # 1. Ekstraksi Data (ETL) dari Supabase
        response = db.table('transaction_items').select('product_id, quantity, profit_margin').execute()
        data = response.data

        if not data or len(data) < 5:
            print("[AI JOB] Data transaksi belum cukup untuk K-Means.")
            return

        df = pd.DataFrame(data)

        # Agregasi data (Total volume & Total margin per produk)
        agg_df = df.groupby('product_id').agg(
            volume=('quantity', 'sum'),
            margin=('profit_margin', 'sum')
        ).reset_index()

        n_unique_products = len(agg_df)
        if n_unique_products < 2:
            print("[AI JOB] Hanya ada 1 produk unik terjual, clustering tidak bisa dilakukan.")
            return

        # Tentukan jumlah cluster dinamis (maksimal 3, atau sejumlah produk unik)
        n_clusters = min(3, n_unique_products)

        # 2. Transformasi & Normalisasi Data
        scaler = MinMaxScaler()
        agg_df[['vol_scaled', 'margin_scaled']] = scaler.fit_transform(agg_df[['volume', 'margin']])

        # 3. Training Model K-Means
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        agg_df['cluster'] = kmeans.fit_predict(agg_df[['vol_scaled', 'margin_scaled']])

        # Evaluasi Kualitas Cluster (Hanya bisa jika n_clusters > 1 dan produk > n_clusters)
        if n_clusters > 1 and n_unique_products > n_clusters:
            score = silhouette_score(agg_df[['vol_scaled', 'margin_scaled']], agg_df['cluster'])
        else:
            score = 0.0

        # 4. Melabeli Cluster (Logika Bisnis)
        # (Cluster dengan total volume & margin tertinggi = Laris & Untung Besar)
        cluster_centers = agg_df.groupby('cluster')[['vol_scaled', 'margin_scaled']].mean().sum(axis=1)
        best_cluster = cluster_centers.idxmax()
        worst_cluster = cluster_centers.idxmin()

        # Rekap Pemikiran AI untuk XAI
        global LAST_AI_THOUGHTS
        centroids = kmeans.cluster_centers_
        LAST_AI_THOUGHTS['kmeans'] = {
            "alasan": f"AI menemukan {n_clusters} titik pusat. Cluster Terbaik berada di koordinat Volume={centroids[best_cluster][0]:.2f} dan Margin={centroids[best_cluster][1]:.2f}",
            "silhouette": round(score, 2)
        }

        def get_label(c):
            if c == best_cluster: 
                return 'Laris & Untung Besar'
            elif c == worst_cluster: 
                return 'Kurang Laris'
            else: 
                return 'Menengah'

        agg_df['label'] = agg_df['cluster'].apply(get_label)

        # 5. Load (Simpan kembali ke Supabase)
        # Kosongkan hasil evaluasi lama
        db.table('ai_cluster_results').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        
        # Insert hasil baru
        insert_data = []
        for _, row in agg_df.iterrows():
            insert_data.append({
                "product_id": row['product_id'],
                "cluster_label": row['label'],
                "silhouette_score": float(round(score, 2))
            })

        db.table('ai_cluster_results').insert(insert_data).execute()
        print(f"[AI JOB] K-Means selesai ({n_clusters} clusters). Silhouette Score: {score:.2f}")

    except Exception as e:
        print(f"[AI JOB] Error K-Means: {e}")
