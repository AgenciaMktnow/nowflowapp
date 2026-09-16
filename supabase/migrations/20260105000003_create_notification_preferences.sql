-- Create User Notification Settings Table
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    notify_task_created BOOLEAN DEFAULT TRUE,
    notify_task_moved BOOLEAN DEFAULT TRUE,
    notify_task_returned BOOLEAN DEFAULT TRUE,
    notify_new_comment BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own notification settings" ON public.user_notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- Function to initialize notification settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_notification_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize settings on user creation
DROP TRIGGER IF EXISTS on_user_created_init_settings ON public.users;
CREATE TRIGGER on_user_created_init_settings
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_notification_settings();

-- Backfill existing users
INSERT INTO public.user_notification_settings (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;
