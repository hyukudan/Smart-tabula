import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Obtener menús
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const published = searchParams.get("published");

    const where: Record<string, unknown> = {};

    if (date) {
      const dateObj = new Date(date);
      dateObj.setHours(0, 0, 0, 0);
      where.date = dateObj;
    }

    if (published === "true") {
      where.isPublished = true;
    }

    const menus = await prisma.menu.findMany({
      where,
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
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(menus);
  } catch (error) {
    console.error("Error fetching menus:", error);
    return NextResponse.json(
      { error: "Error al obtener menús" },
      { status: 500 }
    );
  }
}

// POST - Crear menú (solo admin)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, date, dishIds } = body;

    if (!name || !date || !dishIds || dishIds.length === 0) {
      return NextResponse.json(
        { error: "Nombre, fecha y platos son requeridos" },
        { status: 400 }
      );
    }

    const menuDate = new Date(date);
    menuDate.setHours(0, 0, 0, 0);

    // Check if menu already exists for this date
    const existingMenu = await prisma.menu.findFirst({
      where: { date: menuDate },
    });

    if (existingMenu) {
      return NextResponse.json(
        { error: "Ya existe un menú para esta fecha" },
        { status: 400 }
      );
    }

    // Get week number
    const startOfYear = new Date(menuDate.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((menuDate.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );

    const menu = await prisma.menu.create({
      data: {
        name,
        description: description || null,
        date: menuDate,
        weekNumber,
        year: menuDate.getFullYear(),
        dishes: {
          create: dishIds.map((dishId: string, index: number) => ({
            dishId,
            position: index,
          })),
        },
      },
      include: {
        dishes: {
          include: {
            dish: true,
          },
        },
      },
    });

    return NextResponse.json(menu, { status: 201 });
  } catch (error) {
    console.error("Error creating menu:", error);
    return NextResponse.json(
      { error: "Error al crear menú" },
      { status: 500 }
    );
  }
}
