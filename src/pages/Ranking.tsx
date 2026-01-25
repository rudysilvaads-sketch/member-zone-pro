import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Search, Crown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTopUsers, UserProfile } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";

const rankConfig: Record<string, { color: string; bg: string; border: string }> = {
  bronze: { color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/30" },
  silver: { color: "text-slate-300", bg: "bg-slate-400/20", border: "border-slate-400/30" },
  gold: { color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" },
  platinum: { color: "text-cyan-400", bg: "bg-cyan-500/20", border: "border-cyan-500/30" },
  diamond: { color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30" },
};

const Ranking = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<(UserProfile & { position: number })[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<(UserProfile & { position: number })[]>([]);
  const [search, setSearch] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const topUsers = await getTopUsers(100);
        setUsers(topUsers);
        setFilteredUsers(topUsers);
      } catch (error) {
        console.error('Error fetching ranking:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const filtered = users.filter(user => 
        user.displayName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [search, users]);

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-slate-300" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-400" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const userPosition = users.find(u => u.uid === userProfile?.uid)?.position;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header />
        
        <main className="p-6">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BFFF00]/10 border border-[#BFFF00]/20 mb-3">
              <span className="text-xs text-[#BFFF00] uppercase tracking-widest font-medium">Ranking</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
              <Trophy className="h-8 w-8 text-[#BFFF00]" />
              Ranking <span className="text-[#BFFF00] italic">Global</span>
            </h1>
            <p className="mt-1 text-white/50">
              Veja os melhores membros da comunidade
            </p>
          </div>

          {/* User Position Card */}
          {userProfile && userPosition && (
            <Card variant="gradient" className="mb-6 border-[#BFFF00]/20">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-[#BFFF00]/50">
                    <AvatarImage src={userProfile.photoURL || undefined} />
                    <AvatarFallback className="bg-[#BFFF00]/20 text-[#BFFF00]">
                      {userProfile.displayName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-white/50">Sua posição</p>
                    <p className="text-2xl font-bold text-[#BFFF00]">#{userPosition}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{userProfile.points.toLocaleString()}</p>
                    <p className="text-sm text-white/50">Pontos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">Nível {userProfile.level || 1}</p>
                    <p className="text-sm text-white/50">XP: {userProfile.xp || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Top 3 Podium */}
          {filteredUsers.length >= 3 && !search && (
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              {[1, 0, 2].map((idx) => {
                const user = filteredUsers[idx];
                if (!user) return null;
                const isFirst = idx === 0;
                const rank = rankConfig[user.rank] || rankConfig.bronze;
                
                return (
                  <Card 
                    key={user.uid} 
                    variant="gradient"
                    className={cn(
                      "text-center transition-all",
                      isFirst && "md:order-1 md:-mt-4 border-[#BFFF00]/30 shadow-[0_0_40px_rgba(191,255,0,0.2)]",
                      idx === 1 && "md:order-0 border-slate-400/30",
                      idx === 2 && "md:order-2 border-orange-500/30"
                    )}
                  >
                    <CardContent className="pt-6">
                      <div className="flex justify-center mb-4">
                        {getPositionIcon(user.position)}
                      </div>
                      <Avatar className={cn("h-20 w-20 mx-auto border-4", isFirst ? "border-[#BFFF00]/50" : rank.border)}>
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback className={isFirst ? "bg-[#BFFF00]/20 text-[#BFFF00]" : rank.bg}>
                          {user.displayName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="mt-4 font-bold text-lg text-white">{user.displayName}</h3>
                      <Badge className={cn("mt-2", rank.bg, rank.color)}>
                        {user.rank?.charAt(0).toUpperCase() + user.rank?.slice(1)}
                      </Badge>
                      <p className="mt-3 text-2xl font-bold text-[#BFFF00]">
                        {user.points.toLocaleString()} pts
                      </p>
                      <p className="text-sm text-white/50">
                        Nível {user.level || 1}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Full Ranking List */}
          <Card variant="gradient">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-[#BFFF00]" />
                Classificação <span className="text-[#BFFF00] italic ml-1">Completa</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => {
                    const rank = rankConfig[user.rank] || rankConfig.bronze;
                    const isCurrentUser = user.uid === userProfile?.uid;
                    
                    return (
                      <div 
                        key={user.uid}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-white/5",
                          isCurrentUser && "bg-[#BFFF00]/10 border border-[#BFFF00]/20"
                        )}
                      >
                        <div className="w-10 flex justify-center">
                          {getPositionIcon(user.position)}
                        </div>
                        <Avatar className={cn("h-12 w-12 border-2", isCurrentUser ? "border-[#BFFF00]/50" : rank.border)}>
                          <AvatarImage src={user.photoURL || undefined} />
                          <AvatarFallback className={isCurrentUser ? "bg-[#BFFF00]/20 text-[#BFFF00]" : rank.bg}>
                            {user.displayName?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className={cn("font-semibold text-white", isCurrentUser && "text-[#BFFF00]")}>
                            {user.displayName}
                            {isCurrentUser && <span className="ml-2 text-xs text-[#BFFF00]">(Você)</span>}
                          </p>
                          <Badge variant="outline" className={cn("text-xs", rank.color)}>
                            {user.rank?.charAt(0).toUpperCase() + user.rank?.slice(1)} • Nível {user.level || 1}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-[#BFFF00]">{user.points.toLocaleString()}</p>
                          <p className="text-xs text-white/50">pontos</p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredUsers.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Ranking;
