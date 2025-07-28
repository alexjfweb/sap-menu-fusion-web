-- Crear business_id legacy para datos existentes
DO $$
DECLARE
    legacy_business_id UUID;
BEGIN
    -- Crear business_info legacy si no existe
    INSERT INTO public.business_info (
        id,
        business_name,
        description,
        created_at,
        updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000001'::UUID,
        'Datos Legacy del Sistema',
        'Business legacy para datos preexistentes del sistema',
        now(),
        now()
    ) ON CONFLICT (id) DO NOTHING;
    
    legacy_business_id := '00000000-0000-0000-0000-000000000001'::UUID;
    
    -- Asociar orders existentes sin business_id al legacy
    UPDATE public.orders 
    SET created_by = legacy_business_id
    WHERE created_by IS NULL;
    
    -- Asociar reservations existentes sin business_id al legacy  
    UPDATE public.reservations
    SET created_by = legacy_business_id
    WHERE created_by IS NULL;
    
    -- Limpiar empleados huérfanos - asociarlos al legacy business
    UPDATE public.profiles 
    SET business_id = legacy_business_id,
        created_by_email = 'legacy@system.com'
    WHERE role = 'empleado' 
    AND (created_by_email IS NULL OR created_by_email = '');
    
END $$;

-- Mejorar RLS para Orders - filtrar por business_id del usuario
DROP POLICY IF EXISTS "All authenticated users can view orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;

CREATE POLICY "Users can view orders from their business" 
ON public.orders 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (
            profiles.role = 'superadmin' 
            OR orders.created_by = profiles.business_id
            OR orders.created_by = auth.uid()
        )
    )
);

-- Mejorar RLS para Reservations - filtrar por business_id del usuario
DROP POLICY IF EXISTS "All authenticated users can view reservations" ON public.reservations;
DROP POLICY IF EXISTS "Anyone can view reservations" ON public.reservations;

CREATE POLICY "Users can view reservations from their business" 
ON public.reservations 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND (
            profiles.role = 'superadmin' 
            OR reservations.created_by = profiles.business_id
            OR reservations.created_by = auth.uid()
        )
    )
);

-- Asegurar que orders nuevas se asocien al business_id correcto
DROP POLICY IF EXISTS "All authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

CREATE POLICY "Users can create orders for their business" 
ON public.orders 
FOR INSERT 
WITH CHECK (
    created_by = (SELECT business_id FROM public.profiles WHERE id = auth.uid())
    OR auth.uid() IS NULL -- Permitir órdenes anónimas desde menú público
);

-- Asegurar que reservations nuevas se asocien al business_id correcto
DROP POLICY IF EXISTS "All authenticated users can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Anyone can create reservations" ON public.reservations;

CREATE POLICY "Users can create reservations for their business" 
ON public.reservations 
FOR INSERT 
WITH CHECK (
    created_by = (SELECT business_id FROM public.profiles WHERE id = auth.uid())
    OR auth.uid() IS NULL -- Permitir reservas anónimas desde menú público
);

-- Mejorar política para empleados - solo ver empleados del mismo business
DROP POLICY IF EXISTS "Admins pueden ver sus empleados" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins pueden ver todos los empleados" ON public.profiles;

CREATE POLICY "Admins can view employees from their business" 
ON public.profiles 
FOR SELECT 
USING (
    -- Superadmins pueden ver todos
    (
        EXISTS (
            SELECT 1 FROM public.profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'superadmin'
        )
    )
    OR
    -- Admins pueden ver empleados de su business
    (
        role = 'empleado' 
        AND EXISTS (
            SELECT 1 FROM public.profiles admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'admin'
            AND profiles.business_id = admin_profile.business_id
        )
    )
);

-- Crear función para obtener business_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_business_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT business_id FROM public.profiles WHERE id = auth.uid();
$$;