import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Obtener perfil del usuario actual
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        allergies: {
          include: {
            allergy: true,
          },
        },
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Error al obtener perfil" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar perfil del usuario actual
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, department, allergies, preferences } = body;

    // Update user basic info
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || undefined,
        department: department !== undefined ? department : undefined,
      },
    });

    // Update allergies if provided
    if (allergies !== undefined) {
      // Delete existing allergies
      await prisma.userAllergy.deleteMany({
        where: { userId: session.user.id },
      });

      // Create new allergies
      if (allergies.length > 0) {
        await prisma.userAllergy.createMany({
          data: allergies.map((a: { allergyId: string; severity: string }) => ({
            userId: session.user.id,
            allergyId: a.allergyId,
            severity: a.severity,
          })),
        });
      }
    }

    // Update preferences if provided
    if (preferences !== undefined) {
      // Delete existing preferences
      await prisma.userPreference.deleteMany({
        where: { userId: session.user.id },
      });

      // Create new preferences
      if (preferences.length > 0) {
        await prisma.userPreference.createMany({
          data: preferences.map((type: string) => ({
            userId: session.user.id,
            type,
          })),
        });
      }
    }

    // Fetch updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        allergies: {
          include: {
            allergy: true,
          },
        },
        preferences: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Error al actualizar perfil" },
      { status: 500 }
    );
  }
}
