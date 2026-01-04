"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  UtensilsCrossed,
  ShoppingCart,
  Clock,
  CheckCircle,
  Trash2,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

interface NotificationsViewProps {
  notifications: Notification[];
}

const typeIcons: Record<string, React.ReactNode> = {
  MENU_PUBLISHED: <UtensilsCrossed className="h-5 w-5 text-green-500" />,
  ORDER_CONFIRMED: <ShoppingCart className="h-5 w-5 text-blue-500" />,
  REMINDER: <Clock className="h-5 w-5 text-orange-500" />,
  SYSTEM: <Bell className="h-5 w-5 text-gray-500" />,
};

export function NotificationsView({ notifications }: NotificationsViewProps) {
  const router = useRouter();

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      router.refresh();
    } catch {
      toast.error("Error al marcar como leída");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      toast.success("Todas las notificaciones marcadas como leídas");
      router.refresh();
    } catch {
      toast.error("Error al marcar como leídas");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch {
      toast.error("Error al eliminar notificación");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? "es" : ""} sin leer`
              : "No tienes notificaciones sin leer"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Notifications list */}
      <Card>
        <CardHeader>
          <CardTitle>Todas las notificaciones</CardTitle>
          <CardDescription>
            Últimas 50 notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No tienes notificaciones</p>
              <p className="text-muted-foreground">
                Las notificaciones aparecerán aquí cuando haya novedades
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    notification.isRead
                      ? "bg-background"
                      : "bg-primary/5 border-primary/20"
                  }`}
                >
                  <div className="mt-0.5">
                    {typeIcons[notification.type] || typeIcons.SYSTEM}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{notification.title}</p>
                      {!notification.isRead && (
                        <Badge variant="default" className="text-xs">
                          Nueva
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                      {notification.link && (
                        <Link
                          href={notification.link}
                          className="text-xs text-primary hover:underline"
                          onClick={() => {
                            if (!notification.isRead) {
                              handleMarkAsRead(notification.id);
                            }
                          }}
                        >
                          Ver más
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
