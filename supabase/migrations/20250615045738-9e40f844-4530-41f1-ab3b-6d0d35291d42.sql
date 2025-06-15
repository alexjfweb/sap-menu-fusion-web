
-- Verificar si las tablas existen y crearlas si no están
-- Crear enums si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('empleado', 'admin', 'superadmin');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
        CREATE TYPE public.reservation_status AS ENUM ('pendiente', 'confirmada', 'cancelada', 'completada');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type') THEN
        CREATE TYPE public.product_type AS ENUM ('plato', 'bebida', 'postre', 'entrada', 'acompañamiento');
    END IF;
END $$;

-- Crear tabla profiles si no existe
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'empleado',
  is_active BOOLEAN DEFAULT true,
  password_hash TEXT,
  phone_landline VARCHAR(20),
  phone_mobile VARCHAR(20),
  address TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla categories si no existe
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla products si no existe
CREATE TABLE IF NOT EXISTS public.products (
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

-- Crear tabla tables si no existe
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER NOT NULL UNIQUE,
  capacity INTEGER NOT NULL,
  is_available BOOLEAN DEFAULT true,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla orders si no existe
CREATE TABLE IF NOT EXISTS public.orders (
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

-- Crear tabla order_items si no existe
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla reservations si no existe
CREATE TABLE IF NOT EXISTS public.reservations (
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

-- Crear tabla business_info si no existe
CREATE TABLE IF NOT EXISTS public.business_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  tax_id TEXT,
  phone TEXT,
  address TEXT,
  email TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  whatsapp_url TEXT,
  tiktok_url TEXT,
  website_url TEXT,
  public_menu_url TEXT,
  description TEXT,
  nequi_number TEXT,
  nequi_qr_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insertar datos iniciales si no existen
INSERT INTO public.categories (name, description, sort_order) 
SELECT 'Entradas', 'Platos para comenzar la comida', 1
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Entradas');

INSERT INTO public.categories (name, description, sort_order) 
SELECT 'Platos Principales', 'Platos principales del menú', 2
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Platos Principales');

INSERT INTO public.categories (name, description, sort_order) 
SELECT 'Bebidas', 'Bebidas frías y calientes', 3
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Bebidas');

INSERT INTO public.tables (table_number, capacity, location) 
SELECT 1, 2, 'interior'
WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE table_number = 1);

INSERT INTO public.tables (table_number, capacity, location) 
SELECT 2, 4, 'interior'
WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE table_number = 2);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas para acceso público al menú
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access to business info" ON business_info;

CREATE POLICY "Allow public read access to products" ON products
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public read access to categories" ON categories
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public read access to business info" ON business_info
FOR SELECT TO anon, authenticated USING (true);

-- Políticas básicas para reservas (acceso público para crear)
DROP POLICY IF EXISTS "Anyone can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Anyone can view reservations" ON public.reservations;

CREATE POLICY "Anyone can create reservations" ON public.reservations
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view reservations" ON public.reservations
FOR SELECT USING (true);
