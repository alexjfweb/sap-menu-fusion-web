-- Update the handle_new_user trigger to detect admin-created employees
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new users with metadata detection
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role user_role;
  created_by_admin UUID;
  user_full_name TEXT;
BEGIN
  -- Extract metadata
  created_by_admin := (NEW.raw_user_meta_data->>'created_by_admin')::UUID;
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  
  -- Determine role based on metadata
  IF NEW.raw_user_meta_data->>'employee_creation' = 'true' AND created_by_admin IS NOT NULL THEN
    -- This is an employee being created by an admin
    user_role := 'empleado'::user_role;
  ELSE
    -- This is a regular registration (admin by default)
    user_role := 'admin'::user_role;
    created_by_admin := NULL; -- Regular users don't have created_by
  END IF;

  -- Insert into profiles with appropriate role and created_by
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    is_active,
    created_by
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_role,
    true,
    created_by_admin
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();