
-- Crear enum para roles de usuario
CREATE TYPE public.user_role AS ENUM ('empleado', 'admin', 'superadmin');

-- Crear enum para estados de pedidos
CREATE TYPE public.order_status AS ENUM ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado');

-- Crear enum para estados de reservas
CREATE TYPE public.reservation_status AS ENUM ('pendiente', 'confirmada', 'cancelada', 'completada');

-- Crear enum para tipos de productos
CREATE TYPE public.product_type AS ENUM ('plato', 'bebida', 'postre', 'entrada', 'acompañamiento');

-- Tabla de perfiles de usuario (extiende auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'empleado',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de empresas/restaurantes
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de categorías de productos
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  image_url TEXT,
  product_type product_type DEFAULT 'plato',
  is_available BOOLEAN DEFAULT true,
  preparation_time INTEGER DEFAULT 15,
  ingredients TEXT[],
  allergens TEXT[],
  calories INTEGER,
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  is_gluten_free BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de inventario
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER DEFAULT 100,
  unit TEXT DEFAULT 'unidad',
  cost_per_unit DECIMAL(10,2),
  supplier TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de mesas
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER NOT NULL UNIQUE,
  capacity INTEGER NOT NULL,
  is_available BOOLEAN DEFAULT true,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pedidos
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  table_id UUID REFERENCES public.tables(id),
  customer_name TEXT,
  customer_phone TEXT,
  status order_status DEFAULT 'pendiente',
  total_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de detalles de pedidos
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de reservas
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  party_size INTEGER NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  table_id UUID REFERENCES public.tables(id),
  status reservation_status DEFAULT 'pendiente',
  special_requests TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (get_user_role() IN ('admin', 'superadmin'));

-- Políticas RLS para companies
CREATE POLICY "Admins can manage companies" ON public.companies
  FOR ALL USING (get_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "All authenticated users can view companies" ON public.companies
  FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas RLS para categories
CREATE POLICY "All authenticated users can view categories" ON public.categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (get_user_role() IN ('admin', 'superadmin'));

-- Políticas RLS para products
CREATE POLICY "All authenticated users can view products" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (get_user_role() IN ('admin', 'superadmin'));

-- Políticas RLS para inventory
CREATE POLICY "All authenticated users can view inventory" ON public.inventory
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage inventory" ON public.inventory
  FOR ALL USING (get_user_role() IN ('admin', 'superadmin'));

-- Políticas RLS para tables
CREATE POLICY "All authenticated users can view tables" ON public.tables
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage tables" ON public.tables
  FOR ALL USING (get_user_role() IN ('admin', 'superadmin'));

-- Políticas RLS para orders
CREATE POLICY "All authenticated users can view orders" ON public.orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update orders" ON public.orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE USING (get_user_role() IN ('admin', 'superadmin'));

-- Políticas RLS para order_items
CREATE POLICY "All authenticated users can manage order items" ON public.order_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas RLS para reservations
CREATE POLICY "All authenticated users can view reservations" ON public.reservations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can create reservations" ON public.reservations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can update reservations" ON public.reservations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete reservations" ON public.reservations
  FOR DELETE USING (get_user_role() IN ('admin', 'superadmin'));

-- Trigger para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'empleado'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insertar datos iniciales
INSERT INTO public.companies (name, description, address, phone, email) VALUES
('SAP Menu Demo', 'Restaurante de demostración para SAP Menu', 'Calle Principal 123, Ciudad', '+1234567890', 'demo@sapmenu.com');

INSERT INTO public.categories (name, description, sort_order) VALUES
('Entradas', 'Platos para comenzar la comida', 1),
('Platos Principales', 'Platos principales del menú', 2),
('Bebidas', 'Bebidas frías y calientes', 3),
('Postres', 'Dulces y postres', 4);

INSERT INTO public.tables (table_number, capacity, location) VALUES
(1, 2, 'interior'),
(2, 4, 'interior'),
(3, 6, 'terraza'),
(4, 2, 'ventana'),
(5, 8, 'interior');

-- Productos de ejemplo (corregidos)
INSERT INTO public.products (name, description, price, category_id, product_type, preparation_time, is_vegetarian) 
SELECT 
  'Ensalada César',
  'Ensalada fresca con lechuga, crutones y aderezo césar',
  12.50,
  c.id,
  'entrada',
  10,
  true
FROM public.categories c WHERE c.name = 'Entradas';

INSERT INTO public.products (name, description, price, category_id, product_type, preparation_time, is_vegetarian) 
SELECT 
  'Pasta Carbonara',
  'Pasta con salsa carbonara, panceta y parmesano',
  18.90,
  c.id,
  'plato',
  25,
  false
FROM public.categories c WHERE c.name = 'Platos Principales';

INSERT INTO public.products (name, description, price, category_id, product_type, preparation_time, is_vegetarian) 
SELECT 
  'Agua Mineral',
  'Agua mineral natural 500ml',
  3.50,
  c.id,
  'bebida',
  2,
  true
FROM public.categories c WHERE c.name = 'Bebidas';
