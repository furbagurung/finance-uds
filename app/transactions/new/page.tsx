import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { TransactionForm } from "@/components/transaction-form";
import { getCurrentUser } from "@/lib/current-user";

export default async function NewTransactionPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell user={user}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Add Transaction
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Record company expenses, client expenses, investments, income, or
            withdrawals.
          </p>
        </div>

        <TransactionForm />
      </div>
    </DashboardShell>
  );
}