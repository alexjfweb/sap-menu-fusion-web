
-- Crear tabla para almacenar la configuración de personalización del menú
CREATE TABLE public.menu_customization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.business_info(id) ON DELETE CASCADE,
  
  -- Colores principales
  menu_bg_color TEXT DEFAULT '#ffffff',
  header_bg_color TEXT DEFAULT '#f8f9fa',
  text_color TEXT DEFAULT '#333333',
  header_text_color TEXT DEFAULT '#ffffff',
  
  -- Colores de botones
  button_bg_color TEXT DEFAULT '#007bff',
  button_text_color TEXT DEFAULT '#ffffff',
  contact_button_bg_color TEXT DEFAULT '#25d366',
  contact_button_text_color TEXT DEFAULT '#ffffff',
  
  -- Colores de tarjetas de productos
  product_card_bg_color TEXT DEFAULT '#ffffff',
  product_card_border_color TEXT DEFAULT '#e9ecef',
  product_name_color TEXT DEFAULT '#333333',
  product_description_color TEXT DEFAULT '#6c757d',
  product_price_color TEXT DEFAULT '#28a745',
  
  -- Colores adicionales
  shadow_color TEXT DEFAULT 'rgba(0,0,0,0.1)',
  social_links_color TEXT DEFAULT '#007bff',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint para asegurar un registro por negocio
  UNIQUE(business_id)
);

-- Habilitar RLS
ALTER TABLE public.menu_customization ENABLE ROW LEVEL SECURITY;

-- Política para que solo usuarios autenticados puedan ver y modificar
CREATE POLICY "Authenticated users can manage menu customization"
  ON public.menu_customization
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Función para crear configuración por defecto cuando se crea un business_info
CREATE OR REPLACE FUNCTION public.create_default_menu_customization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.menu_customization (business_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger para crear configuración automáticamente
CREATE TRIGGER create_menu_customization_trigger
  AFTER INSERT ON public.business_info
  FOR EACH ROW
  EXECUTE FUNCTION create_default_menu_customization();
