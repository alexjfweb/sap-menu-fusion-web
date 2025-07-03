
-- Eliminar usuarios de la tabla profiles
DELETE FROM public.profiles WHERE email IN ('alexjfweb@gmail.com', 'alex10@gmail.com');

-- Nota: Los usuarios en auth.users se eliminarán automáticamente desde el panel de Supabase Auth
-- ya que no podemos eliminar directamente desde auth.users usando SQL por seguridad
