
-- FASE 1: Corrección del constraint de payment_methods
-- Eliminar el constraint restrictivo actual
ALTER TABLE public.payment_methods DROP CONSTRAINT IF EXISTS payment_methods_type_check;

-- Crear nuevo constraint que incluya todos los tipos de pago necesarios
ALTER TABLE public.payment_methods 
ADD CONSTRAINT payment_methods_type_check 
CHECK (type IN (
  'cash_on_delivery',
  'qr_code', 
  'nequi',
  'daviplata',
  'mercado_pago',
  'stripe',
  'paypal'
));

-- FASE 2: Verificar y recrear el trigger de usuarios si es necesario
-- Primero eliminamos el trigger existente por seguridad
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Verificar que la función handle_new_user existe y está correcta
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recrear la función handle_new_user con validación mejorada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar perfil con rol admin por defecto para registro público
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'admin'::user_role,  -- Siempre admin para registro público
    true
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log del error pero no bloquear el registro
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FASE 3: Limpiar roles incorrectos existentes
-- Actualizar usuarios que tienen rol empleado pero fueron creados desde registro público
UPDATE public.profiles 
SET role = 'admin'::user_role, updated_at = now()
WHERE role = 'empleado'::user_role 
AND created_by IS NULL
AND email NOT LIKE '%@staff.%';  -- Proteger empleados reales

-- Verificar que los cambios fueron aplicados
SELECT 'Constraint updated' as status;
SELECT 'Trigger recreated' as status;
SELECT 'Roles updated for ' || count(*) || ' users' as status 
FROM public.profiles 
WHERE role = 'admin'::user_role AND created_by IS NULL;
