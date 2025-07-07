
-- FASE 1: Limpieza Total de Datos QR Corruptos
-- Eliminar todos los registros existentes con type = 'qr' o similares
DELETE FROM public.payment_methods 
WHERE type IN ('qr', 'qr_bancolombia', 'qr_daviplata');

-- FASE 2: Actualización de Constraint
-- Primero eliminamos el constraint obsoleto
ALTER TABLE public.payment_methods 
DROP CONSTRAINT IF EXISTS payment_methods_type_check;

-- Crear nuevo constraint que incluya 'qr_code' junto con todos los tipos válidos
ALTER TABLE public.payment_methods 
ADD CONSTRAINT payment_methods_type_check 
CHECK (type IN (
  'cash_on_delivery',
  'qr_code',
  'nequi', 
  'daviplata',
  'mercado_pago',
  'stripe',
  'paypal'
));

-- Verificar que la tabla esté limpia y lista para el nuevo método QR
SELECT * FROM public.payment_methods WHERE type LIKE '%qr%';
