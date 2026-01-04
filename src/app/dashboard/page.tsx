import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  UtensilsCrossed,
  ShoppingCart,
  Calendar,
  Bell,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

async function getDashboardData(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayMenu, pendingOrders, upcomingAbsences, unreadNotifications] = await Promise.all([
    // Menú de hoy
    prisma.menu.findFirst({
      where: {
        date: today,
        isPublished: true,
      },
      include: {
        dishes: {
          include: {
            dish: {
              include: {
                tags: true,
                allergies: {
                  include: {
                    allergy: true,
                  },
                },
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    }),
    // Pedidos pendientes del usuario
    prisma.order.count({
      where: {
        userId,
        status: "PENDING",
      },
    }),
    // Próximas ausencias
    prisma.absence.findMany({
      where: {
        userId,
        endDate: {
          gte: today,
        },
      },
      orderBy: {
        startDate: "asc",
      },
      take: 3,
    }),
    // Notificaciones no leídas
    prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    }),
  ]);

  // Verificar si ya hizo pedido hoy
  const todayOrder = await prisma.order.findFirst({
    where: {
      userId,
      date: today,
    },
  });

  // Verificar alergias del usuario para alertas
  const userAllergies = await prisma.userAllergy.findMany({
    where: { userId },
    include: { allergy: true },
  });

  return {
    todayMenu,
    pendingOrders,
    upcomingAbsences,
    unreadNotifications,
    todayOrder,
    userAllergies,
  };
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const data = await getDashboardData(session.user.id);
  const today = new Date();

  return (
    <DashboardLayout title="Inicio">
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold">
            Hola, {session.user.name?.split(" ")[0]}
          </h2>
          <p className="text-muted-foreground">
            {format(today, "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Menú de hoy</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.todayMenu ? "Disponible" : "No disponible"}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.todayMenu
                  ? `${data.todayMenu.dishes.length} platos`
                  : "Pendiente de publicar"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tu pedido</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.todayOrder ? "Realizado" : "Pendiente"}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.todayOrder
                  ? `Estado: ${data.todayOrder.status === "CONFIRMED" ? "Confirmado" : "Pendiente"}`
                  : "Haz tu pedido para hoy"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ausencias</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.upcomingAbsences.length}</div>
              <p className="text-xs text-muted-foreground">Próximas programadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.unreadNotifications}</div>
              <p className="text-xs text-muted-foreground">Sin leer</p>
            </CardContent>
          </Card>
        </div>

        {/* Allergy warnings */}
        {data.userAllergies.length > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                Tus alergias registradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.userAllergies.map((ua) => (
                  <Badge key={ua.id} variant="outline" className="border-orange-300">
                    {ua.allergy.name}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                Los platos que contengan estos alérgenos estarán marcados para ti.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Today's menu */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Menú de hoy</CardTitle>
                <CardDescription>
                  {data.todayMenu?.name || "No hay menú publicado para hoy"}
                </CardDescription>
              </div>
              <Button asChild>
                <Link href="/menu">
                  Ver completo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.todayMenu ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.todayMenu.dishes.slice(0, 6).map((menuDish) => (
                  <div
                    key={menuDish.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{menuDish.dish.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {menuDish.dish.category === "STARTER" && "Entrante"}
                        {menuDish.dish.category === "MAIN" && "Principal"}
                        {menuDish.dish.category === "SIDE" && "Acompañamiento"}
                        {menuDish.dish.category === "DESSERT" && "Postre"}
                        {menuDish.dish.category === "DRINK" && "Bebida"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {menuDish.dish.tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          {tag.tag === "VEGETARIAN" && "V"}
                          {tag.tag === "VEGAN" && "VG"}
                          {tag.tag === "GLUTEN_FREE" && "SG"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UtensilsCrossed className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>El menú de hoy aún no ha sido publicado</p>
                <p className="text-sm">Vuelve más tarde para ver las opciones disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <Link href="/orders/new" className="block">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Hacer pedido
                </CardTitle>
                <CardDescription>
                  Realiza tu pedido para hoy o próximos días
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <Link href="/absences" className="block">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Registrar ausencia
                </CardTitle>
                <CardDescription>
                  Indica días que no estarás o no comerás aquí
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <Link href="/profile" className="block">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Mis alergias
                </CardTitle>
                <CardDescription>
                  Actualiza tus alergias y preferencias alimentarias
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
