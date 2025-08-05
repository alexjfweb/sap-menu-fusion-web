-- Crear tabla para configuración de navegación
CREATE TABLE public.navigation_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  item_icon TEXT NOT NULL DEFAULT 'Circle',
  item_label TEXT NOT NULL,
  route_path TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  nav_type TEXT NOT NULL CHECK (nav_type IN ('top', 'bottom')),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  auth_required BOOLEAN NOT NULL DEFAULT false,
  required_role TEXT NOT NULL DEFAULT 'public' CHECK (required_role IN ('public', 'empleado', 'admin', 'superadmin')),
  parent_id UUID REFERENCES public.navigation_config(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.navigation_config ENABLE ROW LEVEL SECURITY;

-- Política para que solo superadmins puedan gestionar la configuración
CREATE POLICY "Only superadmins can manage navigation config"
ON public.navigation_config
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

-- Política para que usuarios autenticados puedan leer la configuración
CREATE POLICY "Users can read navigation config"
ON public.navigation_config
FOR SELECT
USING (true);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_navigation_config_updated_at
BEFORE UPDATE ON public.navigation_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar datos por defecto para navegación superior
INSERT INTO public.navigation_config (item_name, item_icon, item_label, route_path, position, nav_type, is_visible, auth_required, required_role) VALUES
('home', 'Home', 'Inicio', '/', 1, 'top', true, false, 'public'),
('features', 'Zap', 'Características', '/#features', 2, 'top', true, false, 'public'),
('pricing', 'CreditCard', 'Precios', '/#planes', 3, 'top', true, false, 'public'),
('contact', 'MessageCircle', 'Contacto', '/contact', 4, 'top', true, false, 'public'),
('auth', 'LogIn', 'Iniciar Sesión', '/auth', 5, 'top', true, false, 'public');

-- Insertar datos por defecto para navegación de dashboard (bottom)
INSERT INTO public.navigation_config (item_name, item_icon, item_label, route_path, position, nav_type, is_visible, auth_required, required_role) VALUES
('dashboard', 'LayoutDashboard', 'Dashboard', '/', 1, 'bottom', true, true, 'empleado'),
('products', 'Package', 'Productos', '/products', 2, 'bottom', true, true, 'admin'),
('orders', 'ShoppingCart', 'Pedidos', '/orders', 3, 'bottom', true, true, 'empleado'),
('reservations', 'Calendar', 'Reservas', '/reservations', 4, 'bottom', true, true, 'empleado'),
('reports', 'BarChart3', 'Reportes', '/reports', 5, 'bottom', true, true, 'admin'),
('settings', 'Settings', 'Configuración', '/settings', 6, 'bottom', true, true, 'admin');