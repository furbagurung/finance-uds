import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmployeeForm } from "@/components/employee-form";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

type EmployeeEditPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EmployeeEditPage({
    params,
}: EmployeeEditPageProps) {
    const user = await requireAdmin();
    const { id } = await params;

    const employee = await prisma.employee.findUnique({
        where: {
            id,
        },
        include: {
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
        },
    });

    if (!employee) {
        notFound();
    }

    return (
        <DashboardShell user={user}>
            <div className="space-y-6">
                <div>
                    <div className="mb-3">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/employees/${employee.id}`}>Back to Employee</Link>
                        </Button>
                    </div>

                    <h1 className="text-3xl font-bold text-slate-950">
                        Edit Employee
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Update employee profile, salary structure, and employment details.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Employee Information</CardTitle>
                        <CardDescription>
                            Keep employee details accurate for payroll and internal records.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <EmployeeForm
                            employee={{
                                ...employee,
                                salaryAmount: employee.salaryAmount ? String(employee.salaryAmount) : null,
                            }}
                            mode="page"
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    );
}
