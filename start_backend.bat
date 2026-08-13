@echo off
title Ogut-POS Backend Server (Uvicorn)
echo =======================================================
echo     MEMULAI OGUT-POS BACKEND DENGAN UVICORN (ASGI)
echo =======================================================
echo.
cd backend-pos
echo Mengaktifkan Virtual Environment...
call .\venv\Scripts\activate.bat
echo.
echo Menjalankan Uvicorn server pada http://localhost:5000...
echo Tekan Ctrl+C untuk menghentikan server.
echo.
python -m uvicorn asgi:asgi_app --host 0.0.0.0 --port 5000 --log-level info
pause
