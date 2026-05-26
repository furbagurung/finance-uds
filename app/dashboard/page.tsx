import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCashflowChart } from "@/components/dashboard-cashflow-chart";
import { Badge } from "@/components/ui/badge";
import { DashboardExpenseDonutChart } from "@/components/dashboard-expense-donut-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeDollarSign,
  Building2,
  CircleDollarSign,
  CreditCard,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";
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

function getMonthKey(date: Date) {
  return date.toLocaleString("en-US", { month: "short" });
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
      date: true,
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

  const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hasCashflowData = transactions.some(
    (transaction) =>
      transaction.type === "INCOME" || transaction.type === "EXPENSE",
  );

  const cashflowData = monthOrder.map((month) => {
    const monthTransactions = transactions.filter(
      (transaction) => getMonthKey(transaction.date) === month,
    );

    return {
      month,
      income: monthTransactions
        .filter((transaction) => transaction.type === "INCOME")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
      expenses: monthTransactions
        .filter((transaction) => transaction.type === "EXPENSE")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
    };
  });
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

  const topStats = [
    {
      title: "Cash Balance",
      value: cashBalance,
      icon: Wallet,
      href: "/transactions",
      tone: "dark",
      helper: "Available business cash",
    },
    {
      title: "Total Income",
      value: totalIncome,
      icon: ArrowUpRight,
      href: "/transactions?type=INCOME",
      tone: "green",
      helper: "All recorded income",
    },
    {
      title: "Total Expenses",
      value: totalExpenses,
      icon: ArrowDownLeft,
      href: "/transactions?type=EXPENSE",
      tone: "orange",
      helper: "Company + client expenses",
    },
    {
      title: "Recoverable",
      value: recoverableClientExpenses,
      icon: BadgeDollarSign,
      href: "/reports/client-wise",
      tone: "yellow",
      helper: "Billable client expenses",
    },
  ];

  const miniStats = [
    {
      title: "Investment",
      value: totalInvestment,
      icon: CircleDollarSign,
    },
    {
      title: "Withdrawals",
      value: totalWithdrawals,
      icon: CreditCard,
    },
    {
      title: "Company Expenses",
      value: companyExpenses,
      icon: Building2,
    },
    {
      title: "Client Expenses",
      value: clientExpenses,
      icon: ReceiptText,
    },
  ];

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Finance Overview
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Welcome back, {user.name}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Monitor income, expenses, recoverable client costs, and cash flow
              from one internal finance workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/transactions/new?type=INCOME"
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              Add Income
            </Link>
            <Link
              href="/transactions/new?type=EXPENSE"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Add Expense
            </Link>
            <Link
              href="/clients/new"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Add Client
            </Link>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          {topStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link key={stat.title} href={stat.href}>
                <Card
                  className={`h-full overflow-hidden rounded-3xl border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${stat.tone === "dark"
                    ? "relative border-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white"
                    : "bg-white"
                    }`}
                >
                  <CardContent className="p-5">
                    {stat.tone === "dark" ? (
                      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-yellow-400/20 blur-2xl" />
                    ) : null}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p
                          className={`text-sm font-medium ${stat.tone === "dark"
                            ? "text-slate-300"
                            : "text-slate-500"
                            }`}
                        >
                          {stat.title}
                        </p>
                        <p
                          className={`mt-4 text-3xl font-bold tracking-tight ${stat.tone === "dark"
                            ? "text-white"
                            : "text-slate-950"
                            }`}
                        >
                          {formatCurrency(stat.value)}
                        </p>
                        <p
                          className={`mt-2 text-xs ${stat.tone === "dark"
                            ? "text-slate-400"
                            : "text-slate-500"
                            }`}
                        >
                          {stat.helper}
                        </p>
                      </div>

                      <div
                        className={`rounded-2xl p-3 ${stat.tone === "dark"
                          ? "bg-white/10 text-yellow-300"
                          : stat.tone === "green"
                            ? "bg-emerald-50 text-emerald-600"
                            : stat.tone === "orange"
                              ? "bg-orange-50 text-orange-600"
                              : "bg-yellow-50 text-yellow-600"
                          }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {miniStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card
                key={stat.title}
                className="rounded-2xl border-slate-200 bg-white shadow-sm"
              >
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                      {formatCurrency(stat.value)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1.35fr_0.65fr]">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-950">
                  Cash Flow
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Monthly income compared with expenses.
                </p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                Yearly
              </Badge>
            </CardHeader>
            <CardContent>
              {hasCashflowData ? (
                <DashboardCashflowChart data={cashflowData} />
              ) : (
                <div className="flex h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No cash flow data yet
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Add income or expense transactions to generate your monthly cash flow chart.
                  </p>
                  <Link
                    href="/transactions/new"
                    className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Add Transaction
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Expense Split
              </CardTitle>
              <p className="text-sm text-slate-500">
                Company vs client expenses.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <DashboardExpenseDonutChart
                companyExpenses={companyExpenses}
                clientExpenses={clientExpenses}
              />

              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-950" />
                    <span className="text-sm text-slate-600">Company Expenses</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-950">
                    {formatCurrency(companyExpenses)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-orange-50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    <span className="text-sm text-slate-600">Client Expenses</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-950">
                    {formatCurrency(clientExpenses)}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-sm text-slate-500">Recoverable Amount</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {formatCurrency(recoverableClientExpenses)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Billable: {formatCurrency(billableClientExpenses)} · Reimbursed:{" "}
                    {formatCurrency(reimbursedClientExpenses)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-950">
                  Recent Transactions
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Latest finance entries from your workspace.
                </p>
              </div>

              <Link
                href="/transactions"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                View all
              </Link>
            </CardHeader>

            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No transactions yet
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Start by adding income, expenses, investments, or withdrawals.
                  </p>
                  <Link
                    href="/transactions/new"
                    className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                  >
                    Add Transaction
                  </Link>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead>Type</TableHead>
                        <TableHead>Done For</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className="hover:bg-slate-50/70">
                          <TableCell>
                            <Badge variant="outline" className="rounded-full">
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/transactions/${transaction.id}`}
                              className="font-medium text-slate-950 hover:text-orange-600 hover:underline"
                            >
                              {transaction.doneFor || transaction.title}
                            </Link>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {transaction.project?.name || "No project linked"}
                            </p>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {transaction.client?.name || "-"}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-slate-950">
                            {formatCurrency(Number(transaction.amount))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-950">
                  Recent Activity
                </CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  Latest admin and finance actions.
                </p>
              </div>

              <Link
                href="/activity"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                View logs
              </Link>
            </CardHeader>

            <CardContent>
              {recentActivityLogs.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No activity yet
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Your create, update, delete, and upload actions will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Badge variant="secondary" className="rounded-full">
                            {log.action}
                          </Badge>
                          <p className="mt-2 text-sm font-medium text-slate-900">
                            {log.message}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {log.user?.name || "System"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}