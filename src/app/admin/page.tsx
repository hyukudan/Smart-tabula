import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  Users,
  UtensilsCrossed,
  ShoppingCart,
  TrendingUp,
  Calendar,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

async function getAdminStats() {
  const prisma = await getPrisma();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const [
    totalUsers,
    totalDishes,
    todayOrders,
    weekOrders,
    monthOrders,
    todayMenu,
    pendingOrders,
    usersWithAllergies,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.dish.count({ where: { isAvailable: true } }),
    prisma.order.count({ where: { date: today } }),
    prisma.order.count({
      where: {
        date: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.order.count({
      where: {
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.menu.findFirst({
      where: { date: today },
      include: { _count: { select: { orders: true } } },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.user.count({
      where: {
        allergies: {
          some: {},
        },
      },
    }),
  ]);

  // Revenue this month
  const monthRevenue = await prisma.order.aggregate({
    where: {
      date: { gte: monthStart, lte: monthEnd },
      status: { not: "CANCELLED" },
    },
    _sum: {
      totalPrice: true,
    },
  });

  // Most ordered dishes
  const popularDishes = await prisma.orderItem.groupBy({
    by: ["dishId"],
    _count: {
      dishId: true,
    },
    orderBy: {
      _count: {
        dishId: "desc",
      },
    },
    take: 5,
  });

  const dishIds = popularDishes.map((d) => d.dishId);
  const dishes = await prisma.dish.findMany({
    where: { id: { in: dishIds } },
  });

  const popularDishesWithNames = popularDishes.map((pd) => ({
    ...pd,
    dish: dishes.find((d) => d.id === pd.dishId),
  }));

  return {
    totalUsers,
    totalDishes,
    todayOrders,
    weekOrders,
    monthOrders,
    todayMenu,
    pendingOrders,
    usersWithAllergies,
    monthRevenue: monthRevenue._sum.totalPrice || 0,
    popularDishes: popularDishesWithNames,
  };
}

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const stats = await getAdminStats();
  const today = new Date();

  return (
    <DashboardLayout title="Panel de administración">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground">
              {format(today, "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/admin/menus/new">
                <Calendar className="mr-2 h-4 w-4" />
                Crear menú
              </Link>
            </Button>
          </div>
        </div>

        {/* Alert for today's menu */}
        {!stats.todayMenu && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="h-5 w-5" />
                Sin menú para hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 dark:text-orange-300 mb-4">
                No hay ningún menú publicado para hoy. Los empleados no podrán hacer pedidos.
              </p>
              <Button asChild variant="outline">
                <Link href="/admin/menus/new">Crear menú para hoy</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.usersWithAllergies} con alergias registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pedidos hoy</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders} pendientes de confirmar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Platos activos</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDishes}</div>
              <p className="text-xs text-muted-foreground">Disponibles para menús</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ingresos mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.monthRevenue.toFixed(2)}€
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.monthOrders} pedidos este mes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick stats */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Today's menu summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Menú de hoy</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/menus">
                    Ver todos
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stats.todayMenu ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{stats.todayMenu.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.todayMenu.isPublished ? "Publicado" : "Borrador"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats.todayMenu._count.orders} pedidos realizados
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No hay menú configurado para hoy
                </p>
              )}
            </CardContent>
          </Card>

          {/* Popular dishes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Platos más pedidos</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin/dishes">
                    Ver todos
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stats.popularDishes.length > 0 ? (
                <div className="space-y-3">
                  {stats.popularDishes.map((item, index) => (
                    <div
                      key={item.dishId}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground font-mono">
                          {index + 1}.
                        </span>
                        <span>{item.dish?.name || "Plato eliminado"}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {item._count.dishId} pedidos
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Aún no hay datos de pedidos
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Button asChild variant="outline" className="h-auto py-4">
                <Link href="/admin/menus" className="flex flex-col items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  <span>Gestionar menús</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4">
                <Link href="/admin/dishes" className="flex flex-col items-center gap-2">
                  <UtensilsCrossed className="h-6 w-6" />
                  <span>Gestionar platos</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4">
                <Link href="/admin/orders" className="flex flex-col items-center gap-2">
                  <ShoppingCart className="h-6 w-6" />
                  <span>Ver pedidos</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4">
                <Link href="/admin/users" className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <span>Gestionar usuarios</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
