
-- Add WhatsApp, X (Twitter), and TikTok fields to business_info table
ALTER TABLE public.business_info 
ADD COLUMN whatsapp_url TEXT,
ADD COLUMN tiktok_url TEXT;

-- Update the existing twitter_url column description for clarity (X formerly Twitter)
COMMENT ON COLUMN public.business_info.twitter_url IS 'X (formerly Twitter) profile URL';
