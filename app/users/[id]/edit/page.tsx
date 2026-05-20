import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { EditUserForm } from "@/components/edit-user-form";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

type EditUserPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditUserPage({ params }: EditUserPageProps) {
  const currentUser = await requireAdmin();

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <DashboardShell user={currentUser}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Edit User</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage user role and account status.
          </p>
        </div>

        <EditUserForm user={user} />
      </div>
    </DashboardShell>
  );
}
