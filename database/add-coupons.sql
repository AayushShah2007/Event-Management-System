-- Coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  usage_limit INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add coupon columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- RLS for coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupons are viewable by everyone"
  ON public.coupons FOR SELECT USING (true);

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Index for quick coupon code lookup
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
