import json
import os
from config.supabase_client import db

# Ini adalah memori RAM utama kita (Dictionary)
# Format: {"Kopi Susu Gula Aren": 150, "Kentang Goreng": 85}
NGRAM_DATA = {}
BACKUP_FILE = 'ngram_backup.json'

def save_ngram_to_file():
    """Menyimpan data N-Gram dari RAM ke file JSON lokal."""
    global NGRAM_DATA
    try:
        with open(BACKUP_FILE, 'w', encoding='utf-8') as f:
            json.dump(NGRAM_DATA, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("Gagal menyimpan backup N-Gram:", e)

def load_initial_data():
    """Memuat data N-Gram dari backup file lokal dan menggabungkan dengan produk dari Supabase."""
    global NGRAM_DATA
    
    # 1. Coba muat dari file backup lokal
    if os.path.exists(BACKUP_FILE):
        print(f"Memuat data N-Gram dari file backup {BACKUP_FILE}...")
        try:
            with open(BACKUP_FILE, 'r', encoding='utf-8') as f:
                NGRAM_DATA = json.load(f)
            print(f"Berhasil memuat {len(NGRAM_DATA)} data dari backup.")
        except Exception as e:
            print("Gagal membaca file backup N-Gram, memulai dengan data kosong:", e)
            NGRAM_DATA = {}
            
    # 2. Sinkronkan dengan menu dasar dari Supabase
    print("Mensinkronkan data N-Gram dengan menu dasar dari Supabase...")
    try:
        response = db.table('products').select('name').execute()
        products = response.data
        for p in products:
            name = p.get('name')
            if name and name not in NGRAM_DATA:
                # Beri skor 0 sebagai awalan jika belum ada
                NGRAM_DATA[name] = 0
        print(f"Sinkronisasi selesai. Total menu dalam RAM: {len(NGRAM_DATA)}.")
        save_ngram_to_file()
    except Exception as e:
        print("Gagal sinkronisasi data awal N-Gram dengan Supabase:", e)

def get_suggestions(query):
    """Mencari menu berdasarkan kata kunci dan mengurutkannya berdasarkan skor tertinggi."""
    if not query:
        return []

    query_lower = query.lower()
    results = []

    # Cari kecocokan substring
    for name, score in NGRAM_DATA.items():
        if query_lower in name.lower():
            results.append({"name": name, "score": score})

    # Urutkan dari skor tertinggi ke terendah
    results.sort(key=lambda x: x['score'], reverse=True)

    # Kembalikan hanya 5 nama teratas (buang skornya, cukup namanya saja untuk React)
    return [item['name'] for item in results[:5]]

def increment_frequency(items_list):
    """Menambah skor menu saat transaksi terjadi (Fire-and-forget)."""
    global NGRAM_DATA
    for item in items_list:
        if item in NGRAM_DATA:
            NGRAM_DATA[item] += 1
        else:
            NGRAM_DATA[item] = 1
            
    # Simpan hasil perubahan skor ke file lokal
    save_ngram_to_file()

def get_memory_stats():
    """Mengembalikan isi RAM saat ini untuk dipantau Admin"""
    global NGRAM_DATA
    # Urutkan dari yang paling sering diketik
    sorted_data = dict(sorted(NGRAM_DATA.items(), key=lambda item: item[1], reverse=True))
    return {
        "total_items": len(NGRAM_DATA),
        "data": sorted_data
    }
