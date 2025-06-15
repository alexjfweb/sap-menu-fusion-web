
-- Crear tabla para capturar pedidos del carrito antes de sincronizar con orders
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  special_instructions TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  total_amount NUMERIC DEFAULT 0,
  cart_items JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para payment_orders
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir inserciones públicas (necesario para el formulario web)
CREATE POLICY "Anyone can create payment orders" ON public.payment_orders
FOR INSERT
WITH CHECK (true);

-- Crear política para que cualquiera pueda ver payment orders
CREATE POLICY "Anyone can view payment orders" ON public.payment_orders
FOR SELECT
USING (true);

-- Crear función para sincronizar payment_orders a orders
CREATE OR REPLACE FUNCTION sync_payment_order_to_order()
RETURNS TRIGGER AS $$
DECLARE
    new_order_id UUID;
    order_number_val TEXT;
    cart_item JSONB;
BEGIN
    -- Generar número de pedido único
    order_number_val := 'ORD-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(EXTRACT(EPOCH FROM now())::TEXT, 10, '0');

    -- Insertar en la tabla orders
    INSERT INTO orders (
        order_number,
        customer_name,
        customer_phone,
        status,
        total_amount,
        notes,
        created_at,
        updated_at
    ) VALUES (
        order_number_val,
        NEW.customer_name,
        NEW.customer_phone,
        CASE 
            WHEN NEW.status = 'pending' THEN 'pendiente'::order_status
            WHEN NEW.status = 'confirmed' THEN 'en_preparacion'::order_status
            WHEN NEW.status = 'cancelled' THEN 'cancelado'::order_status
            ELSE 'pendiente'::order_status
        END,
        NEW.total_amount,
        CASE 
            WHEN NEW.special_instructions IS NOT NULL AND NEW.payment_method IS NOT NULL THEN
                CONCAT('Instrucciones: ', NEW.special_instructions, ' | Método de pago: ', NEW.payment_method)
            WHEN NEW.special_instructions IS NOT NULL THEN
                CONCAT('Instrucciones: ', NEW.special_instructions)
            WHEN NEW.payment_method IS NOT NULL THEN
                CONCAT('Método de pago: ', NEW.payment_method)
            ELSE NULL
        END,
        NEW.created_at,
        NEW.updated_at
    ) RETURNING id INTO new_order_id;

    -- Insertar items del carrito en order_items
    FOR cart_item IN SELECT * FROM jsonb_array_elements(NEW.cart_items)
    LOOP
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            unit_price,
            total_price,
            special_instructions
        ) VALUES (
            new_order_id,
            (cart_item->>'product_id')::UUID,
            (cart_item->>'quantity')::INTEGER,
            (cart_item->>'unit_price')::NUMERIC,
            (cart_item->>'total_price')::NUMERIC,
            cart_item->>'special_instructions'
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecute después de INSERT en payment_orders
CREATE TRIGGER sync_payment_order_trigger
    AFTER INSERT ON payment_orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_payment_order_to_order();

-- Habilitar realtime para la tabla orders para sincronización en tiempo real
ALTER TABLE orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- También habilitar realtime para order_items
ALTER TABLE order_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
