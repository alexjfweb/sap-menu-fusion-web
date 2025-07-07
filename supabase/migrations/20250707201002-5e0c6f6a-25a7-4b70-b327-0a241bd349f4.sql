
-- FASE 1: CORRECCIÓN CRÍTICA DEL TRIGGER CON PROTECCIÓN DE SUPERADMINS

-- Primero eliminamos el trigger y función existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Crear función mejorada con protección completa de superadmins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    existing_role user_role;
BEGIN
    -- Log del evento para auditoría
    RAISE LOG 'handle_new_user triggered for user: % (email: %)', NEW.id, NEW.email;
    
    -- Verificar si ya existe un perfil (caso de re-sincronización)
    SELECT role INTO existing_role 
    FROM public.profiles 
    WHERE id = NEW.id;
    
    IF FOUND THEN
        -- El perfil ya existe
        RAISE LOG 'Profile already exists for user: % with role: %', NEW.id, existing_role;
        
        -- PROTECCIÓN CRÍTICA: Si es superadmin, NO TOCAR NUNCA
        IF existing_role = 'superadmin'::user_role THEN
            RAISE LOG 'PROTECTED: Superadmin role preserved for user: %', NEW.id;
            RETURN NEW; -- Salir sin modificar nada
        END IF;
        
        -- Si existe pero no es superadmin, actualizar a admin (caso de corrección)
        UPDATE public.profiles 
        SET 
            role = 'admin'::user_role,
            updated_at = now(),
            email = NEW.email,  -- Sincronizar email por si cambió
            full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name, NEW.email)
        WHERE id = NEW.id;
        
        RAISE LOG 'Updated existing profile to admin role for user: %', NEW.id;
    ELSE
        -- Crear nuevo perfil con rol admin por defecto
        -- Extraer nombre completo de metadatos o usar email como fallback
        INSERT INTO public.profiles (
            id, 
            email, 
            full_name, 
            role, 
            is_active,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(
                NEW.raw_user_meta_data->>'full_name', 
                NEW.raw_user_meta_data->>'name', 
                split_part(NEW.email, '@', 1), -- Usar parte antes del @ como nombre
                'Usuario'
            ),
            'admin'::user_role,  -- SIEMPRE admin para nuevos registros desde /auth
            true,
            now(),
            now()
        );
        
        RAISE LOG 'Created new profile with admin role for user: % (email: %)', NEW.id, NEW.email;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log detallado del error para debugging
        RAISE LOG 'ERROR in handle_new_user for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
        -- Re-lanzar el error para que el registro falle y se pueda investigar
        RAISE;
END;
$$;

-- Recrear el trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Función adicional para verificar integridad de roles críticos
CREATE OR REPLACE FUNCTION public.verify_superadmin_integrity()
RETURNS TABLE(email text, current_role user_role, should_be_superadmin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.email,
        p.role as current_role,
        (p.email IN ('alexjfweb@gmail.com', 'allseosoporte@gmail.com', 'superadmin@gmail.com')) as should_be_superadmin
    FROM public.profiles p
    WHERE p.email IN ('alexjfweb@gmail.com', 'allseosoporte@gmail.com', 'superadmin@gmail.com')
    ORDER BY p.email;
END;
$$;

-- Función de emergencia para restaurar superadmins (solo usar en caso de pérdida accidental)
CREATE OR REPLACE FUNCTION public.emergency_restore_superadmins()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    restored_count integer := 0;
    result_msg text;
BEGIN
    -- Restaurar superadmins autorizados que hayan perdido su rol
    UPDATE public.profiles 
    SET role = 'superadmin'::user_role, updated_at = now()
    WHERE email IN ('alexjfweb@gmail.com', 'allseosoporte@gmail.com', 'superadmin@gmail.com')
    AND role != 'superadmin'::user_role;
    
    GET DIAGNOSTICS restored_count = ROW_COUNT;
    
    result_msg := format('Emergency restore completed. %s superadmin roles restored.', restored_count);
    RAISE LOG '%', result_msg;
    
    RETURN result_msg;
END;
$$;

-- Verificar estado actual de superadmins
SELECT * FROM public.verify_superadmin_integrity();
