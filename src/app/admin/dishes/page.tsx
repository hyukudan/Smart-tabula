import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DishesList } from "./dishes-list";
import prisma from "@/lib/prisma";

async function getDishesData() {
  const [dishes, allergies] = await Promise.all([
    prisma.dish.findMany({
      include: {
        tags: true,
        allergies: {
          include: {
            allergy: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.allergy.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return { dishes, allergies };
}

export default async function AdminDishesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { dishes, allergies } = await getDishesData();

  return (
    <DashboardLayout title="Gestión de platos">
      <DishesList dishes={dishes} allergies={allergies} />
    </DashboardLayout>
  );
}
