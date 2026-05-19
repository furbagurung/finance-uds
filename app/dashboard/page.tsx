import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
function formatCurrency(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }
  const transactions = await prisma.transaction.findMany({
    select: {
      type: true,
      amount: true,
      expenseScope: true,
      isBillable: true,
      isReimbursed: true,
    },
  });

  const totalInvestment = transactions
    .filter((transaction) => transaction.type === "INVESTMENT")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "INCOME")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const totalWithdrawals = transactions
    .filter((transaction) => transaction.type === "WITHDRAWAL")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const cashBalance =
    totalInvestment + totalIncome - totalExpenses - totalWithdrawals;

  const companyExpenses = transactions
    .filter(
      (transaction) =>
        transaction.type === "EXPENSE" &&
        transaction.expenseScope === "COMPANY",
    )
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const clientExpenses = transactions
    .filter(
      (transaction) =>
        transaction.type === "EXPENSE" && transaction.expenseScope === "CLIENT",
    )
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const billableClientExpenses = transactions
    .filter(
      (transaction) =>
        transaction.type === "EXPENSE" &&
        transaction.expenseScope === "CLIENT" &&
        transaction.isBillable,
    )
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const reimbursedClientExpenses = transactions
    .filter(
      (transaction) =>
        transaction.type === "EXPENSE" &&
        transaction.expenseScope === "CLIENT" &&
        transaction.isReimbursed,
    )
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const recoverableClientExpenses =
    billableClientExpenses - reimbursedClientExpenses;
  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Finance Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track income, expenses, projects, and company financial activity.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Investment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatCurrency(totalInvestment)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatCurrency(totalIncome)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatCurrency(totalExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatCurrency(totalWithdrawals)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Cash Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatCurrency(cashBalance)}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Company Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatCurrency(companyExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Client Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatCurrency(clientExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Billable Client Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatCurrency(billableClientExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Reimbursed Client Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatCurrency(reimbursedClientExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Recoverable Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatCurrency(recoverableClientExpenses)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
