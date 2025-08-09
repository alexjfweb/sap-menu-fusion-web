#!/usr/bin/env bash
set -euo pipefail

# Desplegar Edge Functions a Supabase
# Pre-requisitos: supabase login, supabase link --project-ref hlbbaaewjebasisxgnrt

supabase functions deploy create-mercadopago-preference
supabase functions deploy mercadopago-webhook
supabase functions deploy create-employee
supabase functions deploy bulk-product-operations

echo "Funciones desplegadas."
