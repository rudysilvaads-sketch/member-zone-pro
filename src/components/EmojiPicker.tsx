import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';
import EmojiPickerReact, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from 'next-themes';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

export const EmojiPicker = ({ onEmojiSelect, disabled }: EmojiPickerProps) => {
  const [open, setOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  const pickerTheme = resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="h-9 w-9"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 border-none" 
        side="top" 
        align="start"
        sideOffset={8}
      >
        <EmojiPickerReact
          onEmojiClick={handleEmojiClick}
          theme={pickerTheme}
          width={320}
          height={400}
          searchPlaceholder="Buscar emoji..."
          previewConfig={{ showPreview: false }}
          skinTonesDisabled
          lazyLoadEmojis
        />
      </PopoverContent>
    </Popover>
  );
};
