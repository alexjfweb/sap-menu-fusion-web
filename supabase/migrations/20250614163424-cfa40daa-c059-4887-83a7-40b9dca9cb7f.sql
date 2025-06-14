
-- Insertar algunas reservas de ejemplo para mostrar funcionalidad
INSERT INTO public.reservations (
  customer_name, 
  customer_phone, 
  customer_email, 
  party_size, 
  reservation_date, 
  reservation_time, 
  table_id, 
  status, 
  special_requests
) 
SELECT 
  CASE (ROW_NUMBER() OVER()) % 6
    WHEN 1 THEN 'Roberto Silva'
    WHEN 2 THEN 'Carmen Jiménez'
    WHEN 3 THEN 'David Morales'
    WHEN 4 THEN 'Elena Ruiz'
    WHEN 5 THEN 'Miguel Torres'
    ELSE 'Isabel Vega'
  END,
  CASE (ROW_NUMBER() OVER()) % 6
    WHEN 1 THEN '+34 611 222 333'
    WHEN 2 THEN '+34 622 333 444'
    WHEN 3 THEN '+34 633 444 555'
    WHEN 4 THEN '+34 644 555 666'
    WHEN 5 THEN '+34 655 666 777'
    ELSE '+34 666 777 888'
  END,
  CASE (ROW_NUMBER() OVER()) % 6
    WHEN 1 THEN 'roberto@email.com'
    WHEN 2 THEN 'carmen@email.com'
    WHEN 3 THEN 'david@email.com'
    WHEN 4 THEN 'elena@email.com'
    WHEN 5 THEN 'miguel@email.com'
    ELSE 'isabel@email.com'
  END,
  CASE (ROW_NUMBER() OVER()) % 4 + 2
    WHEN 2 THEN 2
    WHEN 3 THEN 4
    WHEN 4 THEN 6
    ELSE 8
  END,
  CURRENT_DATE + INTERVAL '1 day' * ((ROW_NUMBER() OVER()) % 7),
  TIME '19:00:00' + INTERVAL '30 minutes' * ((ROW_NUMBER() OVER()) % 8),
  t.id,
  CASE (ROW_NUMBER() OVER()) % 4
    WHEN 1 THEN 'pendiente'::reservation_status
    WHEN 2 THEN 'confirmada'::reservation_status
    WHEN 3 THEN 'completada'::reservation_status
    ELSE 'pendiente'::reservation_status
  END,
  CASE (ROW_NUMBER() OVER()) % 3
    WHEN 1 THEN 'Mesa junto a la ventana'
    WHEN 2 THEN 'Celebración de cumpleaños'
    ELSE NULL
  END
FROM public.tables t
WHERE t.table_number <= 5
ON CONFLICT DO NOTHING;

-- Habilitar RLS en la tabla reservations si no está ya habilitado
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Crear políticas para reservas
CREATE POLICY "Authenticated users can view reservations" ON public.reservations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Employees can manage reservations" ON public.reservations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('empleado', 'admin', 'superadmin')
    )
  );
