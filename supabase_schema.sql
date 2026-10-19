-- ========================================================
-- FreshKeep: Supabase Database Migration & Schema Setup
-- Run this script in the Supabase SQL Editor
-- ========================================================

-- 1. Create Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    notify_days_before INT DEFAULT 3,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Trigger to auto-create profile on Google/Email sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name_th TEXT NOT NULL,
    name_en TEXT,
    icon TEXT NOT NULL,
    color TEXT DEFAULT '#10b981',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories"
    ON public.categories FOR SELECT
    USING (TRUE);

-- Seed Categories
INSERT INTO public.categories (id, name_th, name_en, icon, color) VALUES
    ('vegetable', 'ผักและผลไม้', 'Vegetables & Fruits', 'Salad', '#10b981'),
    ('meat', 'เนื้อสัตว์และอาหารทะเล', 'Meat & Seafood', 'Beef', '#ef4444'),
    ('dairy', 'นม ไข่ และชีส', 'Dairy & Eggs', 'Milk', '#f59e0b'),
    ('drinks', 'เครื่องดื่ม', 'Beverages', 'CupSoda', '#06b6d4'),
    ('dry', 'ของแห้งและเครื่องปรุง', 'Dry Goods & Pantry', 'Wheat', '#8b5cf6'),
    ('snack', 'ของหวานและเบเกอรี่', 'Bakery & Snacks', 'Cake', '#ec4899'),
    ('ready', 'อาหารพร้อมทาน', 'Ready to Eat', 'Utensils', '#f97316')
ON CONFLICT (id) DO NOTHING;


-- 3. Create Food Items Table
CREATE TABLE IF NOT EXISTS public.food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category_id TEXT REFERENCES public.categories(id) DEFAULT 'vegetable',
    quantity TEXT DEFAULT '1',
    unit TEXT DEFAULT 'ชิ้น',
    storage_type TEXT DEFAULT 'chiller' CHECK (storage_type IN ('chiller', 'freezer', 'pantry')),
    purchase_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'discarded')),
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_food_items_user_id ON public.food_items(user_id);
CREATE INDEX IF NOT EXISTS idx_food_items_expiry_status ON public.food_items(expiry_date, status);

-- Enable RLS for food_items
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own food items"
    ON public.food_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food items"
    ON public.food_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food items"
    ON public.food_items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food items"
    ON public.food_items FOR DELETE
    USING (auth.uid() = user_id);


-- 4. Create Notification Logs Table (Prevent duplicate emails)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_item_id UUID NOT NULL REFERENCES public.food_items(id) ON DELETE CASCADE,
    notified_at DATE NOT NULL DEFAULT CURRENT_DATE,
    notify_type TEXT NOT NULL CHECK (notify_type IN ('expiring_soon', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, food_item_id, notified_at, notify_type)
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification logs"
    ON public.notification_logs FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert/read via service_role key
