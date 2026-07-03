import requests
import os
from dotenv import load_dotenv

# Load variables
load_dotenv('../frontend/.env.local')

URL = os.environ.get("VITE_SUPABASE_URL")
KEY = os.environ.get("VITE_SUPABASE_ANON_KEY")

headers = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json"
}

def test_rpc(rpc_name, payload=None):
    endpoint = f"{URL}/rest/v1/rpc/{rpc_name}"
    print(f"Testing POST {endpoint}...")
    try:
        if payload:
            res = requests.post(endpoint, json=payload, headers=headers)
        else:
            res = requests.post(endpoint, json={}, headers=headers)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
    except Exception as e:
        print(f"Failed: {e}")
    print("-" * 50)

if __name__ == "__main__":
    print("=== VERIFIKASI KEAMANAN RPC ANONYMOUS ===")
    test_rpc("get_user_profiles")
    test_rpc("get_activity_logs")
    test_rpc("get_activity_logs_paginated", {"p_page": 1, "p_page_size": 10})
    test_rpc("get_order_history")
    test_rpc("get_products_with_stock")
    test_rpc("process_checkout", {
        "p_items": [],
        "p_total": 0,
        "p_payment": "Cash"
    })
