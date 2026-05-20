import requests
import os
from dotenv import load_dotenv

# Load from frontend env
load_dotenv('../frontend/.env.local')

URL = os.environ.get("VITE_SUPABASE_URL")
KEY = os.environ.get("VITE_SUPABASE_ANON_KEY")

def test_anon_read():
    user_id = '7d86fd4a-a8c4-4743-9a83-4062b024f616' # admin@ogut.com
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Accept": "application/vnd.pgrst.object+json"
    }
    
    endpoint = f"{URL}/rest/v1/user_roles?select=role&user_id=eq.{user_id}"
    print(f"Testing GET {endpoint}")
    
    res = requests.get(endpoint, headers=headers)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")

if __name__ == "__main__":
    test_anon_read()
