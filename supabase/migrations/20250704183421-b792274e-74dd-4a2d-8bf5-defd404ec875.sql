-- Create WhatsApp Business configuration table
CREATE TABLE IF NOT EXISTS public.whatsapp_business_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number_id TEXT NOT NULL,
  business_account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  webhook_verify_token TEXT,
  is_connected BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.whatsapp_business_config ENABLE ROW LEVEL SECURITY;

-- Create policies for WhatsApp configuration (only superadmins can manage)
CREATE POLICY "superadmin_manage_whatsapp_config" 
ON public.whatsapp_business_config 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'superadmin'::user_role
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_whatsapp_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON public.whatsapp_business_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_whatsapp_config_updated_at();