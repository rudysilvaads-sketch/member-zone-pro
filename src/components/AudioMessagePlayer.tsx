import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioMessagePlayerProps {
  src: string;
  isOwn?: boolean;
}

export function AudioMessagePlayer({ src, isOwn = false }: AudioMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    audio.currentTime = percentage * duration;
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Generate wave bars for visualization
  const waveBars = Array.from({ length: 20 }, (_, i) => {
    // Create a pseudo-random pattern based on index
    const height = 20 + Math.sin(i * 0.8) * 30 + Math.cos(i * 1.2) * 20;
    return Math.max(15, Math.min(100, height));
  });

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 shrink-0 rounded-full",
          isOwn 
            ? "hover:bg-primary-foreground/20 text-primary-foreground" 
            : "hover:bg-foreground/10"
        )}
        onClick={togglePlayPause}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </Button>

      {/* Waveform Visualization */}
      <div 
        className="flex-1 flex items-center gap-[2px] h-8 cursor-pointer"
        onClick={handleProgressClick}
      >
        {waveBars.map((height, index) => {
          const barProgress = (index / waveBars.length) * 100;
          const isPast = barProgress < progress;
          const isCurrent = Math.abs(barProgress - progress) < (100 / waveBars.length);
          
          return (
            <div
              key={index}
              className={cn(
                "w-[3px] rounded-full transition-all duration-150",
                isPast 
                  ? isOwn 
                    ? "bg-primary-foreground" 
                    : "bg-primary"
                  : isOwn 
                    ? "bg-primary-foreground/40" 
                    : "bg-muted-foreground/40",
                isPlaying && isCurrent && "animate-pulse"
              )}
              style={{
                height: `${height}%`,
                transform: isPlaying && isPast ? `scaleY(${0.8 + Math.random() * 0.4})` : "scaleY(1)",
                transition: isPlaying ? "transform 0.1s ease" : "all 0.15s ease"
              }}
            />
          );
        })}
      </div>

      {/* Duration */}
      <span className={cn(
        "text-xs tabular-nums shrink-0 min-w-[32px]",
        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
      )}>
        {isPlaying || currentTime > 0 
          ? formatTime(currentTime) 
          : formatTime(duration)
        }
      </span>
    </div>
  );
}
