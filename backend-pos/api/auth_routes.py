from flask import Blueprint, request, jsonify, g
import logging
from config.supabase_client import db
from auth import jwt_required

logger = logging.getLogger("api.auth_routes")

auth_bp = Blueprint('auth_api', __name__)

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    """
    Endpoint login terpusat.
    Menerima body: { "email": "user@example.com", "password": "password123" }
    Mengembalikan: { "access_token", "refresh_token", "user": { "id", "email", "user_metadata" }, "role": "admin"|"kasir"|"manajemen_bahan" }
    """
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"error": "Email dan password wajib diisi."}), 400

    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"error": "Email dan password tidak boleh kosong."}), 400

    try:
        logger.info(f"Proses login untuk email: {email}")
        
        # 1. Sign in via Supabase Auth
        auth_res = db.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        if not auth_res or not auth_res.user or not auth_res.session:
            return jsonify({"error": "Autentikasi gagal. Kredensial tidak valid."}), 401

        user = auth_res.user
        session = auth_res.session
        user_id = user.id

        # 2. Ambil role dari tabel user_roles
        role_res = db.table('user_roles').select('role').eq('user_id', user_id).single().execute()
        
        if not role_res.data or not role_res.data.get('role'):
            logger.warning(f"User {email} berhasil login tetapi tidak memiliki role di tabel user_roles.")
            return jsonify({"error": "Akun Anda tidak memiliki role terdaftar. Silakan hubungi Administrator IT."}), 403

        role = role_res.data.get('role')
        logger.info(f"User {email} berhasil login dengan role: {role}")

        return jsonify({
            "status": "success",
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "user_metadata": user.user_metadata or {}
            },
            "role": role
        }), 200

    except Exception as e:
        err_msg = str(e)
        logger.error(f"Error during login for {email}: {err_msg}", exc_info=True)
        if "Invalid login credentials" in err_msg or "invalid_credentials" in err_msg:
            return jsonify({"error": "Email atau kata sandi salah."}), 401
        elif "Email not confirmed" in err_msg:
            return jsonify({"error": "Email belum dikonfirmasi."}), 401
        return jsonify({"error": f"Login gagal: {err_msg}"}), 400


@auth_bp.route('/api/auth/me', methods=['GET'])
@jwt_required
def me():
    """
    Endpoint untuk validasi token dan mendapatkan info user + role saat reload halaman.
    Header: Authorization: Bearer <token>
    """
    try:
        user_id = g.current_user.get('sub')
        email = g.current_user.get('email')

        # 1. Ambil data user dari Supabase Admin
        user_res = db.auth.admin.get_user_by_id(user_id)
        user_obj = user_res.user if user_res else None

        # 2. Ambil role dari user_roles
        role_res = db.table('user_roles').select('role').eq('user_id', user_id).single().execute()
        role = role_res.data.get('role') if (role_res.data and 'role' in role_res.data) else None

        if not role:
            return jsonify({"error": "Role pengguna tidak ditemukan"}), 403

        user_metadata = user_obj.user_metadata if user_obj and hasattr(user_obj, 'user_metadata') else g.current_user.get('user_metadata', {})

        return jsonify({
            "status": "success",
            "user": {
                "id": user_id,
                "email": email or (user_obj.email if user_obj else ""),
                "user_metadata": user_metadata or {}
            },
            "role": role
        }), 200

    except Exception as e:
        logger.error(f"Error in /api/auth/me: {str(e)}", exc_info=True)
        return jsonify({"error": f"Gagal memverifikasi user: {str(e)}"}), 500


@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    """
    Endpoint logout (stateless acknowledgment).
    """
    return jsonify({"status": "success", "message": "Logout berhasil"}), 200


@auth_bp.route('/api/auth/update-profile', methods=['PUT'])
@jwt_required
def update_profile():
    """
    Endpoint untuk memperbarui user metadata (display_name).
    Body: { "display_name": "Nama Baru" }
    """
    data = request.get_json()
    if not data or 'display_name' not in data:
        return jsonify({"error": "Display name diperlukan."}), 400

    display_name = data.get('display_name', '').strip()
    user_id = g.current_user.get('sub')

    try:
        db.auth.admin.update_user_by_id(user_id, {
            "user_metadata": { "display_name": display_name }
        })
        logger.info(f"User {user_id} berhasil memperbarui display_name menjadi: {display_name}")

        return jsonify({
            "status": "success",
            "message": "Profil berhasil diperbarui",
            "display_name": display_name
        }), 200

    except Exception as e:
        logger.error(f"Error updating profile for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({"error": f"Gagal memperbarui profil: {str(e)}"}), 500


@auth_bp.route('/api/auth/update-password', methods=['PUT'])
@jwt_required
def update_password():
    """
    Endpoint untuk memperbarui password user.
    Body: { "password": "newpassword123" }
    """
    data = request.get_json()
    if not data or 'password' not in data:
        return jsonify({"error": "Password baru diperlukan."}), 400

    new_password = data.get('password', '')
    if len(new_password) < 6:
        return jsonify({"error": "Password minimal 6 karakter."}), 400

    user_id = g.current_user.get('sub')

    try:
        db.auth.admin.update_user_by_id(user_id, {
            "password": new_password
        })
        logger.info(f"User {user_id} berhasil memperbarui password.")

        return jsonify({
            "status": "success",
            "message": "Kata sandi berhasil diperbarui."
        }), 200

    except Exception as e:
        logger.error(f"Error updating password for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({"error": f"Gagal memperbarui kata sandi: {str(e)}"}), 500


@auth_bp.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    """
    Endpoint untuk mengirim email instruksi reset password via Supabase Auth.
    Menerima body: { "email": "user@example.com" }
    """
    data = request.get_json()
    if not data or 'email' not in data:
        logger.warning("Reset password request missing email field.")
        return jsonify({"error": "Format data salah. Alamat email diperlukan."}), 400
        
    email = data.get('email', '').strip()
    if not email:
        return jsonify({"error": "Alamat email tidak boleh kosong."}), 400
        
    try:
        logger.info(f"Initiating password reset request for email: {email}")
        db.auth.reset_password_for_email(email)
        logger.info(f"Password reset email sent successfully to {email}")
        return jsonify({
            "status": "success",
            "message": "Email instruksi reset password telah dikirim. Silakan periksa inbox atau spam email Anda."
        }), 200
        
    except Exception as e:
        logger.error(f"Error resetting password for {email}: {str(e)}", exc_info=True)
        return jsonify({
            "status": "success",
            "message": "Email instruksi reset password telah dikirim jika alamat email terdaftar."
        }), 200
