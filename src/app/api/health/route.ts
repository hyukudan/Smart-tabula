import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { databaseInfo } from "@/lib/db";

export async function GET() {
  const startTime = Date.now();

  try {
    const prisma = await getPrisma();

    // Test database connection and get stats
    const [userCount, menuCount, orderCount] = await Promise.all([
      prisma.user.count(),
      prisma.menu.count(),
      prisma.order.count(),
    ]);

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      database: {
        status: "connected",
        type: databaseInfo.type,
        responseTime: `${responseTime}ms`,
      },
      stats: {
        users: userCount,
        menus: menuCount,
        orders: orderCount,
      },
      config: {
        orderDeadline: process.env.ORDER_DEADLINE || "10:00",
        timezone: process.env.TZ || "UTC",
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: {
          status: "disconnected",
          type: databaseInfo.type,
          responseTime: `${responseTime}ms`,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 503 }
    );
  }
}
