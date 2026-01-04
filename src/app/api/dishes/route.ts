import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

// GET - Obtener platos
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const available = searchParams.get("available");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};

    if (available === "true") {
      where.isAvailable = true;
    }

    if (category) {
      where.category = category;
    }

    const prisma = await getPrisma();
    const dishes = await prisma.dish.findMany({
      where,
      include: {
        tags: true,
        allergies: {
          include: {
            allergy: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(dishes);
  } catch (error) {
    console.error("Error fetching dishes:", error);
    return NextResponse.json(
      { error: "Error al obtener platos" },
      { status: 500 }
    );
  }
}

// POST - Crear plato (solo admin)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, category, price, calories, tags, allergyIds, isAvailable } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "Nombre y categoría son requeridos" },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();
    const dish = await prisma.dish.create({
      data: {
        name,
        description: description || null,
        category,
        price: price || 0,
        calories: calories || null,
        isAvailable: isAvailable !== false,
        tags: tags
          ? {
              create: tags.map((tag: string) => ({ tag })),
            }
          : undefined,
        allergies: allergyIds
          ? {
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

    return NextResponse.json(dish, { status: 201 });
  } catch (error) {
    console.error("Error creating dish:", error);
    return NextResponse.json(
      { error: "Error al crear plato" },
      { status: 500 }
    );
  }
}
