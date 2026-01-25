import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare, 
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { 
  Post, 
  getPendingPosts, 
  approvePost, 
  rejectPost,
  createNotification
} from '@/lib/firebaseServices';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const rankConfig: Record<string, { color: string; bg: string }> = {
  bronze: { color: "text-orange-400", bg: "bg-orange-500/20" },
  silver: { color: "text-slate-300", bg: "bg-slate-400/20" },
  gold: { color: "text-yellow-400", bg: "bg-yellow-500/20" },
  platinum: { color: "text-cyan-400", bg: "bg-cyan-500/20" },
  diamond: { color: "text-purple-400", bg: "bg-purple-500/20" },
};

export function AdminPostModeration() {
  const { user } = useAuth();
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchPendingPosts = async () => {
    setLoading(true);
    try {
      const posts = await getPendingPosts(50);
      setPendingPosts(posts);
    } catch (error) {
      console.error('Error fetching pending posts:', error);
      toast.error('Erro ao carregar posts pendentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPosts();
  }, []);

  const handleApprove = async (post: Post) => {
    if (!user) return;
    
    setProcessing(post.id);
    try {
      const success = await approvePost(post.id, user.uid);
      if (success) {
        // Notify user
        await createNotification({
          userId: post.authorId,
          fromUserId: user.uid,
          fromUserName: 'Moderação',
          fromUserAvatar: null,
          type: 'post_approved',
          message: '✅ Seu post foi aprovado e já está visível na comunidade!',
          postId: post.id,
        });
        
        toast.success('Post aprovado!');
        setPendingPosts(prev => prev.filter(p => p.id !== post.id));
      } else {
        toast.error('Erro ao aprovar post');
      }
    } catch (error) {
      toast.error('Erro ao aprovar post');
    } finally {
      setProcessing(null);
    }
  };

  const openRejectDialog = (post: Post) => {
    setSelectedPost(post);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!user || !selectedPost) return;
    
    setProcessing(selectedPost.id);
    try {
      const success = await rejectPost(selectedPost.id, user.uid, rejectionReason);
      if (success) {
        // Notify user
        await createNotification({
          userId: selectedPost.authorId,
          fromUserId: user.uid,
          fromUserName: 'Moderação',
          fromUserAvatar: null,
          type: 'post_rejected',
          message: `❌ Seu post não foi aprovado. Motivo: ${rejectionReason || 'Conteúdo não aprovado'}`,
          postId: selectedPost.id,
        });
        
        toast.success('Post rejeitado');
        setPendingPosts(prev => prev.filter(p => p.id !== selectedPost.id));
        setRejectDialogOpen(false);
        setSelectedPost(null);
      } else {
        toast.error('Erro ao rejeitar post');
      }
    } catch (error) {
      toast.error('Erro ao rejeitar post');
    } finally {
      setProcessing(null);
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Agora';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Posts Pendentes
          </h2>
          <p className="text-sm text-muted-foreground">
            {pendingPosts.length} post(s) aguardando aprovação
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPendingPosts} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {pendingPosts.length === 0 ? (
        <Card variant="gradient">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tudo em dia!</h3>
            <p className="text-muted-foreground">
              Não há posts pendentes de aprovação.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingPosts.map((post) => {
            const rankStyle = rankConfig[post.authorRank?.toLowerCase()] || rankConfig.bronze;
            const isProcessing = processing === post.id;
            
            return (
              <Card key={post.id} variant="gradient" className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Author Info */}
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={post.authorAvatar || undefined} />
                      <AvatarFallback className="bg-primary/20">
                        {post.authorName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-semibold truncate">{post.authorName}</span>
                        <Badge variant="outline" className={cn("text-xs", rankStyle.color, rankStyle.bg)}>
                          {post.authorRank}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Nível {post.authorLevel}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatTimeAgo(post.createdAt)}
                        </span>
                      </div>
                      
                      {/* Content */}
                      <p className="text-sm mb-3 whitespace-pre-wrap break-words">
                        {post.content}
                      </p>
                      
                      {/* Image Preview */}
                      {post.imageUrl && (
                        <div 
                          className="relative mb-3 cursor-pointer group"
                          onClick={() => setImagePreview(post.imageUrl || null)}
                        >
                          <img 
                            src={post.imageUrl} 
                            alt="Post attachment" 
                            className="max-h-48 rounded-lg object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(post)}
                          disabled={isProcessing}
                          className="bg-green-600/90 hover:bg-green-600"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aprovar
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(post)}
                          disabled={isProcessing}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Rejeitar Post
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              O autor será notificado sobre a rejeição. Forneça um motivo para ajudá-lo a entender.
            </p>
            
            {selectedPost && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm line-clamp-3">{selectedPost.content}</p>
              </div>
            )}
            
            <Textarea
              placeholder="Motivo da rejeição (opcional)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={processing === selectedPost?.id}
            >
              {processing === selectedPost?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl p-0">
          {imagePreview && (
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}