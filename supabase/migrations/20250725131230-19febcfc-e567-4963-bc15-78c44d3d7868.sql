-- MIGRACIÓN DE SEGURIDAD CRÍTICA
-- Arreglar problemas críticos encontrados en el linter de Supabase

-- 1. HABILITAR RLS EN TABLAS SIN POLÍTICAS PERO CON RLS HABILITADO
-- Estas tablas necesitan políticas RLS para funcionar correctamente

-- Políticas para whatsapp_business_config (solo superadmins)
CREATE POLICY "Only superadmins can manage whatsapp config"
ON public.whatsapp_business_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Políticas para payment_reminder_settings (solo superadmins)
CREATE POLICY "Only superadmins can manage payment reminder settings"
ON public.payment_reminder_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Políticas para payment_methods (solo superadmins)
CREATE POLICY "Only superadmins can manage payment methods"
ON public.payment_methods
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Políticas para payment_reminder_configs (solo superadmins)
CREATE POLICY "Only superadmins can manage payment reminder configs"
ON public.payment_reminder_configs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- Políticas para payment_reminder_templates (solo superadmins)
CREATE POLICY "Only superadmins can manage payment reminder templates"
ON public.payment_reminder_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);

-- 2. ARREGLAR FUNCIONES SIN SEARCH_PATH CONFIGURADO
-- Recrear funciones con search_path seguro

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Actualizar función get_whatsapp_config con search_path
CREATE OR REPLACE FUNCTION public.get_whatsapp_config()
RETURNS TABLE(id uuid, phone_number_id text, business_account_id text, access_token text, webhook_verify_token text, is_connected boolean, last_verified_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check if user is superadmin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superadmin'::text
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    wbc.id,
    wbc.phone_number_id,
    wbc.business_account_id,
    wbc.access_token,
    wbc.webhook_verify_token,
    wbc.is_connected,
    wbc.last_verified_at,
    wbc.created_at,
    wbc.updated_at
  FROM public.whatsapp_business_config wbc
  LIMIT 1;
END;
$function$;

-- Actualizar función save_whatsapp_config con search_path
CREATE OR REPLACE FUNCTION public.save_whatsapp_config(config_data jsonb, config_id uuid DEFAULT NULL::uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result_id UUID;
BEGIN
  -- Check if user is superadmin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superadmin'::text
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF config_id IS NULL THEN
    -- Insert new configuration
    INSERT INTO public.whatsapp_business_config (
      phone_number_id,
      business_account_id,
      access_token,
      webhook_verify_token,
      is_connected,
      last_verified_at
    ) VALUES (
      config_data->>'phone_number_id',
      config_data->>'business_account_id',
      config_data->>'access_token',
      config_data->>'webhook_verify_token',
      (config_data->>'is_connected')::BOOLEAN,
      CASE 
        WHEN config_data->>'last_verified_at' IS NOT NULL 
        THEN (config_data->>'last_verified_at')::TIMESTAMP WITH TIME ZONE
        ELSE NULL
      END
    ) RETURNING id INTO result_id;
  ELSE
    -- Update existing configuration
    UPDATE public.whatsapp_business_config SET
      phone_number_id = config_data->>'phone_number_id',
      business_account_id = config_data->>'business_account_id',
      access_token = config_data->>'access_token',
      webhook_verify_token = config_data->>'webhook_verify_token',
      is_connected = (config_data->>'is_connected')::BOOLEAN,
      last_verified_at = CASE 
        WHEN config_data->>'last_verified_at' IS NOT NULL 
        THEN (config_data->>'last_verified_at')::TIMESTAMP WITH TIME ZONE
        ELSE NULL
      END,
      updated_at = now()
    WHERE id = config_id
    RETURNING id INTO result_id;
  END IF;

  RETURN result_id;
END;
$function$;

-- Recrear todas las demás funciones con search_path
CREATE OR REPLACE FUNCTION public.get_admin_products_by_business(business_uuid uuid)
RETURNS SETOF products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_public_products_by_business(business_uuid uuid)
RETURNS SETOF products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT * FROM public.products 
  WHERE business_id = business_uuid 
  AND is_available = true
  ORDER BY name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_business_by_id(business_uuid uuid)
RETURNS SETOF business_info
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT * FROM public.business_info 
  WHERE id = business_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_business_by_name(restaurant_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  business_uuid UUID;
BEGIN
  SELECT id INTO business_uuid
  FROM public.business_info 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM(restaurant_name))
  LIMIT 1;
  
  RETURN business_uuid;
END;
$function$;

-- Función mejorada de limpieza de duplicados con validaciones adicionales
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_products()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  
  -- Log de la operación para auditoría
  INSERT INTO role_change_attempts (user_id, email, role, attempted_action)
  VALUES (
    auth.uid(), 
    auth.email(), 
    'superadmin', 
    CONCAT('Cleanup duplicate products - deleted ', deleted_count, ' records')
  );
  
  RETURN deleted_count;
END;
$function$;

-- 3. FUNCIONES DE VALIDACIÓN ADICIONALES
CREATE OR REPLACE FUNCTION public.validate_business_ownership(target_business_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Verificar si el usuario actual tiene acceso al negocio
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (
      role = 'superadmin' 
      OR business_id = target_business_id
    )
  );
END;
$function$;

-- 4. TRIGGER PARA AUDITORÍA DE CAMBIOS SENSIBLES
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Registrar cambios en configuraciones de WhatsApp
  IF TG_TABLE_NAME = 'whatsapp_business_config' THEN
    INSERT INTO role_change_attempts (user_id, email, role, attempted_action)
    VALUES (
      auth.uid(),
      auth.email(),
      'audit',
      CONCAT('WhatsApp config changed - table: ', TG_TABLE_NAME, ', operation: ', TG_OP)
    );
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Crear triggers de auditoría
DROP TRIGGER IF EXISTS audit_whatsapp_config_changes ON public.whatsapp_business_config;
CREATE TRIGGER audit_whatsapp_config_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.whatsapp_business_config
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- 5. FUNCIONES PARA VALIDACIÓN DE ENTRADA
CREATE OR REPLACE FUNCTION public.sanitize_phone_number(phone_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
BEGIN
  -- Remover caracteres no numéricos excepto +
  RETURN regexp_replace(phone_input, '[^0-9+]', '', 'g');
END;
$function$;