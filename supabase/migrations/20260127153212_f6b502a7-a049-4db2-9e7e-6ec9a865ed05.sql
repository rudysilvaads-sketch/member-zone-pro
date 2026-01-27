-- Create tutorial reviews table
CREATE TABLE public.tutorial_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    topic_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create support tickets table
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ticket messages table
CREATE TABLE public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'user',
    message TEXT NOT NULL,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tutorial_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Tutorial reviews policies (public read, authenticated write)
CREATE POLICY "Anyone can view approved reviews"
ON public.tutorial_reviews FOR SELECT
USING (is_approved = true);

CREATE POLICY "Anyone can insert reviews"
ON public.tutorial_reviews FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own reviews"
ON public.tutorial_reviews FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete reviews"
ON public.tutorial_reviews FOR DELETE
USING (true);

-- Support tickets policies
CREATE POLICY "Anyone can view tickets"
ON public.support_tickets FOR SELECT
USING (true);

CREATE POLICY "Anyone can create tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update tickets"
ON public.support_tickets FOR UPDATE
USING (true);

-- Ticket messages policies
CREATE POLICY "Anyone can view ticket messages"
ON public.ticket_messages FOR SELECT
USING (true);

CREATE POLICY "Anyone can send messages"
ON public.ticket_messages FOR INSERT
WITH CHECK (true);

-- Enable realtime for tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;