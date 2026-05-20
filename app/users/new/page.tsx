import { requireAdmin } from "@/lib/require-admin";
import { DashboardShell } from "@/components/dashboard-shell";
import { UserForm } from "@/components/user-form";

export default async function NewUserPage() {
const user = await requireAdmin();

  return (
    <DashboardShell user={user}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Add User</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a staff or admin login account.
          </p>
        </div>

        <UserForm />
      </div>
    </DashboardShell>
  );
}