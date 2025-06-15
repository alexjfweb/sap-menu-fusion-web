
-- Primero eliminamos todas las políticas existentes que causan recursión
DROP POLICY IF EXISTS "Admins and superadmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and superadmins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and superadmins can create profiles" ON public.profiles;

-- Creamos una función segura para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- Políticas nuevas sin recursión
-- Permitir que los usuarios vean su propio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Permitir que admins y superadmins vean todos los perfiles usando la función
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.get_current_user_role() IN ('admin', 'superadmin'));

-- Permitir que los usuarios actualicen su propio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Permitir que admins y superadmins actualicen todos los perfiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.get_current_user_role() IN ('admin', 'superadmin'));

-- Permitir inserción de perfiles (para nuevos usuarios)
CREATE POLICY "Allow profile creation"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Permitir que admins creen perfiles para otros usuarios
CREATE POLICY "Admins can create any profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.get_current_user_role() IN ('admin', 'superadmin'));
