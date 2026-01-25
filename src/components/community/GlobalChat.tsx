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
  Trash2,
  Mic,
  Square,
  X,
  ImagePlus
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
import { useAudioRecorder, formatRecordingTime } from '@/hooks/useAudioRecorder';
import { AudioMessagePlayer } from '@/components/AudioMessagePlayer';

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { 
    isRecording, 
    recordingTime, 
    startRecording, 
    stopRecording, 
    cancelRecording,
    uploadAudio,
    uploadImage
  } = useAudioRecorder();

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

  const handleSend = async (audioUrl?: string, imageUrl?: string) => {
    if ((!newMessage.trim() && !audioUrl && !imageUrl) || !userProfile || sending) return;

    const content = newMessage;
    setNewMessage('');
    setImagePreview(null);
    setSelectedImage(null);
    setSending(true);

    const result = await sendGlobalMessage(
      userProfile.uid,
      userProfile.displayName,
      userProfile.photoURL,
      userProfile.rank || 'bronze',
      userProfile.level || 1,
      content,
      audioUrl,
      imageUrl
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
      if (imagePreview) {
        handleSendImage();
      } else {
        handleSend();
      }
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error('Erro ao acessar microfone');
    }
  };

  const handleStopRecording = async () => {
    if (!userProfile) return;
    
    setSending(true);
    try {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        const audioUrl = await uploadAudio(audioBlob, 'global-chat');
        if (audioUrl) {
          await handleSend(audioUrl, undefined);
        }
      }
    } catch (error) {
      console.error("Error sending audio:", error);
      toast.error('Erro ao enviar áudio');
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendImage = async () => {
    if (!selectedImage || !userProfile) return;

    setSending(true);
    try {
      const imageUrl = await uploadImage(selectedImage, 'global-chat');
      if (imageUrl) {
        await handleSend(undefined, imageUrl);
      } else {
        toast.error('Erro ao enviar imagem');
      }
    } catch (error) {
      console.error("Error sending image:", error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setSending(false);
    }
  };

  const cancelImagePreview = () => {
    setImagePreview(null);
    setSelectedImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
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
                        {message.imageUrl ? (
                          <img 
                            src={message.imageUrl} 
                            alt="Imagem" 
                            className="max-w-full max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(message.imageUrl!, '_blank')}
                          />
                        ) : message.audioUrl ? (
                          <AudioMessagePlayer 
                            src={message.audioUrl} 
                            isOwn={isOwn}
                          />
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Image Preview */}
        {imagePreview && (
          <div className="px-4 py-2 border-t border-border/50 bg-muted/30">
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-24 rounded-md"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5"
                onClick={cancelImagePreview}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Hidden image input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*,image/gif"
          className="hidden"
          onChange={handleImageSelect}
        />
        
        {/* Input */}
        <div className="p-4 border-t border-border/50">
          {isRecording ? (
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 bg-destructive/10 rounded-md h-10">
                <span className="animate-pulse text-destructive">●</span>
                <span className="text-sm font-medium">{formatRecordingTime(recordingTime)}</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={cancelRecording}
                disabled={sending}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleStopRecording}
                disabled={sending}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
              </Button>
            </div>
          ) : imagePreview ? (
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Adicionar legenda..."
                maxLength={500}
                disabled={!userProfile || sending}
                className="flex-1"
              />
              <Button 
                size="icon"
                onClick={handleSendImage}
                disabled={!userProfile || sending}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => imageInputRef.current?.click()}
                disabled={!userProfile || sending}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite sua mensagem..."
                maxLength={500}
                disabled={!userProfile || sending}
                className="flex-1"
              />
              {newMessage.trim() ? (
                <Button 
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={!userProfile || sending}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleStartRecording}
                  disabled={!userProfile || sending}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          {!isRecording && !imagePreview && (
            <p className="text-[10px] text-muted-foreground mt-1 text-right">
              {newMessage.length}/500
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
