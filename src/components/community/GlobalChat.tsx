import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  Users,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { OnlineIndicator } from '@/components/OnlineIndicator';
import { usePresence } from '@/hooks/usePresence';
import { 
  GlobalChatMessage, 
  subscribeToGlobalChat, 
  sendGlobalMessage,
  deleteGlobalMessage 
} from '@/lib/globalChatService';

const rankConfig: Record<string, { color: string; bg: string }> = {
  bronze: { color: "text-orange-400", bg: "bg-orange-500/20" },
  silver: { color: "text-slate-300", bg: "bg-slate-400/20" },
  gold: { color: "text-yellow-400", bg: "bg-yellow-500/20" },
  platinum: { color: "text-cyan-400", bg: "bg-cyan-500/20" },
  diamond: { color: "text-purple-400", bg: "bg-purple-500/20" },
};

interface GlobalChatProps {
  onUserClick?: (user: { uid: string; displayName: string; photoURL: string | null }) => void;
}

export const GlobalChat = ({ onUserClick }: GlobalChatProps) => {
  const { userProfile } = useAuth();
  const { isUserOnline, onlineCount } = usePresence();
  const [messages, setMessages] = useState<GlobalChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Subscribe to global chat
  useEffect(() => {
    const unsubscribe = subscribeToGlobalChat((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !userProfile || sending) return;

    const content = newMessage;
    setNewMessage('');
    setSending(true);

    const result = await sendGlobalMessage(
      userProfile.uid,
      userProfile.displayName,
      userProfile.photoURL,
      userProfile.rank || 'bronze',
      userProfile.level || 1,
      content
    );

    if (!result.success) {
      setNewMessage(content);
      toast.error('Erro ao enviar mensagem');
    }
    
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async (messageId: string) => {
    // Check admin status - using any to bypass typing since isAdmin is dynamic
    if (!(userProfile as any)?.isAdmin) return;
    
    const success = await deleteGlobalMessage(messageId);
    if (success) {
      toast.success('Mensagem deletada');
    } else {
      toast.error('Erro ao deletar mensagem');
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleUserClick = (message: GlobalChatMessage) => {
    if (message.senderId === userProfile?.uid) return;
    if (onUserClick) {
      onUserClick({
        uid: message.senderId,
        displayName: message.senderName,
        photoURL: message.senderAvatar,
      });
    }
  };

  return (
    <Card variant="gradient" className="flex flex-col h-[500px]">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-accent" />
            Chat Geral
          </div>
          <div className="flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{onlineCount} online</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-2 opacity-50" />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Seja o primeiro a dizer olá! 👋</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwn = message.senderId === userProfile?.uid;
                const rank = rankConfig[message.senderRank] || rankConfig.bronze;
                const isOnline = isUserOnline(message.senderId);
                
                return (
                  <div 
                    key={message.id} 
                    className={cn(
                      "flex gap-2 group",
                      isOwn && "flex-row-reverse"
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar 
                        className={cn(
                          "h-8 w-8 cursor-pointer transition-transform hover:scale-105",
                          !isOwn && "cursor-pointer"
                        )}
                        onClick={() => handleUserClick(message)}
                      >
                        <AvatarImage src={message.senderAvatar || undefined} />
                        <AvatarFallback className={cn("text-xs", rank.bg, rank.color)}>
                          {message.senderName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <OnlineIndicator isOnline={isOnline} size="sm" className="absolute -bottom-0.5 -right-0.5" />
                      )}
                    </div>
                    
                    <div className={cn(
                      "flex flex-col max-w-[75%]",
                      isOwn && "items-end"
                    )}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span 
                          className={cn(
                            "text-xs font-medium cursor-pointer hover:underline",
                            rank.color
                          )}
                          onClick={() => handleUserClick(message)}
                        >
                          {message.senderName}
                        </span>
                        <Badge variant="outline" className={cn("text-[10px] px-1 py-0", rank.bg, rank.color)}>
                          Lv.{message.senderLevel}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(message.createdAt)}
                        </span>
                        
                        {/* Admin delete button */}
                        {(userProfile as any)?.isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(message.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                      
                      <div className={cn(
                        "px-3 py-2 rounded-2xl text-sm break-words",
                        isOwn 
                          ? "bg-accent text-accent-foreground rounded-tr-sm" 
                          : "bg-muted rounded-tl-sm"
                      )}>
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        {/* Input */}
        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Digite sua mensagem..."
              maxLength={500}
              disabled={!userProfile || sending}
              className="flex-1"
            />
            <Button 
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || !userProfile || sending}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            {newMessage.length}/500
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
