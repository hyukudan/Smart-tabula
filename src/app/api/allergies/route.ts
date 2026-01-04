import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Obtener todos los alérgenos
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const allergies = await prisma.allergy.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(allergies);
  } catch (error) {
    console.error("Error fetching allergies:", error);
    return NextResponse.json(
      { error: "Error al obtener alérgenos" },
      { status: 500 }
    );
  }
}

// POST - Crear alérgeno (solo admin)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, icon } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Nombre es requerido" },
        { status: 400 }
      );
    }

    const existing = await prisma.allergy.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un alérgeno con ese nombre" },
        { status: 400 }
      );
    }

    const allergy = await prisma.allergy.create({
      data: {
        name,
        description: description || null,
        icon: icon || null,
      },
    });

    return NextResponse.json(allergy, { status: 201 });
  } catch (error) {
    console.error("Error creating allergy:", error);
    return NextResponse.json(
      { error: "Error al crear alérgeno" },
      { status: 500 }
    );
  }
}
