
-- Crear políticas para permitir inserción de productos de ejemplo
DROP POLICY IF EXISTS "Allow initial data insertion for products" ON products;
DROP POLICY IF EXISTS "Allow initial data insertion for business_info" ON business_info;

-- Política temporal para permitir inserción de productos de ejemplo
CREATE POLICY "Allow initial data insertion for products" ON products
FOR INSERT WITH CHECK (true);

-- Política temporal para permitir inserción de información del negocio
CREATE POLICY "Allow initial data insertion for business_info" ON business_info
FOR INSERT WITH CHECK (true);

-- También necesitamos políticas de actualización para productos
CREATE POLICY "Allow authenticated users to manage products" ON products
FOR ALL TO authenticated USING (
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

-- Política para que los administradores puedan gestionar la información del negocio
CREATE POLICY "Allow admins to manage business info" ON business_info
FOR ALL TO authenticated USING (
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
