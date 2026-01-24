import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const getBadgeVariant = (rank: string) => {
  switch (rank?.toLowerCase()) {
    case 'diamond': return 'diamond';
    case 'platinum': return 'platinum';
    case 'gold': return 'gold';
    case 'silver': return 'silver';
    default: return 'bronze';
  }
};

export function Header() {
  const { userProfile } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-6">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            className="h-10 w-full rounded-lg border border-input bg-secondary pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            3
          </span>
        </Button>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium">{userProfile?.displayName || 'Membro'}</p>
            <div className="flex items-center gap-1 justify-end">
              <Badge variant={getBadgeVariant(userProfile?.rank || 'bronze') as any} className="text-[10px] px-1.5 py-0">
                {userProfile?.rank?.toUpperCase() || 'BRONZE'}
              </Badge>
              <span className="text-xs text-muted-foreground">{userProfile?.points?.toLocaleString() || 0} pts</span>
            </div>
          </div>
          <Avatar className="h-10 w-10 border-2 border-gold">
            <AvatarImage src={userProfile?.photoURL || undefined} />
            <AvatarFallback>{userProfile?.displayName?.[0] || 'M'}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
