import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from supabase import create_client, Client

# Memuat variabel dari file .env
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise EnvironmentError(
        "SUPABASE_URL dan SUPABASE_KEY harus diisi di file .env!"
    )

# Membuat instance Supabase Client yang akan di-import oleh file lain
db: Client = create_client(url, key)

