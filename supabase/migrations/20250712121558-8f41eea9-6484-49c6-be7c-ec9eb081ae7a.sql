-- Crear política RLS para UPDATE en business_info
-- Esta política permite que usuarios autenticados puedan actualizar información del negocio

CREATE POLICY "Authenticated users can update business info" 
ON public.business_info 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);