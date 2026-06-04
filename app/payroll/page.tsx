
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { BranchBadge } from "@/components/branch-badge";
import { BranchFilter } from "@/components/branch-filter";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PayrollCreateModal } from "@/components/payroll-create-modal";
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

const branchSelect = {
    id: true,
    name: true,
    code: true,
    country: true,
    currency: true,
    calendarSystem: true,
    fiscalYearType: true,
};

type PayrollPageProps = {
    searchParams: Promise<{
        branchId?: string;
    }>;
};

function formatMoney(amount: unknown, currency = "NPR") {
    if (amount === null || amount === undefined) return "-";

    return new Intl.NumberFormat("en-NP", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(Number(amount));
}

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
    const params = await searchParams;
    const user = await requireAdmin();
    const selectedBranchId =
        params.branchId && params.branchId !== "ALL" ? params.branchId : "";

    const employees = await prisma.employee.findMany({
        where: {
            status: "ACTIVE",
        },
        orderBy: {
            fullName: "asc",
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            position: true,
            salaryAmount: true,
            branchId: true,
            branch: {
                select: branchSelect,
            },
        },
    });
    const employeeOptions = employees.map((employee) => ({
        ...employee,
        salaryAmount: employee.salaryAmount ? String(employee.salaryAmount) : null,
    }));
    const payrollRecords = await prisma.payrollRecord.findMany({
        where: {
            ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
        },
        orderBy: [
            {
                year: "desc",
            },
            {
                month: "desc",
            },
            {
                createdAt: "desc",
            },
        ],
        include: {
            employee: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    position: true,
                    department: true,
                    branchId: true,
                    branch: {
                        select: branchSelect,
                    },
                },
            },
            branch: {
                select: branchSelect,
            },
            transaction: {
                select: {
                    id: true,
                    title: true,
                    amount: true,
                    type: true,
                },
            },
        },
    });

    return (
        <DashboardShell user={user}>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-950">Payroll</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage employee salary records and company salary expenses.
                        </p>
                    </div>

                    <PayrollCreateModal
                        employees={employeeOptions}
                        triggerLabel="Add Payroll"
                        triggerClassName="h-10 cursor-pointer rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition hover:bg-slate-800"
                    />
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle>Payroll Records</CardTitle>
                                <CardDescription>
                                    Track monthly employee salary, payment status, and linked expenses.
                                </CardDescription>
                            </div>
                            <BranchFilter basePath="/payroll" />
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Basic Salary</TableHead>
                                    <TableHead>Bonus</TableHead>
                                    <TableHead>Deduction</TableHead>
                                    <TableHead>Net Pay</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Payment Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {payrollRecords.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={10}
                                            className="py-10 text-center text-sm text-slate-500"
                                        >
                                            No payroll records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payrollRecords.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell>
                                                <div className="font-medium text-slate-950">
                                                    {record.employee.fullName}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {record.employee.position || record.employee.email}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {record.branch ? (
                                                    <BranchBadge branch={record.branch} />
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                {monthNames[record.month]} {record.year}
                                            </TableCell>

                                            <TableCell>{formatMoney(record.basicSalary, record.currency || record.branch?.currency || "NPR")}</TableCell>
                                            <TableCell>{formatMoney(record.bonus, record.currency || record.branch?.currency || "NPR")}</TableCell>
                                            <TableCell>{formatMoney(record.deduction, record.currency || record.branch?.currency || "NPR")}</TableCell>

                                            <TableCell className="font-semibold text-slate-950">
                                                {formatMoney(record.netPay, record.currency || record.branch?.currency || "NPR")}
                                            </TableCell>

                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        record.status === "PAID" ? "default" : "outline"
                                                    }
                                                >
                                                    {record.status}
                                                </Badge>
                                            </TableCell>

                                            <TableCell>{formatDate(record.paymentDate)}</TableCell>

                                            <TableCell>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/payroll/${record.id}`}>View</Link>
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
