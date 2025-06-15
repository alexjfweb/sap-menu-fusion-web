
-- Habilitar RLS en menu_customization si no está habilitado
ALTER TABLE menu_customization ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir acceso público de solo lectura
CREATE POLICY "Allow public read access to menu customization"
ON menu_customization
FOR SELECT
TO anon
USING (true);

-- También permitir acceso a usuarios autenticados
CREATE POLICY "Allow authenticated read access to menu customization"
ON menu_customization
FOR SELECT
TO authenticated
USING (true);

-- Permitir a usuarios autenticados insertar/actualizar (para el panel de administración)
CREATE POLICY "Allow authenticated users to manage menu customization"
ON menu_customization
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
