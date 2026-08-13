@echo off
title Ogut-POS Launcher
echo =======================================================
echo         MEMULAI APLIKASI OGUT-POS (FULLSTACK)
echo =======================================================
echo.

echo [1/2] Menjalankan Backend Server (Uvicorn) di jendela baru...
start "Ogut-POS Backend (Uvicorn)" cmd /k "cd backend-pos && .\venv\Scripts\python.exe -m uvicorn asgi:asgi_app --host 0.0.0.0 --port 5000 --log-level info"

echo.
echo [2/2] Menjalankan Frontend Web (Vite) di jendela baru...
start "Ogut-POS Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo =======================================================
echo  Layanan sedang dijalankan di jendela terpisah!
echo  - Backend: http://localhost:5000
echo  - Frontend: http://localhost:5173 (cek port di jendela Vite)
echo =======================================================
echo.
echo Anda dapat menutup jendela launcher ini.
echo.
timeout /t 5
