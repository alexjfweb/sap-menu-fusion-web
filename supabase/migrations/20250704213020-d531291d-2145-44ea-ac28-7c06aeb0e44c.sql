
-- Crear política para permitir acceso público de solo lectura a menu_customization
CREATE POLICY "Allow public read access to menu customization"
ON menu_customization
FOR SELECT
TO anon
USING (true);

-- También asegurar que usuarios autenticados puedan leer
CREATE POLICY "Allow authenticated read access to menu customization"
ON menu_customization
FOR SELECT
TO authenticated
USING (true);
