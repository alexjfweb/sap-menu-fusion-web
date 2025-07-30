-- Fix ambiguous column reference error in get_unique_business_info function
CREATE OR REPLACE FUNCTION public.get_unique_business_info()
 RETURNS TABLE(id uuid, business_name text, description text, tax_id text, phone text, address text, email text, logo_url text, cover_image_url text, facebook_url text, instagram_url text, twitter_url text, website_url text, public_menu_url text, whatsapp_url text, tiktok_url text, nequi_number text, nequi_qr_url text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_business_id uuid;
  business_count integer;
BEGIN
  -- Get the current user's business_id with fully qualified column references
  SELECT profiles.business_id INTO user_business_id 
  FROM public.profiles 
  WHERE profiles.id = auth.uid();
  
  -- If no business_id found, return empty
  IF user_business_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Count how many business_info records exist for this business_id
  SELECT COUNT(*) INTO business_count
  FROM public.business_info 
  WHERE business_info.id = user_business_id;
  
  -- If no records found, return empty
  IF business_count = 0 THEN
    RETURN;
  END IF;
  
  -- If multiple records found for the same business_id (shouldn't happen but validate)
  IF business_count > 1 THEN
    RAISE EXCEPTION 'Multiple business records found for business_id: %. Please contact support.', user_business_id
      USING ERRCODE = 'check_violation';
  END IF;
  
  -- Return the single business record with fully qualified column references
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
$function$