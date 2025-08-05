-- Add custom share fields to business_info table
DO $$ 
BEGIN
    -- Add custom_share_message column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'business_info' 
                   AND column_name = 'custom_share_message') THEN
        ALTER TABLE public.business_info 
        ADD COLUMN custom_share_message text;
    END IF;
    
    -- Add custom_share_image_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'business_info' 
                   AND column_name = 'custom_share_image_url') THEN
        ALTER TABLE public.business_info 
        ADD COLUMN custom_share_image_url text;
    END IF;
END $$;