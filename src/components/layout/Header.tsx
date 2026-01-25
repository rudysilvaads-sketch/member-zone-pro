import { useState } from "react";
import { Search, MessageCircle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { ChatModal } from "@/components/ChatModal";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { usePresence } from "@/hooks/usePresence";
import { MissionProgressIndicator } from "@/components/layout/MissionProgressIndicator";

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
  const [chatOpen, setChatOpen] = useState(false);
  const { unreadCount } = useUnreadMessages();
  const { onlineCount } = usePresence();

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#BFFF00]/10 bg-[#0a0a0a]/95 backdrop-blur-xl px-6">
        {/* Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Buscar..."
              className="h-10 w-full rounded-xl border border-[#BFFF00]/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#BFFF00]/50 focus:border-[#BFFF00]/30 transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Online Members Counter */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">{onlineCount}</span>
          </div>

          {/* Mission Progress */}
          <MissionProgressIndicator />
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Chat Button with Badge */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setChatOpen(true)}
            className="relative text-white/70 hover:text-[#BFFF00] hover:bg-[#BFFF00]/5"
          >
            <MessageCircle className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#BFFF00] text-[10px] font-bold text-[#0a0a0a]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
          
          {/* Notifications */}
          <NotificationsDropdown />

          {/* User Menu */}
          <div className="flex items-center gap-3 pl-2 border-l border-[#BFFF00]/10">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-white">{userProfile?.displayName || 'Membro'}</p>
              <div className="flex items-center gap-1 justify-end">
                <Badge variant={getBadgeVariant(userProfile?.rank || 'bronze') as any} className="text-[10px] px-1.5 py-0">
                  {userProfile?.rank?.toUpperCase() || 'BRONZE'}
                </Badge>
                <span className="text-xs text-white/50">{userProfile?.points?.toLocaleString() || 0} pts</span>
              </div>
            </div>
            <Avatar className="h-10 w-10 border-2 border-[#BFFF00] shadow-[0_0_10px_rgba(191,255,0,0.3)]">
              <AvatarImage src={userProfile?.photoURL || undefined} />
              <AvatarFallback className="bg-[#BFFF00]/20 text-[#BFFF00]">{userProfile?.displayName?.[0] || 'M'}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <ChatModal open={chatOpen} onOpenChange={setChatOpen} />
    </>
  );
}
