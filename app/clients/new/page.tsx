import { redirect } from "next/navigation";
import { ClientForm } from "@/components/client-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser } from "@/lib/current-user";

export default async function NewClientPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell user={user}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Add Client</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a client profile to link with projects, billing, and
            transactions.
          </p>
        </div>

        <ClientForm />
      </div>
    </DashboardShell>
  );
}