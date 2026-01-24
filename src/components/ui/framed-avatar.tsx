import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getFrameById } from "@/lib/frameData";

interface FramedAvatarProps {
  src?: string | null;
  fallback?: string;
  frameId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

const fallbackSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-2xl',
};

export function FramedAvatar({ 
  src, 
  fallback = 'U', 
  frameId = 'frame-none',
  size = 'md',
  className 
}: FramedAvatarProps) {
  const frame = getFrameById(frameId);
  
  return (
    <div className={cn("avatar-frame-wrapper inline-flex", frame?.animationClass, className)}>
      <Avatar 
        className={cn(
          sizeClasses[size],
          "avatar-with-frame",
          frame?.borderStyle,
          frame?.glowStyle
        )}
      >
        <AvatarImage src={src || undefined} />
        <AvatarFallback className={cn("bg-primary/20", fallbackSizeClasses[size])}>
          {fallback}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
