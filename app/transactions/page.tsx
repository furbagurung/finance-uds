import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Archive,
  FileDown,
  Plus,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard-shell";
import { TransactionFilters } from "@/components/transaction-filters";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatCurrency(amount: unknown) {
  return `Rs. ${Number(amount).toLocaleString("en-IN")}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NP", {
    dateStyle: "medium",
  }).format(date);
}

function getTypeBadgeClass(type: string) {
  if (type === "INCOME") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/60";
  }

  if (type === "EXPENSE") {
    return "border-rose-200 bg-rose-50 text-rose-700 shadow-sm shadow-rose-100/60";
  }

  if (type === "INVESTMENT") {
    return "border-slate-800 bg-slate-950 text-white shadow-sm shadow-slate-200/70";
  }

  return "border-slate-200 bg-slate-100 text-slate-700 shadow-sm shadow-slate-100/70";
}

function getAmountClass(type: string) {
  if (type === "INCOME") {
    return "text-emerald-700";
  }

  if (type === "EXPENSE") {
    return "text-rose-700";
  }

  if (type === "WITHDRAWAL") {
    return "text-slate-500";
  }

  return "text-slate-800";
}

type TransactionsPageProps = {
  searchParams: Promise<{
    type?: string;
    clientId?: string;
    projectId?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const selectedType = params.type && params.type !== "ALL" ? params.type : "";
  const selectedClientId =
    params.clientId && params.clientId !== "ALL" ? params.clientId : "";
  const selectedProjectId =
    params.projectId && params.projectId !== "ALL" ? params.projectId : "";
  const fromDate = params.from || "";
  const toDate = params.to || "";

  const transactionWhere = {
    ...(selectedType ? { type: selectedType as never } : {}),
    ...(selectedClientId ? { clientId: selectedClientId } : {}),
    ...(selectedProjectId ? { projectId: selectedProjectId } : {}),
    ...(fromDate || toDate
      ? {
        date: {
          ...(fromDate ? { gte: new Date(fromDate) } : {}),
          ...(toDate ? { lte: new Date(toDate) } : {}),
        },
      }
      : {}),
  };

  const transactions = await prisma.transaction.findMany({
    where: transactionWhere,
    orderBy: {
      date: "desc",
    },
    include: {
      category: true,
      client: true,
      project: true,
      attachments: true,
      createdBy: {
        select: {
          name: true,
        },
      },
    },
    take: 100,
  });

  const clients = await prisma.client.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      companyName: true,
    },
  });

  const projects = await prisma.project.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      clientId: true,
    },
  });

  const filteredIncome = transactions
    .filter((transaction) => transaction.type === "INCOME")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const filteredExpenses = transactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const filteredNet = filteredIncome - filteredExpenses;

  const receiptCount = transactions.reduce(
    (sum, transaction) => sum + transaction.attachments.length,
    0,
  );

  const exportParams = new URLSearchParams({
    ...(selectedType ? { type: selectedType } : {}),
    ...(selectedClientId ? { clientId: selectedClientId } : {}),
    ...(selectedProjectId ? { projectId: selectedProjectId } : {}),
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
  }).toString();

  return (
    <DashboardShell user={user}>
      <div className="mx-auto w-full max-w-[1220px] space-y-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              Transactions
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Manage, track, and review income, expenses, investments, and
              withdrawals.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-slate-200 bg-white px-3 text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-950"
            >
              <Link
                href={`/api/transactions/export?${exportParams}`}
                target="_blank"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-emerald-200 bg-emerald-50 px-3 text-emerald-700 shadow-sm hover:bg-emerald-100 hover:text-emerald-800"
            >
              <Link href="/transactions/new?type=INCOME">Add Income</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-rose-200 bg-rose-50 px-3 text-rose-700 shadow-sm hover:bg-rose-100 hover:text-rose-800"
            >
              <Link href="/transactions/new?type=EXPENSE">Add Expense</Link>
            </Button>

            <Button
              asChild
              size="sm"
              className="h-9 rounded-xl bg-slate-950 px-3 text-white shadow-sm hover:bg-slate-800"
            >
              <Link href="/transactions/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Total Records
                </p>
                <p className="mt-5 text-2xl font-bold text-slate-950">
                  {transactions.length}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Current filtered view
                </p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Archive className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Total Income
                </p>
                <p className="mt-5 text-2xl font-bold text-slate-950">
                  {formatCurrency(filteredIncome)}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Income in view
                </p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Total Expenses
                </p>
                <p className="mt-5 text-2xl font-bold text-slate-950">
                  {formatCurrency(filteredExpenses)}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Expenses in view
                </p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <TrendingDown className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Net View
                </p>
                <p className="mt-5 text-2xl font-bold text-slate-950">
                  {formatCurrency(filteredNet)}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Income minus expenses
                </p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <WalletCards className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Receipts Attached
                </p>
                <p className="mt-5 text-2xl font-bold text-slate-950">
                  {receiptCount}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Uploaded files
                </p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <ReceiptText className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <TransactionFilters
            clients={clients}
            projects={projects}
            selectedType={selectedType}
            selectedClientId={selectedClientId}
            selectedProjectId={selectedProjectId}
            fromDate={fromDate}
            toDate={toDate}
          />

          <div>
            {transactions.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center border-b border-slate-100 bg-slate-50/25 px-6 py-16 text-center">
                <p className="text-base font-semibold text-slate-950">
                  No transactions yet
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Add your first income, expense, investment, or withdrawal to
                  start tracking finance activity.
                </p>
                <Link
                  href="/transactions/new"
                  className="mt-5 inline-flex h-10 items-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  Add Transaction
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 bg-slate-50/80 hover:bg-slate-50/80">
                      <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Date
                      </TableHead>
                      <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Type
                      </TableHead>
                      <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Paid By
                      </TableHead>
                      <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Client
                      </TableHead>
                      <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Project
                      </TableHead>
                      <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Done For
                      </TableHead>
                      <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Scope
                      </TableHead>
                      <TableHead className="h-11 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Amount
                      </TableHead>
                      <TableHead className="h-11 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Receipt
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className="border-slate-100 transition-colors hover:bg-slate-50"
                      >
                        <TableCell className="whitespace-nowrap py-5 text-sm font-medium text-slate-600">
                          {formatDate(transaction.date)}
                        </TableCell>

                        <TableCell className="py-5">
                          <Badge
                            variant="outline"
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${getTypeBadgeClass(
                              transaction.type,
                            )}`}
                          >
                            {transaction.type}
                          </Badge>
                        </TableCell>

                        <TableCell className="max-w-[180px] truncate py-5 text-sm text-slate-600">
                          {transaction.paidBy || "-"}
                        </TableCell>

                        <TableCell className="max-w-[180px] truncate py-5 text-sm text-slate-600">
                          {transaction.client?.name || "-"}
                        </TableCell>

                        <TableCell className="max-w-[180px] truncate py-5 text-sm text-slate-600">
                          {transaction.project?.name || "-"}
                        </TableCell>

                        <TableCell className="min-w-[220px] py-5">
                          <Link
                            href={`/transactions/${transaction.id}`}
                            className="font-medium text-slate-950 hover:text-slate-700 hover:underline"
                          >
                            {transaction.doneFor || transaction.title}
                          </Link>

                          {transaction.category ? (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {transaction.category.name}
                            </p>
                          ) : null}
                        </TableCell>

                        <TableCell className="py-5">
                          {transaction.expenseScope ? (
                            <Badge
                              variant="secondary"
                              className="rounded-full bg-slate-100 text-slate-700"
                            >
                              {transaction.expenseScope}
                            </Badge>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </TableCell>

                        <TableCell
                          className={`py-5 text-right font-bold ${getAmountClass(
                            transaction.type,
                          )}`}
                        >
                          {formatCurrency(transaction.amount)}
                        </TableCell>

                        <TableCell className="py-5 text-right">
                          {transaction.attachments.length > 0 ? (
                            <div className="flex justify-end gap-2">
                              {transaction.attachments
                                .slice(0, 2)
                                .map((attachment) => (
                                  <Link
                                    key={attachment.id}
                                    href={attachment.fileUrl}
                                    target="_blank"
                                    className="inline-flex h-7 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                                  >
                                    View file
                                  </Link>
                                ))}

                              {transaction.attachments.length > 2 ? (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                  +{transaction.attachments.length - 2}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-slate-400">
                              No file
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-slate-100 bg-white px-5 py-4 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {transactions.length} records of {transactions.length} total
                transactions
              </span>
              <span className="inline-flex items-center gap-2 text-slate-950">
                Net in view:
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-bold">
                  {formatCurrency(filteredNet)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
