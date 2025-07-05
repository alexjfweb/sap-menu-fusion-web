
-- LIMPIEZA CRÍTICA: Eliminar productos duplicados masivamente
-- Mantener solo la versión más reciente de cada producto duplicado

WITH duplicates AS (
  SELECT name, 
         array_agg(id ORDER BY created_at DESC) as ids,
         COUNT(*) as count
  FROM products 
  GROUP BY name 
  HAVING COUNT(*) > 1
),
to_delete AS (
  SELECT unnest(ids[2:]) as id_to_delete
  FROM duplicates
)
DELETE FROM products 
WHERE id IN (SELECT id_to_delete FROM to_delete);

-- Crear constraint único para prevenir duplicados futuros
ALTER TABLE products ADD CONSTRAINT unique_product_name UNIQUE (name);

-- Verificar limpieza (esto es solo informativo)
-- SELECT name, COUNT(*) as count 
-- FROM products 
-- GROUP BY name 
-- HAVING COUNT(*) > 1;
