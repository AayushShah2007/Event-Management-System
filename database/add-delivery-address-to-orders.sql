-- Add delivery address columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_first_name TEXT,
ADD COLUMN IF NOT EXISTS delivery_last_name TEXT,
ADD COLUMN IF NOT EXISTS delivery_phone TEXT,
ADD COLUMN IF NOT EXISTS delivery_email TEXT,
ADD COLUMN IF NOT EXISTS delivery_address_line1 TEXT,
ADD COLUMN IF NOT EXISTS delivery_address_line2 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS delivery_city TEXT,
ADD COLUMN IF NOT EXISTS delivery_district TEXT,
ADD COLUMN IF NOT EXISTS delivery_state TEXT,
ADD COLUMN IF NOT EXISTS delivery_pincode TEXT;
