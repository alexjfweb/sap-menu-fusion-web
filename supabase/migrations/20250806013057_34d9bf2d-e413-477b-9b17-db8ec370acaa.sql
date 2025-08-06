-- Insertar plan gratuito
INSERT INTO subscription_plans (
  name,
  description,
  price,
  currency,
  billing_interval,
  features,
  is_active,
  is_featured,
  trial_days,
  sort_order
) VALUES (
  'Plan Gratuito',
  'Comienza gratis con funciones básicas para probar nuestra plataforma. Perfecto para restaurantes que quieren explorar las funcionalidades digitales sin compromiso.',
  0,
  'USD',
  'monthly',
  '[
    "Menú Digital Básico: Hasta 5 platos",
    "Código QR para menú",
    "Configuración básica del negocio",
    "Soporte por email",
    "Sin límite de tiempo"
  ]',
  true,
  false,
  0,
  -1
);

-- Crear configuraciones por defecto para los planes existentes
INSERT INTO plan_configurations (plan_id, max_products, max_users, max_reservations_per_day, max_tables, max_locations, support_type, support_priority, customization_level, features_enabled, integrations_enabled, api_access_enabled, whitelabel_enabled, custom_domain_enabled, advanced_analytics_enabled, multi_location_enabled)
SELECT 
  sp.id,
  CASE 
    WHEN sp.name = 'Plan Gratuito' THEN 5
    WHEN sp.name = 'Plan Básico' THEN 12
    WHEN sp.name = 'Plan Estándar' THEN 50
    WHEN sp.name = 'Plan Premium' THEN 120
    ELSE 10
  END as max_products,
  CASE 
    WHEN sp.name = 'Plan Gratuito' THEN 1
    WHEN sp.name = 'Plan Básico' THEN 1
    WHEN sp.name = 'Plan Estándar' THEN 3
    WHEN sp.name = 'Plan Premium' THEN 10
    ELSE 1
  END as max_users,
  CASE 
    WHEN sp.name = 'Plan Gratuito' THEN 5
    WHEN sp.name = 'Plan Básico' THEN 10
    WHEN sp.name = 'Plan Estándar' THEN 50
    WHEN sp.name = 'Plan Premium' THEN 120
    ELSE 10
  END as max_reservations_per_day,
  CASE 
    WHEN sp.name = 'Plan Gratuito' THEN 3
    WHEN sp.name = 'Plan Básico' THEN 5
    WHEN sp.name = 'Plan Estándar' THEN 15
    WHEN sp.name = 'Plan Premium' THEN 50
    ELSE 5
  END as max_tables,
  1 as max_locations,
  CASE 
    WHEN sp.name = 'Plan Gratuito' THEN 'email'
    WHEN sp.name = 'Plan Básico' THEN 'email'
    WHEN sp.name = 'Plan Estándar' THEN 'chat'
    WHEN sp.name = 'Plan Premium' THEN 'priority'
    ELSE 'email'
  END as support_type,
  CASE 
    WHEN sp.name = 'Plan Gratuito' THEN 'low'
    WHEN sp.name = 'Plan Básico' THEN 'low'
    WHEN sp.name = 'Plan Estándar' THEN 'medium'
    WHEN sp.name = 'Plan Premium' THEN 'high'
    ELSE 'low'
  END as support_priority,
  CASE 
    WHEN sp.name = 'Plan Gratuito' THEN 'basic'
    WHEN sp.name = 'Plan Básico' THEN 'basic'
    WHEN sp.name = 'Plan Estándar' THEN 'advanced'
    WHEN sp.name = 'Plan Premium' THEN 'full'
    ELSE 'basic'
  END as customization_level,
  CASE 
    WHEN sp.name = 'Plan Gratuito' THEN '{"basic_menu": true, "qr_codes": true}'
    WHEN sp.name = 'Plan Básico' THEN '{"basic_menu": true, "qr_codes": true, "orders": true, "reservations": true}'
    WHEN sp.name = 'Plan Estándar' THEN '{"basic_menu": true, "qr_codes": true, "orders": true, "reservations": true, "analytics": true, "customization": true}'
    WHEN sp.name = 'Plan Premium' THEN '{"basic_menu": true, "qr_codes": true, "orders": true, "reservations": true, "analytics": true, "customization": true, "advanced_reports": true, "employee_management": true}'
    ELSE '{}'
  END::jsonb as features_enabled,
  CASE 
    WHEN sp.name = 'Plan Gratuito' THEN '{}'
    WHEN sp.name = 'Plan Básico' THEN '{"whatsapp": true}'
    WHEN sp.name = 'Plan Estándar' THEN '{"whatsapp": true, "email": true}'
    WHEN sp.name = 'Plan Premium' THEN '{"whatsapp": true, "email": true, "sms": true, "payment_gateways": true}'
    ELSE '{}'
  END::jsonb as integrations_enabled,
  CASE 
    WHEN sp.name = 'Plan Premium' THEN true
    ELSE false
  END as api_access_enabled,
  false as whitelabel_enabled,
  CASE 
    WHEN sp.name = 'Plan Premium' THEN true
    ELSE false
  END as custom_domain_enabled,
  CASE 
    WHEN sp.name = 'Plan Estándar' OR sp.name = 'Plan Premium' THEN true
    ELSE false
  END as advanced_analytics_enabled,
  false as multi_location_enabled
FROM subscription_plans sp
WHERE sp.is_active = true
AND NOT EXISTS (
  SELECT 1 FROM plan_configurations pc WHERE pc.plan_id = sp.id
);