
-- CORRECCIÓN CRÍTICA: Limpieza masiva y definitiva de productos duplicados
-- Esta operación eliminará todos los duplicados manteniendo solo el más reciente de cada producto

-- Paso 1: Eliminar duplicados masivamente (manteniendo solo el más reciente)
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

-- Paso 2: Aplicar constraint único FUERTE para prevenir futuros duplicados
DROP CONSTRAINT IF EXISTS unique_product_name;
ALTER TABLE products ADD CONSTRAINT unique_product_name UNIQUE (name);

-- Paso 3: Verificar limpieza (debe retornar 0 filas)
-- Esta consulta debe estar vacía después de la limpieza
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT name, COUNT(*) as count 
        FROM products 
        GROUP BY name 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'ADVERTENCIA: Aún existen % productos duplicados', duplicate_count;
    ELSE
        RAISE NOTICE 'ÉXITO: Limpieza completada. No hay duplicados.';
    END IF;
END $$;

-- Paso 4: Mostrar estadísticas finales
SELECT 
    COUNT(*) as total_productos_restantes,
    COUNT(DISTINCT name) as productos_unicos
FROM products;
