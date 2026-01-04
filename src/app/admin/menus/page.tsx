import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MenusList } from "./menus-list";
import { getPrisma } from "@/lib/prisma";

async function getMenusData() {
  const prisma = await getPrisma();
  const menus = await prisma.menu.findMany({
    include: {
      dishes: {
        include: {
          dish: true,
        },
      },
      _count: {
        select: {
          orders: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
    take: 50,
  });

  const dishes = await prisma.dish.findMany({
    where: { isAvailable: true },
    include: {
      tags: true,
      allergies: {
        include: {
          allergy: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return { menus, dishes };
}

export default async function AdminMenusPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { menus, dishes } = await getMenusData();

  return (
    <DashboardLayout title="Gestión de menús">
      <MenusList menus={menus} availableDishes={dishes} />
    </DashboardLayout>
  );
}
