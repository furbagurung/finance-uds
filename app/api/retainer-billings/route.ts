import { NextResponse } from "next/server";
import {
  Prisma,
  ProjectType,
  RetainerBillingStatus,
} from "@prisma/client";

import { createActivityLog } from "@/lib/activity-log";
import { getCurrentUser } from "@/lib/current-user";
import { getFiscalYearLabelForDate } from "@/lib/fiscal-year";
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

function parseRequiredInt(value: unknown) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) ? parsedValue : null;
}

function parseOptionalAmount(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const amount = Number(value);

  if (Number.isNaN(amount) || amount < 0) {
    return undefined;
  }

  return amount;
}

function parseOptionalDate(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function calculatePendingAmount(expectedAmount: number, receivedAmount: number) {
  return Math.max(expectedAmount - receivedAmount, 0);
}

function calculateStatus(expectedAmount: number, receivedAmount: number) {
  if (receivedAmount <= 0) {
    return RetainerBillingStatus.PENDING;
  }

  if (receivedAmount < expectedAmount) {
    return RetainerBillingStatus.PARTIALLY_PAID;
  }

  return RetainerBillingStatus.PAID;
}

function createBillingPeriodDate(month: number, year: number) {
  return new Date(Date.UTC(year, month - 1, 1));
}

function parseStatusFilters(value: string | null) {
  if (!value || value === "ALL") {
    return [];
  }

  return value
    .split(",")
    .map((status) => status.trim())
    .filter((status): status is RetainerBillingStatus =>
      Object.values(RetainerBillingStatus).includes(
        status as RetainerBillingStatus,
      ),
    );
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const branchId = parseOptionalString(searchParams.get("branchId"));
    const projectId = parseOptionalString(searchParams.get("projectId"));
    const clientId = parseOptionalString(searchParams.get("clientId"));
    const monthParam = parseOptionalString(searchParams.get("month"));
    const yearParam = parseOptionalString(searchParams.get("year"));
    const statusParam = parseOptionalString(searchParams.get("status"));
    const month = monthParam && monthParam !== "ALL" ? Number(monthParam) : null;
    const year = yearParam && yearParam !== "ALL" ? Number(yearParam) : null;
    const statuses = parseStatusFilters(statusParam);

    const where: Prisma.RetainerBillingWhereInput = {
      ...(branchId && branchId !== "ALL" ? { branchId } : {}),
      ...(projectId && projectId !== "ALL" ? { projectId } : {}),
      ...(clientId && clientId !== "ALL" ? { clientId } : {}),
      ...(month && month >= 1 && month <= 12 ? { month } : {}),
      ...(year && year >= 2000 ? { year } : {}),
      ...(statuses.length === 1 ? { status: statuses[0] } : {}),
      ...(statuses.length > 1 ? { status: { in: statuses } } : {}),
    };

    const retainerBillings = await prisma.retainerBilling.findMany({
      where,
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      include: {
        project: true,
        client: true,
        branch: {
          select: branchSelect,
        },
        transactions: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    return NextResponse.json({ retainerBillings });
  } catch (error) {
    console.error("Retainer billings GET error:", error);

    return NextResponse.json(
      { message: "Failed to fetch monthly payments." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const projectId = parseOptionalString(body.projectId);
    const month = parseRequiredInt(body.month);
    const year = parseRequiredInt(body.year);
    const receivedAmountInput = parseOptionalAmount(body.receivedAmount);
    const expectedAmountInput = parseOptionalAmount(body.expectedAmount);
    const dueDate = parseOptionalDate(body.dueDate);
    const notes = parseOptionalString(body.notes);

    if (!projectId) {
      return NextResponse.json(
        { message: "Project is required." },
        { status: 400 },
      );
    }

    if (!month || month < 1 || month > 12) {
      return NextResponse.json(
        { message: "Valid billing month is required." },
        { status: 400 },
      );
    }

    if (!year || year < 2000) {
      return NextResponse.json(
        { message: "Valid billing year is required." },
        { status: 400 },
      );
    }

    if (
      expectedAmountInput === undefined ||
      receivedAmountInput === undefined ||
      dueDate === undefined
    ) {
      return NextResponse.json(
        { message: "Amounts and due date must be valid." },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        client: true,
        branch: {
          select: branchSelect,
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 },
      );
    }

    if (project.projectType !== ProjectType.MONTHLY_RETAINER) {
      return NextResponse.json(
        {
          message:
            "Monthly payments can only be created for monthly projects.",
        },
        { status: 400 },
      );
    }

    const expectedAmount =
      expectedAmountInput ?? Number(project.monthlyRetainerAmount ?? 0);

    if (!expectedAmount || expectedAmount <= 0) {
      return NextResponse.json(
        {
          message:
            "Expected amount is required. Add a monthly amount to the project or enter one manually.",
        },
        { status: 400 },
      );
    }

    const receivedAmount = receivedAmountInput ?? 0;
    const pendingAmount = calculatePendingAmount(expectedAmount, receivedAmount);
    const status = calculateStatus(expectedAmount, receivedAmount);
    const fiscalYear = getFiscalYearLabelForDate(
      createBillingPeriodDate(month, year),
      project.branch,
    );
    const currency = project.currency || project.branch?.currency || null;

    const retainerBilling = await prisma.retainerBilling.create({
      data: {
        projectId: project.id,
        clientId: project.clientId,
        branchId: project.branchId,
        month,
        year,
        fiscalYear,
        expectedAmount,
        receivedAmount,
        pendingAmount,
        currency,
        dueDate,
        status,
        notes,
      },
      include: {
        project: true,
        client: true,
        branch: {
          select: branchSelect,
        },
        transactions: true,
      },
    });

    await createActivityLog({
      action: "CREATE",
      entity: "RETAINER_BILLING",
      entityId: retainerBilling.id,
      userId: user.id,
      message: `Created monthly payment: ${project.name} ${month}/${year}`,
      metadata: {
        projectId: project.id,
        clientId: project.clientId,
        branchId: project.branchId,
        month,
        year,
        expectedAmount,
        receivedAmount,
        pendingAmount,
        status,
      },
    });

    return NextResponse.json(
      {
        message: "Monthly payment created successfully.",
        retainerBilling,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Retainer billings POST error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          message:
            "A monthly payment already exists for this project, month, and year.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Failed to create monthly payment." },
      { status: 500 },
    );
  }
}
