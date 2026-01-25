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

  const darkSizeClasses = {
    sm: "text-[6px]",
    md: "text-[8px]",
    lg: "text-[10px]",
    xl: "text-xs",
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <span 
        className={cn(
          sizeClasses[size].sub,
          "text-[#F5A623] uppercase tracking-[0.4em] font-medium mb-1 drop-shadow-[0_0_20px_rgba(245,166,35,0.4)]"
        )}
      >
        Members Club
      </span>
      <div className="flex flex-col items-end">
        <span 
          className={cn(
            sizeClasses[size].main,
            "font-black italic text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          )}
          style={{ 
            fontFamily: "'Inter', sans-serif",
          }}
        >
          LA CASA
        </span>
        <span 
          className={cn(
            darkSizeClasses[size],
            "text-[#F5A623] uppercase tracking-[0.3em] font-bold italic -mt-1 mr-0.5 drop-shadow-[0_0_15px_rgba(245,166,35,0.5)]"
          )}
        >
          Dark
        </span>
      </div>
    </div>
  );
}