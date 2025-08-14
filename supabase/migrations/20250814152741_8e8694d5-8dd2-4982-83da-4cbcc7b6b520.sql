-- Agregar columna mp_preapproval_id para almacenar ID de suscripción de Mercado Pago
ALTER TABLE public.user_subscriptions 
ADD COLUMN mp_preapproval_id TEXT;

-- Agregar índice para consultas eficientes del webhook
CREATE INDEX idx_user_subscriptions_mp_preapproval_id ON public.user_subscriptions(mp_preapproval_id);

-- Corregir starts_at para tener valor por defecto
ALTER TABLE public.user_subscriptions 
ALTER COLUMN starts_at SET DEFAULT now();

-- Agregar columnas de fechas específicas para mejor tracking
ALTER TABLE public.user_subscriptions 
ADD COLUMN current_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN canceled_at TIMESTAMP WITH TIME ZONE;