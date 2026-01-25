import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Users, Circle, Clock } from "lucide-react";
import { usePresence } from "@/hooks/usePresence";
import { useAuth } from "@/contexts/AuthContext";
import { Timestamp } from "firebase/firestore";
import { useState, useEffect } from "react";

interface OnlineMembersListProps {
  onMemberClick?: (user: { uid: string; displayName: string; photoURL: string | null }) => void;
}

const formatOnlineTime = (lastSeen: Timestamp | null): string => {
  if (!lastSeen) return "agora";
  
  const now = Date.now();
  const lastSeenTime = lastSeen.toMillis();
  const diffMs = now - lastSeenTime;
  const diffSeconds = Math.floor(diffMs / 1000);
  
  if (diffSeconds < 60) return "agora";
  
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}min`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  
  return "1d+";
};

export const OnlineMembersList = ({ onMemberClick }: OnlineMembersListProps) => {
  const { onlineUsers, onlineCount } = usePresence();
  const { user: currentUser } = useAuth();
  const [, setTick] = useState(0);

  // Update time display every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const onlineUsersList = Object.entries(onlineUsers).map(([oderId, userData]) => ({
    oderId,
    ...userData,
  }));

  return (
    <Card variant="gradient" className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Membros Online</span>
          </div>
          <Badge 
            variant="outline" 
            className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          >
            <Circle className="h-2 w-2 fill-emerald-400 mr-1" />
            {onlineCount}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {onlineCount === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum membro online</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-2">
            <div className="space-y-2">
              {onlineUsersList.map((member) => {
                const isCurrentUser = member.oderId === currentUser?.uid;
                const onlineTime = formatOnlineTime(member.lastSeen);
                
                return (
                  <div
                    key={member.oderId}
                    onClick={() => {
                      if (!isCurrentUser && onMemberClick) {
                        onMemberClick({
                          uid: member.oderId,
                          displayName: member.displayName,
                          photoURL: member.photoURL,
                        });
                      }
                    }}
                    className={`
                      flex items-center gap-3 p-2 rounded-lg transition-colors
                      ${isCurrentUser 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-muted/50 cursor-pointer'}
                    `}
                  >
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.photoURL || undefined} />
                        <AvatarFallback className="bg-primary/20 text-sm">
                          {member.displayName?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator */}
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.displayName || 'Usuário'}
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground ml-1">(você)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{onlineTime}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
