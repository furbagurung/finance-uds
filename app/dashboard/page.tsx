import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  const recentTransactions = await prisma.transaction.findMany({
    orderBy: {
      date: "desc",
    },
    take: 5,
    include: {
      client: true,
      project: true,
    },
  });

  const recentActivityLogs = await prisma.activityLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

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

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Done For</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-sm text-slate-500"
                      >
                        No transactions yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Badge variant="outline">{transaction.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/transactions/${transaction.id}`}
                            className="font-medium hover:text-orange-600 hover:underline"
                          >
                            {transaction.doneFor || transaction.title}
                          </Link>
                        </TableCell>
                        <TableCell>{transaction.client?.name || "-"}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Number(transaction.amount))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivityLogs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-8 text-center text-sm text-slate-500"
                      >
                        No activity yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentActivityLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="secondary">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.message}
                        </TableCell>
                        <TableCell>{log.user?.name || "System"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
