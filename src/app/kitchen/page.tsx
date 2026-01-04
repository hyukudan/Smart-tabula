import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/lib/prisma";
import { format } from "date-fns";
import {
  ChefHat,
  Download,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Package,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const categoryColors: Record<string, string> = {
  STARTER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  MAIN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  SIDE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  DESSERT: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100",
  DRINK: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
};

async function getKitchenData(date: Date) {
  const prisma = await getPrisma();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: { not: "CANCELLED" },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          department: true,
          allergies: {
            include: { allergy: true },
          },
        },
      },
      items: {
        include: {
          dish: {
            include: {
              tags: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by dish for kitchen summary
  const dishSummary: Record<
    string,
    {
      dish: { id: string; name: string; category: string };
      quantity: number;
      orders: Array<{
        orderId: string;
        userName: string;
        department: string | null;
        notes: string | null;
        allergies: string[];
      }>;
    }
  > = {};

  for (const order of orders) {
    for (const item of order.items) {
      const dishId = item.dish.id;
      if (!dishSummary[dishId]) {
        dishSummary[dishId] = {
          dish: {
            id: item.dish.id,
            name: item.dish.name,
            category: item.dish.category,
          },
          quantity: 0,
          orders: [],
        };
      }
      dishSummary[dishId].quantity += item.quantity;
      dishSummary[dishId].orders.push({
        orderId: order.id,
        userName: order.user.name,
        department: order.user.department,
        notes: item.notes,
        allergies: order.user.allergies.map((a) => a.allergy.name),
      });
    }
  }

  // Sort by category
  const categoryOrder = ["STARTER", "MAIN", "SIDE", "DESSERT", "DRINK"];
  const sortedDishes = Object.values(dishSummary).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.dish.category);
    const bIndex = categoryOrder.indexOf(b.dish.category);
    return aIndex - bIndex;
  });

  // Group by category
  const groupedByCategory: Record<string, typeof sortedDishes> = {};
  for (const item of sortedDishes) {
    const cat = item.dish.category;
    if (!groupedByCategory[cat]) {
      groupedByCategory[cat] = [];
    }
    groupedByCategory[cat].push(item);
  }

  // Stats
  const stats = {
    totalOrders: orders.length,
    totalItems: orders.reduce((sum, o) => sum + o.items.length, 0),
    totalPortions: orders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    ),
    confirmedOrders: orders.filter((o) => o.status === "CONFIRMED").length,
    pendingOrders: orders.filter((o) => o.status === "PENDING").length,
    completedOrders: orders.filter((o) => o.status === "COMPLETED").length,
    usersWithAllergies: orders.filter((o) => o.user.allergies.length > 0).length,
  };

  return { groupedByCategory, stats, categoryOrder };
}

export default async function KitchenPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();

  if (!session?.user || !["ADMIN", "KITCHEN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const targetDate = params.date ? new Date(params.date) : new Date();
  const { groupedByCategory, stats, categoryOrder } = await getKitchenData(targetDate);

  const t = await getTranslations("kitchen");
  const tMenu = await getTranslations("menu.category");

  const dateStr = format(targetDate, "yyyy-MM-dd");
  const dateDisplay = format(targetDate, "EEEE, MMMM d, yyyy");

  // Translated category labels
  const categoryLabels: Record<string, string> = {
    STARTER: tMenu("STARTER"),
    MAIN: tMenu("MAIN"),
    SIDE: tMenu("SIDE"),
    DESSERT: tMenu("DESSERT"),
    DRINK: tMenu("DRINK"),
  };

  return (
    <DashboardLayout title={t("title")}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-orange-500" />
            <div>
              <h2 className="text-2xl font-bold">{t("orders")}</h2>
              <p className="text-muted-foreground">{dateDisplay}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/api/kitchen/export?date=${dateStr}&type=summary`}>
                <Download className="mr-2 h-4 w-4" />
                {t("exportSummary")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/api/kitchen/export?date=${dateStr}&type=detailed`}>
                <Download className="mr-2 h-4 w-4" />
                {t("exportDetails")}
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("totalOrders")}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPortions} portions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("pending")}</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingOrders}
              </div>
              <p className="text-xs text-muted-foreground">{t("awaitingConfirmation")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("confirmed")}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.confirmedOrders}
              </div>
              <p className="text-xs text-muted-foreground">{t("readyToPrepare")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("withAllergies")}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.usersWithAllergies}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("needsAttention")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Orders by Category */}
        {categoryOrder.map((category) => {
          const dishes = groupedByCategory[category];
          if (!dishes || dishes.length === 0) return null;

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className={categoryColors[category]}>
                    {categoryLabels[category]}
                  </Badge>
                  <span className="text-muted-foreground font-normal text-sm">
                    ({dishes.reduce((sum, d) => sum + d.quantity, 0)} portions)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dishes.map((item) => (
                    <div
                      key={item.dish.id}
                      className="border rounded-lg p-4 bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-lg">{item.dish.name}</h4>
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          x{item.quantity}
                        </Badge>
                      </div>

                      <div className="grid gap-2">
                        {item.orders.map((order, idx) => (
                          <div
                            key={`${order.orderId}-${idx}`}
                            className="flex items-center justify-between text-sm bg-background rounded px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{order.userName}</span>
                              {order.department && (
                                <span className="text-muted-foreground">
                                  ({order.department})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {order.notes && (
                                <Badge variant="outline" className="text-xs">
                                  {order.notes}
                                </Badge>
                              )}
                              {order.allergies.length > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs flex items-center gap-1"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  {order.allergies.join(", ")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Empty state */}
        {stats.totalOrders === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t("noOrders")}</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {t("noOrdersDescription")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
