import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Eye, Users, Loader2, ArrowLeft } from "lucide-react";
import { 
  Conversation, 
  ChatMessage, 
  getAllConversations,
  adminSubscribeToMessages
} from "@/lib/chatService";
import { cn } from "@/lib/utils";

export const AdminChats = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const convs = await getAllConversations();
        setConversations(convs);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const unsubscribe = adminSubscribeToMessages(selectedConversation.id, (msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("pt-BR", { 
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const getParticipantNames = (conversation: Conversation) => {
    return Object.values(conversation.participantNames).join(" & ");
  };

  const getTotalMessages = (conversation: Conversation) => {
    const unread = Object.values(conversation.unreadCount || {}).reduce((a, b) => a + b, 0);
    return unread;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (selectedConversation) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedConversation(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <CardTitle className="text-lg">
                {getParticipantNames(selectedConversation)}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {messages.length} mensagens
              </p>
            </div>
            <Badge variant="outline" className="gap-1">
              <Eye className="h-3 w-3" />
              Modo Admin
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <p className="text-muted-foreground">
                  Nenhuma mensagem nesta conversa
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={message.senderAvatar || undefined} />
                      <AvatarFallback>
                        {message.senderName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{message.senderName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.createdAt)}
                        </span>
                        {!message.read && (
                          <Badge variant="secondary" className="text-xs">
                            Não lida
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm mt-1 bg-muted/50 rounded-lg p-2">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Monitorar Conversas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Visualize todas as conversas privadas entre usuários
        </p>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma conversa ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const unreadTotal = getTotalMessages(conversation);
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 rounded-lg transition-colors text-left border"
                >
                  <div className="flex -space-x-3">
                    {conversation.participants.slice(0, 2).map((uid) => (
                      <Avatar key={uid} className="h-10 w-10 border-2 border-background">
                        <AvatarImage src={conversation.participantAvatars[uid] || undefined} />
                        <AvatarFallback>
                          {conversation.participantNames[uid]?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {getParticipantNames(conversation)}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage || "Conversa iniciada"}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {unreadTotal > 0 && (
                      <Badge variant="secondary">{unreadTotal} não lidas</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatTime(conversation.lastMessageAt)}
                    </span>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
