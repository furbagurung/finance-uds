import { NextResponse } from "next/server";
import { PaymentMethod, PayrollStatus } from "@prisma/client";
import { createActivityLog } from "@/lib/activity-log";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    const payrollRecords = await prisma.payrollRecord.findMany({
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
          },
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

    const employee = await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { message: "Employee not found." },
        { status: 404 }
      );
    }

    const netPay = basicSalary + bonus - deduction;

    if (netPay < 0) {
      return NextResponse.json(
        { message: "Net pay cannot be negative." },
        { status: 400 }
      );
    }

    const payrollRecord = await prisma.payrollRecord.create({
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
        notes: notes || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            position: true,
            department: true,
          },
        },
      },
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