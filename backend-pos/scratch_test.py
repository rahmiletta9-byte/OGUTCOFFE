import requests

# Test POST N-Gram Increment
print("Testing POST /api/ngram/increment...")
res = requests.post("http://127.0.0.1:5000/api/ngram/increment", json={"items": ["Americano", "Kentang Goreng"]})
print("Response:", res.status_code, res.json())

from app import run_nightly_ai_jobs
print("\nMenjalankan AI Jobs secara manual...")
run_nightly_ai_jobs()
print("Selesai menguji AI.")
