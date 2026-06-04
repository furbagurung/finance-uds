import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { EditProjectForm } from "@/components/edit-project-form";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type EditProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    notFound();
  }

  const clients = await prisma.client.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      companyName: true,
      branchId: true,
    },
  });

  const plainProject = {
    ...project,
    budget: project.budget ? Number(project.budget) : null,
    startDate: project.startDate,
    endDate: project.endDate,
  };

  return (
    <DashboardShell user={user}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Edit Project</h1>
          <p className="mt-1 text-sm text-slate-500">
            Update project budget, timeline, status, and linked client.
          </p>
        </div>

        <EditProjectForm project={plainProject} clients={clients} />
      </div>
    </DashboardShell>
  );
}
