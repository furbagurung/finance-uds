import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { BranchFilter } from "@/components/branch-filter";
import { DashboardShell } from "@/components/dashboard-shell";
import { FiscalYearFilter } from "@/components/fiscal-year-filter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/current-user";
import {
  getFiscalYearDateRangeForBranch,
  getFiscalYearExclusiveEndDate,
} from "@/lib/fiscal-year";
import { prisma } from "@/lib/prisma";

function formatCurrency(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return new Intl.DateTimeFormat("en-NP", {
    month: "long",
    year: "numeric",
  }).format(date);
}

type MonthlyReportPageProps = {
  searchParams: Promise<{
    branchId?: string;
    fiscalYear?: string;
  }>;
};

export default async function MonthlyReportPage({
  searchParams,
}: MonthlyReportPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const selectedBranchId =
    params.branchId && params.branchId !== "ALL" ? params.branchId : "";
  const selectedBranch = selectedBranchId
    ? await prisma.branch.findUnique({
        where: {
          id: selectedBranchId,
        },
        select: {
          id: true,
          calendarSystem: true,
          fiscalYearType: true,
        },
      })
    : null;
  const fiscalYearDateRange = getFiscalYearDateRangeForBranch(
    params.fiscalYear,
    selectedBranch,
  );
  const transactionWhere: Prisma.TransactionWhereInput = {
    ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
    ...(fiscalYearDateRange
      ? {
          date: {
            gte: fiscalYearDateRange.startDate,
            lt: getFiscalYearExclusiveEndDate(fiscalYearDateRange),
          },
        }
      : {}),
  };

  const transactions = await prisma.transaction.findMany({
    where: transactionWhere,
    orderBy: {
      date: "desc",
    },
    select: {
      id: true,
      type: true,
      amount: true,
      date: true,
      expenseScope: true,
      isBillable: true,
      isReimbursed: true,
    },
  });

  const monthlyMap = new Map<
    string,
    {
      investment: number;
      income: number;
      expenses: number;
      withdrawals: number;
      companyExpenses: number;
      clientExpenses: number;
      billableClientExpenses: number;
      reimbursedClientExpenses: number;
      transactionCount: number;
    }
  >();

  for (const transaction of transactions) {
    const monthKey = getMonthKey(transaction.date);

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        investment: 0,
        income: 0,
        expenses: 0,
        withdrawals: 0,
        companyExpenses: 0,
        clientExpenses: 0,
        billableClientExpenses: 0,
        reimbursedClientExpenses: 0,
        transactionCount: 0,
      });
    }

    const row = monthlyMap.get(monthKey)!;
    const amount = Number(transaction.amount);

    row.transactionCount += 1;

    if (transaction.type === "INVESTMENT") {
      row.investment += amount;
    }

    if (transaction.type === "INCOME") {
      row.income += amount;
    }

    if (transaction.type === "EXPENSE") {
      row.expenses += amount;

      if (transaction.expenseScope === "COMPANY") {
        row.companyExpenses += amount;
      }

      if (transaction.expenseScope === "CLIENT") {
        row.clientExpenses += amount;
      }

      if (transaction.expenseScope === "CLIENT" && transaction.isBillable) {
        row.billableClientExpenses += amount;
      }

      if (transaction.expenseScope === "CLIENT" && transaction.isReimbursed) {
        row.reimbursedClientExpenses += amount;
      }
    }

    if (transaction.type === "WITHDRAWAL") {
      row.withdrawals += amount;
    }
  }

  const reportRows = Array.from(monthlyMap.entries()).map(([monthKey, row]) => {
    const cashBalance =
      row.investment + row.income - row.expenses - row.withdrawals;

    const recoverableAmount =
      row.billableClientExpenses - row.reimbursedClientExpenses;

    return {
      monthKey,
      monthLabel: getMonthLabel(monthKey),
      ...row,
      cashBalance,
      recoverableAmount,
    };
  });

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              Monthly Report
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review month-wise investment, income, expenses, withdrawals, and
              recoverable client costs.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <BranchFilter basePath="/reports/monthly" />
            <FiscalYearFilter
              basePath="/reports/monthly"
              branchFiscalYearType={selectedBranch?.fiscalYearType}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Financial Summary</CardTitle>
            <CardDescription>
              This report groups all transactions by month.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Investment</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead>Withdrawals</TableHead>
                  <TableHead>Cash Balance</TableHead>
                  <TableHead>Client Expenses</TableHead>
                  <TableHead>Recoverable</TableHead>
                  <TableHead>Transactions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {reportRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      No monthly data available yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  reportRows.map((row) => (
                    <TableRow key={row.monthKey}>
                      <TableCell className="font-medium">
                        {row.monthLabel}
                      </TableCell>

                      <TableCell>{formatCurrency(row.investment)}</TableCell>

                      <TableCell>{formatCurrency(row.income)}</TableCell>

                      <TableCell>{formatCurrency(row.expenses)}</TableCell>

                      <TableCell>{formatCurrency(row.withdrawals)}</TableCell>

                      <TableCell className="font-semibold">
                        {formatCurrency(row.cashBalance)}
                      </TableCell>

                      <TableCell>{formatCurrency(row.clientExpenses)}</TableCell>

                      <TableCell>{formatCurrency(row.recoverableAmount)}</TableCell>

                      <TableCell>{row.transactionCount}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
