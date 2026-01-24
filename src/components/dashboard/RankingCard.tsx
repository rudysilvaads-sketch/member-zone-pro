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
      return <Crown className="h-5 w-5 text-primary" />;
    case 2:
      return <Medal className="h-5 w-5 text-rank-platinum" />;
    case 3:
      return <Award className="h-5 w-5 text-bronze" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground">#{position}</span>;
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
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Top Ranking
        </CardTitle>
        <a href="/ranking" className="text-sm text-primary hover:underline">
          Ver todos
        </a>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário no ranking ainda</p>
            <p className="text-sm">Seja o primeiro a conquistar pontos!</p>
          </div>
        ) : (
          users.map((user, index) => (
            <div
              key={user.uid}
              className={`flex items-center gap-4 rounded-lg p-3 transition-all duration-200 hover:bg-secondary animate-slide-in-right ${
                user.uid === currentUserId ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/50'
              }`}
              style={{ animationDelay: `${(index + 3) * 100}ms` }}
            >
              <div className="flex h-8 w-8 items-center justify-center">
                {getRankIcon(user.position)}
              </div>
              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback>{user.displayName?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">
                  {user.displayName}
                  {user.uid === currentUserId && (
                    <span className="ml-2 text-xs text-primary">(você)</span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={getBadgeVariant(user.rank) as any} className="text-[10px]">
                    {user.rank?.toUpperCase() || 'BRONZE'}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{user.points?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">pontos</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
