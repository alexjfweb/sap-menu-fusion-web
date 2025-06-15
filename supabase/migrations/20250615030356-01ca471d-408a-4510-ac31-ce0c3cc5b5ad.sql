
-- Eliminar políticas existentes si existen y crear nuevas
DROP POLICY IF EXISTS "Anyone can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Anyone can view reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can update reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can delete reservations" ON public.reservations;
DROP POLICY IF EXISTS "Authenticated users can view reservations" ON public.reservations;
DROP POLICY IF EXISTS "Employees can manage reservations" ON public.reservations;

-- Crear nuevas políticas RLS para la tabla reservations
CREATE POLICY "Anyone can create reservations" ON public.reservations
FOR INSERT
WITH CHECK (true);

-- Crear política para que cualquiera pueda ver reservas (necesario para sincronización)
CREATE POLICY "Anyone can view reservations" ON public.reservations
FOR SELECT
USING (true);

-- Política para que los empleados y administradores puedan actualizar reservas
CREATE POLICY "Staff can update reservations" ON public.reservations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('empleado', 'admin', 'superadmin')
  )
);

-- Política para que los administradores puedan eliminar reservas
CREATE POLICY "Staff can delete reservations" ON public.reservations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('empleado', 'admin', 'superadmin')
  )
);
