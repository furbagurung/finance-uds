import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

type EmployeeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-NP", {
    dateStyle: "medium",
  }).format(date);
}

function formatMoney(amount: unknown) {
  if (amount === null || amount === undefined) return "-";

  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export default async function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  const user = await requireAdmin();
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: {
      id,
    },
    include: {
      payrollRecords: {
        orderBy: [
          {
            year: "desc",
          },
          {
            month: "desc",
          },
        ],
      },
    },
  });

  if (!employee) {
    notFound();
  }

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/employees">Back to Employees</Link>
              </Button>
            </div>

            <h1 className="text-3xl font-bold text-slate-950">
              {employee.fullName}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Employee profile, salary structure, and payroll history.
            </p>
          </div>

         <div className="flex items-center gap-3">
  <Badge variant={employee.status === "ACTIVE" ? "default" : "outline"}>
    {employee.status}
  </Badge>

  <Button asChild>
    <Link href={`/employees/${employee.id}/edit`}>Edit Employee</Link>
  </Button>
</div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Full Name" value={employee.fullName} />
              <DetailItem label="Email" value={employee.email} />
              <DetailItem label="Phone" value={employee.phone || "-"} />
              <DetailItem label="Position" value={employee.position || "-"} />
              <DetailItem
                label="Department"
                value={employee.department || "-"}
              />
              <DetailItem
                label="Joining Date"
                value={formatDate(employee.joiningDate)}
              />
              <DetailItem
                label="Salary Type"
                value={employee.salaryType}
              />
              <DetailItem
                label="Salary Amount"
                value={formatMoney(employee.salaryAmount)}
              />

              <div className="sm:col-span-2">
                <DetailItem label="Notes" value={employee.notes || "-"} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payroll Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <DetailItem
                label="Total Payroll Records"
                value={String(employee.payrollRecords.length)}
              />
              <DetailItem
                label="Latest Payroll"
                value={
                  employee.payrollRecords[0]
                    ? `${employee.payrollRecords[0].month}/${employee.payrollRecords[0].year}`
                    : "-"
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}