-- Add summary column to conversations table
ALTER TABLE public.conversations 
ADD COLUMN summary text DEFAULT NULL;

-- Add message_count to track when to regenerate summary
ALTER TABLE public.conversations 
ADD COLUMN message_count integer DEFAULT 0;