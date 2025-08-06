-- Enable superadmins to fully manage subscription plans
CREATE POLICY "superadmins_manage_subscription_plans" 
ON subscription_plans 
FOR ALL 
USING (EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'))
WITH CHECK (EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Drop the existing restrictive policy if it exists
DROP POLICY IF EXISTS "users_view_active_plans" ON subscription_plans;