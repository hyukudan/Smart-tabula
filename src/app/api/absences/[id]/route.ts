import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

// DELETE - Eliminar ausencia
export async function DELETE(
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
    const absence = await prisma.absence.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!absence) {
      return NextResponse.json(
        { error: "Ausencia no encontrada" },
        { status: 404 }
      );
    }

    await prisma.absence.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting absence:", error);
    return NextResponse.json(
      { error: "Error al eliminar ausencia" },
      { status: 500 }
    );
  }
}
