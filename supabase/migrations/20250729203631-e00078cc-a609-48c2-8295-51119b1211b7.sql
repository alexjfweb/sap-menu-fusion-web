-- Create function to get unique business info with validation
CREATE OR REPLACE FUNCTION public.get_unique_business_info()
RETURNS TABLE(
  id uuid,
  business_name text,
  description text,
  tax_id text,
  phone text,
  address text,
  email text,
  logo_url text,
  cover_image_url text,
  facebook_url text,
  instagram_url text,
  twitter_url text,
  website_url text,
  public_menu_url text,
  whatsapp_url text,
  tiktok_url text,
  nequi_number text,
  nequi_qr_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_business_id uuid;
  business_count integer;
BEGIN
  -- Get the current user's business_id
  SELECT business_id INTO user_business_id 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- If no business_id found, return empty
  IF user_business_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Count how many business_info records exist for this business_id
  SELECT COUNT(*) INTO business_count
  FROM public.business_info 
  WHERE public.business_info.id = user_business_id;
  
  -- If no records found, return empty
  IF business_count = 0 THEN
    RETURN;
  END IF;
  
  -- If multiple records found for the same business_id (shouldn't happen but validate)
  IF business_count > 1 THEN
    RAISE EXCEPTION 'Multiple business records found for business_id: %. Please contact support.', user_business_id
      USING ERRCODE = 'check_violation';
  END IF;
  
  -- Return the single business record
  RETURN QUERY
  SELECT 
    bi.id,
    bi.business_name,
    bi.description,
    bi.tax_id,
    bi.phone,
    bi.address,
    bi.email,
    bi.logo_url,
    bi.cover_image_url,
    bi.facebook_url,
    bi.instagram_url,
    bi.twitter_url,
    bi.website_url,
    bi.public_menu_url,
    bi.whatsapp_url,
    bi.tiktok_url,
    bi.nequi_number,
    bi.nequi_qr_url,
    bi.created_at,
    bi.updated_at
  FROM public.business_info bi
  WHERE bi.id = user_business_id;
END;
$$;

-- Create function to clean up duplicate business records (optional)
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_business_records()
RETURNS TABLE(
  cleaned_count integer,
  remaining_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role text;
  total_cleaned integer := 0;
  total_remaining integer := 0;
BEGIN
  -- Only superadmins can run this cleanup
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'superadmin' THEN
    RAISE EXCEPTION 'Only superadmins can perform duplicate cleanup'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  
  -- This function would identify and merge duplicate business records
  -- For now, just return counts
  SELECT COUNT(*) INTO total_remaining FROM public.business_info;
  
  RETURN QUERY SELECT total_cleaned, total_remaining;
END;
$$;