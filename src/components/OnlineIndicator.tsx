import { cn } from "@/lib/utils";

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const OnlineIndicator = ({ isOnline, size = "md", className }: OnlineIndicatorProps) => {
  if (!isOnline) return null;

  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <span 
      className={cn(
        "absolute rounded-full bg-green-500 border-2 border-background animate-pulse",
        sizeClasses[size],
        className
      )}
      title="Online agora"
    />
  );
};
