import { useState } from "react";
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
  Shield,
  Menu,
  X,
  GraduationCap,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
  { icon: GraduationCap, label: "Tutoriais", href: "/tutorials" },
  { icon: ShoppingBag, label: "Produtos", href: "/products" },
  { icon: Users, label: "Comunidade", href: "/community" },
  { icon: HelpCircle, label: "Suporte", href: "/support" },
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
  const [mobileOpen, setMobileOpen] = useState(false);
  
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

  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex h-full flex-col">
      {/* Logo - La Casa Elite */}
      <div className="flex h-14 sm:h-16 items-center justify-between border-b border-[#F5A623]/10 px-4">
        <div className={cn("flex items-center gap-3", !isMobile && collapsed && "justify-center w-full")}>
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#F5A623] shadow-[0_0_20px_rgba(245,166,35,0.3)]">
            <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-[#0a0a0a]" />
          </div>
          {(isMobile || !collapsed) && (
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold italic text-white tracking-tight">LA CASA</span>
              <span className="text-[7px] sm:text-[8px] text-[#F5A623] uppercase tracking-[0.3em] -mt-1">Members Club</span>
            </div>
          )}
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="text-white/50 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 sm:p-4 overflow-y-auto">
        {navItems
          .filter(item => !item.adminOnly || hasAdminAccess)
          .map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => isMobile && setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 min-h-[48px]",
                  !isMobile && collapsed && "justify-center px-0",
                  active
                    ? "bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20 shadow-[0_0_15px_rgba(245,166,35,0.1)]"
                    : "text-white/70 hover:bg-white/5 hover:text-white active:bg-white/10",
                  item.adminOnly && "text-[#F5A623]/70"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", active && "text-[#F5A623]", item.adminOnly && "text-[#F5A623]/70")} />
                {(isMobile || !collapsed) && <span>{item.label}</span>}
              </Link>
            );
          })}
      </nav>

      {/* Logout & Collapse */}
      <div className="border-t border-[#F5A623]/10 p-3 sm:p-4 space-y-2 safe-area-inset">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 min-h-[48px]", 
            !isMobile && collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {(isMobile || !collapsed) && <span className="ml-3">Sair</span>}
        </Button>
        
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-full justify-center text-white/50 hover:text-[#F5A623] hover:bg-[#F5A623]/5 min-h-[48px]"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-3 top-3 z-50 md:hidden bg-[#0a0a0a]/90 border border-[#F5A623]/20 text-white hover:bg-[#F5A623]/10 hover:text-[#F5A623] h-10 w-10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 bg-[#0a0a0a] border-r border-[#F5A623]/10">
          <NavContent isMobile />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-[#0a0a0a] border-r border-[#F5A623]/10 transition-all duration-300 hidden md:block",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
