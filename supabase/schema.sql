-- Supabase Schema for EventPass Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
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

-- Event categories table
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

-- Orders table
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

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.event_categories(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- Cart table
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) NOT NULL,
  category_id UUID REFERENCES public.event_categories(id) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id, category_id)
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'order' CHECK (type IN ('order', 'payment', 'system')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
  ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Events RLS
CREATE POLICY "Events are viewable by everyone" 
  ON public.events FOR SELECT USING (true);

CREATE POLICY "Admins can insert events" 
  ON public.events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update events" 
  ON public.events FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete events" 
  ON public.events FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Event Categories RLS
CREATE POLICY "Categories are viewable by everyone" 
  ON public.event_categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" 
  ON public.event_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Orders RLS
CREATE POLICY "Users can view own orders" 
  ON public.orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert orders" 
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" 
  ON public.orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update orders" 
  ON public.orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Order Items RLS
CREATE POLICY "Users can view own order items" 
  ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own order items" 
  ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can view all order items" 
  ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Carts RLS
CREATE POLICY "Users can manage own cart" 
  ON public.carts FOR ALL USING (auth.uid() = user_id);

-- Notifications RLS
CREATE POLICY "Users can view own notifications" 
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" 
  ON public.notifications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Create Indexes
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_is_live ON public.events(is_live);
CREATE INDEX idx_events_is_featured ON public.events(is_featured);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_event_id ON public.orders(event_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed Data

-- Insert Admin User (Note: This user needs to sign up first through the app)
-- The admin will be created when the user with email aayushshah458@gmail.com signs up
-- You can update their role manually after signup

-- Sample Events
INSERT INTO public.events (title, description, artist_name, venue, venue_address, date, time, image_url, thumbnail_url, is_featured, is_trending, total_tickets, sold_tickets) VALUES
('Neon Dreams Festival', 'The biggest electronic music festival featuring top DJs from around the world. Experience mind-blowing visuals and world-class sound.', 'Various Artists', 'MGM Arena', 'Las Vegas, NV', '2026-06-15 18:00:00+00', '18:00', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400', true, true, 5000, 2340),
('Rock Legends Live', 'A night of legendary rock performances featuring iconic bands and unforgettable music.', 'Metallica, Guns N Roses', 'Madison Square Garden', 'New York, NY', '2026-07-20 20:00:00+00', '20:00', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', true, true, 8000, 5600),
('Comedy Night Gold', 'An evening of laughter with the biggest names in comedy.', 'Kevin Hart, Dave Chappelle', 'The Comedy Store', 'Los Angeles, CA', '2026-05-25 21:00:00+00', '21:00', 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=1200', 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400', false, true, 2000, 1200),
('Classical Symphony Evening', 'A magical evening of classical music performed by world-renowned orchestra.', 'London Symphony Orchestra', 'Royal Albert Hall', 'London, UK', '2026-08-10 19:30:00+00', '19:30', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400', true, false, 3000, 890),
('Jazz Under the Stars', 'Smooth jazz performances in an intimate outdoor setting.', 'Herbie Hancock, Kamasi Washington', 'Hollywood Bowl', 'Los Angeles, CA', '2026-09-05 20:00:00+00', '20:00', 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200', 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400', false, true, 4000, 2100),
('Bollywood Music Festival', 'The biggest Bollywood music celebration with top Indian artists.', 'A.R. Rahman, Shah Rukh Khan', 'Wankhede Stadium', 'Mumbai, India', '2026-10-12 18:00:00+00', '18:00', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400', true, true, 15000, 12000);

-- Sample Categories for each event
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
    ('Bronze', 99.00, 500, 450, 'Basic seating with great view', '#cd7f32'),
    ('Silver', 199.00, 300, 280, 'Premium seating with better view', '#c0c0c0'),
    ('Gold', 399.00, 150, 120, 'VIP seating with exclusive access', '#ffd700'),
    ('Platinum', 799.00, 50, 30, 'Backstage access and meet & greet', '#e5e4e2')
) AS c(name, price, total_seats, available_seats, description, color);

-- Update event categories based on event type
UPDATE public.event_categories 
SET price = CASE 
  WHEN name = 'Bronze' THEN 99
  WHEN name = 'Silver' THEN 199
  WHEN name = 'Gold' THEN 399
  WHEN name = 'Platinum' THEN 799
END
WHERE id IS NOT NULL;

-- Special pricing for certain events
UPDATE public.event_categories ec
SET price = CASE 
  WHEN ec.name = 'Bronze' THEN 149
  WHEN ec.name = 'Silver' THEN 299
  WHEN ec.name = 'Gold' THEN 599
  WHEN ec.name = 'Platinum' THEN 1299
END
FROM public.events e
WHERE ec.event_id = e.id AND e.title = 'Neon Dreams Festival';

UPDATE public.event_categories ec
SET price = CASE 
  WHEN ec.name = 'Bronze' THEN 199
  WHEN ec.name = 'Silver' THEN 399
  WHEN ec.name = 'Gold' THEN 799
  WHEN ec.name = 'Platinum' THEN 1999
END
FROM public.events e
WHERE ec.event_id = e.id AND e.title = 'Rock Legends Live';