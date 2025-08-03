-- Add custom sharing fields to business_info table
ALTER TABLE public.business_info 
ADD COLUMN custom_share_message text,
ADD COLUMN custom_share_image_url text;