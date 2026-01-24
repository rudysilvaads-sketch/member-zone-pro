import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Medal, Award, Trophy } from "lucide-react";
import { UserProfile } from "@/lib/firebaseServices";

interface RankingCardProps {
  users: (UserProfile & { position: number })[];
  currentUserId?: string;
}

const getRankIcon = (position: number) => {
  switch (position) {
    case 1:
      return <Crown className="h-5 w-5 text-[#BFFF00]" />;
    case 2:
      return <Medal className="h-5 w-5 text-slate-300" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-500" />;
    default:
      return <span className="text-sm font-bold text-white/50">#{position}</span>;
  }
};

const getBadgeVariant = (rank: string) => {
  switch (rank?.toLowerCase()) {
    case "diamond":
      return "diamond";
    case "platinum":
      return "platinum";
    case "gold":
      return "gold";
    case "silver":
      return "silver";
    default:
      return "bronze";
  }
};

export function RankingCard({ users, currentUserId }: RankingCardProps) {
  return (
    <Card variant="gradient" className="animate-fade-in" style={{ animationDelay: "200ms" }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-white">
          <Trophy className="h-5 w-5 text-[#BFFF00]" />
          Top Ranking
        </CardTitle>
        <a href="/ranking" className="text-sm text-[#BFFF00] hover:underline">
          Ver todos
        </a>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50 text-[#BFFF00]/30" />
            <p>Nenhum usuário no ranking ainda</p>
            <p className="text-sm">Seja o primeiro a conquistar pontos!</p>
          </div>
        ) : (
          users.map((user, index) => (
            <div
              key={user.uid}
              className={`flex items-center gap-4 rounded-xl p-3 transition-all duration-200 hover:bg-white/5 ${
                user.uid === currentUserId ? 'bg-[#BFFF00]/10 border border-[#BFFF00]/20' : 'bg-white/5'
              }`}
              style={{ animationDelay: `${(index + 3) * 100}ms` }}
            >
              <div className="flex h-8 w-8 items-center justify-center">
                {getRankIcon(user.position)}
              </div>
              <Avatar className="h-10 w-10 border-2 border-[#BFFF00]/30">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback className="bg-[#BFFF00]/10 text-[#BFFF00]">{user.displayName?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-white">
                  {user.displayName}
                  {user.uid === currentUserId && (
                    <span className="ml-2 text-xs text-[#BFFF00]">(você)</span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={getBadgeVariant(user.rank) as any} className="text-[10px]">
                    {user.rank?.toUpperCase() || 'BRONZE'}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#BFFF00]">{user.points?.toLocaleString() || 0}</p>
                <p className="text-xs text-white/50">pontos</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
