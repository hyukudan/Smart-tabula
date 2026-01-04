import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

// GET - Obtener pedidos del usuario
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    if (from || to) {
      where.date = {};
      if (from) {
        (where.date as Record<string, unknown>).gte = new Date(from);
      }
      if (to) {
        (where.date as Record<string, unknown>).lte = new Date(to);
      }
    }

    const prisma = await getPrisma();
    const orders = await prisma.order.findMany({
      where,
      include: {
        menu: true,
        items: {
          include: {
            dish: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Error al obtener pedidos" },
      { status: 500 }
    );
  }
}

// POST - Crear pedido
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { menuId, dishIds, notes } = body;

    if (!menuId || !dishIds || dishIds.length === 0) {
      return NextResponse.json(
        { error: "Menu y platos son requeridos" },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();
    // Obtener el menú para la fecha
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
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

    // Calcular precio total
    const totalPrice = menu.dishes
      .filter((d) => dishIds.includes(d.dish.id))
      .reduce((sum, d) => sum + d.dish.price, 0);

    // Crear pedido
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        menuId,
        date: menu.date,
        status: "PENDING",
        notes: notes || null,
        totalPrice,
        items: {
          create: dishIds.map((dishId: string) => ({
            dishId,
            quantity: 1,
          })),
        },
      },
      include: {
        items: {
          include: {
            dish: true,
          },
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Error al crear pedido" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar pedido existente
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, dishIds, notes } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "ID de pedido requerido" },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();
    // Verificar que el pedido pertenece al usuario
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        menu: {
          include: {
            dishes: {
              include: {
                dish: true,
              },
            },
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (existingOrder.status === "COMPLETED" || existingOrder.status === "CANCELLED") {
      return NextResponse.json(
        { error: "No se puede modificar un pedido completado o cancelado" },
        { status: 400 }
      );
    }

    // Calcular nuevo precio
    const totalPrice = existingOrder.menu.dishes
      .filter((d) => dishIds.includes(d.dish.id))
      .reduce((sum, d) => sum + d.dish.price, 0);

    // Actualizar pedido
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        notes: notes || null,
        totalPrice,
        items: {
          deleteMany: {},
          create: dishIds.map((dishId: string) => ({
            dishId,
            quantity: 1,
          })),
        },
      },
      include: {
        items: {
          include: {
            dish: true,
          },
        },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Error al actualizar pedido" },
      { status: 500 }
    );
  }
}
