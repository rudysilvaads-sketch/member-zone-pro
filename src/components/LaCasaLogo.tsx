import { cn } from "@/lib/utils";

interface LaCasaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function LaCasaLogo({ size = "md", className }: LaCasaLogoProps) {
  const sizeClasses = {
    sm: { main: "text-2xl", sub: "text-[8px]" },
    md: { main: "text-4xl", sub: "text-[10px]" },
    lg: { main: "text-5xl", sub: "text-xs" },
    xl: { main: "text-6xl", sub: "text-sm" },
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <span 
        className={cn(
          sizeClasses[size].sub,
          "text-[#BFFF00] uppercase tracking-[0.4em] font-medium mb-1"
        )}
      >
        Members Club
      </span>
      <div className="flex items-baseline">
        <span 
          className={cn(
            sizeClasses[size].main,
            "font-black italic text-[#BFFF00] drop-shadow-[0_0_30px_rgba(191,255,0,0.4)]"
          )}
          style={{ 
            fontFamily: "'Inter', sans-serif",
          }}
        >
          LA CASA
        </span>
      </div>
    </div>
  );
}
