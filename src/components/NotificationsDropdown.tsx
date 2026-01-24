import { useState, useEffect, useCallback } from "react";
import { Bell, Check, CheckCheck, Heart, MessageSquare, Trash2, X, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Notification,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "@/lib/firebaseServices";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function NotificationsDropdown() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToNotifications(userProfile.uid, (newNotifications) => {
      setNotifications(newNotifications);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markNotificationAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    if (!userProfile?.uid) return;
    const success = await markAllNotificationsAsRead(userProfile.uid);
    if (success) {
      toast.success("Todas as notificações marcadas como lidas");
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleClearAll = async () => {
    if (!userProfile?.uid) return;
    const success = await clearAllNotifications(userProfile.uid);
    if (success) {
      toast.success("Todas as notificações removidas");
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
    setOpen(false);
    
    // Navigate based on notification type
    if (notification.type === 'new_product') {
      navigate('/products');
    } else {
      navigate('/community');
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Agora";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Agora";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-semibold">Notificações</h3>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Ler todas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                onClick={handleClearAll}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 bg-muted rounded" />
                    <div className="h-2 w-1/2 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação ainda
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 group",
                    !notification.read && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="relative">
                    {notification.type === 'new_product' ? (
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {notification.productImage ? (
                          <img 
                            src={notification.productImage} 
                            alt={notification.productName || 'Produto'} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    ) : (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.fromUserAvatar || undefined} />
                        <AvatarFallback className="bg-primary/20">
                          {notification.fromUserName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center",
                        notification.type === "like"
                          ? "bg-destructive"
                          : notification.type === "new_product"
                            ? "bg-primary"
                            : "bg-accent"
                      )}
                    >
                      {notification.type === "like" ? (
                        <Heart className="h-3 w-3 text-destructive-foreground fill-current" />
                      ) : notification.type === "new_product" ? (
                        <Sparkles className="h-3 w-3 text-primary-foreground" />
                      ) : (
                        <MessageSquare className="h-3 w-3 text-accent-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      {notification.type === 'new_product' ? (
                        <>
                          <span className="font-semibold">Novo produto!</span>{" "}
                          {notification.productName} disponível na loja
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">{notification.fromUserName}</span>{" "}
                          {notification.type === "like"
                            ? "curtiu seu post"
                            : "comentou no seu post"}
                        </>
                      )}
                    </p>
                    {notification.type === 'new_product' && notification.productPrice && (
                      <p className="text-xs text-primary font-semibold mt-0.5">
                        🎁 {notification.productPrice.toLocaleString()} pontos
                      </p>
                    )}
                    {notification.postContent && notification.type !== 'new_product' && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        "{notification.postContent}"
                      </p>
                    )}
                    {notification.type === "comment" && notification.commentContent && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        💬 {notification.commentContent}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={(e) => handleDelete(notification.id, e)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
