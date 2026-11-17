#!/bin/bash
# Doble clic en Finder: inicia el prototipo de Anémona Design Studio y abre el navegador.
cd "$(dirname "$0")"
if ! command -v python3 >/dev/null 2>&1; then
  echo "No se encontró python3. Instálelo desde https://www.python.org/downloads/ y vuelva a intentar."
  read -n 1 -s -r -p "Presione una tecla para cerrar…"; exit 1
fi
( sleep 1.5; open http://localhost:8000 ) &
python3 servidor/servidor.py "$@"
