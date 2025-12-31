
-- Enable RLS policies for time_logs (Missing in original schema)
-- This allows the application to actually Read/Write time logs.

CREATE POLICY "Allow authenticated users to read time_logs" 
ON time_logs FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert time_logs" 
ON time_logs FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update time_logs" 
ON time_logs FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete time_logs" 
ON time_logs FOR DELETE 
USING (auth.role() = 'authenticated');
