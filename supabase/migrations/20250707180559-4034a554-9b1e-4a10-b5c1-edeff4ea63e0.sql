
-- Actualizar el trigger para asegurar que asigne rol 'admin' por defecto
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Crear función mejorada para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'admin'::user_role,  -- SIEMPRE asignar admin por defecto
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Actualizar usuarios existentes que tienen rol incorrecto
-- Cambiar empleados a admin si fueron creados desde registro público
UPDATE public.profiles 
SET role = 'admin'::user_role, updated_at = now()
WHERE role = 'empleado'::user_role 
AND created_by IS NULL  -- Usuarios creados desde registro público
AND id NOT IN (
  -- Excluir usuarios específicos que sabemos que deben ser empleados
  SELECT id FROM public.profiles 
  WHERE email IN ('staff@restaurant.com')
);
