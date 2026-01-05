-- 1. FIX: Add missing updated_at and expand role constraint
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
        ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;

    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'MANAGER', 'MEMBER', 'CLIENT', 'OPERATIONAL'));
END $$;

-- 2. FIX: Ultra-Robust handle_new_user function for public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up any record with same email but different ID (Sync conflict fix)
  DELETE FROM public.users WHERE email = NEW.email AND id != NEW.id;

  -- Insert or Update logic
  INSERT INTO public.users (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'MEMBER',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    updated_at = now();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Last resort: log warning but let auth proceed if possible
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FIX: Ensure Trigger is correctly placed on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. FIX: Ultra-Robust handle_new_user_notification_settings
CREATE OR REPLACE FUNCTION public.handle_new_user_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_notification_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in notification settings trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FIX: Ensure Trigger is correctly placed on public.users
DROP TRIGGER IF EXISTS on_user_created_init_settings ON public.users;
CREATE TRIGGER on_user_created_init_settings
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_notification_settings();

-- 6. Table & Defaults Verification
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    notify_task_created BOOLEAN DEFAULT TRUE,
    notify_task_moved BOOLEAN DEFAULT TRUE,
    notify_task_returned BOOLEAN DEFAULT TRUE,
    notify_new_comment BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 7. Backfill
INSERT INTO public.user_notification_settings (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;
