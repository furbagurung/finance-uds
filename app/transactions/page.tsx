import { redirect } from "next/navigation";
import { TransactionType, type Prisma } from "@prisma/client";
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
import { TransactionCreateModal } from "@/components/transaction-create-modal";
import { TransactionsTable } from "@/components/transactions-table";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

function formatCurrency(amount: unknown) {
  const value = Number(amount);
  const formattedValue = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

  return `Rs. ${formattedValue}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NP", {
    dateStyle: "medium",
  }).format(date);
}

type TransactionsPageProps = {
  searchParams: Promise<{
    type?: string;
    clientId?: string;
    projectId?: string;
    branchId?: string;
    from?: string;
    to?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    q?: string;
  }>;
};

function getSelectedTransactionType(type?: string) {
  if (!type || type === "ALL") {
    return "";
  }

  return Object.values(TransactionType).includes(type as TransactionType)
    ? (type as TransactionType)
    : "";
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const selectedType = getSelectedTransactionType(params.type);
  const selectedClientId =
    params.clientId && params.clientId !== "ALL" ? params.clientId : "";
  const selectedProjectId =
    params.projectId && params.projectId !== "ALL" ? params.projectId : "";
  const selectedBranchId =
    params.branchId && params.branchId !== "ALL" ? params.branchId : "";
  const fromDate = params.startDate || params.from || "";
  const toDate = params.endDate || params.to || "";
  const searchQuery = (params.q || params.search || "").trim();

  const transactionWhere: Prisma.TransactionWhereInput = {
    ...(selectedType ? { type: selectedType } : {}),
    ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
    ...(selectedClientId ? { clientId: selectedClientId } : {}),
    ...(selectedProjectId ? { projectId: selectedProjectId } : {}),
    ...(searchQuery
      ? {
          OR: [
            { title: { contains: searchQuery } },
            { doneFor: { contains: searchQuery } },
            { paidBy: { contains: searchQuery } },
            { client: { name: { contains: searchQuery } } },
            { client: { companyName: { contains: searchQuery } } },
            { project: { name: { contains: searchQuery } } },
            { category: { name: { contains: searchQuery } } },
          ],
        }
      : {}),
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
      branch: {
        select: {
          id: true,
          name: true,
          code: true,
          country: true,
          currency: true,
          calendarSystem: true,
          fiscalYearType: true,
        },
      },
      project: {
        include: {
          client: {
            select: {
              name: true,
              companyName: true,
              logoUrl: true,
            },
          },
        },
      },
      attachments: true,
      payrollRecord: {
        include: {
          employee: {
            select: {
              fullName: true,
            },
          },
        },
      },
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
    ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
    ...(selectedClientId ? { clientId: selectedClientId } : {}),
    ...(selectedProjectId ? { projectId: selectedProjectId } : {}),
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
    ...(searchQuery ? { search: searchQuery } : {}),
  }).toString();

  const transactionTableItems = transactions.map((transaction) => ({
    id: transaction.id,
    dateLabel: formatDate(transaction.date),
    type: transaction.type,
    clientName:
      transaction.client?.name ||
      transaction.project?.client?.companyName ||
      transaction.project?.client?.name ||
      null,
    clientLogoUrl:
      transaction.client?.logoUrl || transaction.project?.client?.logoUrl || null,
    employeeName: transaction.payrollRecord?.employee.fullName || null,
    projectName: transaction.project?.name || null,
    doneFor: transaction.doneFor,
    title: transaction.title,
    categoryName: transaction.category?.name || null,
    branch: transaction.branch,
    paymentMethod: transaction.paymentMethod,
    amountLabel: formatCurrency(transaction.amount),
    attachments: transaction.attachments.map((attachment) => ({
      id: attachment.id,
      fileUrl: attachment.fileUrl,
    })),
  }));

  return (
    <DashboardShell user={user}>
      <div className="mx-auto w-full max-w-[1440px] space-y-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
              Transactions
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Track money received and spent across clients, projects, and
              branches.
            </p>
          </div>

          {/* TRANSACTION QUICK ACTIONS
    These actions now open premium modals instead of navigating to /transactions/new.
    The old /transactions/new page still exists as fallback.
*/}
          <div className="flex flex-wrap items-center gap-2">
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

            <TransactionCreateModal
              triggerLabel="Add Transaction"
triggerClassName="h-10 cursor-pointer rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition hover:bg-slate-800"
            />
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

        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <TransactionFilters
            clients={clients}
            projects={projects}
            selectedType={selectedType}
            selectedBranchId={selectedBranchId}
            selectedClientId={selectedClientId}
            selectedProjectId={selectedProjectId}
            fromDate={fromDate}
            toDate={toDate}
            searchQuery={searchQuery}
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
                <TransactionCreateModal
                  triggerLabel="Add Transaction"
triggerClassName="mt-4 h-10 cursor-pointer rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition hover:bg-slate-800"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <TransactionsTable transactions={transactionTableItems} />
              </div>
            )}

            <div className="flex flex-col gap-2 rounded-b-2xl border-t border-slate-100 bg-white px-5 py-4 text-xs font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between">
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
