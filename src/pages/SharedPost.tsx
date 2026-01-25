import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Heart, MessageSquare, Clock, ArrowLeft, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Post, getPostById } from "@/lib/firebaseServices";
import { Loader2 } from "lucide-react";
import { LaCasaLogo } from "@/components/LaCasaLogo";

const rankConfig: Record<string, { color: string; bg: string }> = {
  bronze: { color: "text-orange-400", bg: "bg-orange-500/20" },
  silver: { color: "text-slate-300", bg: "bg-slate-400/20" },
  gold: { color: "text-yellow-400", bg: "bg-yellow-500/20" },
  platinum: { color: "text-cyan-400", bg: "bg-cyan-500/20" },
  diamond: { color: "text-purple-400", bg: "bg-purple-500/20" },
};

const SharedPost = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageExpanded, setImageExpanded] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setError("Post não encontrado");
        setLoading(false);
        return;
      }

      try {
        const postData = await getPostById(postId);
        if (postData) {
          setPost(postData);
        } else {
          setError("Post não encontrado ou foi excluído");
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Erro ao carregar o post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Agora";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Agora";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Post não encontrado</h2>
            <p className="text-muted-foreground mb-6">
              {error || "Este post pode ter sido excluído ou o link é inválido."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button asChild>
                <Link to="/auth">
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rankStyle = rankConfig[post.authorRank] || rankConfig.bronze;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <LaCasaLogo className="h-8 w-8" />
            <span className="font-bold text-lg">La Casa</span>
          </Link>
          <Button asChild>
            <Link to="/auth">
              <LogIn className="h-4 w-4 mr-2" />
              Entrar para interagir
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Post da Comunidade</h1>
          <p className="text-muted-foreground">
            Entre para curtir, comentar e interagir com a comunidade
          </p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.authorAvatar || undefined} />
                <AvatarFallback className={rankStyle.bg}>
                  {post.authorName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{post.authorName}</span>
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

                {post.content && (
                  <p className="mt-2 text-foreground whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}

                {/* Post Image */}
                {post.imageUrl && (
                  <div className="mt-3 max-w-md">
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="max-h-64 w-auto max-w-full object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setImageExpanded(true)}
                    />
                  </div>
                )}

                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span>{post.likes?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.commentsCount || 0}</span>
                  </div>
                </div>

                {/* CTA to join */}
                <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-center mb-3">
                    Entre na comunidade para curtir, comentar e compartilhar!
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button asChild>
                      <Link to="/auth">Criar conta grátis</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/auth">Já tenho conta</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Image Expanded Dialog */}
      <Dialog open={imageExpanded} onOpenChange={setImageExpanded}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <img
            src={post.imageUrl || ""}
            alt="Post expanded"
            className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SharedPost;
