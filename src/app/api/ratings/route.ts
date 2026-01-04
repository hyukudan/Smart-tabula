import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

// GET - Get user's ratings or dish ratings
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dishId = searchParams.get("dishId");

    const prisma = await getPrisma();

    if (dishId) {
      // Get ratings for a specific dish
      const ratings = await prisma.dishRating.findMany({
        where: { dishId },
        include: {
          user: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const avgRating = await prisma.dishRating.aggregate({
        where: { dishId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      return NextResponse.json({
        ratings,
        average: avgRating._avg.rating || 0,
        count: avgRating._count.rating,
      });
    }

    // Get user's ratings
    const ratings = await prisma.dishRating.findMany({
      where: { userId: session.user.id },
      include: {
        dish: {
          select: { id: true, name: true, category: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(ratings);
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return NextResponse.json(
      { error: "Error fetching ratings" },
      { status: 500 }
    );
  }
}

// POST - Rate a dish
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { dishId, rating, comment } = body;

    if (!dishId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Dish ID and rating (1-5) are required" },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();

    // Check if dish exists
    const dish = await prisma.dish.findUnique({
      where: { id: dishId },
    });

    if (!dish) {
      return NextResponse.json(
        { error: "Dish not found" },
        { status: 404 }
      );
    }

    // Upsert rating (update if exists, create if not)
    const dishRating = await prisma.dishRating.upsert({
      where: {
        userId_dishId: {
          userId: session.user.id,
          dishId,
        },
      },
      update: {
        rating,
        comment: comment || null,
      },
      create: {
        userId: session.user.id,
        dishId,
        rating,
        comment: comment || null,
      },
      include: {
        dish: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(dishRating);
  } catch (error) {
    console.error("Error creating rating:", error);
    return NextResponse.json(
      { error: "Error creating rating" },
      { status: 500 }
    );
  }
}
