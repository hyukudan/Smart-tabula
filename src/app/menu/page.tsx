import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MenuView } from "./menu-view";
import prisma from "@/lib/prisma";

async function getMenuData(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayMenu, userAllergies, userPreferences, existingOrder] = await Promise.all([
    // Menú de hoy con todos los platos
    prisma.menu.findFirst({
      where: {
        date: today,
        isPublished: true,
      },
      include: {
        dishes: {
          include: {
            dish: {
              include: {
                tags: true,
                allergies: {
                  include: {
                    allergy: true,
                  },
                },
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    }),
    // Alergias del usuario
    prisma.userAllergy.findMany({
      where: { userId },
      include: { allergy: true },
    }),
    // Preferencias del usuario
    prisma.userPreference.findMany({
      where: { userId },
    }),
    // Pedido existente para hoy
    prisma.order.findFirst({
      where: {
        userId,
        date: today,
      },
      include: {
        items: {
          include: {
            dish: true,
          },
        },
      },
    }),
  ]);

  return {
    menu: todayMenu,
    userAllergies,
    userPreferences,
    existingOrder,
  };
}

export default async function MenuPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const data = await getMenuData(session.user.id);

  return (
    <DashboardLayout title="Menú del día">
      <MenuView
        menu={data.menu}
        userAllergies={data.userAllergies}
        userPreferences={data.userPreferences}
        existingOrder={data.existingOrder}
        userId={session.user.id}
      />
    </DashboardLayout>
  );
}
