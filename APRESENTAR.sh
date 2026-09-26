#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "Dependencias nao encontradas. Instalando..."
  npm install --no-audit --no-fund
fi

echo "Iniciando Tech-Game na porta 5173..."
npm start
