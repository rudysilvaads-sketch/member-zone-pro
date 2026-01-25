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
  ImagePlus,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { OnlineIndicator } from '@/components/OnlineIndicator';
import { usePresence } from '@/hooks/usePresence';
import { 
  GlobalChatMessage, 
  ChatSettings,
  subscribeToGlobalChat, 
  sendGlobalMessage,
  deleteGlobalMessage,
  subscribeToChatSettings,
  toggleChatLock,
  clearAllMessages,
  cleanOldMessages
} from '@/lib/globalChatService';
import { useAudioRecorder, formatRecordingTime } from '@/hooks/useAudioRecorder';
import { AudioMessagePlayer } from '@/components/AudioMessagePlayer';
import { EmojiPicker } from '@/components/EmojiPicker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from 'lucide-react';

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
  const [chatSettings, setChatSettings] = useState<ChatSettings>({ isLocked: false });
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isTogglingLock, setIsTogglingLock] = useState(false);
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

  const isAdmin = (userProfile as any)?.isAdmin;

  // Subscribe to global chat
  useEffect(() => {
    const unsubscribe = subscribeToGlobalChat((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to chat settings
  useEffect(() => {
    const unsubscribe = subscribeToChatSettings((settings) => {
      setChatSettings(settings);
    });

    return () => unsubscribe();
  }, []);

  // Clean old messages periodically (run once on mount for admins)
  useEffect(() => {
    if (isAdmin) {
      cleanOldMessages().then((count) => {
        if (count > 0) {
          console.log(`Cleaned ${count} messages older than 7 days`);
        }
      });
    }
  }, [isAdmin]);

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
      toast.error(result.error || 'Erro ao enviar mensagem');
    }
    
    setSending(false);
  };

  const handleToggleLock = async () => {
    if (!userProfile || !isAdmin) return;
    
    setIsTogglingLock(true);
    const newLockState = !chatSettings.isLocked;
    const success = await toggleChatLock(newLockState, userProfile.uid);
    
    if (success) {
      toast.success(newLockState ? 'Chat bloqueado' : 'Chat desbloqueado');
    } else {
      toast.error('Erro ao alterar status do chat');
    }
    setIsTogglingLock(false);
  };

  const handleClearChat = async () => {
    if (!userProfile || !isAdmin) return;
    
    setIsClearing(true);
    const success = await clearAllMessages(userProfile.uid);
    
    if (success) {
      toast.success('Todas as mensagens foram apagadas');
      setClearDialogOpen(false);
    } else {
      toast.error('Erro ao limpar o chat');
    }
    setIsClearing(false);
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
      console.log('Uploading image to Supabase...');
      const imageUrl = await uploadImage(selectedImage, 'global-chat');
      console.log('Image uploaded, URL:', imageUrl);
      
      if (imageUrl) {
        console.log('Sending message with image URL:', imageUrl);
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

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
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
            {chatSettings.isLocked && (
              <Badge variant="destructive" className="text-[10px] gap-1">
                <Lock className="h-3 w-3" />
                Bloqueado
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{onlineCount} online</span>
            </div>
            
            {/* Admin Controls */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={handleToggleLock}
                    disabled={isTogglingLock}
                  >
                    {chatSettings.isLocked ? (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Desbloquear Chat
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Bloquear Chat
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpar Todo o Chat
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Limpar Chat
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja apagar TODAS as mensagens do chat global? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleClearChat}
                          disabled={isClearing}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isClearing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Limpando...
                            </>
                          ) : (
                            'Limpar Tudo'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
          {chatSettings.isLocked && !isAdmin ? (
            <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span className="text-sm">O chat está temporariamente bloqueado</span>
            </div>
          ) : isRecording ? (
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
                disabled={!userProfile || sending || (chatSettings.isLocked && !isAdmin)}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <EmojiPicker 
                onEmojiSelect={handleEmojiSelect}
                disabled={!userProfile || sending || (chatSettings.isLocked && !isAdmin)}
              />
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={chatSettings.isLocked ? "Chat bloqueado (admin pode enviar)" : "Digite sua mensagem..."}
                maxLength={500}
                disabled={!userProfile || sending || (chatSettings.isLocked && !isAdmin)}
                className="flex-1"
              />
              {newMessage.trim() ? (
                <Button 
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={!userProfile || sending || (chatSettings.isLocked && !isAdmin)}
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
                  disabled={!userProfile || sending || (chatSettings.isLocked && !isAdmin)}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          {!isRecording && !imagePreview && !chatSettings.isLocked && (
            <p className="text-[10px] text-muted-foreground mt-1 text-right">
              {newMessage.length}/500
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
