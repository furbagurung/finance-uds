import { requireAdmin } from "@/lib/require-admin";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmployeeCreateModal } from "@/components/employee-create-modal";
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
import { prisma } from "@/lib/prisma";

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

export default async function EmployeesPage() {
  const user = await requireAdmin();

  const employees = await prisma.employee.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      position: true,
      department: true,
      joiningDate: true,
      salaryAmount: true,
      salaryType: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Employees</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage company employees and prepare their payroll records.
            </p>
          </div>

          <EmployeeCreateModal
  triggerLabel="Add Employee"
  triggerClassName="h-10 cursor-pointer rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition hover:bg-slate-800"
/>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
            <CardDescription>
              View employee details, salary structure, and employment status.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="font-medium text-slate-950">
                          {employee.fullName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {employee.position || "No position added"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-slate-700">
                          {employee.email}
                        </div>
                        <div className="text-xs text-slate-500">
                          {employee.phone || "No phone"}
                        </div>
                      </TableCell>

                      <TableCell>{employee.department || "-"}</TableCell>

                      <TableCell>
                        <div className="font-medium">
                          {formatMoney(employee.salaryAmount)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {employee.salaryType}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            employee.status === "ACTIVE"
                              ? "default"
                              : "outline"
                          }
                        >
                          {employee.status}
                        </Badge>
                      </TableCell>

                      <TableCell>{formatDate(employee.joiningDate)}</TableCell>

                      <TableCell>
                        <Button variant="outline" size="sm" disabled>
                          View
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