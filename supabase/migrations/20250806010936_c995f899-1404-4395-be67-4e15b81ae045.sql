-- Crear tabla de configuraciones de planes
CREATE TABLE public.plan_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  
  -- Límites de funcionalidades
  max_products INTEGER DEFAULT NULL,
  max_users INTEGER DEFAULT NULL,
  max_reservations_per_day INTEGER DEFAULT NULL,
  max_tables INTEGER DEFAULT NULL,
  max_locations INTEGER DEFAULT 1,
  
  -- Funcionalidades habilitadas
  features_enabled JSONB DEFAULT '{}',
  integrations_enabled JSONB DEFAULT '{}',
  
  -- Configuración de soporte
  support_type TEXT DEFAULT 'email',
  support_priority TEXT DEFAULT 'low',
  
  -- Configuraciones específicas
  api_access_enabled BOOLEAN DEFAULT false,
  whitelabel_enabled BOOLEAN DEFAULT false,
  custom_domain_enabled BOOLEAN DEFAULT false,
  advanced_analytics_enabled BOOLEAN DEFAULT false,
  multi_location_enabled BOOLEAN DEFAULT false,
  
  -- Configuraciones de personalización
  customization_level TEXT DEFAULT 'basic', -- basic, advanced, full
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para plan_configurations
ALTER TABLE public.plan_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage plan configurations" 
ON public.plan_configurations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
);

-- Extender tabla user_subscriptions para conectar con configuraciones
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS configuration_applied_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS current_usage JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_usage_check TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Crear tabla de límites de uso actuales
CREATE TABLE public.usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.business_info(id) ON DELETE CASCADE,
  
  -- Contadores actuales
  current_products INTEGER DEFAULT 0,
  current_users INTEGER DEFAULT 0,
  current_tables INTEGER DEFAULT 0,
  current_locations INTEGER DEFAULT 1,
  
  -- Uso diario (se resetea cada día)
  daily_reservations INTEGER DEFAULT 0,
  last_daily_reset DATE DEFAULT CURRENT_DATE,
  
  -- Metadatos de uso
  usage_metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- RLS para usage_tracking
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage" 
ON public.usage_tracking 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can manage usage tracking" 
ON public.usage_tracking 
FOR ALL 
USING (true);

-- Función para aplicar configuración de plan automáticamente
CREATE OR REPLACE FUNCTION public.apply_plan_configuration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  plan_config RECORD;
  user_business_id UUID;
BEGIN
  -- Obtener la configuración del plan
  SELECT pc.* INTO plan_config
  FROM public.plan_configurations pc
  WHERE pc.plan_id = NEW.plan_id;
  
  -- Obtener business_id del usuario
  SELECT business_id INTO user_business_id
  FROM public.profiles
  WHERE id = NEW.user_id;
  
  -- Crear o actualizar el registro de uso
  INSERT INTO public.usage_tracking (
    user_id,
    business_id,
    current_products,
    current_users,
    current_tables,
    current_locations,
    usage_metadata
  ) VALUES (
    NEW.user_id,
    user_business_id,
    0, -- Se actualizará con los valores reales
    1, -- Usuario inicial
    COALESCE(plan_config.max_tables, 999999),
    COALESCE(plan_config.max_locations, 1),
    JSONB_BUILD_OBJECT(
      'plan_applied', NEW.plan_id,
      'features_enabled', COALESCE(plan_config.features_enabled, '{}'),
      'integrations_enabled', COALESCE(plan_config.integrations_enabled, '{}'),
      'support_type', COALESCE(plan_config.support_type, 'email'),
      'api_access', COALESCE(plan_config.api_access_enabled, false),
      'whitelabel', COALESCE(plan_config.whitelabel_enabled, false),
      'custom_domain', COALESCE(plan_config.custom_domain_enabled, false),
      'advanced_analytics', COALESCE(plan_config.advanced_analytics_enabled, false),
      'multi_location', COALESCE(plan_config.multi_location_enabled, false)
    )
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    business_id = user_business_id,
    usage_metadata = JSONB_BUILD_OBJECT(
      'plan_applied', NEW.plan_id,
      'features_enabled', COALESCE(plan_config.features_enabled, '{}'),
      'integrations_enabled', COALESCE(plan_config.integrations_enabled, '{}'),
      'support_type', COALESCE(plan_config.support_type, 'email'),
      'api_access', COALESCE(plan_config.api_access_enabled, false),
      'whitelabel', COALESCE(plan_config.whitelabel_enabled, false),
      'custom_domain', COALESCE(plan_config.custom_domain_enabled, false),
      'advanced_analytics', COALESCE(plan_config.advanced_analytics_enabled, false),
      'multi_location', COALESCE(plan_config.multi_location_enabled, false)
    ),
    updated_at = now();
  
  -- Marcar que la configuración fue aplicada
  NEW.configuration_applied_at = now();
  
  RETURN NEW;
END;
$$;

-- Trigger para aplicar configuración automáticamente
CREATE TRIGGER apply_plan_configuration_trigger
  BEFORE INSERT OR UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_plan_configuration();

-- Función para validar límites antes de crear recursos
CREATE OR REPLACE FUNCTION public.validate_resource_limit(
  p_user_id UUID,
  p_resource_type TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_subscription RECORD;
  plan_config RECORD;
  current_usage RECORD;
  max_allowed INTEGER;
BEGIN
  -- Obtener suscripción actual del usuario
  SELECT us.*, sp.name as plan_name
  INTO current_subscription
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id 
  AND us.status = 'active'
  AND (us.ends_at IS NULL OR us.ends_at > now())
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- Si no tiene suscripción activa, denegar
  IF current_subscription IS NULL THEN
    RETURN false;
  END IF;
  
  -- Obtener configuración del plan
  SELECT * INTO plan_config
  FROM public.plan_configurations
  WHERE plan_id = current_subscription.plan_id;
  
  -- Si no hay configuración, permitir (plan sin límites)
  IF plan_config IS NULL THEN
    RETURN true;
  END IF;
  
  -- Obtener uso actual
  SELECT * INTO current_usage
  FROM public.usage_tracking
  WHERE user_id = p_user_id;
  
  -- Si no hay tracking, permitir por primera vez
  IF current_usage IS NULL THEN
    RETURN true;
  END IF;
  
  -- Validar según el tipo de recurso
  CASE p_resource_type
    WHEN 'products' THEN
      max_allowed := plan_config.max_products;
      IF max_allowed IS NOT NULL AND (current_usage.current_products + p_increment) > max_allowed THEN
        RETURN false;
      END IF;
      
    WHEN 'users' THEN
      max_allowed := plan_config.max_users;
      IF max_allowed IS NOT NULL AND (current_usage.current_users + p_increment) > max_allowed THEN
        RETURN false;
      END IF;
      
    WHEN 'tables' THEN
      max_allowed := plan_config.max_tables;
      IF max_allowed IS NOT NULL AND (current_usage.current_tables + p_increment) > max_allowed THEN
        RETURN false;
      END IF;
      
    WHEN 'locations' THEN
      max_allowed := plan_config.max_locations;
      IF max_allowed IS NOT NULL AND (current_usage.current_locations + p_increment) > max_allowed THEN
        RETURN false;
      END IF;
      
    WHEN 'daily_reservations' THEN
      -- Resetear contador diario si es necesario
      IF current_usage.last_daily_reset < CURRENT_DATE THEN
        UPDATE public.usage_tracking 
        SET daily_reservations = 0, last_daily_reset = CURRENT_DATE
        WHERE user_id = p_user_id;
        current_usage.daily_reservations := 0;
      END IF;
      
      max_allowed := plan_config.max_reservations_per_day;
      IF max_allowed IS NOT NULL AND (current_usage.daily_reservations + p_increment) > max_allowed THEN
        RETURN false;
      END IF;
  END CASE;
  
  RETURN true;
END;
$$;

-- Función para actualizar contadores de uso
CREATE OR REPLACE FUNCTION public.update_usage_counter(
  p_user_id UUID,
  p_resource_type TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Actualizar contador según el tipo de recurso
  CASE p_resource_type
    WHEN 'products' THEN
      UPDATE public.usage_tracking 
      SET current_products = current_products + p_increment, updated_at = now()
      WHERE user_id = p_user_id;
      
    WHEN 'users' THEN
      UPDATE public.usage_tracking 
      SET current_users = current_users + p_increment, updated_at = now()
      WHERE user_id = p_user_id;
      
    WHEN 'tables' THEN
      UPDATE public.usage_tracking 
      SET current_tables = current_tables + p_increment, updated_at = now()
      WHERE user_id = p_user_id;
      
    WHEN 'locations' THEN
      UPDATE public.usage_tracking 
      SET current_locations = current_locations + p_increment, updated_at = now()
      WHERE user_id = p_user_id;
      
    WHEN 'daily_reservations' THEN
      UPDATE public.usage_tracking 
      SET daily_reservations = daily_reservations + p_increment, updated_at = now()
      WHERE user_id = p_user_id;
  END CASE;
END;
$$;

-- Trigger de actualización de timestamps
CREATE TRIGGER update_plan_configurations_updated_at
  BEFORE UPDATE ON public.plan_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();