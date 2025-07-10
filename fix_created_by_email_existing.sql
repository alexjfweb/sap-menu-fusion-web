-- Actualizar empleados existentes para que tengan el campo created_by_email correcto
UPDATE profiles
SET created_by_email = (
  SELECT email FROM profiles AS admin
  WHERE admin.id = profiles.created_by
)
WHERE role = 'empleado' AND created_by IS NOT NULL AND created_by_email IS NULL; 