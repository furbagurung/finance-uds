import { NextResponse } from "next/server";
import {
    ExpenseScope,
    PaymentMethod,
    PayrollStatus,
    Prisma,
    TransactionType,
} from "@prisma/client";
import { createActivityLog } from "@/lib/activity-log";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const branchSelect = {
    id: true,
    name: true,
    code: true,
    country: true,
    currency: true,
    calendarSystem: true,
    fiscalYearType: true,
} satisfies Prisma.BranchSelect;

function parseOptionalString(value: unknown) {
    if (value === "" || value === null || value === undefined) {
        return null;
    }

    const parsedValue = String(value).trim();

    return parsedValue || null;
}

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { message: "Not authenticated." },
                { status: 401 }
            );
        }

        if (currentUser.role !== "ADMIN") {
            return NextResponse.json(
                { message: "Only admin users can view payroll records." },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const branchIdParam = parseOptionalString(searchParams.get("branchId"));
        const branchId =
            branchIdParam && branchIdParam !== "ALL" ? branchIdParam : null;
        const statusParam = parseOptionalString(searchParams.get("status"));
        const status =
            statusParam &&
            statusParam !== "ALL" &&
            Object.values(PayrollStatus).includes(statusParam as PayrollStatus)
                ? (statusParam as PayrollStatus)
                : null;
        const month = searchParams.get("month")
            ? Number(searchParams.get("month"))
            : null;
        const year = searchParams.get("year")
            ? Number(searchParams.get("year"))
            : null;

        const where: Prisma.PayrollRecordWhereInput = {
            ...(branchId ? { branchId } : {}),
            ...(status ? { status } : {}),
            ...(month && month >= 1 && month <= 12 ? { month } : {}),
            ...(year && year >= 2000 ? { year } : {}),
        };

        const payrollRecords = await prisma.payrollRecord.findMany({
            where,
            orderBy: [
                { year: "desc" },
                { month: "desc" },
                { createdAt: "desc" },
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

        return NextResponse.json({ payrollRecords });
    } catch (error) {
        console.error("Payroll GET error:", error);

        return NextResponse.json(
            { message: "Failed to fetch payroll records." },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json(
                { message: "Not authenticated." },
                { status: 401 }
            );
        }

        if (currentUser.role !== "ADMIN") {
            return NextResponse.json(
                { message: "Only admin users can create payroll records." },
                { status: 403 }
            );
        }

        const body = await request.json();

        const employeeId = String(body.employeeId || "").trim();
        const month = Number(body.month);
        const year = Number(body.year);
        const basicSalary = Number(body.basicSalary);
        const bonus = body.bonus ? Number(body.bonus) : 0;
        const deduction = body.deduction ? Number(body.deduction) : 0;

        const paymentDate = body.paymentDate
            ? new Date(String(body.paymentDate))
            : null;

        const paymentMethod = body.paymentMethod
            ? (body.paymentMethod as PaymentMethod)
            : PaymentMethod.BANK_TRANSFER;

        const status = body.status
            ? (body.status as PayrollStatus)
            : PayrollStatus.DRAFT;

        const notes = String(body.notes || "").trim();

        if (!employeeId) {
            return NextResponse.json(
                { message: "Employee is required." },
                { status: 400 }
            );
        }

        if (!month || month < 1 || month > 12) {
            return NextResponse.json(
                { message: "Valid payroll month is required." },
                { status: 400 }
            );
        }

        if (!year || year < 2000) {
            return NextResponse.json(
                { message: "Valid payroll year is required." },
                { status: 400 }
            );
        }

        if (Number.isNaN(basicSalary) || basicSalary < 0) {
            return NextResponse.json(
                { message: "Basic salary must be a valid positive number." },
                { status: 400 }
            );
        }

        if (Number.isNaN(bonus) || bonus < 0) {
            return NextResponse.json(
                { message: "Bonus must be a valid positive number." },
                { status: 400 }
            );
        }

        if (Number.isNaN(deduction) || deduction < 0) {
            return NextResponse.json(
                { message: "Deduction must be a valid positive number." },
                { status: 400 }
            );
        }

        if (!Object.values(PaymentMethod).includes(paymentMethod)) {
            return NextResponse.json(
                { message: "Invalid payment method." },
                { status: 400 }
            );
        }

        if (!Object.values(PayrollStatus).includes(status)) {
            return NextResponse.json(
                { message: "Invalid payroll status." },
                { status: 400 }
            );
        }

        const requestBranchId = parseOptionalString(body.branchId);

        const employee = await prisma.employee.findUnique({
            where: {
                id: employeeId,
            },
            select: {
                id: true,
                fullName: true,
                branchId: true,
                branch: {
                    select: {
                        ...branchSelect,
                        isActive: true,
                    },
                },
            },
        });

        if (!employee) {
            return NextResponse.json(
                { message: "Employee not found." },
                { status: 404 }
            );
        }

        if (requestBranchId && requestBranchId !== employee.branchId) {
            return NextResponse.json(
                { message: "Payroll branch must match the selected employee branch." },
                { status: 400 }
            );
        }

        const payrollBranchId =
            employee.branchId && employee.branch?.isActive ? employee.branchId : null;
        const payrollCurrency =
            employee.branchId && employee.branch?.isActive
                ? employee.branch.currency
                : null;

        const netPay = basicSalary + bonus - deduction;

        if (netPay < 0) {
            return NextResponse.json(
                { message: "Net pay cannot be negative." },
                { status: 400 }
            );
        }

        const payrollRecord = await prisma.$transaction(async (tx) => {
            let transactionId: string | null = null;

            if (status === PayrollStatus.PAID) {
                const salaryExpense = await tx.transaction.create({
                    data: {
                        type: TransactionType.EXPENSE,
                        title: `Salary Payment - ${employee.fullName} - ${month}/${year}`,
                        amount: netPay,
                        date: paymentDate || new Date(),
                        paymentMethod,
                        expenseScope: ExpenseScope.COMPANY,
                        paidBy: "United Digital Service",
                        doneFor: employee.fullName,
                        notes:
                            notes ||
                            `Payroll salary expense for ${employee.fullName} for ${month}/${year}.`,
                        isBillable: false,
                        isReimbursed: false,
                        branchId: payrollBranchId,
                        currency: payrollCurrency,
                        createdById: currentUser.id,
                    },
                    select: {
                        id: true,
                    },
                });

                transactionId = salaryExpense.id;
            }

            return tx.payrollRecord.create({
                data: {
                    employeeId,
                    month,
                    year,
                    basicSalary,
                    bonus,
                    deduction,
                    netPay,
                    paymentDate,
                    paymentMethod,
                    status,
                    branchId: payrollBranchId,
                    currency: payrollCurrency,
                    notes: notes || null,
                    transactionId,
                },
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
        });

        await createActivityLog({
            action: "CREATE",
            entity: "PAYROLL",
            entityId: payrollRecord.id,
            userId: currentUser.id,
            message: `Created payroll record for ${payrollRecord.employee.fullName}`,
            metadata: {
                employeeId,
                employeeName: payrollRecord.employee.fullName,
                month,
                year,
                netPay,
                status,
            },
        });

        return NextResponse.json(
            {
                message: "Payroll record created successfully.",
                payrollRecord,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Payroll POST error:", error);

        return NextResponse.json(
            { message: "Failed to create payroll record." },
            { status: 500 }
        );
    }
}
