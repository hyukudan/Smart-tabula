import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Obtener plato específico
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

    const dish = await prisma.dish.findUnique({
      where: { id },
      include: {
        tags: true,
        allergies: {
          include: {
            allergy: true,
          },
        },
      },
    });

    if (!dish) {
      return NextResponse.json(
        { error: "Plato no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(dish);
  } catch (error) {
    console.error("Error fetching dish:", error);
    return NextResponse.json(
      { error: "Error al obtener plato" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar plato (solo admin)
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
    const { name, description, category, price, calories, tags, allergyIds, isAvailable } = body;

    const existingDish = await prisma.dish.findUnique({
      where: { id },
    });

    if (!existingDish) {
      return NextResponse.json(
        { error: "Plato no encontrado" },
        { status: 404 }
      );
    }

    // Update dish
    const dish = await prisma.dish.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        category: category || undefined,
        price: price !== undefined ? price : undefined,
        calories: calories !== undefined ? calories : undefined,
        isAvailable: isAvailable !== undefined ? isAvailable : undefined,
        tags: tags !== undefined
          ? {
              deleteMany: {},
              create: tags.map((tag: string) => ({ tag })),
            }
          : undefined,
        allergies: allergyIds !== undefined
          ? {
              deleteMany: {},
              create: allergyIds.map((allergyId: string) => ({ allergyId })),
            }
          : undefined,
      },
      include: {
        tags: true,
        allergies: {
          include: {
            allergy: true,
          },
        },
      },
    });

    return NextResponse.json(dish);
  } catch (error) {
    console.error("Error updating dish:", error);
    return NextResponse.json(
      { error: "Error al actualizar plato" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar plato (solo admin)
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

    const existingDish = await prisma.dish.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orderItems: true, menus: true },
        },
      },
    });

    if (!existingDish) {
      return NextResponse.json(
        { error: "Plato no encontrado" },
        { status: 404 }
      );
    }

    if (existingDish._count.orderItems > 0 || existingDish._count.menus > 0) {
      // Instead of deleting, deactivate it
      await prisma.dish.update({
        where: { id },
        data: { isAvailable: false },
      });

      return NextResponse.json({
        success: true,
        message: "Plato desactivado (tiene pedidos o menús asociados)",
      });
    }

    await prisma.dish.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting dish:", error);
    return NextResponse.json(
      { error: "Error al eliminar plato" },
      { status: 500 }
    );
  }
}
