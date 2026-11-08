@echo off
cd /d "%~dp0"
echo Iniciando el prototipo de Anemona Design Studio...
start "" http://localhost:8000
python servidor\servidor.py
if errorlevel 1 py servidor\servidor.py
pause
