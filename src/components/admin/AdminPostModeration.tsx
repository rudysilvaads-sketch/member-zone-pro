import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Edit,
  Eye,
  FileCheck,
  FileX,
  Files
} from 'lucide-react';
import { 
  Post, 
  PostStatus,
  getPendingPosts, 
  approvePost, 
  rejectPost,
  createNotification
} from '@/lib/firebaseServices';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
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

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
  approved: { label: 'Aprovado', color: 'text-green-500', bg: 'bg-green-500/20' },
  rejected: { label: 'Rejeitado', color: 'text-red-500', bg: 'bg-red-500/20' },
};

// Fetch all posts for admin management
const getAllPosts = async (limitCount: number = 100): Promise<Post[]> => {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];
  } catch (error) {
    console.error('Error fetching all posts:', error);
    return [];
  }
};

// Admin delete post (bypasses author check)
const adminDeletePost = async (postId: string): Promise<boolean> => {
  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
};

// Admin update post content
const adminUpdatePost = async (postId: string, content: string): Promise<boolean> => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { content });
    return true;
  } catch (error) {
    console.error('Error updating post:', error);
    return false;
  }
};

export function AdminPostModeration() {
  const { user } = useAuth();
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  
  // Dialogs
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [editContent, setEditContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchAllPosts = async () => {
    setLoading(true);
    try {
      const posts = await getAllPosts(200);
      setAllPosts(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPosts();
  }, []);

  // Filter posts by status
  const pendingPosts = allPosts.filter(p => p.status === 'pending');
  const approvedPosts = allPosts.filter(p => p.status === 'approved' || !p.status);
  const rejectedPosts = allPosts.filter(p => p.status === 'rejected');

  const handleApprove = async (post: Post) => {
    if (!user) return;
    
    setProcessing(post.id);
    try {
      const success = await approvePost(post.id, user.uid);
      if (success) {
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
        setAllPosts(prev => prev.map(p => 
          p.id === post.id ? { ...p, status: 'approved' as PostStatus } : p
        ));
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
        setAllPosts(prev => prev.map(p => 
          p.id === selectedPost.id ? { ...p, status: 'rejected' as PostStatus } : p
        ));
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

  const openDeleteDialog = (post: Post) => {
    setSelectedPost(post);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPost) return;
    
    setProcessing(selectedPost.id);
    try {
      const success = await adminDeletePost(selectedPost.id);
      if (success) {
        toast.success('Post excluído permanentemente');
        setAllPosts(prev => prev.filter(p => p.id !== selectedPost.id));
        setDeleteDialogOpen(false);
        setSelectedPost(null);
      } else {
        toast.error('Erro ao excluir post');
      }
    } catch (error) {
      toast.error('Erro ao excluir post');
    } finally {
      setProcessing(null);
    }
  };

  const openEditDialog = (post: Post) => {
    setSelectedPost(post);
    setEditContent(post.content);
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedPost || !editContent.trim()) return;
    
    setProcessing(selectedPost.id);
    try {
      const success = await adminUpdatePost(selectedPost.id, editContent.trim());
      if (success) {
        toast.success('Post atualizado');
        setAllPosts(prev => prev.map(p => 
          p.id === selectedPost.id ? { ...p, content: editContent.trim() } : p
        ));
        setEditDialogOpen(false);
        setSelectedPost(null);
      } else {
        toast.error('Erro ao atualizar post');
      }
    } catch (error) {
      toast.error('Erro ao atualizar post');
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

  const renderPostCard = (post: Post, showModActions = false) => {
    const rankStyle = rankConfig[post.authorRank?.toLowerCase()] || rankConfig.bronze;
    const status = post.status || 'approved';
    const statusStyle = statusConfig[status] || statusConfig.approved;
    const isProcessing = processing === post.id;
    
    return (
      <Card key={post.id} variant="gradient" className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Avatar className="h-12 w-12 shrink-0">
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
                <Badge variant="outline" className={cn("text-xs", statusStyle.color, statusStyle.bg)}>
                  {statusStyle.label}
                </Badge>
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
                  className="relative mb-3 cursor-pointer group inline-block"
                  onClick={() => setImagePreview(post.imageUrl || null)}
                >
                  <img 
                    src={post.imageUrl} 
                    alt="Post attachment" 
                    className="max-h-32 rounded-lg object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap">
                {/* Moderation actions for pending posts */}
                {showModActions && status === 'pending' && (
                  <>
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
                          <CheckCircle className="h-4 w-4 mr-1" />
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
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </>
                )}
                
                {/* Admin actions for all posts */}
                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(post)}
                    disabled={isProcessing}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => openDeleteDialog(post)}
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
            <Files className="h-5 w-5 text-primary" />
            Gerenciar Posts
          </h2>
          <p className="text-sm text-muted-foreground">
            {allPosts.length} post(s) total • {pendingPosts.length} pendente(s)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAllPosts} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Pendentes</span>
            {pendingPosts.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {pendingPosts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Aprovados</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <FileX className="h-4 w-4" />
            <span className="hidden sm:inline">Rejeitados</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Files className="h-4 w-4" />
            <span className="hidden sm:inline">Todos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-4">
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
            pendingPosts.map(post => renderPostCard(post, true))
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4 space-y-4">
          {approvedPosts.length === 0 ? (
            <Card variant="gradient">
              <CardContent className="py-12 text-center">
                <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum post aprovado.</p>
              </CardContent>
            </Card>
          ) : (
            approvedPosts.map(post => renderPostCard(post, false))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4 space-y-4">
          {rejectedPosts.length === 0 ? (
            <Card variant="gradient">
              <CardContent className="py-12 text-center">
                <FileX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum post rejeitado.</p>
              </CardContent>
            </Card>
          ) : (
            rejectedPosts.map(post => renderPostCard(post, false))
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-4">
          {allPosts.length === 0 ? (
            <Card variant="gradient">
              <CardContent className="py-12 text-center">
                <Files className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum post encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            allPosts.map(post => renderPostCard(post, post.status === 'pending'))
          )}
        </TabsContent>
      </Tabs>

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
              O autor será notificado sobre a rejeição.
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
              {processing === selectedPost?.id && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Excluir Post
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta ação é permanente e não pode ser desfeita. O post será removido completamente.
            </p>
            
            {selectedPost && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Por: {selectedPost.authorName}</p>
                <p className="text-sm line-clamp-3">{selectedPost.content}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={processing === selectedPost?.id}
            >
              {processing === selectedPost?.id && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Editar Post
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedPost && (
              <p className="text-xs text-muted-foreground">
                Autor: {selectedPost.authorName}
              </p>
            )}
            
            <Textarea
              placeholder="Conteúdo do post..."
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[120px]"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {editContent.length}/1000
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEdit}
              disabled={!editContent.trim() || processing === selectedPost?.id}
            >
              {processing === selectedPost?.id && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Salvar Alterações
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