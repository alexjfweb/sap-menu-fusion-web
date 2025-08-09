#!/usr/bin/env bash
set -euo pipefail

# Pre-requisitos:
#  - Supabase CLI instalado: https://supabase.com/docs/guides/cli
#  - Variable DATABASE_URL si quieres usar dump remoto (opcional)
#  - Proyecto linkeado: supabase link --project-ref hlbbaaewjebasisxgnrt

DATE=$(date +%F_%H%M%S)
mkdir -p backups

# Opción A: usar el dashboard de Supabase para crear un backup (recomendado).
echo "Recuerda: también puedes crear un backup desde el dashboard (Database > Backups)."

# Opción B: dump con CLI y URL remota (ajusta DATABASE_URL si corresponde)
if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "Haciendo dump de la base de datos a backups/backup-${DATE}.sql"
  supabase db dump --db-url "$DATABASE_URL" --schema public -f "backups/backup-${DATE}.sql"
else
  echo "DATABASE_URL no está definido. Omite dump CLI o expórtalo antes de ejecutar."
fi

echo "Backup finalizado."
