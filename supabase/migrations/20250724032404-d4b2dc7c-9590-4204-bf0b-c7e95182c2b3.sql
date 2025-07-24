
-- FASE 1: Corrección de Políticas RLS para Products

-- 1. Eliminar políticas RLS existentes problemáticas
DROP POLICY IF EXISTS "Public can view available products by business" ON public.products;
DROP POLICY IF EXISTS "Admins can view their business products" ON public.products;
DROP POLICY IF EXISTS "Admins can create products for their business" ON public.products;
DROP POLICY IF EXISTS "Admins can update their business products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete their business products" ON public.products;

-- 2. LIMPIEZA DE DATOS: Eliminar productos duplicados
-- Eliminar el producto duplicado "Cochinita Pibil" manteniendo solo uno
WITH duplicate_cochinita AS (
  SELECT id, created_by, created_at,
         ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM products 
  WHERE name = 'Cochinita Pibil'
)
DELETE FROM products 
WHERE id IN (
  SELECT id FROM duplicate_cochinita WHERE rn > 1
);

-- 3. Eliminar productos de ejemplo del superadmin (alexjfweb@gmail.com)
DELETE FROM products 
WHERE created_by = (
  SELECT id FROM profiles WHERE email = 'alexjfweb@gmail.com'
);

-- 4. Implementar constraint único mejorado
-- Eliminar constraint antiguo si existe
ALTER TABLE products DROP CONSTRAINT IF EXISTS unique_product_name;
ALTER TABLE products DROP CONSTRAINT IF EXISTS unique_product_name_per_admin;

-- Crear nuevo constraint único por business_id
ALTER TABLE products 
ADD CONSTRAINT unique_product_name_per_business 
UNIQUE (name, business_id);

-- 5. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_products_created_by_business 
ON products(created_by, business_id);

-- 6. Crear nuevas políticas RLS restrictivas

-- Política SELECT: Admins ven sus productos + superadmins ven todos
CREATE POLICY "Admins can view products by ownership" ON public.products
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
    AND (
      profiles.role = 'superadmin' OR 
      products.created_by = profiles.id
    )
  )
);

-- Política INSERT: Solo admins pueden crear productos propios
CREATE POLICY "Admins can create own products" ON public.products
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
    AND products.created_by = profiles.id
    AND products.business_id = profiles.business_id
  )
);

-- Política UPDATE: Solo propietarios pueden actualizar (+ superadmins)
CREATE POLICY "Admins can update own products" ON public.products
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
    AND (
      profiles.role = 'superadmin' OR 
      products.created_by = profiles.id
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
    AND products.created_by = profiles.id
    AND products.business_id = profiles.business_id
  )
);

-- Política DELETE: Solo propietarios pueden eliminar (+ superadmins)
CREATE POLICY "Admins can delete own products" ON public.products
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
    AND (
      profiles.role = 'superadmin' OR 
      products.created_by = profiles.id
    )
  )
);

-- 7. Mantener política pública para acceso del menú público
CREATE POLICY "Public can view available products" ON public.products
FOR SELECT TO anon, authenticated 
USING (is_available = true);

-- 8. Crear función RPC para productos de admin (filtrada por propietario)
CREATE OR REPLACE FUNCTION public.get_admin_products_by_business(business_uuid UUID)
RETURNS SETOF public.products
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Obtener rol del usuario actual
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Si es superadmin, devolver todos los productos del negocio
  IF current_user_role = 'superadmin' THEN
    RETURN QUERY
    SELECT * FROM public.products 
    WHERE business_id = business_uuid 
    ORDER BY name;
  ELSE
    -- Si es admin regular, solo sus productos
    RETURN QUERY
    SELECT * FROM public.products 
    WHERE business_id = business_uuid 
    AND created_by = auth.uid()
    ORDER BY name;
  END IF;
END;
$$;

-- 9. Función para detectar y limpiar duplicados futuros
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_products()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Solo superadmins pueden ejecutar esta función
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Solo superadmins pueden ejecutar la limpieza de duplicados';
  END IF;
  
  -- Eliminar duplicados manteniendo el más reciente
  WITH duplicates AS (
    SELECT name, business_id,
           array_agg(id ORDER BY created_at DESC) as ids,
           COUNT(*) as count
    FROM products 
    GROUP BY name, business_id
    HAVING COUNT(*) > 1
  ),
  to_delete AS (
    SELECT unnest(ids[2:]) as id_to_delete
    FROM duplicates
  )
  DELETE FROM products 
  WHERE id IN (SELECT id_to_delete FROM to_delete);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- 10. Actualizar trigger de validación
DROP TRIGGER IF EXISTS ensure_product_ownership ON public.products;
DROP FUNCTION IF EXISTS validate_product_ownership();

CREATE OR REPLACE FUNCTION validate_product_ownership()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que el usuario actual sea admin o superadmin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden crear productos';
  END IF;
  
  -- Asegurar que created_by sea el usuario actual
  IF NEW.created_by != auth.uid() THEN
    RAISE EXCEPTION 'No puedes crear productos para otro administrador';
  END IF;
  
  -- Validar que business_id coincida con el del admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND business_id = NEW.business_id
  ) THEN
    RAISE EXCEPTION 'El producto debe pertenecer al mismo negocio del administrador';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER ensure_product_ownership
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_ownership();
