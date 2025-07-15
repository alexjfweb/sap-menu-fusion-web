-- Corregir políticas RLS para permitir que admins actualicen empleados

-- Eliminar política conflictiva que impide actualizar empleados
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Política para que admins y superadmins puedan actualizar cualquier perfil de admin/superadmin
CREATE POLICY "Admins can update admin profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role IN ('admin', 'superadmin')
  )
  AND role IN ('admin', 'superadmin')
);

-- Política para que admins puedan actualizar empleados que crearon
CREATE POLICY "Admins can update their employees"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role IN ('admin', 'superadmin')
    AND profiles.created_by_email = admin_profile.email
    AND profiles.role = 'empleado'
  )
);

-- Política para superadmins que pueden actualizar cualquier perfil
CREATE POLICY "Superadmins can update any profile"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role = 'superadmin'
  )
);