-- Create RPC functions for WhatsApp configuration management

-- Function to get WhatsApp configuration
CREATE OR REPLACE FUNCTION public.get_whatsapp_config()
RETURNS TABLE (
  id UUID,
  phone_number_id TEXT,
  business_account_id TEXT,
  access_token TEXT,
  webhook_verify_token TEXT,
  is_connected BOOLEAN,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is superadmin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superadmin'::user_role
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
$$;

-- Function to save WhatsApp configuration
CREATE OR REPLACE FUNCTION public.save_whatsapp_config(
  config_data JSONB,
  config_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_id UUID;
BEGIN
  -- Check if user is superadmin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superadmin'::user_role
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
$$;