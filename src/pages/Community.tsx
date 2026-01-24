import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, Heart, Share2, TrendingUp, UserPlus, Send, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTopUsers, UserProfile } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";

const rankConfig: Record<string, { color: string; bg: string }> = {
  bronze: { color: "text-orange-400", bg: "bg-orange-500/20" },
  silver: { color: "text-slate-300", bg: "bg-slate-400/20" },
  gold: { color: "text-yellow-400", bg: "bg-yellow-500/20" },
  platinum: { color: "text-cyan-400", bg: "bg-cyan-500/20" },
  diamond: { color: "text-purple-400", bg: "bg-purple-500/20" },
};

// Mock data for community features
const mockPosts = [
  {
    id: '1',
    author: { name: 'Maria Silva', avatar: null, rank: 'gold', level: 15 },
    content: 'Acabei de completar o módulo avançado! 🎉 Foi desafiador mas valeu cada minuto. Quem mais está fazendo?',
    likes: 24,
    comments: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
  },
  {
    id: '2',
    author: { name: 'João Santos', avatar: null, rank: 'platinum', level: 22 },
    content: 'Dica do dia: Façam as missões diárias logo cedo! Assim vocês garantem o streak e ainda começam o dia motivados 💪',
    likes: 56,
    comments: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '3',
    author: { name: 'Ana Costa', avatar: null, rank: 'diamond', level: 30 },
    content: 'Finalmente alcancei o rank Diamond! 💎 Obrigada a todos que me ajudaram nessa jornada. A comunidade aqui é incrível!',
    likes: 142,
    comments: 35,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
  },
];

const Community = () => {
  const { userProfile } = useAuth();
  const [topUsers, setTopUsers] = useState<(UserProfile & { position: number })[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const users = await getTopUsers(10);
        setTopUsers(users);
      } catch (error) {
        console.error('Error fetching community data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatTimeAgo = (date: Date) => {
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
                        className="resize-none"
                      />
                      <div className="flex justify-end">
                        <Button disabled={!newPost.trim()}>
                          <Send className="h-4 w-4 mr-2" />
                          Publicar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feed Tabs */}
              <Tabs defaultValue="recent">
                <TabsList>
                  <TabsTrigger value="recent">Recentes</TabsTrigger>
                  <TabsTrigger value="popular">Populares</TabsTrigger>
                  <TabsTrigger value="following">Seguindo</TabsTrigger>
                </TabsList>

                <TabsContent value="recent" className="space-y-4 mt-4">
                  {mockPosts.map((post) => {
                    const rankStyle = rankConfig[post.author.rank] || rankConfig.bronze;
                    
                    return (
                      <Card key={post.id}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={post.author.avatar || undefined} />
                              <AvatarFallback className={rankStyle.bg}>
                                {post.author.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">{post.author.name}</span>
                                <Badge className={cn("text-xs", rankStyle.bg, rankStyle.color)}>
                                  {post.author.rank.charAt(0).toUpperCase() + post.author.rank.slice(1)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Nível {post.author.level}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTimeAgo(post.createdAt)}
                                </span>
                              </div>
                              <p className="mt-2 text-foreground">{post.content}</p>
                              <div className="flex items-center gap-6 mt-4">
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                                  <Heart className="h-4 w-4 mr-1" />
                                  {post.likes}
                                </Button>
                                <Button variant="ghost" size="sm" className="text-muted-foreground">
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  {post.comments}
                                </Button>
                                <Button variant="ghost" size="sm" className="text-muted-foreground">
                                  <Share2 className="h-4 w-4 mr-1" />
                                  Compartilhar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>

                <TabsContent value="popular">
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Posts populares em breve...
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="following">
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Siga membros para ver seus posts aqui
                    </CardContent>
                  </Card>
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
                    <span className="text-muted-foreground">Membros ativos</span>
                    <span className="font-semibold">{topUsers.length}+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Posts hoje</span>
                    <span className="font-semibold">47</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Novos membros</span>
                    <span className="font-semibold text-green-500">+12</span>
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
                        <div key={user.uid} className="flex items-center gap-3">
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
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Links Rápidos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    📚 Guia da Comunidade
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    ❓ FAQ
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    🎯 Desafios Semanais
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Community;
