import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { TransactionFilters } from "@/components/transaction-filters";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

function formatCurrency(amount: unknown) {
  return `Rs. ${Number(amount).toLocaleString("en-IN")}`;
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

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Transactions</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track investments, income, expenses, withdrawals, and client
              costs.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link
                href={`/api/transactions/export?${new URLSearchParams({
                  ...(selectedType ? { type: selectedType } : {}),
                  ...(selectedClientId ? { clientId: selectedClientId } : {}),
                  ...(selectedProjectId
                    ? { projectId: selectedProjectId }
                    : {}),
                  ...(fromDate ? { from: fromDate } : {}),
                  ...(toDate ? { to: toDate } : {}),
                }).toString()}`}
                target="_blank"
              >
                Export CSV
              </Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/transactions/new?type=INCOME">Add Income</Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/transactions/new?type=EXPENSE">Add Expense</Link>
            </Button>

            <Button asChild>
              <Link href="/transactions/new">Add Transaction</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter transactions by type, client, project, and date range.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <TransactionFilters
              clients={clients}
              projects={projects}
              selectedType={selectedType}
              selectedClientId={selectedClientId}
              selectedProjectId={selectedProjectId}
              fromDate={fromDate}
              toDate={toDate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              This follows your spreadsheet flow: date, paid by, done for,
              amount, and receipt/invoice.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Paid By</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Done For</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      No transactions added yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Intl.DateTimeFormat("en-NP", {
                          dateStyle: "medium",
                        }).format(transaction.date)}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            transaction.type === "INCOME" ||
                            transaction.type === "INVESTMENT"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {transaction.type}
                        </Badge>
                      </TableCell>

                      <TableCell>{transaction.paidBy || "-"}</TableCell>

                      <TableCell>{transaction.client?.name || "-"}</TableCell>

                      <TableCell>{transaction.project?.name || "-"}</TableCell>

                      <TableCell>
                        <Link
                          href={`/transactions/${transaction.id}`}
                          className="font-medium text-slate-950 hover:text-orange-600 hover:underline"
                        >
                          {transaction.doneFor || transaction.title}
                        </Link>
                        {transaction.category ? (
                          <div className="text-xs text-slate-500">
                            {transaction.category.name}
                          </div>
                        ) : null}
                      </TableCell>

                      <TableCell>{transaction.expenseScope || "-"}</TableCell>

                      <TableCell className="font-semibold">
                        {formatCurrency(transaction.amount)}
                      </TableCell>

                      <TableCell>
                        {transaction.attachments.length > 0 ? (
                          <div className="space-y-1">
                            {transaction.attachments.map((attachment) => (
                              <Link
                                key={attachment.id}
                                href={attachment.fileUrl}
                                target="_blank"
                                className="block text-sm font-medium text-orange-600 hover:underline"
                              >
                                View File
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            No file
                          </span>
                        )}
                      </TableCell>
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
