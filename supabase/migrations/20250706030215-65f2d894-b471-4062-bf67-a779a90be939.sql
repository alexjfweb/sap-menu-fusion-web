
-- FASE 1: Establecer contexto de restaurante
-- Agregar business_id a la tabla profiles para vincular administradores con restaurantes
ALTER TABLE public.profiles 
ADD COLUMN business_id UUID REFERENCES public.business_info(id);

-- Crear índice para mejorar rendimiento de consultas
CREATE INDEX idx_profiles_business_id ON public.profiles(business_id);

-- Migrar datos existentes: vincular administradores existentes con el primer restaurante
-- (Asumiendo que hay un solo restaurante en el sistema actualmente)
UPDATE public.profiles 
SET business_id = (
  SELECT id FROM public.business_info LIMIT 1
)
WHERE role IN ('admin', 'superadmin') AND business_id IS NULL;

-- Agregar business_id a la tabla products para vincular productos con restaurantes
ALTER TABLE public.products 
ADD COLUMN business_id UUID REFERENCES public.business_info(id);

-- Crear índice para mejorar rendimiento
CREATE INDEX idx_products_business_id ON public.products(business_id);

-- Migrar productos existentes al restaurante del administrador que los creó
UPDATE public.products 
SET business_id = (
  SELECT p.business_id 
  FROM public.profiles p 
  WHERE p.id = products.created_by
)
WHERE business_id IS NULL AND created_by IS NOT NULL;

-- Para productos sin created_by, asignar al primer restaurante
UPDATE public.products 
SET business_id = (
  SELECT id FROM public.business_info LIMIT 1
)
WHERE business_id IS NULL;

-- Actualizar políticas RLS para products para incluir filtrado por business_id
DROP POLICY IF EXISTS "Admins can view their own products" ON public.products;
CREATE POLICY "Admins can view their business products" ON public.products
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
    AND (
      profiles.role = 'superadmin' OR 
      profiles.business_id = products.business_id
    )
  )
);

DROP POLICY IF EXISTS "Admins can create their own products" ON public.products;
CREATE POLICY "Admins can create products for their business" ON public.products
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
    AND profiles.business_id = products.business_id
    AND products.created_by = profiles.id
  )
);

DROP POLICY IF EXISTS "Admins can update their own products" ON public.products;
CREATE POLICY "Admins can update their business products" ON public.products
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
    AND (
      profiles.role = 'superadmin' OR 
      (profiles.business_id = products.business_id AND products.created_by = profiles.id)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
    AND profiles.business_id = products.business_id
    AND products.created_by = profiles.id
  )
);

DROP POLICY IF EXISTS "Admins can delete their own products" ON public.products;
CREATE POLICY "Admins can delete their business products" ON public.products
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
    AND (
      profiles.role = 'superadmin' OR 
      (profiles.business_id = products.business_id AND products.created_by = profiles.id)
    )
  )
);

-- Actualizar política pública para mostrar solo productos del restaurante especificado
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
DROP POLICY IF EXISTS "Public can view available products" ON public.products;

CREATE POLICY "Public can view available products by business" ON public.products
FOR SELECT 
USING (is_available = true);

-- Función para obtener productos por business_id de manera pública
CREATE OR REPLACE FUNCTION public.get_public_products_by_business(business_uuid UUID)
RETURNS SETOF public.products
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.products 
  WHERE business_id = business_uuid 
  AND is_available = true
  ORDER BY name;
END;
$$;

-- Función para obtener información del negocio por ID
CREATE OR REPLACE FUNCTION public.get_business_by_id(business_uuid UUID)
RETURNS SETOF public.business_info
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.business_info 
  WHERE id = business_uuid;
END;
$$;

-- Función para obtener business_id por nombre del restaurante (para URLs amigables)
CREATE OR REPLACE FUNCTION public.get_business_by_name(restaurant_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  business_uuid UUID;
BEGIN
  SELECT id INTO business_uuid
  FROM public.business_info 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM(restaurant_name))
  LIMIT 1;
  
  RETURN business_uuid;
END;
$$;
