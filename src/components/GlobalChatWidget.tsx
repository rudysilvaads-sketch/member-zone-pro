import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { ChatWidget } from "@/components/ChatWidget";

export function GlobalChatWidget() {
  const { conversations } = useUnreadMessages();
  
  return <ChatWidget conversations={conversations} />;
}
