-- Eliminar registros QR duplicados para limpiar la base de datos
-- Mantener solo registros que no sean tipo qr_code
UPDATE payment_methods 
SET is_active = false 
WHERE type = 'qr_code';

-- Limpiar registros duplicados de menu_customization si los hay
-- Mantener solo el más reciente por business_id
DELETE FROM menu_customization 
WHERE id NOT IN (
  SELECT DISTINCT ON (business_id) id 
  FROM menu_customization 
  ORDER BY business_id, created_at DESC
);