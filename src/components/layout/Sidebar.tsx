import { 
  LayoutDashboard, 
  Trophy, 
  Award, 
  ShoppingBag, 
  Users, 
  Settings,
  Crown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";

// Admin emails list
const ADMIN_EMAILS = ['rudysilvaads@gmail.com'];

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Trophy, label: "Ranking", href: "/ranking" },
  { icon: Award, label: "Conquistas", href: "/achievements" },
  { icon: ShoppingBag, label: "Produtos", href: "/products" },
  { icon: Users, label: "Comunidade", href: "/community" },
  { icon: Settings, label: "Configurações", href: "/settings" },
  { icon: Shield, label: "Admin", href: "/admin", adminOnly: true },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check both email list AND Firestore role for admin/moderator access
  const isAdmin = user && (
    ADMIN_EMAILS.includes(user.email || '') || 
    (userProfile as any)?.isAdmin || 
    (userProfile as any)?.role === 'admin'
  );
  const isModerator = (userProfile as any)?.isModerator || (userProfile as any)?.role === 'moderator';
  const hasAdminAccess = isAdmin || isModerator;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso!');
      navigate('/auth');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[#0a0a0a] border-r border-[#BFFF00]/10 transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo - La Casa Elite */}
        <div className="flex h-16 items-center justify-between border-b border-[#BFFF00]/10 px-4">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#BFFF00] shadow-[0_0_20px_rgba(191,255,0,0.3)]">
              <Crown className="h-5 w-5 text-[#0a0a0a]" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold italic text-white tracking-tight">LA CASA</span>
                <span className="text-[8px] text-[#BFFF00] uppercase tracking-[0.3em] -mt-1">Members Club</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems
            .filter(item => !item.adminOnly || hasAdminAccess)
            .map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-[#BFFF00]/10 text-[#BFFF00] border border-[#BFFF00]/20 shadow-[0_0_15px_rgba(191,255,0,0.1)]"
                      : "text-white/70 hover:bg-white/5 hover:text-white",
                    item.adminOnly && "text-[#BFFF00]/70"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", active && "text-[#BFFF00]", item.adminOnly && "text-[#BFFF00]/70")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
        </nav>

        {/* Logout & Collapse */}
        <div className="border-t border-[#BFFF00]/10 p-4 space-y-2">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn("w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10", collapsed && "justify-center")}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Sair</span>}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-full justify-center text-white/50 hover:text-[#BFFF00] hover:bg-[#BFFF00]/5"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
