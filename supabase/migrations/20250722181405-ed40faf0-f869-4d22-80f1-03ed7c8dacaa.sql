-- Add read receipt functionality to alert system

-- Add read status and timestamp to alert_recipients table
ALTER TABLE alert_recipients 
ADD COLUMN read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN read_status TEXT DEFAULT 'unread' CHECK (read_status IN ('unread', 'read'));

-- Create index for efficient read status queries
CREATE INDEX idx_alert_recipients_read_status ON alert_recipients(read_status);
CREATE INDEX idx_alert_recipients_read_at ON alert_recipients(read_at);

-- Add policy for users to update their own read status
CREATE POLICY "Users can update their own read status" 
ON alert_recipients 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());