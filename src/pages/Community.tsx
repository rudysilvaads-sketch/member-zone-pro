import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Users, MessageSquare, Heart, TrendingUp, UserPlus, Send, Clock, 
  MoreHorizontal, Trash2, Loader2, ImagePlus, X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { 
  getTopUsers, 
  UserProfile, 
  Post, 
  Comment,
  getPosts, 
  createPost, 
  toggleLikePost, 
  deletePost,
  addComment,
  getComments,
  deleteComment,
  uploadPostImage,
  createNotification
} from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const rankConfig: Record<string, { color: string; bg: string }> = {
  bronze: { color: "text-orange-400", bg: "bg-orange-500/20" },
  silver: { color: "text-slate-300", bg: "bg-slate-400/20" },
  gold: { color: "text-yellow-400", bg: "bg-yellow-500/20" },
  platinum: { color: "text-cyan-400", bg: "bg-cyan-500/20" },
  diamond: { color: "text-purple-400", bg: "bg-purple-500/20" },
};

const Community = () => {
  const { userProfile } = useAuth();
  const [topUsers, setTopUsers] = useState<(UserProfile & { position: number })[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const postsData = await getPosts(50);
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, postsData] = await Promise.all([
          getTopUsers(10),
          getPosts(50)
        ]);
        setTopUsers(users);
        setPosts(postsData);
      } catch (error) {
        console.error('Error fetching community data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB.');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use JPG, PNG, GIF ou WebP.');
      return;
    }
    
    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async () => {
    if ((!newPost.trim() && !selectedImage) || !userProfile) return;
    
    setPosting(true);
    try {
      let imageUrl: string | null = null;
      let imagePath: string | null = null;
      
      // Upload image if selected
      if (selectedImage) {
        setUploadingImage(true);
        const uploadResult = await uploadPostImage(userProfile.uid, selectedImage);
        setUploadingImage(false);
        
        if (!uploadResult.success) {
          toast.error(uploadResult.error || 'Erro ao fazer upload da imagem');
          setPosting(false);
          return;
        }
        
        imageUrl = uploadResult.url || null;
        imagePath = uploadResult.path || null;
      }
      
      const result = await createPost(userProfile, newPost, imageUrl, imagePath);
      if (result.success) {
        toast.success('Post publicado!');
        setNewPost("");
        removeImage();
        await fetchPosts();
      } else {
        toast.error(result.error || 'Erro ao publicar');
      }
    } catch (error) {
      toast.error('Erro ao publicar post');
    } finally {
      setPosting(false);
      setUploadingImage(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!userProfile) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const isAlreadyLiked = post.likes?.includes(userProfile.uid);
    
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: isAlreadyLiked 
            ? p.likes.filter(id => id !== userProfile.uid)
            : [...(p.likes || []), userProfile.uid]
        };
      }
      return p;
    }));
    
    const result = await toggleLikePost(postId, userProfile.uid);
    
    // Create notification if liking (not unliking) and successful
    if (result.success && result.liked && post.authorId !== userProfile.uid) {
      await createNotification({
        userId: post.authorId,
        fromUserId: userProfile.uid,
        fromUserName: userProfile.displayName,
        fromUserAvatar: userProfile.photoURL,
        type: 'like',
        postId: postId,
        postContent: post.content?.substring(0, 50) || '',
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!userProfile) return;
    
    const success = await deletePost(postId, userProfile.uid);
    if (success) {
      toast.success('Post excluído');
      setPosts(prev => prev.filter(p => p.id !== postId));
    } else {
      toast.error('Erro ao excluir post');
    }
  };

  const openComments = async (post: Post) => {
    setSelectedPost(post);
    setLoadingComments(true);
    try {
      const commentsData = await getComments(post.id);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !userProfile || !selectedPost) return;
    
    setPostingComment(true);
    try {
      const result = await addComment(selectedPost.id, userProfile, newComment);
      if (result.success && result.comment) {
        setComments(prev => [...prev, result.comment!]);
        const commentText = newComment;
        setNewComment("");
        
        // Update comments count in posts list
        setPosts(prev => prev.map(p => 
          p.id === selectedPost.id 
            ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
            : p
        ));
        
        // Create notification for post author
        if (selectedPost.authorId !== userProfile.uid) {
          await createNotification({
            userId: selectedPost.authorId,
            fromUserId: userProfile.uid,
            fromUserName: userProfile.displayName,
            fromUserAvatar: userProfile.photoURL,
            type: 'comment',
            postId: selectedPost.id,
            postContent: selectedPost.content?.substring(0, 50) || '',
            commentContent: commentText.substring(0, 100),
          });
        }
        
        toast.success('Comentário adicionado!');
      }
    } catch (error) {
      toast.error('Erro ao comentar');
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!userProfile || !selectedPost) return;
    
    const success = await deleteComment(selectedPost.id, commentId, userProfile.uid);
    if (success) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      setPosts(prev => prev.map(p => 
        p.id === selectedPost.id 
          ? { ...p, commentsCount: Math.max((p.commentsCount || 1) - 1, 0) }
          : p
      ));
      toast.success('Comentário excluído');
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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header />
        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Comunidade
            </h1>
            <p className="mt-1 text-muted-foreground">
              Conecte-se com outros membros e compartilhe sua jornada
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Post */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userProfile?.photoURL || undefined} />
                      <AvatarFallback className="bg-primary/20">
                        {userProfile?.displayName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <Textarea 
                        placeholder="Compartilhe algo com a comunidade..."
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        className="resize-none min-h-[80px]"
                        maxLength={500}
                      />
                      
                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="relative inline-block">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="max-h-48 rounded-lg object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={removeImage}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={posting}
                          >
                            <ImagePlus className="h-4 w-4 mr-2" />
                            Imagem
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {newPost.length}/500
                          </span>
                        </div>
                        <Button 
                          onClick={handleCreatePost} 
                          disabled={(!newPost.trim() && !selectedImage) || posting}
                        >
                          {posting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {uploadingImage ? 'Enviando imagem...' : 'Publicando...'}
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Publicar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Posts Feed */}
              <Tabs defaultValue="recent">
                <TabsList>
                  <TabsTrigger value="recent">Recentes</TabsTrigger>
                  <TabsTrigger value="popular">Populares</TabsTrigger>
                </TabsList>

                <TabsContent value="recent" className="space-y-4 mt-4">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Card key={i}>
                          <CardContent className="p-4">
                            <div className="animate-pulse space-y-3">
                              <div className="flex gap-4">
                                <div className="h-12 w-12 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 w-32 bg-muted rounded" />
                                  <div className="h-3 w-20 bg-muted rounded" />
                                </div>
                              </div>
                              <div className="h-16 bg-muted rounded" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : posts.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Nenhum post ainda. Seja o primeiro a compartilhar!
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={userProfile?.uid}
                        onLike={() => handleLike(post.id)}
                        onDelete={() => handleDeletePost(post.id)}
                        onOpenComments={() => openComments(post)}
                        formatTimeAgo={formatTimeAgo}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="popular" className="space-y-4 mt-4">
                  {posts
                    .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
                    .slice(0, 10)
                    .map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={userProfile?.uid}
                        onLike={() => handleLike(post.id)}
                        onDelete={() => handleDeletePost(post.id)}
                        onOpenComments={() => openComments(post)}
                        formatTimeAgo={formatTimeAgo}
                      />
                    ))}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total de posts</span>
                    <span className="font-semibold">{posts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Membros ativos</span>
                    <span className="font-semibold">{topUsers.length}+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seus posts</span>
                    <span className="font-semibold">
                      {posts.filter(p => p.authorId === userProfile?.uid).length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Top Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Membros em Destaque
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topUsers.slice(0, 5).map((user) => {
                      const rankStyle = rankConfig[user.rank] || rankConfig.bronze;
                      
                      return (
                        <Link 
                          key={user.uid} 
                          to={`/profile/${user.uid}`}
                          className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-lg -mx-2 transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.photoURL || undefined} />
                            <AvatarFallback className={rankStyle.bg}>
                              {user.displayName?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.displayName}</p>
                            <Badge className={cn("text-xs", rankStyle.bg, rankStyle.color)}>
                              {user.rank?.charAt(0).toUpperCase() + user.rank?.slice(1)}
                            </Badge>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Comments Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Comentários</DialogTitle>
          </DialogHeader>
          
          {selectedPost && (
            <>
              {/* Original Post */}
              <div className="border-b pb-4 mb-4">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedPost.authorAvatar || undefined} />
                    <AvatarFallback>
                      {selectedPost.authorName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{selectedPost.authorName}</p>
                    <p className="text-sm text-foreground mt-1">{selectedPost.content}</p>
                    {selectedPost.imageUrl && (
                      <img 
                        src={selectedPost.imageUrl} 
                        alt="Post" 
                        className="mt-2 max-h-40 rounded-lg object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto space-y-4 min-h-[200px]">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum comentário ainda. Seja o primeiro!
                  </p>
                ) : (
                  comments.map((comment) => {
                    const rankStyle = rankConfig[comment.authorRank] || rankConfig.bronze;
                    return (
                      <div key={comment.id} className="flex gap-3 group">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.authorAvatar || undefined} />
                          <AvatarFallback className={rankStyle.bg}>
                            {comment.authorName?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{comment.authorName}</p>
                            {comment.authorId === userProfile?.uid && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm mt-1">{comment.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(comment.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Comment */}
              <div className="flex gap-2 pt-4 border-t">
                <Textarea
                  placeholder="Escreva um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="resize-none min-h-[60px]"
                  maxLength={300}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || postingComment}
                  size="icon"
                  className="shrink-0"
                >
                  {postingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <ImageLightbox />
    </div>
  );
};

// Image Lightbox Component (for viewing full images)
const ImageLightbox = () => {
  return null; // Placeholder for future implementation
};

// PostCard Component
interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike: () => void;
  onDelete: () => void;
  onOpenComments: () => void;
  formatTimeAgo: (timestamp: any) => string;
}

const PostCard = ({ post, currentUserId, onLike, onDelete, onOpenComments, formatTimeAgo }: PostCardProps) => {
  const rankStyle = rankConfig[post.authorRank] || rankConfig.bronze;
  const isLiked = post.likes?.includes(currentUserId || '');
  const isAuthor = post.authorId === currentUserId;
  const [imageExpanded, setImageExpanded] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Link to={`/profile/${post.authorId}`}>
              <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                <AvatarImage src={post.authorAvatar || undefined} />
                <AvatarFallback className={rankStyle.bg}>
                  {post.authorName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link 
                    to={`/profile/${post.authorId}`}
                    className="font-semibold hover:text-primary transition-colors"
                  >
                    {post.authorName}
                  </Link>
                  <Badge className={cn("text-xs", rankStyle.bg, rankStyle.color)}>
                    {post.authorRank?.charAt(0).toUpperCase() + post.authorRank?.slice(1)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Nível {post.authorLevel}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(post.createdAt)}
                  </span>
                </div>
                
                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={onDelete}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              {post.content && (
                <p className="mt-2 text-foreground whitespace-pre-wrap">{post.content}</p>
              )}
              
              {/* Post Image */}
              {post.imageUrl && (
                <div className="mt-3">
                  <img 
                    src={post.imageUrl} 
                    alt="Post" 
                    className="max-h-80 w-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setImageExpanded(true)}
                  />
                </div>
              )}
              
              <div className="flex items-center gap-6 mt-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "text-muted-foreground",
                    isLiked && "text-red-500 hover:text-red-600"
                  )}
                  onClick={onLike}
                >
                  <Heart className={cn("h-4 w-4 mr-1", isLiked && "fill-current")} />
                  {post.likes?.length || 0}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground"
                  onClick={onOpenComments}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {post.commentsCount || 0}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Expanded Dialog */}
      <Dialog open={imageExpanded} onOpenChange={setImageExpanded}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <img 
            src={post.imageUrl || ''} 
            alt="Post expanded" 
            className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Community;
