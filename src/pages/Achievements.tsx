import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Lock, Star, Flame, Target, Zap, Trophy, Medal, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAchievements, Achievement } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";

const iconMap: Record<string, React.ElementType> = {
  star: Star,
  flame: Flame,
  target: Target,
  zap: Zap,
  trophy: Trophy,
  medal: Medal,
};

const rarityConfig = {
  common: { color: "text-slate-400", bg: "bg-slate-500/20", border: "border-slate-500/30", label: "Comum" },
  rare: { color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30", label: "Raro" },
  epic: { color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30", label: "Épico" },
  legendary: { color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30", label: "Lendário" },
};

const Achievements = () => {
  const { userProfile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const data = await getAchievements();
        setAchievements(data);
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  const unlockedIds = userProfile?.achievements || [];
  const unlockedCount = unlockedIds.length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const groupedAchievements = {
    legendary: achievements.filter(a => a.rarity === 'legendary'),
    epic: achievements.filter(a => a.rarity === 'epic'),
    rare: achievements.filter(a => a.rarity === 'rare'),
    common: achievements.filter(a => a.rarity === 'common'),
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header />
        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Award className="h-8 w-8 text-primary" />
              Conquistas
            </h1>
            <p className="mt-1 text-muted-foreground">
              Desbloqueie conquistas completando desafios
            </p>
          </div>

          {/* Progress Overview */}
          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">Seu Progresso</h3>
                  <p className="text-muted-foreground">
                    {unlockedCount} de {totalCount} conquistas desbloqueadas
                  </p>
                </div>
                <div className="text-4xl font-bold text-primary">
                  {Math.round(progressPercent)}%
                </div>
              </div>
              <Progress value={progressPercent} className="h-3" />
              
              <div className="flex gap-4 mt-6">
                {Object.entries(rarityConfig).map(([key, config]) => {
                  const count = groupedAchievements[key as keyof typeof groupedAchievements]?.length || 0;
                  const unlocked = groupedAchievements[key as keyof typeof groupedAchievements]?.filter(a => unlockedIds.includes(a.id)).length || 0;
                  return (
                    <div key={key} className={cn("flex-1 p-3 rounded-lg", config.bg)}>
                      <p className={cn("text-sm font-medium", config.color)}>{config.label}</p>
                      <p className="text-lg font-bold">{unlocked}/{count}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Achievements Grid */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            Object.entries(groupedAchievements).map(([rarity, items]) => {
              if (items.length === 0) return null;
              const config = rarityConfig[rarity as keyof typeof rarityConfig];
              
              return (
                <div key={rarity} className="mb-8">
                  <h2 className={cn("text-xl font-bold mb-4 flex items-center gap-2", config.color)}>
                    <Star className="h-5 w-5" />
                    {config.label}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((achievement) => {
                      const isUnlocked = unlockedIds.includes(achievement.id);
                      const Icon = iconMap[achievement.icon] || Award;
                      
                      return (
                        <Card 
                          key={achievement.id}
                          className={cn(
                            "transition-all relative overflow-hidden",
                            isUnlocked 
                              ? cn(config.border, "border-2") 
                              : "opacity-60 grayscale"
                          )}
                        >
                          {isUnlocked && (
                            <div className="absolute top-3 right-3">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                          )}
                          <CardContent className="p-6">
                            <div className={cn(
                              "w-16 h-16 rounded-xl flex items-center justify-center mb-4",
                              isUnlocked ? config.bg : "bg-muted"
                            )}>
                              {isUnlocked ? (
                                <Icon className={cn("h-8 w-8", config.color)} />
                              ) : (
                                <Lock className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <h3 className="font-bold text-lg">{achievement.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {achievement.description}
                            </p>
                            <Badge className={cn("mt-3", isUnlocked ? config.bg : "bg-muted", config.color)}>
                              {config.label}
                            </Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {achievements.length === 0 && !loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma conquista disponível ainda
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default Achievements;
