-- Habilitar RLS si no está activado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: los admins pueden ver empleados que ellos crearon
CREATE POLICY "Admins pueden ver sus empleados"
ON profiles
FOR SELECT
USING (
  (role = 'empleado' AND created_by_email = auth.email())
  OR (role = 'empleado' AND auth.role() = 'service_role') -- para pruebas y migraciones
);

-- Política: los superadmins pueden ver todos los empleados
CREATE POLICY "Superadmins pueden ver todos los empleados"
ON profiles
FOR SELECT
USING (
  (role = 'empleado' AND auth.jwt()::jsonb ->> 'user_role' = 'superadmin')
);

-- Política temporal para desarrollo: permitir a cualquier usuario autenticado ver empleados
-- (puedes eliminarla en producción si quieres más restricción)
CREATE POLICY "Cualquier usuario autenticado puede ver empleados (temporal)"
ON profiles
FOR SELECT
USING (
  role = 'empleado'
); 