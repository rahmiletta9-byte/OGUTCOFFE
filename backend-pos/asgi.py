from a2wsgi import WSGIMiddleware
from app import app

# Membungkus aplikasi Flask (WSGI) menjadi aplikasi ASGI
# Hal ini memungkinkan Flask dijalankan secara native menggunakan Uvicorn
asgi_app = WSGIMiddleware(app)

if __name__ == '__main__':
    import uvicorn
    # Menjalankan uvicorn secara langsung jika file ini dieksekusi
    uvicorn.run("asgi:asgi_app", host="0.0.0.0", port=5000, log_level="info")
