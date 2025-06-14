
-- Enable RLS on products and categories tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to available products
CREATE POLICY "Enable public read access for available products" ON products
FOR SELECT USING (is_available = true);

-- Create policy to allow public read access to active categories
CREATE POLICY "Enable public read access for active categories" ON categories
FOR SELECT USING (is_active = true);

-- Enable RLS on cart_items table and allow public access
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access to cart items (session-based)
CREATE POLICY "Enable public access to cart items" ON cart_items
FOR ALL USING (true);

-- Enable RLS on business_info table and allow public read access
ALTER TABLE business_info ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to business info
CREATE POLICY "Enable public read access to business info" ON business_info
FOR SELECT USING (true);
