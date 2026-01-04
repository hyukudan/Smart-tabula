import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// POST - Publicar menú y notificar a usuarios
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        dishes: {
          include: {
            dish: true,
          },
        },
      },
    });

    if (!menu) {
      return NextResponse.json(
        { error: "Menú no encontrado" },
        { status: 404 }
      );
    }

    if (menu.isPublished) {
      return NextResponse.json(
        { error: "El menú ya está publicado" },
        { status: 400 }
      );
    }

    // Publish menu
    await prisma.menu.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    // Get all employees (excluding users with absences for this date)
    const menuDate = new Date(menu.date);
    menuDate.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: {
        role: "EMPLOYEE",
        absences: {
          none: {
            AND: [
              { startDate: { lte: menuDate } },
              { endDate: { gte: menuDate } },
            ],
          },
        },
        skipMeals: {
          none: {
            date: menuDate,
          },
        },
      },
      select: { id: true },
    });

    // Create notifications for all employees
    const dateFormatted = format(menuDate, "EEEE d 'de' MMMM", { locale: es });

    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((user) => ({
          userId: user.id,
          title: "Nuevo menú disponible",
          message: `El menú para ${dateFormatted} ya está disponible. ¡Haz tu pedido!`,
          type: "MENU_PUBLISHED",
          link: "/menu",
        })),
      });
    }

    return NextResponse.json({
      success: true,
      notifiedUsers: users.length,
    });
  } catch (error) {
    console.error("Error publishing menu:", error);
    return NextResponse.json(
      { error: "Error al publicar menú" },
      { status: 500 }
    );
  }
}
