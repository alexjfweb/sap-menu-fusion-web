
-- Add new fields to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS phone_landline VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add a comment to clarify the password field usage
COMMENT ON COLUMN public.profiles.password_hash IS 'Temporary field for user creation, should be cleared after auth user creation';
