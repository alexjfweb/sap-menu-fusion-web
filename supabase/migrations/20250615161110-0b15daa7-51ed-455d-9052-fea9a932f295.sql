
-- Crear tabla para planes de suscripción
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly', 'weekly')),
  features JSONB DEFAULT '[]',
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  max_subscribers INTEGER,
  trial_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla para métodos de pago
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('stripe', 'nequi', 'qr')),
  is_active BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}',
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla para transacciones
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  plan_id UUID REFERENCES subscription_plans(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  nequi_transaction_id TEXT,
  qr_code_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla para suscripciones de usuarios
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, plan_id)
);

-- Crear tabla para códigos QR
CREATE TABLE public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
  qr_data TEXT NOT NULL,
  qr_image_url TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  payment_provider TEXT CHECK (payment_provider IN ('bancolombia', 'daviplata', 'nequi')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para subscription_plans (solo superadmin y admin pueden gestionar)
CREATE POLICY "superadmin_admin_manage_plans" ON public.subscription_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'admin')
    )
  );

-- Política para que cualquier usuario autenticado pueda ver planes activos
CREATE POLICY "users_view_active_plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- Políticas RLS para payment_methods (solo superadmin puede gestionar)
CREATE POLICY "superadmin_manage_payment_methods" ON public.payment_methods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

-- Políticas RLS para transactions
CREATE POLICY "users_view_own_transactions" ON public.transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "superadmin_admin_view_all_transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "system_insert_transactions" ON public.transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "system_update_transactions" ON public.transactions
  FOR UPDATE USING (true);

-- Políticas RLS para user_subscriptions
CREATE POLICY "users_view_own_subscriptions" ON public.user_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "superadmin_admin_view_all_subscriptions" ON public.user_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "system_manage_subscriptions" ON public.user_subscriptions
  FOR ALL USING (true);

-- Políticas RLS para qr_codes
CREATE POLICY "users_view_qr_codes" ON public.qr_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "superadmin_admin_manage_qr_codes" ON public.qr_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('superadmin', 'admin')
    )
  );

-- Insertar métodos de pago por defecto
INSERT INTO public.payment_methods (name, type, configuration) VALUES
('Stripe', 'stripe', '{"publishable_key": "", "webhook_secret": ""}'),
('Nequi', 'nequi', '{"api_key": "", "merchant_id": "", "webhook_url": ""}'),
('QR Bancolombia', 'qr', '{"provider": "bancolombia", "merchant_code": ""}'),
('QR Daviplata', 'qr', '{"provider": "daviplata", "merchant_code": ""}');

-- Insertar planes de ejemplo
INSERT INTO public.subscription_plans (name, description, price, currency, billing_interval, features) VALUES
('Plan Básico', 'Perfecto para restaurantes pequeños', 29.99, 'USD', 'monthly', 
 '["Hasta 5 usuarios", "Gestión básica de menú", "Reportes básicos", "Soporte por email"]'),
('Plan Profesional', 'Para restaurantes en crecimiento', 79.99, 'USD', 'monthly',
 '["Usuarios ilimitados", "Gestión avanzada de menú", "Reportes detallados", "Integraciones", "Soporte prioritario"]'),
('Plan Empresarial', 'Para cadenas de restaurantes', 199.99, 'USD', 'monthly',
 '["Todo del Plan Profesional", "Multi-sucursal", "API personalizada", "Soporte 24/7", "Gerente de cuenta dedicado"]');
