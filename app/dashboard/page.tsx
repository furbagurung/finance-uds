import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { BranchBadge } from "@/components/branch-badge";
import { BranchFilter } from "@/components/branch-filter";
import { getCurrentUser } from "@/lib/current-user";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCashflowChart } from "@/components/dashboard-cashflow-chart";
import { Badge } from "@/components/ui/badge";
import { DashboardExpenseDonutChart } from "@/components/dashboard-expense-donut-chart";
import { ClientCreateModal } from "@/components/client-create-modal";
import { TransactionCreateModal } from "@/components/transaction-create-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDownLeft,
  ArrowUpRight,
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

type DashboardPageProps = {
  searchParams: Promise<{
    branchId?: string;
  }>;
};

const branchSelect = {
  id: true,
  name: true,
  code: true,
  country: true,
  currency: true,
  calendarSystem: true,
  fiscalYearType: true,
} satisfies Prisma.BranchSelect;

function buildTransactionsHref(
  params: Record<string, string | undefined>,
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();

  return query ? `/transactions?${query}` : "/transactions";
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const selectedBranchId =
    params.branchId && params.branchId !== "ALL" ? params.branchId : "";
  const transactionWhere: Prisma.TransactionWhereInput = {
    ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
  };

  const transactions = await prisma.transaction.findMany({
    where: transactionWhere,
    select: {
      type: true,
      amount: true,
      date: true,
      expenseScope: true,
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

  const netProfitLoss = totalIncome - totalExpenses;

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
    where: transactionWhere,
    orderBy: {
      date: "desc",
    },
    take: 5,
    include: {
      client: true,
      project: true,
      branch: {
        select: branchSelect,
      },
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
      href: buildTransactionsHref({
        branchId: selectedBranchId,
      }),
      tone: "dark",
      helper: "Available business cash",
    },
    {
      title: "Total Income",
      value: totalIncome,
      icon: ArrowUpRight,
      href: buildTransactionsHref({
        type: "INCOME",
        branchId: selectedBranchId,
      }),
      tone: "green",
      helper: "All recorded income",
    },
    {
      title: "Total Expenses",
      value: totalExpenses,
      icon: ArrowDownLeft,
      href: buildTransactionsHref({
        type: "EXPENSE",
        branchId: selectedBranchId,
      }),
      tone: "orange",
      helper: "Company + client expenses",
    },
    {
      title: "Net Profit / Loss",
      value: netProfitLoss,
      icon: TrendingUp,
      href: buildTransactionsHref({
        branchId: selectedBranchId,
      }),
      tone: "blue",
      helper: "Income minus expenses",
    },
  ];

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4  p-5 lg:flex-row lg:items-center lg:justify-between">

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Welcome back, {user.name}
          </h1>

          {/* DASHBOARD QUICK ACTIONS
    Soft premium pill buttons inspired by SaaS action buttons.
*/}
          <div className="flex flex-wrap items-center gap-3">
            <BranchFilter basePath="/dashboard" />

            <TransactionCreateModal
              defaultType="INCOME"
              triggerLabel="Add Income"
             triggerClassName="h-10 cursor-pointer rounded-full border border-emerald-100 bg-emerald-50 px-5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
            />

            <TransactionCreateModal
              defaultType="EXPENSE"
              triggerLabel="Add Expense"
              triggerClassName="h-10 cursor-pointer rounded-full border border-rose-100 bg-rose-50 px-5 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100"
            />

            <ClientCreateModal
              triggerLabel="Add Client"
            triggerClassName="h-10 cursor-pointer rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition hover:bg-slate-800"
            />
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
                              : "bg-sky-50 text-sky-600"
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
                  <TransactionCreateModal
                    triggerLabel="Add Transaction"
                    triggerClassName="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                  />
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
                  <TransactionCreateModal
                    triggerLabel="Add Transaction"
                    triggerClassName="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                  />
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
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-slate-500">
                                {transaction.project?.name || "No project linked"}
                              </span>
                              {transaction.branch ? (
                                <BranchBadge
                                  branch={transaction.branch}
                                  className="text-[10px] leading-none"
                                />
                              ) : null}
                            </div>
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
