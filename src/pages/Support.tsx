import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  HelpCircle, Plus, MessageCircle, Clock, Send, 
  Loader2, AlertCircle, CheckCircle2, ArrowLeft,
  Ticket, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  SupportTicket,
  TicketMessage,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  getUserTickets,
  getAllTickets,
  getTicketMessages,
  createTicket,
  addTicketMessage,
  updateTicketStatus,
  subscribeToTicketMessages,
} from "@/lib/supportService";

const ADMIN_EMAILS = ['rudysilvaads@gmail.com'];

const Support = () => {
  const { user, userProfile } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState("my-tickets");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New ticket form
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "general",
    priority: "medium",
    message: "",
  });
  const [creating, setCreating] = useState(false);

  const isAdmin = user && (
    ADMIN_EMAILS.includes(user.email || '') || 
    (userProfile as any)?.isAdmin || 
    (userProfile as any)?.role === 'admin'
  );

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
      const unsubscribe = subscribeToTicketMessages(selectedTicket.id, (newMsg) => {
        setMessages((prev) => [...prev, newMsg]);
      });
      return unsubscribe;
    }
  }, [selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadTickets = async () => {
    if (!user) return;
    setLoading(true);
    
    let data: SupportTicket[];
    if (activeTab === "all-tickets" && isAdmin) {
      data = await getAllTickets();
    } else {
      data = await getUserTickets(user.uid);
    }
    
    setTickets(data);
    setLoading(false);
  };

  const loadMessages = async (ticketId: string) => {
    const data = await getTicketMessages(ticketId);
    setMessages(data);
  };

  const handleCreateTicket = async () => {
    if (!user || !ticketForm.subject.trim() || !ticketForm.message.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setCreating(true);
    const result = await createTicket(
      user.uid,
      user.email || "",
      (userProfile as any)?.displayName || user.email?.split("@")[0] || "Usuário",
      ticketForm.subject,
      ticketForm.category,
      ticketForm.priority,
      ticketForm.message
    );

    if (result.success) {
      toast.success("Ticket criado com sucesso!");
      setShowNewTicketDialog(false);
      setTicketForm({ subject: "", category: "general", priority: "medium", message: "" });
      loadTickets();
    } else {
      toast.error(result.error || "Erro ao criar ticket");
    }
    setCreating(false);
  };

  const handleSendMessage = async () => {
    if (!user || !selectedTicket || !newMessage.trim()) return;

    setSendingMessage(true);
    const success = await addTicketMessage(
      selectedTicket.id,
      user.uid,
      (userProfile as any)?.displayName || user.email?.split("@")[0] || "Usuário",
      isAdmin ? "admin" : "user",
      newMessage
    );

    if (success) {
      setNewMessage("");
    } else {
      toast.error("Erro ao enviar mensagem");
    }
    setSendingMessage(false);
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedTicket) return;
    const success = await updateTicketStatus(selectedTicket.id, status);
    if (success) {
      setSelectedTicket({ ...selectedTicket, status });
      toast.success("Status atualizado");
      loadTickets();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = TICKET_STATUSES.find((s) => s.value === status);
    return (
      <Badge className={cn("text-xs", statusConfig?.color || "bg-gray-500/20")}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    return TICKET_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
          <Header />
          <main className="p-6">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-white">{selectedTicket.subject}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedTicket.status)}
                    <Badge variant="outline" className="text-xs">
                      {getCategoryLabel(selectedTicket.category)}
                    </Badge>
                  </div>
                </div>
                {isAdmin && (
                  <Select value={selectedTicket.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Messages */}
              <Card variant="gradient" className="mb-4">
                <ScrollArea className="h-[500px]">
                  <CardContent className="p-4 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-3",
                          msg.sender_role === "admin" && "flex-row-reverse"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] p-3 rounded-lg",
                            msg.sender_role === "admin"
                              ? "bg-[#F5A623]/20"
                              : "bg-white/10"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">
                              {msg.sender_name}
                            </span>
                            {msg.sender_role === "admin" && (
                              <Badge className="text-[10px] bg-[#F5A623]/30 text-[#F5A623]">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-white/80 whitespace-pre-wrap">
                            {msg.message}
                          </p>
                          <p className="text-[10px] text-white/40 mt-1">
                            {formatDate(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </CardContent>
                </ScrollArea>
              </Card>

              {/* Reply */}
              {selectedTicket.status !== "closed" && (
                <Card variant="gradient">
                  <CardContent className="p-4">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        rows={2}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={sendingMessage || !newMessage.trim()}
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header />
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/20 mb-3">
                  <span className="text-xs text-[#F5A623] uppercase tracking-widest font-medium">Suporte</span>
                </div>
                <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
                  <HelpCircle className="h-8 w-8 text-[#F5A623]" />
                  Central de Suporte
                </h1>
                <p className="text-white/60 mt-2">
                  Precisa de ajuda? Abra um ticket e nossa equipe responderá em breve.
                </p>
              </div>
              <Button onClick={() => setShowNewTicketDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Ticket
              </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="my-tickets">
                  <Ticket className="h-4 w-4 mr-2" />
                  Meus Tickets
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="all-tickets">
                    <User className="h-4 w-4 mr-2" />
                    Todos os Tickets
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="my-tickets">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#F5A623]" />
                  </div>
                ) : tickets.length === 0 ? (
                  <Card variant="gradient" className="text-center py-12">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-white/20" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Nenhum ticket ainda
                    </h3>
                    <p className="text-white/50 mb-6">
                      Crie um ticket para falar com nossa equipe de suporte.
                    </p>
                    <Button onClick={() => setShowNewTicketDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Ticket
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        variant="interactive"
                        className="p-4"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-white">{ticket.subject}</h3>
                              {getStatusBadge(ticket.status)}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-white/50">
                              <span>{getCategoryLabel(ticket.category)}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(ticket.created_at)}
                              </span>
                            </div>
                          </div>
                          <MessageCircle className="h-5 w-5 text-white/30" />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {isAdmin && (
                <TabsContent value="all-tickets">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-[#F5A623]" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <Card variant="gradient" className="text-center py-12">
                      <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-400/50" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Nenhum ticket pendente
                      </h3>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {tickets.map((ticket) => (
                        <Card
                          key={ticket.id}
                          variant="interactive"
                          className="p-4"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-white">{ticket.subject}</h3>
                                {getStatusBadge(ticket.status)}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-white/50">
                                <span className="text-[#F5A623]">{ticket.user_name}</span>
                                <span>{getCategoryLabel(ticket.category)}</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(ticket.created_at)}
                                </span>
                              </div>
                            </div>
                            <MessageCircle className="h-5 w-5 text-white/30" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-[#F5A623]" />
              Novo Ticket de Suporte
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">Assunto *</label>
              <Input
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                placeholder="Descreva brevemente o problema..."
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-white mb-1 block">Categoria</label>
                <Select
                  value={ticketForm.category}
                  onValueChange={(v) => setTicketForm({ ...ticketForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-white mb-1 block">Prioridade</label>
                <Select
                  value={ticketForm.priority}
                  onValueChange={(v) => setTicketForm({ ...ticketForm, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className={p.color}>{p.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white mb-1 block">Mensagem *</label>
              <Textarea
                value={ticketForm.message}
                onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                placeholder="Descreva detalhadamente seu problema ou dúvida..."
                rows={5}
                maxLength={2000}
              />
              <p className="text-xs text-white/40 mt-1 text-right">
                {ticketForm.message.length}/2000
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTicketDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTicket} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;
