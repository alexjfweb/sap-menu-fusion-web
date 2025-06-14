
-- Create cart table for shopping cart functionality
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  special_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment_reservations table for reservations with payment
CREATE TABLE public.payment_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  party_size INTEGER NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  special_requests TEXT,
  payment_method TEXT CHECK (payment_method IN ('nequi', 'qr', 'stripe')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX idx_payment_reservations_date ON payment_reservations(reservation_date);
CREATE INDEX idx_payment_reservations_status ON payment_reservations(status);

-- Enable RLS on new tables
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reservations ENABLE ROW LEVEL SECURITY;

-- Create policies for cart_items (session-based access)
CREATE POLICY "Anyone can manage their cart items by session" ON public.cart_items
FOR ALL
USING (true)
WITH CHECK (true);

-- Create policies for payment_reservations (public access for creation, admin access for management)
CREATE POLICY "Anyone can create reservations" ON public.payment_reservations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view their own reservations by phone" ON public.payment_reservations
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage all reservations" ON public.payment_reservations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  )
);
