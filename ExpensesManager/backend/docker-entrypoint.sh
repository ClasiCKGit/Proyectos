#!/bin/sh
# backend/docker-entrypoint.sh
# Espera a que MySQL esté listo, corre las migraciones y arranca el servidor.

set -e

echo "⏳ Esperando a MySQL..."

until npx prisma db push --skip-generate 2>/dev/null; do
  echo "   MySQL no está listo todavía — reintentando en 3s..."
  sleep 3
done

echo "✅ Base de datos lista"
echo "🚀 Iniciando servidor..."

exec node dist/index.js
