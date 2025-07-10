-- Script para arreglar el filtrado de empleados por created_by_email
-- Ejecutar en el SQL Editor de Supabase

-- 1. Agregar la columna created_by_email a la tabla profiles
ALTER TABLE profiles
ADD COLUMN created_by_email TEXT;

-- 2. Migrar los datos existentes: actualizar created_by_email con el email del admin que creó cada empleado
UPDATE profiles
SET created_by_email = (
  SELECT email FROM profiles AS admin
  WHERE admin.id = profiles.created_by
)
WHERE role = 'empleado' AND created_by IS NOT NULL;

-- 3. Verificar que los datos se migraron correctamente
SELECT 
  id,
  email,
  role,
  created_by,
  created_by_email,
  created_at
FROM profiles 
WHERE role = 'empleado'
ORDER BY created_at DESC;

-- 4. Crear un índice para mejorar el rendimiento de las consultas por created_by_email
CREATE INDEX IF NOT EXISTS idx_profiles_created_by_email 
ON profiles(created_by_email) 
WHERE role = 'empleado'; 