-- Función para actualizar rol de usuario a superadmin (solo para usuarios específicos)
CREATE OR REPLACE FUNCTION public.promote_to_superadmin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_exists boolean;
BEGIN
    -- Verificar si el usuario existe en profiles
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE email = user_email) INTO user_exists;
    
    IF NOT user_exists THEN
        RETURN false;
    END IF;
    
    -- Actualizar rol a superadmin solo para emails específicos autorizados
    IF user_email IN ('alexjfweb@gmail.com', 'allseosoporte@gmail.com', 'superadmin@gmail.com') THEN
        UPDATE public.profiles 
        SET role = 'superadmin'::user_role, 
            updated_at = now()
        WHERE email = user_email;
        
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;