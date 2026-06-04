import { NextResponse } from "next/server";
import { EmployeeStatus, SalaryType } from "@prisma/client";
import { createActivityLog } from "@/lib/activity-log";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const employeeBranchSelect = {
  id: true,
  name: true,
  code: true,
  country: true,
  currency: true,
  calendarSystem: true,
  fiscalYearType: true,
};

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
        { message: "Only admin users can view employees." },
        { status: 403 }
      );
    }

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
        branchId: true,
        branch: {
          select: employeeBranchSelect,
        },
        createdAt: true,
      },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Employees GET error:", error);

    return NextResponse.json(
      { message: "Failed to fetch employees." },
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
        { message: "Only admin users can create employees." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const position = String(body.position || "").trim();
    const department = String(body.department || "").trim();
    const notes = String(body.notes || "").trim();
    const branchIdValue =
      body.branchId === "" ||
      body.branchId === null ||
      body.branchId === undefined
        ? null
        : String(body.branchId).trim();
    const branchId = branchIdValue || null;

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

    if (salaryAmount !== null && (Number.isNaN(salaryAmount) || salaryAmount < 0)) {
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
      where: { email },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { message: "An employee with this email already exists." },
        { status: 400 }
      );
    }

    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: {
          id: branchId,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (!branch) {
        return NextResponse.json(
          { message: "Selected branch was not found or is inactive." },
          { status: 400 }
        );
      }
    }

    const employee = await prisma.employee.create({
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
        branchId,
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
        branchId: true,
        branch: {
          select: employeeBranchSelect,
        },
        createdAt: true,
      },
    });

    await createActivityLog({
      action: "CREATE",
      entity: "EMPLOYEE",
      entityId: employee.id,
      userId: currentUser.id,
      message: `Created employee: ${employee.fullName}`,
      metadata: {
        email: employee.email,
        position: employee.position,
        department: employee.department,
        salaryType: employee.salaryType,
        status: employee.status,
        branchId: employee.branchId,
        branchName: employee.branch?.name,
      },
    });

    return NextResponse.json(
      {
        message: "Employee created successfully.",
        employee,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Employees POST error:", error);

    return NextResponse.json(
      { message: "Failed to create employee." },
      { status: 500 }
    );
  }
}
