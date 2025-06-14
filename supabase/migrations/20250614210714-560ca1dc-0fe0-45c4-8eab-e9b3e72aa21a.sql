
-- Add Nequi and QR code fields to business_info table
ALTER TABLE public.business_info 
ADD COLUMN nequi_number TEXT,
ADD COLUMN nequi_qr_url TEXT;

-- Add comments for clarity
COMMENT ON COLUMN public.business_info.nequi_number IS 'Número de Nequi para pagos';
COMMENT ON COLUMN public.business_info.nequi_qr_url IS 'URL del código QR de Nequi';
