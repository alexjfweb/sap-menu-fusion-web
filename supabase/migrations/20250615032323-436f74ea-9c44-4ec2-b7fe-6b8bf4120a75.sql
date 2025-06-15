
-- Crear políticas RLS para permitir inserciones públicas en orders (necesario para el trigger)
CREATE POLICY "Anyone can create orders" ON public.orders
FOR INSERT
WITH CHECK (true);

-- Crear política para que cualquiera pueda ver orders
CREATE POLICY "Anyone can view orders" ON public.orders
FOR SELECT
USING (true);

-- Crear políticas para que usuarios autenticados puedan actualizar y eliminar
CREATE POLICY "Authenticated users can update orders" ON public.orders
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete orders" ON public.orders
FOR DELETE
USING (auth.role() = 'authenticated');

-- También crear políticas similares para order_items
CREATE POLICY "Anyone can create order items" ON public.order_items
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view order items" ON public.order_items
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can update order items" ON public.order_items
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete order items" ON public.order_items
FOR DELETE
USING (auth.role() = 'authenticated');
