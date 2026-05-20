from flask import Blueprint, request, jsonify
from memory.ngram_cache import get_suggestions, increment_frequency

# Membuat Blueprint untuk grup API
api_bp = Blueprint('api', __name__)

@api_bp.route('/api/suggest', methods=['GET'])
def suggest():
    """
    Endpoint untuk mencari menu. 
    Contoh akses: GET /api/suggest?q=kopi
    """
    query = request.args.get('q', '')

    # Memanggil fungsi di memori RAM
    results = get_suggestions(query)

    # Mengembalikan hasil ke React dalam bentuk Array JSON
    return jsonify(results), 200

@api_bp.route('/api/ngram/increment', methods=['POST'])
def increment():
    """
    Endpoint untuk menambah skor (dipanggil diam-diam setelah Checkout).
    Contoh Body: { "items": ["Kopi Susu Gula Aren"] }
    """
    data = request.get_json()

    if not data or 'items' not in data:
        return jsonify({"error": "Format data salah"}), 400

    items = data.get('items', [])

    # Memanggil fungsi penambahan skor di RAM
    increment_frequency(items)

    return jsonify({"status": "success", "message": "N-Gram berhasil diperbarui"}), 200
