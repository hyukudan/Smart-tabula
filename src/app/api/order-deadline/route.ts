import { NextResponse } from "next/server";
import { getDeadlineInfo, isOrderingAllowed } from "@/lib/order-deadline";

// GET - Check order deadline status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  const targetDate = dateParam ? new Date(dateParam) : new Date();
  const deadlineInfo = getDeadlineInfo();
  const allowed = isOrderingAllowed(targetDate);

  return NextResponse.json({
    ...deadlineInfo,
    allowed,
    forDate: targetDate.toISOString().split("T")[0],
  });
}
