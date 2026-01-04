import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProfileForm } from "./profile-form";
import prisma from "@/lib/prisma";

async function getProfileData(userId: string) {
  const [user, allAllergies] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        allergies: {
          include: {
            allergy: true,
          },
        },
        preferences: true,
      },
    }),
    prisma.allergy.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return { user, allAllergies };
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user, allAllergies } = await getProfileData(session.user.id);

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout title="Mi perfil">
      <ProfileForm user={user} allAllergies={allAllergies} />
    </DashboardLayout>
  );
}
