
-- FASE 1: Modificar estructura de base de datos

-- 1. Agregar campo created_by a la tabla products
ALTER TABLE public.products 
ADD COLUMN created_by UUID REFERENCES public.profiles(id);

-- 2. Asignar productos existentes al primer superadmin encontrado
UPDATE public.products 
SET created_by = (
  SELECT id FROM public.profiles 
  WHERE role = 'superadmin' 
  ORDER BY created_at ASC 
  LIMIT 1
) 
WHERE created_by IS NULL;

-- 3. Hacer el campo created_by obligatorio
ALTER TABLE public.products 
ALTER COLUMN created_by SET NOT NULL;

-- 4. Crear índice para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_products_created_by ON public.products(created_by);

-- 5. Eliminar políticas RLS permisivas existentes
DROP POLICY IF EXISTS "Allow initial data insertion for products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "All authenticated users can view products" ON public.products;

-- 6. Crear nuevas políticas RLS restrictivas

-- Política para que administradores solo vean sus propios productos
CREATE POLICY "Admins can view their own products" ON public.products
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
    AND (
      products.created_by = profiles.id OR
      profiles.role = 'superadmin'
    )
  )
);

-- Política para que administradores solo puedan crear productos asignados a sí mismos
CREATE POLICY "Admins can create their own products" ON public.products
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
    AND products.created_by = profiles.id
  )
);

-- Política para que administradores solo puedan actualizar sus propios productos
CREATE POLICY "Admins can update their own products" ON public.products
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
    AND (
      products.created_by = profiles.id OR
      profiles.role = 'superadmin'
    )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
    AND products.created_by = profiles.id
  )
);

-- Política para que administradores solo puedan eliminar sus propios productos
CREATE POLICY "Admins can delete their own products" ON public.products
FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
    AND (
      products.created_by = profiles.id OR
      profiles.role = 'superadmin'
    )
  )
);

-- Mantener acceso público para el menú público (solo lectura)
CREATE POLICY "Public can view available products" ON public.products
FOR SELECT TO anon, authenticated USING (is_available = true);

-- 7. Crear trigger para validar que created_by coincida con el usuario actual
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER ensure_product_ownership
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_ownership();
