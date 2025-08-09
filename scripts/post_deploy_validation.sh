#!/usr/bin/env bash
set -euo pipefail

# Validaciones simples post-despliegue
PROJECT_REF=hlbbaaewjebasisxgnrt
BASE_URL="https://${PROJECT_REF}.supabase.co/functions/v1"

# 1) Ping al webhook de Mercado Pago (espera 'ok')
echo "Ping webhook Mercado Pago..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"TEST_ID"}}' \
  "$BASE_URL/mercadopago-webhook")

echo "Código HTTP: ${HTTP_CODE} (200 esperado)"

# 2) Recordatorio ver transacciones desde el Dashboard
cat <<EOF
Ahora verifica en el Dashboard de Supabase la tabla 'transactions' para confirmar actualizaciones del estado.
SQL sugerido:
  SELECT id, status, metadata->>'external_reference' AS ref, created_at
  FROM transactions
  ORDER BY created_at DESC
  LIMIT 20;
EOF
