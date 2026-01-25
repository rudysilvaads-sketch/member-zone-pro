import { useState, useEffect, useRef } from "react";
import { X, MessageCircle, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Conversation, sendMessage, getOrCreateConversation, markMessagesAsRead } from "@/lib/chatService";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  conversations: Conversation[];
}

export function ChatWidget({ conversations }: ChatWidgetProps) {
  const { user, userProfile } = useAuth();
  const [expandedChat, setExpandedChat] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [dismissedConversations, setDismissedConversations] = useState<Set<string>>(new Set());
  const previousUnreadRef = useRef<Record<string, number>>({});

  // Find conversations with new unread messages (not dismissed)
  const conversationsWithNewMessages = conversations.filter(convo => {
    if (!user) return false;
    const unread = convo.unreadCount?.[user.uid] || 0;
    const previousUnread = previousUnreadRef.current[convo.id] || 0;
    
    // Show if there are unread messages and not dismissed
    return unread > 0 && 
           !dismissedConversations.has(convo.id) && 
           convo.lastMessageSenderId !== user.uid;
  });

  // Update previous unread counts
  useEffect(() => {
    if (!user) return;
    const newPrevious: Record<string, number> = {};
    conversations.forEach(convo => {
      newPrevious[convo.id] = convo.unreadCount?.[user.uid] || 0;
    });
    previousUnreadRef.current = newPrevious;
  }, [conversations, user]);

  // Get the other participant's info
  const getOtherParticipant = (convo: Conversation) => {
    if (!user) return { name: "Usuário", avatar: null, oderId: "" };
    const otherId = convo.participants.find(p => p !== user.uid) || "";
    return {
      name: convo.participantNames?.[otherId] || "Usuário",
      avatar: convo.participantAvatars?.[otherId] || null,
      oderId: otherId,
    };
  };

  const handleDismiss = (convoId: string) => {
    setDismissedConversations(prev => new Set([...prev, convoId]));
    if (expandedChat?.id === convoId) {
      setExpandedChat(null);
    }
  };

  const handleExpand = async (convo: Conversation) => {
    setExpandedChat(convo);
    if (user) {
      await markMessagesAsRead(convo.id, user.uid);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !expandedChat || !user || !userProfile) return;

    setSending(true);
    try {
      const other = getOtherParticipant(expandedChat);
      await sendMessage(
        expandedChat.id,
        user.uid,
        userProfile.displayName,
        userProfile.photoURL,
        newMessage,
        other.oderId
      );
      setNewMessage("");
      handleDismiss(expandedChat.id);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  // Don't render if no new messages or no user
  if (!user || conversationsWithNewMessages.length === 0) {
    return null;
  }

  // Show only the most recent conversation with unread messages
  const latestConvo = conversationsWithNewMessages[0];
  const other = getOtherParticipant(latestConvo);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Expanded Chat View */}
      {expandedChat && (
        <Card className="w-80 shadow-2xl border-primary/20 overflow-hidden animate-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-primary/10 border-b border-primary/20">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getOtherParticipant(expandedChat).avatar || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {getOtherParticipant(expandedChat).name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">
                {getOtherParticipant(expandedChat).name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleDismiss(expandedChat.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Last Message Preview */}
          <div className="p-3 bg-muted/30 min-h-[60px]">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {expandedChat.lastMessage || "Iniciou uma conversa"}
            </p>
          </div>

          {/* Quick Reply */}
          <div className="p-3 border-t flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Responder..."
              className="text-sm h-9"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Collapsed Notification Bubble */}
      {!expandedChat && (
        <div
          onClick={() => handleExpand(latestConvo)}
          className={cn(
            "flex items-center gap-3 p-3 rounded-2xl shadow-2xl cursor-pointer",
            "bg-card border border-primary/20 hover:border-primary/40 transition-all",
            "animate-in slide-in-from-right-5 duration-300",
            "max-w-[300px]"
          )}
        >
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={other.avatar || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {other.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {latestConvo.unreadCount?.[user.uid] || 1}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{other.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {latestConvo.lastMessage || "Nova mensagem"}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss(latestConvo.id);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Badge showing more conversations */}
      {conversationsWithNewMessages.length > 1 && !expandedChat && (
        <div className="text-xs text-muted-foreground bg-muted/80 px-2 py-1 rounded-full">
          +{conversationsWithNewMessages.length - 1} outras mensagens
        </div>
      )}
    </div>
  );
}
