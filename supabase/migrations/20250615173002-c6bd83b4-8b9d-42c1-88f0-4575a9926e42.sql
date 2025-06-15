
-- Crear tabla para configuración de recordatorios
CREATE TABLE public.payment_reminder_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  days_before INTEGER NOT NULL, -- Días antes del vencimiento (puede ser negativo para después)
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('before', 'on_due', 'after')),
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'sms', 'whatsapp', 'push')),
  is_active BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  retry_interval_hours INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla para plantillas de mensajes
CREATE TABLE public.payment_reminder_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES payment_reminder_configs(id) ON DELETE CASCADE,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'sms', 'whatsapp', 'push')),
  subject TEXT, -- Para email
  message_body TEXT NOT NULL,
  tone TEXT CHECK (tone IN ('friendly', 'urgent', 'formal')) DEFAULT 'friendly',
  variables JSONB DEFAULT '{}', -- Variables dinámicas disponibles
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla para historial de recordatorios enviados
CREATE TABLE public.payment_reminder_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES payment_reminder_configs(id),
  subscription_id UUID REFERENCES user_subscriptions(id),
  user_id UUID REFERENCES auth.users(id),
  delivery_method TEXT NOT NULL,
  message_content TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered', 'read')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla para configuración global del sistema
CREATE TABLE public.payment_reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_messages_per_day INTEGER DEFAULT 50,
  spam_protection_enabled BOOLEAN DEFAULT true,
  audit_log_enabled BOOLEAN DEFAULT true,
  email_provider_config JSONB DEFAULT '{}',
  sms_provider_config JSONB DEFAULT '{}',
  whatsapp_provider_config JSONB DEFAULT '{}',
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla para logs de auditoría
CREATE TABLE public.payment_reminder_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  performed_by UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.payment_reminder_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminder_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminder_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reminder_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Solo superadmin puede gestionar recordatorios
CREATE POLICY "superadmin_manage_reminder_configs" ON public.payment_reminder_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

CREATE POLICY "superadmin_manage_reminder_templates" ON public.payment_reminder_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

CREATE POLICY "superadmin_view_reminder_history" ON public.payment_reminder_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

CREATE POLICY "system_insert_reminder_history" ON public.payment_reminder_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "superadmin_manage_reminder_settings" ON public.payment_reminder_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

CREATE POLICY "superadmin_view_audit_log" ON public.payment_reminder_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

CREATE POLICY "system_insert_audit_log" ON public.payment_reminder_audit_log
  FOR INSERT WITH CHECK (true);

-- Insertar configuración inicial
INSERT INTO public.payment_reminder_settings (
  max_messages_per_day,
  spam_protection_enabled,
  audit_log_enabled
) VALUES (50, true, true);

-- Insertar configuraciones de recordatorio por defecto
INSERT INTO public.payment_reminder_configs (name, days_before, reminder_type, delivery_method) VALUES
('Recordatorio 3 días antes', 3, 'before', 'email'),
('Recordatorio día del vencimiento', 0, 'on_due', 'email'),
('Recordatorio 1 día después', -1, 'after', 'email'),
('Recordatorio 5 días después', -5, 'after', 'email');

-- Insertar plantillas por defecto
INSERT INTO public.payment_reminder_templates (config_id, delivery_method, subject, message_body, tone, variables) 
SELECT 
  c.id,
  'email',
  CASE 
    WHEN c.reminder_type = 'before' THEN 'Recordatorio: Tu suscripción vence pronto'
    WHEN c.reminder_type = 'on_due' THEN 'Tu suscripción vence hoy'
    ELSE 'Suscripción vencida - Renueva ahora'
  END,
  CASE 
    WHEN c.reminder_type = 'before' THEN 'Hola {nombre_restaurante}, tu suscripción vence el {fecha_vencimiento}. Renueva ahora por ${monto}.'
    WHEN c.reminder_type = 'on_due' THEN 'Hola {nombre_restaurante}, tu suscripción vence hoy. Renueva ahora por ${monto}.'
    ELSE 'Hola {nombre_restaurante}, tu suscripción venció el {fecha_vencimiento}. Renueva ahora por ${monto}.'
  END,
  'friendly',
  '{"nombre_restaurante": "string", "fecha_vencimiento": "date", "monto": "number", "dias_restantes": "number"}'
FROM payment_reminder_configs c;

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_payment_reminder_history_user_id ON payment_reminder_history(user_id);
CREATE INDEX idx_payment_reminder_history_sent_at ON payment_reminder_history(sent_at);
CREATE INDEX idx_payment_reminder_history_status ON payment_reminder_history(status);
CREATE INDEX idx_payment_reminder_configs_active ON payment_reminder_configs(is_active);
