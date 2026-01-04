import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

// GET - Obtener menú específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const prisma = await getPrisma();
    const menu = await prisma.menu.findUnique({
      where: { id },
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
    });

    if (!menu) {
      return NextResponse.json(
        { error: "Menú no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json(
      { error: "Error al obtener menú" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar menú (solo admin)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, date, dishIds } = body;

    const prisma = await getPrisma();
    const existingMenu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      return NextResponse.json(
        { error: "Menú no encontrado" },
        { status: 404 }
      );
    }

    let menuDate = existingMenu.date;
    if (date) {
      menuDate = new Date(date);
      menuDate.setHours(0, 0, 0, 0);
    }

    // Update menu
    const menu = await prisma.menu.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        date: menuDate,
        dishes: dishIds
          ? {
              deleteMany: {},
              create: dishIds.map((dishId: string, index: number) => ({
                dishId,
                position: index,
              })),
            }
          : undefined,
      },
      include: {
        dishes: {
          include: {
            dish: true,
          },
        },
      },
    });

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Error updating menu:", error);
    return NextResponse.json(
      { error: "Error al actualizar menú" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar menú (solo admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const prisma = await getPrisma();
    const existingMenu = await prisma.menu.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!existingMenu) {
      return NextResponse.json(
        { error: "Menú no encontrado" },
        { status: 404 }
      );
    }

    if (existingMenu._count.orders > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un menú con pedidos" },
        { status: 400 }
      );
    }

    await prisma.menu.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu:", error);
    return NextResponse.json(
      { error: "Error al eliminar menú" },
      { status: 500 }
    );
  }
}
