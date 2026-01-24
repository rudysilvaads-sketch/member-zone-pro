import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Conversation, 
  ChatMessage, 
  subscribeToConversations,
  subscribeToMessages,
  sendMessage,
  markMessagesAsRead,
  getOrCreateConversation
} from "@/lib/chatService";
import { OnlineIndicator } from "./OnlineIndicator";
import { usePresence } from "@/hooks/usePresence";

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser?: {
    uid: string;
    displayName: string;
    photoURL: string | null;
  } | null;
}

export const ChatModal = ({ open, onOpenChange, targetUser }: ChatModalProps) => {
  const { userProfile } = useAuth();
  const { isUserOnline } = usePresence();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to conversations
  useEffect(() => {
    if (!userProfile?.uid || !open) return;

    setLoading(true);
    const unsubscribe = subscribeToConversations(userProfile.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.uid, open]);

  // Handle target user - open or create conversation
  useEffect(() => {
    const openConversationWithUser = async () => {
      if (!targetUser || !userProfile || !open) return;

      setLoadingMessages(true);
      try {
        const conversationId = await getOrCreateConversation(
          userProfile.uid,
          userProfile.displayName,
          userProfile.photoURL,
          targetUser.uid,
          targetUser.displayName,
          targetUser.photoURL
        );

        // Find or create the conversation object
        const existingConv = conversations.find(c => c.id === conversationId);
        if (existingConv) {
          setSelectedConversation(existingConv);
        } else {
          // Create a temporary conversation object
          setSelectedConversation({
            id: conversationId,
            participants: [userProfile.uid, targetUser.uid],
            participantNames: {
              [userProfile.uid]: userProfile.displayName,
              [targetUser.uid]: targetUser.displayName,
            },
            participantAvatars: {
              [userProfile.uid]: userProfile.photoURL,
              [targetUser.uid]: targetUser.photoURL,
            },
            lastMessage: '',
            lastMessageAt: null as any,
            lastMessageSenderId: '',
            unreadCount: {},
            createdAt: null as any,
          });
        }
      } catch (error) {
        console.error('Error opening conversation:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    openConversationWithUser();
  }, [targetUser, userProfile, open, conversations]);

  // Subscribe to messages when a conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const unsubscribe = subscribeToMessages(selectedConversation.id, (msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
    });

    // Mark messages as read
    if (userProfile?.uid) {
      markMessagesAsRead(selectedConversation.id, userProfile.uid);
    }

    return () => unsubscribe();
  }, [selectedConversation, userProfile?.uid]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !userProfile) return;

    const recipientId = selectedConversation.participants.find(
      id => id !== userProfile.uid
    );
    if (!recipientId) return;

    setSending(true);
    const content = newMessage;
    setNewMessage("");

    const result = await sendMessage(
      selectedConversation.id,
      userProfile.uid,
      userProfile.displayName,
      userProfile.photoURL,
      content,
      recipientId
    );

    if (!result.success) {
      setNewMessage(content);
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    const otherId = conversation.participants.find(id => id !== userProfile?.uid);
    if (!otherId) return { name: "Desconhecido", avatar: null, id: "" };
    return {
      id: otherId,
      name: conversation.participantNames[otherId] || "Desconhecido",
      avatar: conversation.participantAvatars[otherId],
    };
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const renderConversationList = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Mensagens</h3>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma conversa ainda</p>
          <p className="text-xs text-muted-foreground mt-1">
            Clique em um usuário na comunidade para iniciar uma conversa
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          {conversations.map((conversation) => {
            const other = getOtherParticipant(conversation);
            const unread = conversation.unreadCount?.[userProfile?.uid || ""] || 0;
            
            return (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left border-b"
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={other.avatar || undefined} />
                    <AvatarFallback>{other.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <OnlineIndicator 
                    isOnline={isUserOnline(other.id)} 
                    size="sm"
                    className="bottom-0 right-0"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{other.name}</span>
                    {unread > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {conversation.lastMessage || "Conversa iniciada"}
                  </p>
                </div>
              </button>
            );
          })}
        </ScrollArea>
      )}
    </div>
  );

  const renderChat = () => {
    if (!selectedConversation) return null;
    const other = getOtherParticipant(selectedConversation);

    return (
      <div className="h-full flex flex-col">
        {/* Chat Header */}
        <div className="p-3 border-b flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedConversation(null)}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={other.avatar || undefined} />
              <AvatarFallback>{other.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <OnlineIndicator 
              isOnline={isUserOnline(other.id)} 
              size="sm"
              className="bottom-0 right-0"
            />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{other.name}</p>
            <p className="text-xs text-muted-foreground">
              {isUserOnline(other.id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-muted-foreground">
                Nenhuma mensagem ainda. Diga olá!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwn = message.senderId === userProfile?.uid;
                return (
                  <div
                    key={message.id}
                    className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2",
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                      <p className={cn(
                        "text-xs mt-1",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[70vh] p-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Chat</DialogTitle>
        </DialogHeader>
        {selectedConversation ? renderChat() : renderConversationList()}
      </DialogContent>
    </Dialog>
  );
};
