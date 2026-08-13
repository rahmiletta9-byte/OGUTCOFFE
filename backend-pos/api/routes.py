from flask import Blueprint, request, jsonify
import os
import logging
from functools import wraps
from memory.ngram_cache import get_suggestions, increment_frequency
from auth import jwt_required, role_required

# Logger Setup
logger = logging.getLogger("api")

# Membuat Blueprint untuk grup API
api_bp = Blueprint('api', __name__)

@api_bp.route('/api/suggest', methods=['GET'])
@jwt_required
@role_required(['kasir', 'admin'])
def suggest():
    """
    Endpoint untuk mencari menu. 
    Contoh akses: GET /api/suggest?q=kopi
    """
    query = request.args.get('q', '')
    logger.info(f"Suggest request query: '{query}'")

    # Memanggil fungsi di memori RAM
    results = get_suggestions(query)
    logger.info(f"Suggest results for '{query}': {results}")

    # Mengembalikan hasil ke React dalam bentuk Array JSON
    return jsonify(results), 200

@api_bp.route('/api/ngram/increment', methods=['POST'])
@jwt_required
@role_required(['kasir', 'admin'])
def increment():
    """
    Endpoint untuk menambah skor (dipanggil diam-diam setelah Checkout).
    Contoh Body: { "items": ["Kopi Susu Gula Aren"] }
    """
    data = request.get_json()
    logger.info(f"Increment N-Gram request payload: {data}")

    if not data or 'items' not in data:
        logger.warning(f"Invalid Increment N-Gram request format: {data}")
        return jsonify({"error": "Format data salah"}), 400

    items = data.get('items', [])

    # Memanggil fungsi penambahan skor di RAM
    increment_frequency(items)
    logger.info(f"N-Gram scores incremented for: {items}")

    return jsonify({"status": "success", "message": "N-Gram berhasil diperbarui"}), 200

@api_bp.route('/api/admin/create-user', methods=['POST'])
@jwt_required
@role_required(['admin'])
def admin_create_user():
    """
    Endpoint untuk membuat user baru (staf/kasir) dengan service_role key.
    Menghindari terputusnya session admin di frontend.
    """
    from config.supabase_client import db
    
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data or 'role' not in data:
        return jsonify({"error": "Format data salah. Harus berisi email, password, dan role"}), 400
        
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    
    try:
        # 1. Buat user di Supabase Auth
        auth_response = db.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True
        })
        
        # UserResponse berisi data user
        user_id = auth_response.user.id
        
        # 2. Masukkan role ke tabel user_roles
        db.table('user_roles').insert([
            {"user_id": user_id, "role": role}
        ]).execute()
        
        return jsonify({
            "status": "success",
            "message": "User berhasil dibuat",
            "user": {
                "id": user_id,
                "email": email,
                "role": role
            }
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


