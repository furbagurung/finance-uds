import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RetainerBillingStatus } from "@prisma/client";

import { BranchBadge } from "@/components/branch-badge";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
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
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type RetainerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatMoney(amount: unknown, currency?: string | null) {
  const value = Number(amount);
  const currencyCode = currency || "NPR";

  try {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  } catch {
    return `${currencyCode} ${value.toLocaleString("en-IN")}`;
  }
}

function formatDate(date: Date | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-NP", {
    dateStyle: "medium",
  }).format(date);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatPaymentMethod(method: string) {
  return method.replaceAll("_", " ");
}

function getStatusClassName(status: RetainerBillingStatus) {
  if (status === "PAID") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "PARTIALLY_PAID") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "OVERDUE") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "WAIVED") {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

export default async function RetainerDetailPage({
  params,
}: RetainerDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const retainerBilling = await prisma.retainerBilling.findUnique({
    where: { id },
    include: {
      project: true,
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
      transactions: {
        orderBy: {
          date: "desc",
        },
        include: {
          category: true,
          attachments: true,
        },
      },
    },
  });

  if (!retainerBilling) {
    notFound();
  }

  const currency =
    retainerBilling.currency || retainerBilling.branch?.currency || "NPR";

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              {months[retainerBilling.month - 1] || retainerBilling.month}{" "}
              {retainerBilling.year}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Monthly payment details and linked income transactions.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href="/retainers">Back to Monthly Payments</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Expected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatMoney(retainerBilling.expectedAmount, currency)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatMoney(retainerBilling.receivedAmount, currency)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatMoney(retainerBilling.pendingAmount, currency)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Payment Information</CardTitle>
            <CardDescription>
              Project, client, branch, dates, and payment status.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Project
              </p>
              <p className="mt-1 font-medium">
                <Link
                  href={`/projects/${retainerBilling.project.id}`}
                  className="hover:text-orange-600 hover:underline"
                >
                  {retainerBilling.project.name}
                </Link>
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Client
              </p>
              <p className="mt-1 font-medium">
                {retainerBilling.client ? (
                  <Link
                    href={`/clients/${retainerBilling.client.id}`}
                    className="hover:text-orange-600 hover:underline"
                  >
                    {retainerBilling.client.companyName ||
                      retainerBilling.client.name}
                  </Link>
                ) : (
                  "-"
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Branch
              </p>
              <div className="mt-1">
                {retainerBilling.branch ? (
                  <BranchBadge branch={retainerBilling.branch} showCurrency />
                ) : (
                  "-"
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Status
              </p>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={getStatusClassName(retainerBilling.status)}
                >
                  {formatStatus(retainerBilling.status)}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Month / Year
              </p>
              <p className="mt-1 font-medium">
                {months[retainerBilling.month - 1] || retainerBilling.month}{" "}
                {retainerBilling.year}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Fiscal Year
              </p>
              <p className="mt-1 font-medium">
                {retainerBilling.fiscalYear || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Due Date
              </p>
              <p className="mt-1 font-medium">
                {formatDate(retainerBilling.dueDate)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Paid Date
              </p>
              <p className="mt-1 font-medium">
                {formatDate(retainerBilling.paidDate)}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-medium uppercase text-slate-500">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                {retainerBilling.notes || "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linked Transactions</CardTitle>
            <CardDescription>
              Income transactions linked to this monthly payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Transaction Title</TableHead>
                  <TableHead className="text-right">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retainerBilling.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      No linked transactions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  retainerBilling.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>
                        {formatMoney(transaction.amount, transaction.currency)}
                      </TableCell>
                      <TableCell>
                        {formatPaymentMethod(transaction.paymentMethod)}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/transactions/${transaction.id}`}
                          className="font-medium hover:text-orange-600 hover:underline"
                        >
                          {transaction.title}
                        </Link>
                        {transaction.doneFor ? (
                          <p className="text-xs text-slate-500">
                            {transaction.doneFor}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/transactions/${transaction.id}`}>
                            Open
                          </Link>
                        </Button>
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
