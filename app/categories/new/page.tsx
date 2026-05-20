import { redirect } from "next/navigation";
import { CategoryForm } from "@/components/category-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser } from "@/lib/current-user";

export default async function NewCategoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell user={user}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Add Category</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create custom finance categories for United Digital Service.
          </p>
        </div>

        <CategoryForm />
      </div>
    </DashboardShell>
  );
}