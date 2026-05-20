import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/change-password-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser } from "@/lib/current-user";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell user={user}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your finance dashboard account settings.
          </p>
        </div>

        <ChangePasswordForm />
      </div>
    </DashboardShell>
  );
}