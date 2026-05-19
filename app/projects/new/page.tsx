import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProjectForm } from "@/components/project-form";
import { getCurrentUser } from "@/lib/current-user";

export default async function NewProjectPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell user={user}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Add Project</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a client project to track budget, expenses, income, and
            profitability.
          </p>
        </div>

        <ProjectForm />
      </div>
    </DashboardShell>
  );
}