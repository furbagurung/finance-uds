import { NextResponse } from "next/server";
import { EmployeeStatus, SalaryType } from "@prisma/client";
import { createActivityLog } from "@/lib/activity-log";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type EmployeeRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: EmployeeRouteProps) {
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
        { message: "Only admin users can update employees." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const position = String(body.position || "").trim();
    const department = String(body.department || "").trim();
    const notes = String(body.notes || "").trim();

    const joiningDate = body.joiningDate
      ? new Date(String(body.joiningDate))
      : null;

    const salaryAmount =
      body.salaryAmount === "" ||
      body.salaryAmount === null ||
      body.salaryAmount === undefined
        ? null
        : Number(body.salaryAmount);

    const salaryType = body.salaryType
      ? (body.salaryType as SalaryType)
      : SalaryType.MONTHLY;

    const status = body.status
      ? (body.status as EmployeeStatus)
      : EmployeeStatus.ACTIVE;

    if (!fullName || !email) {
      return NextResponse.json(
        { message: "Full name and email are required." },
        { status: 400 }
      );
    }

    if (Number.isNaN(joiningDate?.getTime())) {
      return NextResponse.json(
        { message: "Invalid joining date." },
        { status: 400 }
      );
    }

    if (
      salaryAmount !== null &&
      (Number.isNaN(salaryAmount) || salaryAmount < 0)
    ) {
      return NextResponse.json(
        { message: "Salary amount must be a valid positive number." },
        { status: 400 }
      );
    }

    if (!Object.values(SalaryType).includes(salaryType)) {
      return NextResponse.json(
        { message: "Invalid salary type." },
        { status: 400 }
      );
    }

    if (!Object.values(EmployeeStatus).includes(status)) {
      return NextResponse.json(
        { message: "Invalid employee status." },
        { status: 400 }
      );
    }

    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { message: "Employee not found." },
        { status: 404 }
      );
    }

    const duplicateEmployee = await prisma.employee.findFirst({
      where: {
        email,
        NOT: {
          id,
        },
      },
    });

    if (duplicateEmployee) {
      return NextResponse.json(
        { message: "Another employee with this email already exists." },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.update({
      where: {
        id,
      },
      data: {
        fullName,
        email,
        phone: phone || null,
        position: position || null,
        department: department || null,
        joiningDate,
        salaryAmount,
        salaryType,
        status,
        notes: notes || null,
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

    await createActivityLog({
      action: "UPDATE",
      entity: "EMPLOYEE",
      entityId: employee.id,
      userId: currentUser.id,
      message: `Updated employee: ${employee.fullName}`,
      metadata: {
        email: employee.email,
        position: employee.position,
        department: employee.department,
        salaryType: employee.salaryType,
        status: employee.status,
      },
    });

    return NextResponse.json({
      message: "Employee updated successfully.",
      employee,
    });
  } catch (error) {
    console.error("Employee PATCH error:", error);

    return NextResponse.json(
      { message: "Failed to update employee." },
      { status: 500 }
    );
  }
}