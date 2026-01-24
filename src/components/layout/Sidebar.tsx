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
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold">
              <Crown className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-foreground">MemberHub</span>
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
                      ? "bg-sidebar-accent text-sidebar-primary shadow-glow-gold"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
                    item.adminOnly && "text-accent"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", active && "text-primary", item.adminOnly && "text-accent")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
        </nav>

        {/* Logout & Collapse */}
        <div className="border-t border-sidebar-border p-4 space-y-2">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn("w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10", collapsed && "justify-center")}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Sair</span>}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-full justify-center"
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
