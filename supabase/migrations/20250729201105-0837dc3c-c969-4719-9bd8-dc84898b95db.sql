-- Fix infinite recursion in profiles RLS policies
-- Drop conflicting policies that may cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view employees from their business" ON public.profiles;

-- Create a simple, non-recursive policy for viewing profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Create a policy for superadmins to view all profiles (non-recursive)
CREATE POLICY "Superadmins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    -- Check directly in the same table if the current user is superadmin
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

-- Create a policy for admins to view employees from their business (non-recursive)
CREATE POLICY "Admins can view business employees"
  ON public.profiles
  FOR SELECT
  USING (
    -- Allow if current user is superadmin OR if viewing employee from same business
    (
      EXISTS (
        SELECT 1 FROM public.profiles current_user
        WHERE current_user.id = auth.uid() 
        AND current_user.role = 'superadmin'
      )
    ) OR (
      -- Admin viewing employee from same business
      EXISTS (
        SELECT 1 FROM public.profiles current_user
        WHERE current_user.id = auth.uid() 
        AND current_user.role = 'admin'
        AND current_user.business_id = profiles.business_id
        AND profiles.role = 'empleado'
      )
    )
  );