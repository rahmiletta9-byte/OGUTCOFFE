from functools import wraps
from flask import request, jsonify, g
import logging
from auth.supabase_jwt import decode_supabase_jwt
from config.supabase_client import db
import jwt

logger = logging.getLogger("auth.decorators")

def jwt_required(f):
    """
    Decorator untuk memastikan request menyertakan token JWT Supabase yang valid.
    Token harus diletakkan di header Authorization: Bearer <token>.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            logger.warning(f"Unauthorized access: Header Authorization tidak ditemukan. IP: {request.remote_addr}")
            return jsonify({"error": "Unauthorized: Token tidak ditemukan"}), 401
            
        try:
            # Format header harus 'Bearer <token>'
            parts = auth_header.split()
            if len(parts) != 2 or parts[0].lower() != "bearer":
                logger.warning(f"Unauthorized access: Format header Authorization tidak valid. IP: {request.remote_addr}")
                return jsonify({"error": "Unauthorized: Format token tidak valid (harus Bearer <token>)"}), 401
                
            token = parts[1]
            # Decode token
            payload = decode_supabase_jwt(token)
            
            # Simpan payload user ke Flask global context 'g'
            g.current_user = payload
            logger.info(f"JWT validated successfully for user: {payload.get('email')} (ID: {payload.get('sub')})")
            
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Unauthorized: Token telah kedaluwarsa"}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({"error": f"Unauthorized: Token tidak valid ({str(e)})"}), 401
        except Exception as e:
            logger.error(f"Error validating JWT: {str(e)}", exc_info=True)
            return jsonify({"error": f"Internal Server Error saat memproses autentikasi"}), 500
            
        return f(*args, **kwargs)
    return decorated

def role_required(allowed_roles):
    """
    Decorator untuk memastikan user yang terautentikasi memiliki salah satu dari allowed_roles.
    Harus digunakan SETELAH @jwt_required karena bergantung pada g.current_user.
    """
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]
        
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Pastikan g.current_user sudah di-set oleh @jwt_required
            if not hasattr(g, "current_user") or not g.current_user:
                logger.error("role_required digunakan tanpa @jwt_required!")
                return jsonify({"error": "Unauthorized: Autentikasi diperlukan"}), 401
                
            user_id = g.current_user.get("sub") # 'sub' di JWT Supabase adalah user ID
            email = g.current_user.get("email")
            
            try:
                # Query tabel user_roles di Supabase
                res = db.table("user_roles").select("role").eq("user_id", user_id).single().execute()
                
                if not res.data or "role" not in res.data:
                    logger.warning(f"Forbidden access: User {email} tidak memiliki role terdaftar.")
                    return jsonify({"error": "Forbidden: Hak akses tidak ditemukan"}), 403
                    
                user_role = res.data["role"]
                
                if user_role not in allowed_roles:
                    logger.warning(f"Forbidden access: User {email} dengan role '{user_role}' mencoba mengakses resource yang dibatasi ({allowed_roles}).")
                    return jsonify({"error": f"Forbidden: Role '{user_role}' tidak diizinkan mengakses resource ini"}), 403
                
                # Simpan role di g context jika rute membutuhkannya
                g.current_user_role = user_role
                
            except Exception as e:
                logger.error(f"Error checking user role for user {email}: {str(e)}", exc_info=True)
                return jsonify({"error": "Internal Server Error saat memverifikasi hak akses"}), 500
                
            return f(*args, **kwargs)
        return decorated
    return decorator
