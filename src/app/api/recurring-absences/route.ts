import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

// GET - Get user's recurring absences
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const absences = await prisma.recurringAbsence.findMany({
      where: { userId: session.user.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json(absences);
  } catch (error) {
    console.error("Error fetching recurring absences:", error);
    return NextResponse.json(
      { error: "Error fetching recurring absences" },
      { status: 500 }
    );
  }
}

// POST - Create recurring absence
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { dayOfWeek, meal, reason } = body;

    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: "Valid day of week (0-6) is required" },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();

    // Check if already exists
    const existing = await prisma.recurringAbsence.findFirst({
      where: {
        userId: session.user.id,
        dayOfWeek,
        meal: meal || "LUNCH",
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Recurring absence already exists for this day" },
        { status: 400 }
      );
    }

    const absence = await prisma.recurringAbsence.create({
      data: {
        userId: session.user.id,
        dayOfWeek,
        meal: meal || "LUNCH",
        reason: reason || null,
      },
    });

    return NextResponse.json(absence, { status: 201 });
  } catch (error) {
    console.error("Error creating recurring absence:", error);
    return NextResponse.json(
      { error: "Error creating recurring absence" },
      { status: 500 }
    );
  }
}

// DELETE - Remove recurring absence
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Absence ID is required" },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();

    // Verify ownership
    const absence = await prisma.recurringAbsence.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!absence) {
      return NextResponse.json(
        { error: "Recurring absence not found" },
        { status: 404 }
      );
    }

    await prisma.recurringAbsence.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recurring absence:", error);
    return NextResponse.json(
      { error: "Error deleting recurring absence" },
      { status: 500 }
    );
  }
}
