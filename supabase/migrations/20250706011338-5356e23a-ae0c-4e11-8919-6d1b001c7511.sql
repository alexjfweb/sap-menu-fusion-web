
-- Tabla para registrar todas las actividades de los empleados
CREATE TABLE public.employee_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'order_created', 'reservation_updated', 'product_modified', 'employee_created', etc.
  description TEXT NOT NULL,
  entity_type TEXT, -- 'order', 'reservation', 'product', 'employee'
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para notificaciones del sistema
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'error', 'task_assigned'
  is_read BOOLEAN DEFAULT false,
  entity_type TEXT, -- 'order', 'reservation', 'product'
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para configuraciones específicas de empleados
CREATE TABLE public.employee_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "task_assigned": true, "menu_changes": true}',
  work_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para optimización de consultas
CREATE INDEX idx_employee_activities_employee_date ON public.employee_activities(employee_id, created_at DESC);
CREATE INDEX idx_employee_activities_type ON public.employee_activities(activity_type);
CREATE INDEX idx_notifications_recipient_unread ON public.notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- RLS Policies para employee_activities
ALTER TABLE public.employee_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all employee activities" 
  ON public.employee_activities 
  FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'superadmin'::user_role]))
  );

CREATE POLICY "Employees can view their own activities" 
  ON public.employee_activities 
  FOR SELECT 
  USING (employee_id = auth.uid());

CREATE POLICY "System can insert employee activities" 
  ON public.employee_activities 
  FOR INSERT 
  WITH CHECK (true);

-- RLS Policies para notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (recipient_id = auth.uid());

CREATE POLICY "Admins can create notifications for their employees" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'superadmin'::user_role]))
  );

-- RLS Policies para employee_settings
ALTER TABLE public.employee_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can manage their own settings" 
  ON public.employee_settings 
  FOR ALL 
  USING (employee_id = auth.uid());

CREATE POLICY "Admins can view employee settings" 
  ON public.employee_settings 
  FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ANY(ARRAY['admin'::user_role, 'superadmin'::user_role]))
  );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para employee_settings
CREATE TRIGGER update_employee_settings_updated_at 
  BEFORE UPDATE ON public.employee_settings 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Función para registrar actividades automáticamente
CREATE OR REPLACE FUNCTION public.log_employee_activity(
  p_employee_id UUID,
  p_activity_type TEXT,
  p_description TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.employee_activities (
    employee_id,
    activity_type,
    description,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_employee_id,
    p_activity_type,
    p_description,
    p_entity_type,
    p_entity_id,
    p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear notificaciones
CREATE OR REPLACE FUNCTION public.create_notification(
  p_recipient_id UUID,
  p_sender_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    sender_id,
    title,
    message,
    type,
    entity_type,
    entity_id,
    metadata,
    expires_at
  ) VALUES (
    p_recipient_id,
    p_sender_id,
    p_title,
    p_message,
    p_type,
    p_entity_type,
    p_entity_id,
    p_metadata,
    p_expires_at
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
