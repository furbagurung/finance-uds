import Link from "next/link";
import { redirect } from "next/navigation";
import { RetainerBillingStatus, type Prisma } from "@prisma/client";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

import { BranchBadge } from "@/components/branch-badge";
import { BranchFilter } from "@/components/branch-filter";
import { DashboardShell } from "@/components/dashboard-shell";
import { RetainerBillingFilters } from "@/components/retainer-billing-filters";
import { RetainerBillingCreateModal } from "@/components/retainer-billing-create-modal";
import { Badge } from "@/components/ui/badge";
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

type RetainersPageProps = {
  searchParams: Promise<{
    branchId?: string;
    month?: string;
    year?: string;
    status?: string;
  }>;
};

const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
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

export default async function RetainersPage({
  searchParams,
}: RetainersPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const selectedBranchId =
    params.branchId && params.branchId !== "ALL" ? params.branchId : "";
  const selectedMonth =
    params.month && params.month !== "ALL" ? Number(params.month) : null;
  const selectedYear =
    params.year && params.year !== "ALL" ? Number(params.year) : null;
  const selectedStatus =
    params.status &&
    params.status !== "ALL" &&
    Object.values(RetainerBillingStatus).includes(
      params.status as RetainerBillingStatus,
    )
      ? (params.status as RetainerBillingStatus)
      : null;

  const where: Prisma.RetainerBillingWhereInput = {
    ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
    ...(selectedMonth && selectedMonth >= 1 && selectedMonth <= 12
      ? { month: selectedMonth }
      : {}),
    ...(selectedYear && selectedYear >= 2000 ? { year: selectedYear } : {}),
    ...(selectedStatus ? { status: selectedStatus } : {}),
  };

  const [retainerBillings, branches] = await Promise.all([
    prisma.retainerBilling.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
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
            isActive: true,
          },
        },
      },
    }),
    prisma.branch.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ name: "asc" }, { code: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        country: true,
        currency: true,
        calendarSystem: true,
        fiscalYearType: true,
        isActive: true,
      },
    }),
  ]);

  const totalExpected = retainerBillings.reduce(
    (sum, billing) => sum + Number(billing.expectedAmount),
    0,
  );
  const totalReceived = retainerBillings.reduce(
    (sum, billing) => sum + Number(billing.receivedAmount),
    0,
  );
  const totalPending = retainerBillings.reduce(
    (sum, billing) => sum + Number(billing.pendingAmount),
    0,
  );
  const paidCount = retainerBillings.filter(
    (billing) => billing.status === "PAID",
  ).length;
  const pendingOrOverdueCount = retainerBillings.filter((billing) =>
    ["PENDING", "PARTIALLY_PAID", "OVERDUE"].includes(billing.status),
  ).length;

  const defaultCurrency =
    retainerBillings[0]?.currency || retainerBillings[0]?.branch?.currency;

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              Retainer Billings
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track monthly expected, received, and pending retainer payments.
            </p>
          </div>

          <RetainerBillingCreateModal
            triggerLabel="Add Billing"
            triggerClassName="h-10 cursor-pointer rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition hover:bg-slate-800"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Expected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatMoney(totalExpected, defaultCurrency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatMoney(totalReceived, defaultCurrency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {formatMoney(totalPending, defaultCurrency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Paid Billings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">{paidCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Overdue/Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">
                {pendingOrOverdueCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Billing Records</CardTitle>
                <CardDescription>
                  Manual retainer billing records by month and project.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <BranchFilter branches={branches} basePath="/retainers" />
                <RetainerBillingFilters
                  selectedStatus={selectedStatus || ""}
                  selectedMonth={selectedMonth ? String(selectedMonth) : ""}
                  selectedYear={selectedYear ? String(selectedYear) : ""}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retainerBillings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      No retainer billings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  retainerBillings.map((billing) => (
                    <TableRow key={billing.id}>
                      <TableCell>
                        <Link
                          href={`/retainers/${billing.id}`}
                          className="font-medium hover:text-orange-600 hover:underline"
                        >
                          {months[billing.month - 1]?.label || billing.month}{" "}
                          {billing.year}
                        </Link>
                        <div className="mt-1 text-xs text-slate-500">
                          {billing.fiscalYear || "-"}
                        </div>
                      </TableCell>
                      <TableCell>{billing.project.name}</TableCell>
                      <TableCell>
                        {billing.client?.companyName ||
                          billing.client?.name ||
                          "-"}
                      </TableCell>
                      <TableCell>
                        {billing.branch ? (
                          <BranchBadge branch={billing.branch} />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {formatMoney(
                          billing.expectedAmount,
                          billing.currency || billing.branch?.currency,
                        )}
                      </TableCell>
                      <TableCell>
                        {formatMoney(
                          billing.receivedAmount,
                          billing.currency || billing.branch?.currency,
                        )}
                      </TableCell>
                      <TableCell>
                        {formatMoney(
                          billing.pendingAmount,
                          billing.currency || billing.branch?.currency,
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusClassName(billing.status)}
                        >
                          {formatStatus(billing.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(billing.dueDate)}
                        </span>
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
