import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

// GET - Get today's orders for kitchen (grouped by dish)
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "KITCHEN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const prisma = await getPrisma();

    // Get all orders for the day with items
    const orders = await prisma.order.findMany({
      where: {
        date: {
          gte: targetDate,
          lte: endDate,
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

    // Sort by category for easier kitchen workflow
    const categoryOrder = ["STARTER", "MAIN", "SIDE", "DESSERT", "DRINK"];
    const sortedDishes = Object.values(dishSummary).sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.dish.category);
      const bIndex = categoryOrder.indexOf(b.dish.category);
      return aIndex - bIndex;
    });

    // Stats
    const stats = {
      totalOrders: orders.length,
      totalItems: orders.reduce((sum, o) => sum + o.items.length, 0),
      confirmedOrders: orders.filter((o) => o.status === "CONFIRMED").length,
      pendingOrders: orders.filter((o) => o.status === "PENDING").length,
      completedOrders: orders.filter((o) => o.status === "COMPLETED").length,
    };

    return NextResponse.json({
      date: targetDate.toISOString(),
      stats,
      dishes: sortedDishes,
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        user: o.user.name,
        department: o.user.department,
        notes: o.notes,
        items: o.items.map((i) => ({
          dish: i.dish.name,
          quantity: i.quantity,
          notes: i.notes,
        })),
        allergies: o.user.allergies.map((a) => a.allergy.name),
      })),
    });
  } catch (error) {
    console.error("Error fetching kitchen orders:", error);
    return NextResponse.json(
      { error: "Error fetching orders" },
      { status: 500 }
    );
  }
}
