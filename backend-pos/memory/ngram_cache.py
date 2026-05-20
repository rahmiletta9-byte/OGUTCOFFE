from config.supabase_client import db

# Ini adalah memori RAM utama kita (Dictionary)
# Format: {"Kopi Susu Gula Aren": 150, "Kentang Goreng": 85}
NGRAM_DATA = {}

def load_initial_data():
    """Menarik daftar menu dasar dari Supabase saat server pertama kali menyala."""
    global NGRAM_DATA
    print("Memuat data awal N-Gram dari Supabase...")
    try:
        response = db.table('products').select('name').execute()
        products = response.data
        for p in products:
            name = p.get('name')
            if name and name not in NGRAM_DATA:
                # Beri skor 0 sebagai awalan jika belum ada
                NGRAM_DATA[name] = 0
        print(f"Berhasil memuat {len(NGRAM_DATA)} menu ke dalam RAM.")
    except Exception as e:
        print("Gagal memuat data awal N-Gram:", e)

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

def get_memory_stats():
    """Mengembalikan isi RAM saat ini untuk dipantau Admin"""
    global NGRAM_DATA
    # Urutkan dari yang paling sering diketik
    sorted_data = dict(sorted(NGRAM_DATA.items(), key=lambda item: item[1], reverse=True))
    return {
        "total_items": len(NGRAM_DATA),
        "data": sorted_data
    }
