/**
 * Order Deadline Utilities
 * Handles order cut-off time logic
 */

export function getOrderDeadline(): { hours: number; minutes: number } {
  const deadline = process.env.ORDER_DEADLINE || "10:00";
  const [hours, minutes] = deadline.split(":").map(Number);
  return { hours: hours || 10, minutes: minutes || 0 };
}

export function isOrderingAllowed(forDate?: Date): boolean {
  const now = new Date();
  const targetDate = forDate || now;
  const { hours, minutes } = getOrderDeadline();

  // Create deadline time for target date
  const deadline = new Date(targetDate);
  deadline.setHours(hours, minutes, 0, 0);

  // If ordering for today, check if we're past the deadline
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDay = new Date(targetDate);
  targetDay.setHours(0, 0, 0, 0);

  // If it's for today, check deadline
  if (targetDay.getTime() === today.getTime()) {
    return now < deadline;
  }

  // If it's for a past date, not allowed
  if (targetDay < today) {
    return false;
  }

  // Future dates are always allowed
  return true;
}

export function getTimeUntilDeadline(): { allowed: boolean; remaining: string } {
  const now = new Date();
  const { hours, minutes } = getOrderDeadline();

  const deadline = new Date(now);
  deadline.setHours(hours, minutes, 0, 0);

  if (now >= deadline) {
    return { allowed: false, remaining: "Time expired" };
  }

  const diff = deadline.getTime() - now.getTime();
  const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hoursRemaining > 0) {
    return {
      allowed: true,
      remaining: `${hoursRemaining}h ${minutesRemaining}m`,
    };
  }

  return { allowed: true, remaining: `${minutesRemaining} minutes` };
}

export function getDeadlineInfo() {
  const { hours, minutes } = getOrderDeadline();
  const timeUntil = getTimeUntilDeadline();

  return {
    deadline: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
    ...timeUntil,
  };
}
