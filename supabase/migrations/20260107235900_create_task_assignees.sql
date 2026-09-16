-- Create task_assignees junction table
CREATE TABLE IF NOT EXISTS public.task_assignees (
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (task_id, user_id)
);

-- Enable RLS
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write (adjust if you need stricter rules)
CREATE POLICY "Allow authenticated users to select task_assignees" 
ON public.task_assignees FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert task_assignees" 
ON public.task_assignees FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete task_assignees" 
ON public.task_assignees FOR DELETE USING (auth.role() = 'authenticated');
