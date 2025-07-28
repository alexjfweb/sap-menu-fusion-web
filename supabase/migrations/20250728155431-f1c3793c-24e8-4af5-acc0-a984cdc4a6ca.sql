-- Crear business_id legacy para datos existentes
DO $$
DECLARE
    legacy_business_id UUID;
BEGIN
    -- Usar UUID específico para legacy business
    legacy_business_id := '00000000-0000-0000-0000-000000000001'::UUID;
    
    -- Crear business_info legacy si no existe
    INSERT INTO public.business_info (
        id,
        business_name,
        description,
        created_at,
        updated_at
    ) VALUES (
        legacy_business_id,
        'Datos Legacy del Sistema',
        'Business legacy para datos preexistentes del sistema',
        now(),
        now()
    ) ON CONFLICT (id) DO NOTHING;
    
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
    -- Permitir vista pública para órdenes anónimas
    auth.uid() IS NULL
    OR
    -- Superadmins pueden ver todas las órdenes
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'superadmin'
    )
    OR
    -- Usuarios autenticados pueden ver órdenes donde el creator pertenece a su business
    EXISTS (
        SELECT 1 FROM public.profiles user_profile
        JOIN public.profiles creator_profile ON creator_profile.id = orders.created_by
        WHERE user_profile.id = auth.uid() 
        AND user_profile.business_id = creator_profile.business_id
    )
    OR
    -- O si son sus propias órdenes
    orders.created_by = auth.uid()
);

-- Mejorar RLS para Reservations - filtrar por business_id del usuario
DROP POLICY IF EXISTS "All authenticated users can view reservations" ON public.reservations;
DROP POLICY IF EXISTS "Anyone can view reservations" ON public.reservations;

CREATE POLICY "Users can view reservations from their business" 
ON public.reservations 
FOR SELECT 
USING (
    -- Permitir vista pública para reservas anónimas
    auth.uid() IS NULL
    OR
    -- Superadmins pueden ver todas las reservas
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'superadmin'
    )
    OR
    -- Usuarios autenticados pueden ver reservas donde el creator pertenece a su business
    EXISTS (
        SELECT 1 FROM public.profiles user_profile
        JOIN public.profiles creator_profile ON creator_profile.id = reservations.created_by
        WHERE user_profile.id = auth.uid() 
        AND user_profile.business_id = creator_profile.business_id
    )
    OR
    -- O si son sus propias reservas
    reservations.created_by = auth.uid()
);

-- Mejorar política para empleados - solo ver empleados del mismo business
DROP POLICY IF EXISTS "Admins pueden ver sus empleados" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins pueden ver todos los empleados" ON public.profiles;

CREATE POLICY "Admins can view employees from their business" 
ON public.profiles 
FOR SELECT 
USING (
    -- Superadmins pueden ver todos los perfiles
    EXISTS (
        SELECT 1 FROM public.profiles admin_profile 
        WHERE admin_profile.id = auth.uid() 
        AND admin_profile.role = 'superadmin'
    )
    OR
    -- Admins pueden ver empleados de su business solamente
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

-- Asegurar que las nuevas órdenes se asignen correctamente
DROP POLICY IF EXISTS "All authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

CREATE POLICY "Users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
    created_by = auth.uid()
    OR auth.uid() IS NULL -- Permitir órdenes anónimas desde menú público
);

-- Asegurar que las nuevas reservas se asignen correctamente
DROP POLICY IF EXISTS "All authenticated users can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Anyone can create reservations" ON public.reservations;

CREATE POLICY "Users can create reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (
    created_by = auth.uid()
    OR auth.uid() IS NULL -- Permitir reservas anónimas desde menú público
);