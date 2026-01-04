import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

// GET - Obtener ausencias del usuario
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const absences = await prisma.absence.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(absences);
  } catch (error) {
    console.error("Error fetching absences:", error);
    return NextResponse.json(
      { error: "Error al obtener ausencias" },
      { status: 500 }
    );
  }
}

// POST - Crear ausencia
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, reason, notes } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Fechas son requeridas" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (end < start) {
      return NextResponse.json(
        { error: "La fecha de fin debe ser posterior a la de inicio" },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();
    const absence = await prisma.absence.create({
      data: {
        userId: session.user.id,
        startDate: start,
        endDate: end,
        reason: reason || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(absence, { status: 201 });
  } catch (error) {
    console.error("Error creating absence:", error);
    return NextResponse.json(
      { error: "Error al crear ausencia" },
      { status: 500 }
    );
  }
}
