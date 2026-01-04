import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { format } from "date-fns";

// GET - Export daily orders to CSV
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "KITCHEN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const exportType = searchParams.get("type") || "summary"; // "summary" or "detailed"

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const prisma = await getPrisma();

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
            name: true,
            department: true,
            allergies: {
              include: { allergy: true },
            },
          },
        },
        items: {
          include: {
            dish: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const dateFormatted = format(targetDate, "yyyy-MM-dd");
    let csv = "";
    let filename = "";

    if (exportType === "summary") {
      // Summary export: dishes grouped by quantity
      const dishSummary: Record<string, { name: string; category: string; quantity: number }> = {};

      for (const order of orders) {
        for (const item of order.items) {
          const key = item.dish.id;
          if (!dishSummary[key]) {
            dishSummary[key] = {
              name: item.dish.name,
              category: item.dish.category,
              quantity: 0,
            };
          }
          dishSummary[key].quantity += item.quantity;
        }
      }

      csv = "Dish,Category,Quantity\n";
      const categoryOrder = ["STARTER", "MAIN", "SIDE", "DESSERT", "DRINK"];
      const sorted = Object.values(dishSummary).sort((a, b) => {
        return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      });

      for (const dish of sorted) {
        csv += `"${dish.name}","${dish.category}",${dish.quantity}\n`;
      }

      filename = `orders-summary-${dateFormatted}.csv`;
    } else {
      // Detailed export: all orders with user info
      csv = "Order,User,Department,Dish,Quantity,Notes,Allergies,Status\n";

      for (const order of orders) {
        const allergies = order.user.allergies.map((a) => a.allergy.name).join("; ");
        for (const item of order.items) {
          csv += `"${order.id}","${order.user.name}","${order.user.department || ""}","${item.dish.name}",${item.quantity},"${item.notes || ""}","${allergies}","${order.status}"\n`;
        }
      }

      filename = `orders-detail-${dateFormatted}.csv`;
    }

    // Add BOM for Excel compatibility
    const bom = "\uFEFF";
    const csvWithBom = bom + csv;

    return new NextResponse(csvWithBom, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting orders:", error);
    return NextResponse.json(
      { error: "Error exporting orders" },
      { status: 500 }
    );
  }
}
