import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Medal, Award, Trophy } from "lucide-react";

const topUsers = [
  {
    rank: 1,
    name: "Carlos Mendes",
    points: 3420,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    badge: "diamond",
  },
  {
    rank: 2,
    name: "Ana Costa",
    points: 2890,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    badge: "platinum",
  },
  {
    rank: 3,
    name: "Pedro Santos",
    points: 2540,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    badge: "gold",
  },
  {
    rank: 4,
    name: "Maria Oliveira",
    points: 2210,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    badge: "gold",
  },
  {
    rank: 5,
    name: "Lucas Ferreira",
    points: 1980,
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop&crop=face",
    badge: "silver",
  },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-primary" />;
    case 2:
      return <Medal className="h-5 w-5 text-rank-platinum" />;
    case 3:
      return <Award className="h-5 w-5 text-bronze" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getBadgeVariant = (badge: string) => {
  switch (badge) {
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

export function RankingCard() {
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
        {topUsers.map((user, index) => (
          <div
            key={user.rank}
            className="flex items-center gap-4 rounded-lg bg-secondary/50 p-3 transition-all duration-200 hover:bg-secondary animate-slide-in-right"
            style={{ animationDelay: `${(index + 3) * 100}ms` }}
          >
            <div className="flex h-8 w-8 items-center justify-center">
              {getRankIcon(user.rank)}
            </div>
            <Avatar className="h-10 w-10 border-2 border-border">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{user.name}</p>
              <div className="flex items-center gap-2">
                <Badge variant={getBadgeVariant(user.badge) as any} className="text-[10px]">
                  {user.badge.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">{user.points.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">pontos</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
