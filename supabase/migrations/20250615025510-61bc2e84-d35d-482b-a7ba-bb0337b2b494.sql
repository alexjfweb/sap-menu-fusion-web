
-- Crear función para sincronizar reservas de payment_reservations a reservations
CREATE OR REPLACE FUNCTION sync_payment_reservation_to_reservation()
RETURNS TRIGGER AS $$
DECLARE
    available_table_id UUID;
BEGIN
    -- Buscar una mesa disponible que tenga suficiente capacidad
    SELECT id INTO available_table_id
    FROM tables 
    WHERE capacity >= NEW.party_size 
    AND is_available = true
    ORDER BY capacity ASC
    LIMIT 1;

    -- Si no hay mesa disponible, usar NULL
    IF available_table_id IS NULL THEN
        available_table_id := NULL;
    END IF;

    -- Insertar en la tabla reservations
    INSERT INTO reservations (
        customer_name,
        customer_phone,
        customer_email,
        party_size,
        reservation_date,
        reservation_time,
        special_requests,
        table_id,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.customer_name,
        NEW.customer_phone,
        NEW.customer_email,
        NEW.party_size,
        NEW.reservation_date,
        NEW.reservation_time,
        NEW.special_requests,
        available_table_id,
        CASE 
            WHEN NEW.status = 'pending' THEN 'pendiente'::reservation_status
            WHEN NEW.status = 'confirmed' THEN 'confirmada'::reservation_status
            WHEN NEW.status = 'cancelled' THEN 'cancelada'::reservation_status
            ELSE 'pendiente'::reservation_status
        END,
        NEW.created_at,
        NEW.updated_at
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecute después de INSERT en payment_reservations
CREATE TRIGGER sync_payment_reservation_trigger
    AFTER INSERT ON payment_reservations
    FOR EACH ROW
    EXECUTE FUNCTION sync_payment_reservation_to_reservation();

-- Habilitar realtime para la tabla reservations para sincronización en tiempo real
ALTER TABLE reservations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
