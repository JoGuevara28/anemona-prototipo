#!/usr/bin/env sh
# Inicia el prototipo de Anémona Design Studio en http://localhost:8000
cd "$(dirname "$0")"
( sleep 1.5; (open http://localhost:8000 || xdg-open http://localhost:8000) >/dev/null 2>&1 ) &
python3 servidor/servidor.py "$@"
