-- Fix the sync_payment_reservation_to_reservation trigger function
-- to handle created_by field correctly for public menu reservations

CREATE OR REPLACE FUNCTION public.sync_payment_reservation_to_reservation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    available_table_id UUID;
    current_user_id UUID;
BEGIN
    -- Get current user ID (will be NULL for public/unauthenticated users)
    current_user_id := auth.uid();

    -- Buscar una mesa disponible que tenga suficiente capacidad
    SELECT id INTO available_table_id
    FROM public.tables 
    WHERE capacity >= NEW.party_size 
    AND is_available = true
    ORDER BY capacity ASC
    LIMIT 1;

    -- Si no hay mesa disponible, usar NULL
    IF available_table_id IS NULL THEN
        available_table_id := NULL;
    END IF;

    -- Insertar en la tabla reservations con created_by manejado correctamente
    INSERT INTO public.reservations (
        customer_name,
        customer_phone,
        customer_email,
        party_size,
        reservation_date,
        reservation_time,
        special_requests,
        table_id,
        status,
        created_by,  -- Explicitly handle this field
        created_at,
        updated_at
    ) VALUES (
        NEW.customer_name,
        NEW.customer_phone,
        NEW.customer_email,
        NEW.party_size,
        NEW.reservation_date,
        NEW.reservation_time,
        NEW.special_requests,
        available_table_id,
        CASE 
            WHEN NEW.status = 'pending' THEN 'pendiente'::reservation_status
            WHEN NEW.status = 'confirmed' THEN 'confirmada'::reservation_status
            WHEN NEW.status = 'cancelled' THEN 'cancelada'::reservation_status
            ELSE 'pendiente'::reservation_status
        END,
        current_user_id,  -- This will be NULL for public menu users, which is allowed by RLS
        NEW.created_at,
        NEW.updated_at
    );

    RETURN NEW;
END;
$function$;