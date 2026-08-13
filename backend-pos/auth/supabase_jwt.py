import os
import jwt
import logging

logger = logging.getLogger("auth.supabase_jwt")

# Supabase JWT Secret digunakan untuk memverifikasi token secara simetris
# Biasanya merupakan string JWT Secret dari dashboard Supabase
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

def decode_supabase_jwt(token: str) -> dict:
    """
    Mendecode dan memvalidasi JWT token yang diberikan oleh Supabase Auth.
    Mendukung HS256 (menggunakan SUPABASE_JWT_SECRET).
    """
    if not SUPABASE_JWT_SECRET:
        logger.error("SUPABASE_JWT_SECRET tidak diset di environment variables!")
        raise ValueError("Konfigurasi server tidak lengkap: SUPABASE_JWT_SECRET belum diset.")
        
    try:
        # Supabase default jwt audience adalah 'authenticated'
        # Namun bisa juga 'anon' untuk public access. Kita harapkan 'authenticated'.
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False} # Matikan verifikasi aud jika audience bervariasi, atau set manual
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token JWT telah kedaluwarsa.")
        raise
    except jwt.InvalidTokenError as e:
        logger.warning(f"Token JWT tidak valid: {str(e)}")
        raise
