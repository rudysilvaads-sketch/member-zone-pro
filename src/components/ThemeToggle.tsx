import { Moon, Sun, Monitor, Waves, Trees, Sunset, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect } from "react";
import { useThemePreference } from "@/hooks/useThemePreference";

const themes = [
  { id: "light", label: "Claro", icon: Sun, color: "text-amber-500" },
  { id: "dark", label: "Escuro", icon: Moon, color: "text-slate-400" },
  { id: "ocean", label: "Oceano", icon: Waves, color: "text-cyan-500" },
  { id: "forest", label: "Floresta", icon: Trees, color: "text-emerald-500" },
  { id: "sunset", label: "Pôr do Sol", icon: Sunset, color: "text-purple-500" },
  { id: "system", label: "Sistema", icon: Monitor, color: "text-muted-foreground" },
];

export function ThemeToggle() {
  const { theme, setTheme, isSaving } = useThemePreference();

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes first
    root.classList.remove("theme-ocean", "theme-forest", "theme-sunset");
    
    // Add the custom theme class if it's one of our special themes
    if (theme === "ocean") {
      root.classList.add("theme-ocean");
      root.classList.add("dark");
    } else if (theme === "forest") {
      root.classList.add("theme-forest");
      root.classList.add("dark");
    } else if (theme === "sunset") {
      root.classList.add("theme-sunset");
      root.classList.add("dark");
    }
  }, [theme]);

  const currentTheme = themes.find(t => t.id === theme) || themes[1];
  const CurrentIcon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CurrentIcon className={`h-4 w-4 ${currentTheme.color}`} />
          )}
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {themes.slice(0, 2).map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.id;
          return (
            <DropdownMenuItem 
              key={t.id}
              onClick={() => setTheme(t.id)} 
              className={`gap-2 justify-between ${isActive ? 'bg-accent' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${t.color}`} />
                {t.label}
              </div>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Temas Especiais
        </div>
        
        {themes.slice(2, 5).map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.id;
          return (
            <DropdownMenuItem 
              key={t.id}
              onClick={() => setTheme(t.id)} 
              className={`gap-2 justify-between ${isActive ? 'bg-accent' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${t.color}`} />
                {t.label}
              </div>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => setTheme("system")} 
          className={`gap-2 justify-between ${theme === 'system' ? 'bg-accent' : ''}`}
        >
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            Sistema
          </div>
          {theme === 'system' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
