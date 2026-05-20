from flask import Flask, jsonify, render_template, request, redirect, session, url_for
from flask_cors import CORS
import atexit
import json
from functools import wraps

# Import rute, cache, dan modul AI
from api.routes import api_bp
from memory.ngram_cache import load_initial_data, get_memory_stats
from ai_services.kmeans_clustering import run_kmeans, LAST_AI_THOUGHTS
from ai_services.linear_regression import run_regression

# Import Scheduler
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)
app.secret_key = 'kunci_rahasia_sesi_flask_yang_sangat_panjang'
CORS(app)

# Memuat Kredensial dari JSON
with open('config.json') as f:
    admin_config = json.load(f)

# Dekorator untuk Melindungi Rute Admin
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

# Rute Utama (Redirect ke Login)
@app.route('/')
def index():
    return redirect(url_for('admin_login'))

# Rute Login
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if username == admin_config['admin_username'] and password == admin_config['admin_password']:
            session['logged_in'] = True
            return redirect(url_for('admin_dashboard'))
        else:
            return render_template('login.html', error="Username atau Password salah!")

    return render_template('login.html')

# Rute Logout
@app.route('/admin/logout')
def admin_logout():
    session.pop('logged_in', None)
    return redirect(url_for('admin_login'))

@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    # Mengambil status jadwal dari scheduler
    # We will initialize scheduler in global scope to access it here
    global scheduler
    jobs = scheduler.get_jobs() if 'scheduler' in globals() else []
    next_run = jobs[0].next_run_time.strftime("%Y-%m-%d %H:%M:%S") if jobs else "Tidak ada jadwal"

    return render_template('dashboard.html', 
                           server_status="Aktif (Online)", 
                           next_run_time=next_run)

@app.route('/admin/force-run-ai', methods=['POST'])
@login_required
def force_run_ai():
    run_nightly_ai_jobs()
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/ngram')
@login_required
def admin_ngram():
    stats = get_memory_stats()
    return render_template('ngram_view.html', stats=stats)

@app.route('/admin/ai-reasoning')
@login_required
def admin_ai_reasoning():
    return render_template('ai_reasoning.html', thoughts=LAST_AI_THOUGHTS)

# Mendaftarkan API
app.register_blueprint(api_bp)
# Fungsi pembungkus untuk menjalankan semua Job AI
def run_nightly_ai_jobs():
    print("\n--- MEMULAI BATCH PROCESSING AI MALAM HARI ---")
    run_kmeans()
    run_regression()
    print("--- BATCH PROCESSING SELESAI ---\n")

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "active"}), 200

if __name__ == '__main__':
    # 1. Muat data N-Gram ke RAM (Hanya jalan sekali saat server menyala)
    load_initial_data()

    # 2. Konfigurasi dan Nyalakan Scheduler
    scheduler = BackgroundScheduler()
    # Jadwalkan fungsi AI jalan setiap hari pukul 23:59
    scheduler.add_job(func=run_nightly_ai_jobs, trigger="cron", hour=23, minute=59)
    scheduler.start()

    # Pastikan scheduler dimatikan dengan aman saat server dihentikan paksa (Ctrl+C)
    atexit.register(lambda: scheduler.shutdown())

    # 3. Nyalakan server Flask
    print("Server Flask berjalan. Menunggu API Call dan Jadwal AI...")
    app.run(host='0.0.0.0', port=5000, debug=False)   
    # Note: Set debug=False saat menggunakan Scheduler agar job tidak jalan 2x (dobel) karena auto-reload.
