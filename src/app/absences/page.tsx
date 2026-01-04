import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AbsencesView } from "./absences-view";
import { getPrisma } from "@/lib/prisma";

async function getAbsencesData(userId: string) {
  const prisma = await getPrisma();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [absences, skipMeals] = await Promise.all([
    prisma.absence.findMany({
      where: {
        userId,
        endDate: {
          gte: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        },
      },
      orderBy: {
        startDate: "desc",
      },
    }),
    prisma.skipMeal.findMany({
      where: {
        userId,
        date: {
          gte: today,
        },
      },
      orderBy: {
        date: "asc",
      },
    }),
  ]);

  return { absences, skipMeals };
}

export default async function AbsencesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { absences, skipMeals } = await getAbsencesData(session.user.id);

  return (
    <DashboardLayout title="Mis ausencias">
      <AbsencesView absences={absences} skipMeals={skipMeals} />
    </DashboardLayout>
  );
}
