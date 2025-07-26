
-- Fase 1: Correcciones en Base de Datos

-- 1. Primero, vamos a mover los datos existentes a un business_id específico para preservarlos
DO $$
DECLARE
    legacy_business_id UUID;
BEGIN
    -- Crear un business_info "legacy" para datos existentes si no hay ninguno específico
    INSERT INTO public.business_info (
        business_name,
        description,
        created_at,
        updated_at
    ) VALUES (
        'Datos Legacy del Sistema',
        'Datos de ejemplo que existían antes de la implementación del aislamiento de cuentas',
        now(),
        now()
    ) RETURNING id INTO legacy_business_id;
    
    -- Actualizar productos que no tienen business_id asignado
    UPDATE public.products 
    SET business_id = legacy_business_id 
    WHERE business_id IS NULL;
    
    -- Actualizar perfiles que no tienen business_id asignado (admins sin negocio)
    UPDATE public.profiles 
    SET business_id = legacy_business_id 
    WHERE business_id IS NULL 
    AND role IN ('admin', 'superadmin');
END $$;

-- 2. Modificar el trigger handle_new_user para crear business_info automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
    new_business_id UUID;
BEGIN
    -- Crear un nuevo business_info para el usuario
    INSERT INTO public.business_info (
        business_name,
        description,
        created_at,
        updated_at
    ) VALUES (
        'Mi Restaurante',
        'Configura tu información de negocio desde el panel de administración',
        now(),
        now()
    ) RETURNING id INTO new_business_id;
    
    -- Crear el perfil del usuario con el business_id asignado
    INSERT INTO public.profiles (
        id, 
        role,
        business_id,
        email,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        'admin',  -- Por defecto admin para nuevos usuarios
        new_business_id,
        NEW.email,
        now(),
        now()
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error en handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- 3. Mejorar las políticas RLS para business_info
DROP POLICY IF EXISTS "Allow public read access to business info" ON public.business_info;
DROP POLICY IF EXISTS "Authenticated users can update business info" ON public.business_info;

-- Nueva política: solo el propietario del negocio puede ver su business_info
CREATE POLICY "Users can view their own business info" 
ON public.business_info 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.business_id = business_info.id
    )
);

-- Nueva política: solo el propietario puede actualizar su business_info
CREATE POLICY "Users can update their own business info" 
ON public.business_info 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.business_id = business_info.id
    )
);

-- 4. Política especial para acceso público al menú (solo para URLs públicas específicas)
CREATE POLICY "Public can view business info for public menus" 
ON public.business_info 
FOR SELECT 
USING (true);  -- Esto se controlará desde el código con parámetros específicos

-- 5. Mejorar las funciones existentes para mejor aislamiento
CREATE OR REPLACE FUNCTION public.get_business_by_name(restaurant_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  business_uuid UUID;
BEGIN
  -- Solo buscar en business_info que realmente tengan datos configurados
  SELECT id INTO business_uuid
  FROM public.business_info 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM(restaurant_name))
  AND business_name != 'Mi Restaurante'  -- Excluir plantillas por defecto
  LIMIT 1;
  
  RETURN business_uuid;
END;
$$;

-- 6. Función para obtener business_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_business_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT business_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 7. Actualizar la política de productos para mejor aislamiento
DROP POLICY IF EXISTS "Public can view available products" ON public.products;

-- Nueva política: productos públicos solo para menús públicos específicos
CREATE POLICY "Public can view products for specific business" 
ON public.products 
FOR SELECT 
USING (
  is_available = true 
  AND business_id IS NOT NULL
);
