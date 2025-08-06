-- Agregar 'bancolombia' como tipo de método de pago válido
ALTER TABLE payment_methods 
DROP CONSTRAINT IF EXISTS payment_methods_type_check;

ALTER TABLE payment_methods 
ADD CONSTRAINT payment_methods_type_check 
CHECK (type IN ('cash_on_delivery', 'qr_code', 'nequi', 'daviplata', 'mercado_pago', 'stripe', 'paypal', 'bancolombia'));