import { cn } from "@/lib/utils";

interface LaCasaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function LaCasaLogo({ size = "md", className }: LaCasaLogoProps) {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-5xl",
    xl: "text-6xl",
  };

  const subtitleSizes = {
    sm: "text-[10px] tracking-[0.2em]",
    md: "text-xs tracking-[0.3em]",
    lg: "text-sm tracking-[0.35em]",
    xl: "text-base tracking-[0.4em]",
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <h1 
        className={cn(
          sizeClasses[size],
          "font-bold text-[#7FFF00] drop-shadow-[0_0_20px_rgba(127,255,0,0.5)]"
        )}
        style={{ 
          fontFamily: "'Inter', sans-serif",
          fontWeight: 800,
          letterSpacing: "0.05em"
        }}
      >
        LA CASA
      </h1>
      <span 
        className={cn(
          subtitleSizes[size],
          "text-muted-foreground uppercase font-medium mt-1"
        )}
      >
        Members Club
      </span>
    </div>
  );
}
