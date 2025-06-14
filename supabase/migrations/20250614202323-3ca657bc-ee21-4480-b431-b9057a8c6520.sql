
-- Create business_info table for storing business information
CREATE TABLE public.business_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  tax_id TEXT, -- NIT
  phone TEXT,
  address TEXT,
  email TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  public_menu_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;

-- Create policies for business_info
CREATE POLICY "Admins can view business info" ON public.business_info
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Admins can update business info" ON public.business_info
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Insert default business info record
INSERT INTO public.business_info (
  business_name,
  tax_id,
  phone,
  address,
  email,
  description
) VALUES (
  'Mi Restaurante',
  '900000000-1',
  '+57 300 000 0000',
  'Calle 123 #45-67, Bogotá, Colombia',
  'info@mirestaurante.com',
  'Descripción de mi restaurante'
);
