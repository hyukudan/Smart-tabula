import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NotificationsView } from "./notifications-view";
import { getPrisma } from "@/lib/prisma";

async function getNotificationsData(userId: string) {
  const prisma = await getPrisma();
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return { notifications };
}

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { notifications } = await getNotificationsData(session.user.id);

  return (
    <DashboardLayout title="Notificaciones">
      <NotificationsView notifications={notifications} />
    </DashboardLayout>
  );
}
