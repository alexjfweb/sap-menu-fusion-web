-- Paso 1: Arreglar política RLS para que usuarios autenticados puedan ver métodos de pago activos
DROP POLICY IF EXISTS "payment_methods_select_active" ON payment_methods;

CREATE POLICY "Users can view active payment methods" 
ON payment_methods 
FOR SELECT 
USING (is_active = true);

-- Paso 2: Limpiar registros duplicados e inválidos de payment_methods
-- Eliminar el registro duplicado de Mercado Pago (mantener el más reciente)
DELETE FROM payment_methods 
WHERE type = 'mercado_pago' 
AND id != (
  SELECT id 
  FROM payment_methods 
  WHERE type = 'mercado_pago' 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Desactivar Stripe que tiene configuración inválida
UPDATE payment_methods 
SET is_active = false 
WHERE type = 'stripe' 
AND (configuration->>'publishable_key' IS NULL OR configuration->>'publishable_key' = '');

-- Desactivar Nequi que tiene configuración inválida
UPDATE payment_methods 
SET is_active = false 
WHERE type = 'nequi' 
AND (configuration->>'api_key' IS NULL OR configuration->>'api_key' = '');

-- Paso 3: Asegurar que Mercado Pago tenga configuración válida
-- Actualizar el registro de Mercado Pago para tener claves de ejemplo válidas (para testing)
UPDATE payment_methods 
SET configuration = jsonb_build_object(
  'public_key', 'TEST-your-public-key-here',
  'private_key', 'TEST-your-access-token-here'
)
WHERE type = 'mercado_pago' 
AND is_active = true
AND (
  configuration->>'public_key' IS NULL 
  OR configuration->>'private_key' IS NULL
  OR configuration->>'public_key' = ''
  OR configuration->>'private_key' = ''
);

-- Paso 4: Asegurar que Bancolombia tenga configuración válida
UPDATE payment_methods 
SET configuration = jsonb_build_object(
  'account_number', '123456789',
  'merchant_code', 'MERCHANT123'
)
WHERE type = 'bancolombia' 
AND is_active = true
AND (
  configuration->>'account_number' IS NULL 
  OR configuration->>'merchant_code' IS NULL
  OR configuration->>'account_number' = ''
  OR configuration->>'merchant_code' = ''
);