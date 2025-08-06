-- Agregar política para permitir lectura pública de planes activos
CREATE POLICY "public_can_view_active_subscription_plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);