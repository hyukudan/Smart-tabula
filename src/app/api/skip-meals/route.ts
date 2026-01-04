import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Obtener skip meals del usuario
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const skipMeals = await prisma.skipMeal.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(skipMeals);
  } catch (error) {
    console.error("Error fetching skip meals:", error);
    return NextResponse.json(
      { error: "Error al obtener registros" },
      { status: 500 }
    );
  }
}

// POST - Crear skip meal
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { date, meal, reason } = body;

    if (!date) {
      return NextResponse.json(
        { error: "Fecha es requerida" },
        { status: 400 }
      );
    }

    const skipDate = new Date(date);
    skipDate.setHours(0, 0, 0, 0);

    // Check if already exists
    const existing = await prisma.skipMeal.findFirst({
      where: {
        userId: session.user.id,
        date: skipDate,
        meal: meal || "LUNCH",
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un registro para esta fecha y comida" },
        { status: 400 }
      );
    }

    const skipMeal = await prisma.skipMeal.create({
      data: {
        userId: session.user.id,
        date: skipDate,
        meal: meal || "LUNCH",
        reason: reason || null,
      },
    });

    return NextResponse.json(skipMeal, { status: 201 });
  } catch (error) {
    console.error("Error creating skip meal:", error);
    return NextResponse.json(
      { error: "Error al crear registro" },
      { status: 500 }
    );
  }
}
