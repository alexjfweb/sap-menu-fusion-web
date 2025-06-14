
-- Primero eliminamos las políticas existentes que podrían estar causando conflictos
DROP POLICY IF EXISTS "Enable public read access for available products" ON products;
DROP POLICY IF EXISTS "Enable public read access for active categories" ON categories;
DROP POLICY IF EXISTS "Enable public access to cart items" ON cart_items;
DROP POLICY IF EXISTS "Enable public read access to business info" ON business_info;

-- Deshabilitamos RLS temporalmente para recrear las políticas
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_info DISABLE ROW LEVEL SECURITY;

-- Volvemos a habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_info ENABLE ROW LEVEL SECURITY;

-- Creamos políticas más permisivas para acceso público
CREATE POLICY "Allow public read access to products" ON products
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public read access to categories" ON categories
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public access to cart items" ON cart_items
FOR ALL TO anon, authenticated USING (true);

CREATE POLICY "Allow public read access to business info" ON business_info
FOR SELECT TO anon, authenticated USING (true);
