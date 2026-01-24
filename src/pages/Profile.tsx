import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Trophy, Target, Flame, Star, Award, ArrowLeft,
  MessageSquare, Heart, Calendar, TrendingUp, Zap, Medal,
  CheckCircle2, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getUserProfile, 
  UserProfile, 
  Post, 
  Achievement,
  getAchievements,
  getXpToNextLevel
} from "@/lib/firebaseServices";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

const rankConfig: Record<string, { color: string; bg: string; label: string }> = {
  bronze: { color: "text-orange-400", bg: "bg-orange-500/20", label: "Bronze" },
  silver: { color: "text-slate-300", bg: "bg-slate-400/20", label: "Prata" },
  gold: { color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Ouro" },
  platinum: { color: "text-cyan-400", bg: "bg-cyan-500/20", label: "Platina" },
  diamond: { color: "text-purple-400", bg: "bg-purple-500/20", label: "Diamante" },
};

const rarityConfig = {
  common: { color: "text-slate-400", bg: "bg-slate-500/20", border: "border-slate-500/30", label: "Comum" },
  rare: { color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30", label: "Raro" },
  epic: { color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30", label: "Épico" },
  legendary: { color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30", label: "Lendário" },
};

const iconMap: Record<string, React.ElementType> = {
  star: Star,
  flame: Flame,
  target: Target,
  zap: Zap,
  trophy: Trophy,
  medal: Medal,
};

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { userProfile: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const [profileData, userPosts, allAchievements] = await Promise.all([
          getUserProfile(userId),
          getUserPosts(userId),
          getAchievements()
        ]);
        
        setProfile(profileData);
        setPosts(userPosts);
        setAchievements(allAchievements);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [userId]);

  const getUserPosts = async (uid: string): Promise<Post[]> => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef, 
        where('authorId', '==', uid),
        orderBy('createdAt', 'desc'), 
        limit(20)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
    } catch (error) {
      console.error('Error fetching user posts:', error);
      return [];
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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
          <Header />
          <main className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-48 bg-muted rounded-lg" />
              <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-muted rounded-lg" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
          <Header />
          <main className="p-6">
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-bold mb-2">Usuário não encontrado</h2>
                <p className="text-muted-foreground mb-4">
                  O perfil que você está procurando não existe.
                </p>
                <Button onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const rank = rankConfig[profile.rank] || rankConfig.bronze;
  const unlockedIds = profile.achievements || [];
  const xpProgress = getXpToNextLevel(profile.xp || 0);
  const isOwnProfile = currentUser?.uid === profile.uid;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header />
        
        <main className="p-6">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {/* Profile Header */}
          <Card className="mb-6 overflow-hidden">
            <div className={cn("h-24 bg-gradient-to-r", rank.bg.replace('bg-', 'from-'), "to-primary/20")} />
            <CardContent className="relative pb-6">
              <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={profile.photoURL || undefined} />
                  <AvatarFallback className={cn("text-2xl", rank.bg)}>
                    {profile.displayName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 pt-2 md:pt-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                    <Badge className={cn(rank.bg, rank.color, "border-0")}>
                      <Trophy className="h-3 w-3 mr-1" />
                      {rank.label}
                    </Badge>
                    <Badge variant="secondary">
                      Nível {profile.level || 1}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Membro desde {formatDate(profile.createdAt)}
                    </span>
                  </div>
                </div>

                {isOwnProfile && (
                  <Link to="/settings">
                    <Button variant="outline">Editar Perfil</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("p-3 rounded-lg", rank.bg)}>
                  <Star className={cn("h-6 w-6", rank.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile.points?.toLocaleString() || 0}</p>
                  <p className="text-sm text-muted-foreground">Pontos</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/20">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile.xp?.toLocaleString() || 0}</p>
                  <p className="text-sm text-muted-foreground">XP Total</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-500/20">
                  <Flame className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{profile.streakDays || 0}</p>
                  <p className="text-sm text-muted-foreground">Dias de Streak</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/20">
                  <Award className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unlockedIds.length}</p>
                  <p className="text-sm text-muted-foreground">Conquistas</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Level Progress */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Nível {profile.level || 1}</span>
                <span className="text-sm text-muted-foreground">
                  {xpProgress.current} / {xpProgress.needed} XP
                </span>
              </div>
              <Progress value={xpProgress.progress} className="h-2" />
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="achievements" className="space-y-4">
            <TabsList>
              <TabsTrigger value="achievements">
                <Award className="h-4 w-4 mr-2" />
                Conquistas
              </TabsTrigger>
              <TabsTrigger value="posts">
                <MessageSquare className="h-4 w-4 mr-2" />
                Posts ({posts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="achievements">
              {achievements.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma conquista disponível</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {achievements.map((achievement) => {
                    const isUnlocked = unlockedIds.includes(achievement.id);
                    const config = rarityConfig[achievement.rarity as keyof typeof rarityConfig] || rarityConfig.common;
                    const Icon = iconMap[achievement.icon] || Award;
                    
                    return (
                      <Card 
                        key={achievement.id}
                        className={cn(
                          "transition-all",
                          isUnlocked 
                            ? cn(config.border, "border-2") 
                            : "opacity-50 grayscale"
                        )}
                      >
                        {isUnlocked && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                            isUnlocked ? config.bg : "bg-muted"
                          )}>
                            {isUnlocked ? (
                              <Icon className={cn("h-6 w-6", config.color)} />
                            ) : (
                              <Lock className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate">{achievement.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {achievement.description}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="posts">
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {isOwnProfile 
                        ? "Você ainda não publicou nenhum post"
                        : "Este usuário ainda não publicou posts"
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={post.authorAvatar || undefined} />
                            <AvatarFallback className={rank.bg}>
                              {post.authorName?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">{post.authorName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(post.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        {post.content && (
                          <p className="text-sm mb-3 whitespace-pre-wrap">{post.content}</p>
                        )}
                        
                        {post.imageUrl && (
                          <img 
                            src={post.imageUrl} 
                            alt="Post" 
                            className="rounded-lg max-h-80 object-cover mb-3"
                          />
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {post.commentsCount || 0}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Profile;
