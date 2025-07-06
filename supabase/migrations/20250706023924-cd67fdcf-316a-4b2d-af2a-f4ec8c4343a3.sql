
-- FASE 1: Corrección del Constraint de Base de Datos

-- 1. Eliminar el constraint UNIQUE global problemático si existe
DO $$ 
BEGIN
    -- Verificar y eliminar constraint único en name si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%name%'
    ) THEN
        ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_name_key;
        ALTER TABLE public.products DROP CONSTRAINT IF EXISTS unique_product_name;
    END IF;
END $$;

-- 2. Crear constraint UNIQUE compuesto (name, created_by)
-- Esto permite que diferentes administradores tengan productos con el mismo nombre
ALTER TABLE public.products 
ADD CONSTRAINT unique_product_name_per_admin 
UNIQUE (name, created_by);

-- 3. Crear índice compuesto para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_products_name_created_by 
ON public.products(name, created_by);
