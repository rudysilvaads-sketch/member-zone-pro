import { supabase } from "@/integrations/supabase/client";

export interface SupportTicket {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  attachments?: any;
  created_at: string;
}

export const TICKET_CATEGORIES = [
  { value: 'general', label: 'Dúvida Geral' },
  { value: 'technical', label: 'Problema Técnico' },
  { value: 'account', label: 'Conta/Acesso' },
  { value: 'content', label: 'Conteúdo/Tutoriais' },
  { value: 'billing', label: 'Pagamento/Resgate' },
  { value: 'suggestion', label: 'Sugestão' },
];

export const TICKET_PRIORITIES = [
  { value: 'low', label: 'Baixa', color: 'text-green-400' },
  { value: 'medium', label: 'Média', color: 'text-yellow-400' },
  { value: 'high', label: 'Alta', color: 'text-orange-400' },
  { value: 'urgent', label: 'Urgente', color: 'text-red-400' },
];

export const TICKET_STATUSES = [
  { value: 'open', label: 'Aberto', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'in_progress', label: 'Em Andamento', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'waiting_user', label: 'Aguardando Usuário', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'resolved', label: 'Resolvido', color: 'bg-green-500/20 text-green-400' },
  { value: 'closed', label: 'Fechado', color: 'bg-gray-500/20 text-gray-400' },
];

// Get user's tickets
export const getUserTickets = async (userId: string): Promise<SupportTicket[]> => {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }

  return data as SupportTicket[];
};

// Get all tickets (admin)
export const getAllTickets = async (): Promise<SupportTicket[]> => {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all tickets:', error);
    return [];
  }

  return data as SupportTicket[];
};

// Get ticket by ID
export const getTicketById = async (ticketId: string): Promise<SupportTicket | null> => {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching ticket:', error);
    return null;
  }

  return data as SupportTicket;
};

// Get ticket messages
export const getTicketMessages = async (ticketId: string): Promise<TicketMessage[]> => {
  const { data, error } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data as TicketMessage[];
};

// Create a new ticket
export const createTicket = async (
  userId: string,
  userEmail: string,
  userName: string,
  subject: string,
  category: string,
  priority: string,
  initialMessage: string
): Promise<{ success: boolean; ticketId?: string; error?: string }> => {
  // Create ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .insert({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      subject,
      category,
      priority,
    })
    .select()
    .single();

  if (ticketError) {
    console.error('Error creating ticket:', ticketError);
    return { success: false, error: 'Erro ao criar ticket' };
  }

  // Add initial message
  const { error: messageError } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticket.id,
      sender_id: userId,
      sender_name: userName,
      sender_role: 'user',
      message: initialMessage,
    });

  if (messageError) {
    console.error('Error adding message:', messageError);
  }

  return { success: true, ticketId: ticket.id };
};

// Add message to ticket
export const addTicketMessage = async (
  ticketId: string,
  senderId: string,
  senderName: string,
  senderRole: 'user' | 'admin',
  message: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      message,
    });

  if (error) {
    console.error('Error adding message:', error);
    return false;
  }

  // Update ticket updated_at
  await supabase
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  return true;
};

// Update ticket status
export const updateTicketStatus = async (
  ticketId: string,
  status: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  if (error) {
    console.error('Error updating status:', error);
    return false;
  }

  return true;
};

// Subscribe to ticket messages (realtime)
export const subscribeToTicketMessages = (
  ticketId: string,
  callback: (message: TicketMessage) => void
) => {
  const channel = supabase
    .channel(`ticket_${ticketId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
        filter: `ticket_id=eq.${ticketId}`,
      },
      (payload) => {
        callback(payload.new as TicketMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
