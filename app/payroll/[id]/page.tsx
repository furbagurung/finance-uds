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

type PayrollDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const monthNames = [
  "",
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

export default async function PayrollDetailPage({
  params,
}: PayrollDetailPageProps) {
  const user = await requireAdmin();
  const { id } = await params;

  const payrollRecord = await prisma.payrollRecord.findUnique({
    where: {
      id,
    },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          position: true,
          department: true,
        },
      },
      transaction: {
        select: {
          id: true,
          title: true,
          amount: true,
          type: true,
          date: true,
        },
      },
    },
  });

  if (!payrollRecord) {
    notFound();
  }

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/payroll">Back to Payroll</Link>
              </Button>
            </div>

            <h1 className="text-3xl font-bold text-slate-950">
              Payroll Detail
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Salary record for {payrollRecord.employee.fullName} —{" "}
              {monthNames[payrollRecord.month]} {payrollRecord.year}
            </p>
          </div>

          <Badge
            variant={payrollRecord.status === "PAID" ? "default" : "outline"}
          >
            {payrollRecord.status}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Salary Breakdown</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Employee"
                value={payrollRecord.employee.fullName}
              />
              <DetailItem
                label="Period"
                value={`${monthNames[payrollRecord.month]} ${payrollRecord.year}`}
              />
              <DetailItem
                label="Basic Salary"
                value={formatMoney(payrollRecord.basicSalary)}
              />
              <DetailItem label="Bonus" value={formatMoney(payrollRecord.bonus)} />
              <DetailItem
                label="Deduction"
                value={formatMoney(payrollRecord.deduction)}
              />
              <DetailItem
                label="Net Pay"
                value={formatMoney(payrollRecord.netPay)}
              />
              <DetailItem
                label="Payment Method"
                value={payrollRecord.paymentMethod}
              />
              <DetailItem
                label="Payment Date"
                value={formatDate(payrollRecord.paymentDate)}
              />

              <div className="sm:col-span-2">
                <DetailItem label="Notes" value={payrollRecord.notes || "-"} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Info</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <DetailItem label="Email" value={payrollRecord.employee.email} />
                <DetailItem
                  label="Phone"
                  value={payrollRecord.employee.phone || "-"}
                />
                <DetailItem
                  label="Position"
                  value={payrollRecord.employee.position || "-"}
                />
                <DetailItem
                  label="Department"
                  value={payrollRecord.employee.department || "-"}
                />

                <Button asChild variant="outline" className="w-full">
                  <Link href={`/employees/${payrollRecord.employee.id}`}>
                    View Employee
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Linked Expense</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {payrollRecord.transaction ? (
                  <>
                    <DetailItem
                      label="Transaction"
                      value={payrollRecord.transaction.title}
                    />
                    <DetailItem
                      label="Amount"
                      value={formatMoney(payrollRecord.transaction.amount)}
                    />
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    No expense transaction is linked yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
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