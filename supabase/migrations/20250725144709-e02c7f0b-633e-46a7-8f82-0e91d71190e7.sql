-- MIGRACIÓN DE SEGURIDAD FASE 2
-- Arreglar las funciones restantes sin search_path y tablas sin RLS

-- 1. ARREGLAR FUNCIONES RESTANTES SIN SEARCH_PATH
CREATE OR REPLACE FUNCTION public.validate_product_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.prevent_role_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_user_role text;
BEGIN
  -- Obtener el rol del usuario actual
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();

  -- Permitir el cambio de rol solo si el usuario actual es superadmin
  IF current_user_role = 'superadmin' THEN
    RETURN NEW;
  END IF;

  -- Si el rol está cambiando y no es superadmin, bloquear
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'No se permite cambiar el rol manualmente.';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- FORZAR el rol a 'admin', ignorando cualquier metadata
  INSERT INTO public.profiles (id, role)
  VALUES (
    NEW.id,
    'admin'
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error en handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.change_user_role(superadmin_id uuid, target_id uuid, new_role text)
RETURNS TABLE(user_id uuid, user_role text, updated boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Permitir el cambio de rol solo dentro de esta función
  PERFORM set_config('app.bypass_role_protection', 'on', true);

  UPDATE public.profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_id;

  RETURN QUERY
    SELECT id, role, true FROM public.profiles WHERE id = target_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.change_user_role(target_id uuid, new_role text)
RETURNS TABLE(user_id uuid, user_role text, updated integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_user_role text;
  current_user_email text;
  current_user_id uuid;
  updated_count integer;
BEGIN
  SELECT id, role, email INTO current_user_id, current_user_role, current_user_email 
  FROM public.profiles WHERE id = auth.uid();

  IF current_user_role = 'superadmin' THEN
    UPDATE public.profiles SET role = new_role, updated_at = now() WHERE id = target_id;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN QUERY SELECT current_user_id, current_user_role, updated_count;
  ELSE
    IF current_user_id IS NOT NULL THEN
      INSERT INTO public.role_change_attempts (user_id, email, role, attempted_action)
      VALUES (current_user_id, current_user_email, current_user_role, CONCAT('Intento de cambio de rol a ', new_role, ' para usuario ', target_id));
    END IF;
    RAISE EXCEPTION 'Solo los superadmins pueden cambiar roles.';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.promote_to_superadmin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    user_exists boolean;
BEGIN
    -- Verificar si el usuario existe en profiles
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE email = user_email) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN false;
    END IF;
    
    -- Actualizar rol a superadmin solo para emails específicos autorizados
    IF user_email IN ('alexjfweb@gmail.com', 'allseosoporte@gmail.com', 'superadmin@gmail.com') THEN
        UPDATE public.profiles 
        SET role = 'superadmin', 
            updated_at = now()
        WHERE email = user_email;
        
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_employee_activity(p_employee_id uuid, p_activity_type text, p_description text, p_entity_type text DEFAULT NULL::text, p_entity_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.employee_activities (
    employee_id,
    activity_type,
    description,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_employee_id,
    p_activity_type,
    p_description,
    p_entity_type,
    p_entity_id,
    p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_notification(p_recipient_id uuid, p_sender_id uuid, p_title text, p_message text, p_type text DEFAULT 'info'::text, p_entity_type text DEFAULT NULL::text, p_entity_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    sender_id,
    title,
    message,
    type,
    entity_type,
    entity_id,
    metadata,
    expires_at
  ) VALUES (
    p_recipient_id,
    p_sender_id,
    p_title,
    p_message,
    p_type,
    p_entity_type,
    p_entity_id,
    p_metadata,
    p_expires_at
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$function$;

-- Funciones de sincronización con search_path
CREATE OR REPLACE FUNCTION public.sync_payment_order_to_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
    new_order_id UUID;
    order_number_val TEXT;
    cart_item JSONB;
BEGIN
    -- Generar número de pedido único
    order_number_val := 'ORD-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(EXTRACT(EPOCH FROM now())::TEXT, 10, '0');

    -- Insertar en la tabla orders
    INSERT INTO public.orders (
        order_number,
        customer_name,
        customer_phone,
        status,
        total_amount,
        notes,
        created_at,
        updated_at
    ) VALUES (
        order_number_val,
        NEW.customer_name,
        NEW.customer_phone,
        CASE 
            WHEN NEW.status = 'pending' THEN 'pendiente'::order_status
            WHEN NEW.status = 'confirmed' THEN 'en_preparacion'::order_status
            WHEN NEW.status = 'cancelled' THEN 'cancelado'::order_status
            ELSE 'pendiente'::order_status
        END,
        NEW.total_amount,
        CASE 
            WHEN NEW.special_instructions IS NOT NULL AND NEW.payment_method IS NOT NULL THEN
                CONCAT('Instrucciones: ', NEW.special_instructions, ' | Método de pago: ', NEW.payment_method)
            WHEN NEW.special_instructions IS NOT NULL THEN
                CONCAT('Instrucciones: ', NEW.special_instructions)
            WHEN NEW.payment_method IS NOT NULL THEN
                CONCAT('Método de pago: ', NEW.payment_method)
            ELSE NULL
        END,
        NEW.created_at,
        NEW.updated_at
    ) RETURNING id INTO new_order_id;

    -- Insertar items del carrito en order_items
    FOR cart_item IN SELECT * FROM jsonb_array_elements(NEW.cart_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            unit_price,
            total_price,
            special_instructions
        ) VALUES (
            new_order_id,
            (cart_item->>'product_id')::UUID,
            (cart_item->>'quantity')::INTEGER,
            (cart_item->>'unit_price')::NUMERIC,
            (cart_item->>'total_price')::NUMERIC,
            cart_item->>'special_instructions'
        );
    END LOOP;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_payment_reservation_to_reservation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
    available_table_id UUID;
BEGIN
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

    -- Insertar en la tabla reservations
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
        NEW.created_at,
        NEW.updated_at
    );

    RETURN NEW;
END;
$function$;

-- Funciones de triggers con search_path
CREATE OR REPLACE FUNCTION public.create_default_menu_customization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.menu_customization (business_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_whatsapp_config_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. HABILITAR RLS EN LAS TABLAS RESTANTES QUE NO LO TIENEN
-- Identificar y habilitar RLS en las tablas que lo necesitan

-- Habilitar RLS en role_change_attempts
ALTER TABLE public.role_change_attempts ENABLE ROW LEVEL SECURITY;

-- Política para role_change_attempts (solo superadmins pueden ver)
CREATE POLICY "Only superadmins can view role change attempts"
ON public.role_change_attempts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Habilitar RLS en registration_logs 
ALTER TABLE public.registration_logs ENABLE ROW LEVEL SECURITY;

-- Política para registration_logs (solo superadmins pueden ver)
CREATE POLICY "Only superadmins can view registration logs"
ON public.registration_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Sistema permite insertar logs para registro
CREATE POLICY "System can insert registration logs"
ON public.registration_logs
FOR INSERT
WITH CHECK (true);

-- 3. FUNCIONES DE SEGURIDAD ADICIONALES
-- Función para validar emails de entrada
CREATE OR REPLACE FUNCTION public.is_valid_email(email_input text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
BEGIN
  -- Validar formato básico de email
  RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$function$;

-- Función para rate limiting (prevenir spam)
CREATE OR REPLACE FUNCTION public.check_rate_limit(user_identifier text, action_type text, max_attempts integer DEFAULT 5, time_window_minutes integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  attempt_count integer;
BEGIN
  -- Contar intentos recientes
  SELECT COUNT(*) INTO attempt_count
  FROM public.role_change_attempts
  WHERE (email = user_identifier OR user_id::text = user_identifier)
  AND attempted_action LIKE '%' || action_type || '%'
  AND attempted_at > (now() - INTERVAL '1 minute' * time_window_minutes);
  
  -- Retornar true si está dentro del límite
  RETURN attempt_count < max_attempts;
END;
$function$;