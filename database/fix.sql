-- COMPLETE FIX: Drop and recreate ALL tables with permissive policies

-- Drop all existing policies and triggers to start fresh
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public" ON public.profiles;
DROP POLICY IF EXISTS "allow_all_profiles" ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP POLICY IF EXISTS "events_read" ON public.events;
DROP POLICY IF EXISTS "events_all" ON public.events;
DROP POLICY IF EXISTS "events_public" ON public.events;
DROP POLICY IF EXISTS "events_select" ON public.events;

DROP POLICY IF EXISTS "categories_read" ON public.event_categories;
DROP POLICY IF EXISTS "categories_all" ON public.event_categories;
DROP POLICY IF EXISTS "categories_public" ON public.event_categories;
DROP POLICY IF EXISTS "categories_select" ON public.event_categories;

DROP POLICY IF EXISTS "orders_read" ON public.orders;
DROP POLICY IF EXISTS "orders_all" ON public.orders;
DROP POLICY IF EXISTS "orders_public" ON public.orders;
DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

DROP POLICY IF EXISTS "order_items_read" ON public.order_items;
DROP POLICY IF EXISTS "order_items_all" ON public.order_items;
DROP POLICY IF EXISTS "order_items_public" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

DROP POLICY IF EXISTS "notifications_read" ON public.notifications;
DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_public" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;

-- Drop and recreate all tables with proper structure
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.event_categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;

-- Recreate tables
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  artist_name TEXT NOT NULL,
  venue TEXT NOT NULL,
  venue_address TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  time TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_sold_out BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  is_live BOOLEAN DEFAULT true,
  total_tickets INTEGER DEFAULT 1000,
  sold_tickets INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.event_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total_seats INTEGER DEFAULT 100,
  available_seats INTEGER DEFAULT 100,
  description TEXT,
  color TEXT DEFAULT '#dc2626'
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_id UUID REFERENCES public.events(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'auto_rejected', 'paid', 'completed')),
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.event_categories(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'order' CHECK (type IN ('order', 'payment', 'system')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create SUPER PERMISSIVE policies for development
CREATE POLICY "events_full_access" ON public.events
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "profiles_full_access" ON public.profiles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "event_categories_full_access" ON public.event_categories
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "orders_full_access" ON public.orders
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "order_items_full_access" ON public.order_items
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "notifications_full_access" ON public.notifications
  FOR ALL USING (true) WITH CHECK (true);

-- Recreate the trigger function for auto-creating profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, role, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'user',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample events if they don't exist
INSERT INTO public.events (title, description, artist_name, venue, venue_address, date, time, image_url, thumbnail_url, is_featured, is_trending, is_live, total_tickets, sold_tickets)
SELECT * FROM (VALUES
  ('Neon Dreams Festival', 'The biggest electronic music festival featuring top DJs from around the world. Experience mind-blowing visuals and world-class sound.', 'Various Artists', 'MGM Arena', 'Las Vegas, NV', '2026-06-15 18:00:00+00'::timestamptz, '18:00', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400', true, true, true, 5000, 2340),
  ('Rock Legends Live', 'A night of legendary rock performances featuring iconic bands and unforgettable music.', 'Metallica, Guns N Roses', 'Madison Square Garden', 'New York, NY', '2026-07-20 20:00:00+00'::timestamptz, '20:00', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', true, true, true, 8000, 5600),
  ('Comedy Night Gold', 'An evening of laughter with the biggest names in comedy.', 'Kevin Hart, Dave Chappelle', 'The Comedy Store', 'Los Angeles, CA', '2026-05-25 21:00:00+00'::timestamptz, '21:00', 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=1200', 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400', false, true, true, 2000, 1200),
  ('Classical Symphony Evening', 'A magical evening of classical music performed by world-renowned orchestra.', 'London Symphony Orchestra', 'Royal Albert Hall', 'London, UK', '2026-08-10 19:30:00+00'::timestamptz, '19:30', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400', true, false, true, 3000, 890),
  ('Jazz Under the Stars', 'Smooth jazz performances in an intimate outdoor setting.', 'Herbie Hancock, Kamasi Washington', 'Hollywood Bowl', 'Los Angeles, CA', '2026-09-05 20:00:00+00'::timestamptz, '20:00', 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200', 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400', false, true, true, 4000, 2100),
  ('Bollywood Music Festival', 'The biggest Bollywood music celebration with top Indian artists.', 'A.R. Rahman, Shah Rukh Khan', 'Wankhede Stadium', 'Mumbai, India', '2026-10-12 18:00:00+00'::timestamptz, '18:00', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400', true, true, true, 15000, 12000)
) AS t(title, description, artist_name, venue, venue_address, date, time, image_url, thumbnail_url, is_featured, is_trending, is_live, total_tickets, sold_tickets)
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE title = t.title);

-- Insert sample categories for all events if they don't exist
INSERT INTO public.event_categories (event_id, name, price, total_seats, available_seats, description, color)
SELECT 
  e.id,
  c.name,
  c.price,
  c.total_seats,
  c.available_seats,
  c.description,
  c.color
FROM public.events e
CROSS JOIN (
  VALUES
    ('Bronze', 99.00, 100, 100, 'Basic seating with great view', '#cd7f32'),
    ('Silver', 199.00, 50, 50, 'Premium seating with better view', '#c0c0c0'),
    ('Gold', 399.00, 25, 25, 'VIP seating with exclusive access', '#ffd700'),
    ('Platinum', 799.00, 10, 10, 'Backstage access and meet & greet', '#e5e4e2')
) AS c(name, price, total_seats, available_seats, description, color)
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_categories ec 
  WHERE ec.event_id = e.id AND ec.name = c.name
);

-- Make sure admin accounts exist and are set to admin (SIMPLE VERSION)
-- Update profiles for known admin emails
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'kinjal2506shah@gmail.com'
);

UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'aayushshah458@gmail.com'
);

-- Ensure profiles exist for these users (insert if missing)
INSERT INTO public.profiles (user_id, full_name, phone, role)
SELECT 
  id,
  split_part(email, '@', 1),
  '0000000000',
  'admin'
FROM auth.users 
WHERE email IN ('kinjal2506shah@gmail.com', 'aayushshah458@gmail.com')
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE user_id = auth.users.id
);

-- Create addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address_line1 TEXT NOT NULL DEFAULT '',
  address_line2 TEXT NOT NULL DEFAULT '',
  landmark TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  pincode TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL DEFAULT 'home' CHECK (label IN ('home', 'work', 'other')),
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration: add district column if missing (for existing tables)
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS district TEXT NOT NULL DEFAULT '';

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses_select" ON public.addresses;
CREATE POLICY "addresses_select" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_insert" ON public.addresses;
CREATE POLICY "addresses_insert" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_update" ON public.addresses;
CREATE POLICY "addresses_update" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_delete" ON public.addresses;
CREATE POLICY "addresses_delete" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Add addresses columns to profiles (optional, for quick access)
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Reviews table (drop FK if it exists from older schema)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select" ON public.reviews;
CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
CREATE POLICY "reviews_insert" ON public.reviews
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "reviews_delete" ON public.reviews;
CREATE POLICY "reviews_delete" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Seed sample reviews (only if table is empty)
INSERT INTO public.reviews (user_id, user_name, rating, comment, created_at)
SELECT p.id, COALESCE(p.full_name, 'Anonymous'), 5, v.comment, v.date
FROM public.profiles p, (VALUES
  ('Incredible platform! Booked tickets for a concert in seconds. The seat selection was smooth and the digital tickets worked flawlessly.', NOW() - INTERVAL '2 days'),
  ('As an organizer, EventPass made managing ticket sales effortless. Real-time analytics and easy payout system.', NOW() - INTERVAL '5 days'),
  ('Love the user experience! The venue layout view helped me pick the perfect seats. Secure payments every time.', NOW() - INTERVAL '8 days')
) AS v(comment, date)
WHERE (SELECT COUNT(*) FROM public.reviews) = 0
LIMIT 1;

