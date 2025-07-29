-- Fix infinite recursion in profiles RLS policies using existing security definer functions
-- Drop conflicting policies that may cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view employees from their business" ON public.profiles;

-- Update existing policies to use security definer functions instead of direct table queries
-- This prevents infinite recursion

-- Policy for superadmins to view all profiles (using existing function)
CREATE POLICY "Superadmins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.get_current_user_role() = 'superadmin');

-- Policy for admins to view employees from their business (using existing functions)
CREATE POLICY "Admins can view business employees"
  ON public.profiles
  FOR SELECT
  USING (
    -- Allow superadmins to see everything
    public.get_current_user_role() = 'superadmin' OR
    -- Allow admins to see employees from their business
    (
      public.get_current_user_role() = 'admin' AND
      profiles.role = 'empleado' AND
      profiles.business_id = public.get_current_user_business_id()
    )
  );