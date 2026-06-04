import { NextResponse } from "next/server";
import { BillingCycle, ProjectStatus, ProjectType } from "@prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

const projectBranchSelect = {
  id: true,
  name: true,
  code: true,
  country: true,
  currency: true,
  calendarSystem: true,
  fiscalYearType: true,
};

function parseOptionalString(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsedValue = String(value).trim();

  return parsedValue || null;
}

function hasOptionalValue(value: unknown) {
  return value !== "" && value !== null && value !== undefined;
}

function parseOptionalAmount(value: unknown) {
  if (!hasOptionalValue(value)) return null;

  const amount = Number(value);

  if (Number.isNaN(amount) || amount < 0) {
    return undefined;
  }

  return amount;
}

function parseOptionalDate(value: unknown) {
  if (!hasOptionalValue(value)) return null;

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function parseProjectType(value: unknown) {
  const projectType = parseOptionalString(value) as ProjectType | null;

  if (!projectType) return null;

  return Object.values(ProjectType).includes(projectType)
    ? projectType
    : undefined;
}

function parseBillingCycle(value: unknown) {
  const billingCycle = parseOptionalString(value) as BillingCycle | null;

  if (!billingCycle) return null;

  return Object.values(BillingCycle).includes(billingCycle)
    ? billingCycle
    : undefined;
}

function getDefaultBillingCycle(projectType: ProjectType) {
  if (projectType === ProjectType.MONTHLY_RETAINER) {
    return BillingCycle.MONTHLY;
  }

  if (projectType === ProjectType.ONE_TIME) {
    return BillingCycle.ONE_TIME;
  }

  return undefined;
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 },
      );
    }

    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        branch: {
          select: projectBranchSelect,
        },
        client: {
          include: {
            branch: {
              select: projectBranchSelect,
            },
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    return NextResponse.json({
      projects,
    });
  } catch (error) {
    console.error("Projects GET error:", error);

    return NextResponse.json(
      { message: "Failed to fetch projects." },
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

    const name = String(body.name || "").trim();
    const clientId = body.clientId ? String(body.clientId) : null;
    const budget = body.budget ? Number(body.budget) : null;
    const startDate = body.startDate ? new Date(body.startDate) : null;
    const endDate = body.endDate ? new Date(body.endDate) : null;
    const projectTypeInput = parseProjectType(body.projectType);
    const billingCycleInput = parseBillingCycle(body.billingCycle);
    const monthlyRetainerAmount = parseOptionalAmount(
      body.monthlyRetainerAmount
    );
    const projectValue = parseOptionalAmount(body.projectValue);
    const requestedCurrency = parseOptionalString(body.currency)?.toUpperCase();
    const billingStartDate = parseOptionalDate(body.billingStartDate);
    const billingEndDate = parseOptionalDate(body.billingEndDate);
    const nextBillingDate = parseOptionalDate(body.nextBillingDate);
    const branchIdValue =
      body.branchId === "" ||
      body.branchId === null ||
      body.branchId === undefined
        ? null
        : String(body.branchId).trim();
    const branchId = branchIdValue || null;
    const branchIdTouched = Boolean(body.branchIdTouched);
    const status = body.status
      ? (body.status as ProjectStatus)
      : ProjectStatus.ACTIVE;

    if (!name) {
      return NextResponse.json(
        { message: "Project name is required." },
        { status: 400 },
      );
    }

    if (body.status && !Object.values(ProjectStatus).includes(status)) {
      return NextResponse.json(
        { message: "Invalid project status." },
        { status: 400 },
      );
    }

    if (projectTypeInput === undefined) {
      return NextResponse.json(
        { message: "Invalid project type." },
        { status: 400 },
      );
    }

    if (billingCycleInput === undefined) {
      return NextResponse.json(
        { message: "Invalid billing cycle." },
        { status: 400 },
      );
    }

    if (
      monthlyRetainerAmount === undefined ||
      projectValue === undefined ||
      billingStartDate === undefined ||
      billingEndDate === undefined ||
      nextBillingDate === undefined
    ) {
      return NextResponse.json(
        { message: "Billing amounts and dates must be valid." },
        { status: 400 },
      );
    }

    const projectType = projectTypeInput ?? ProjectType.ONE_TIME;
    const billingCycle =
      billingCycleInput ?? getDefaultBillingCycle(projectType);

    let selectedBranch: { id: string; currency: string } | null = null;

    if (branchId) {
      selectedBranch = await prisma.branch.findFirst({
        where: {
          id: branchId,
          isActive: true,
        },
        select: {
          id: true,
          currency: true,
        },
      });

      if (!selectedBranch) {
        return NextResponse.json(
          { message: "Selected branch was not found or is inactive." },
          { status: 400 },
        );
      }
    }

    const client = clientId
      ? await prisma.client.findUnique({
          where: {
            id: clientId,
          },
          select: {
            branchId: true,
            branch: {
              select: {
                id: true,
                isActive: true,
                currency: true,
              },
            },
          },
        })
      : null;

    const resolvedBranchId =
      branchId ||
      (!branchIdTouched && client?.branch?.isActive ? client.branchId : null);
    const resolvedCurrency =
      requestedCurrency ||
      selectedBranch?.currency ||
      (!branchIdTouched && client?.branch?.isActive
        ? client.branch.currency
        : null);

    const project = await prisma.project.create({
      data: {
        name,
        budget,
        startDate,
        endDate,
        status,
        projectType,
        ...(billingCycle ? { billingCycle } : {}),
        monthlyRetainerAmount,
        projectValue,
        currency: resolvedCurrency,
        billingStartDate,
        billingEndDate,
        nextBillingDate,
        clientId,
        branchId: resolvedBranchId,
        createdById: user.id,
      },
      include: {
        branch: {
          select: projectBranchSelect,
        },
        client: {
          include: {
            branch: {
              select: projectBranchSelect,
            },
          },
        },
      },
    });

    await createActivityLog({
      action: "CREATE",
      entity: "PROJECT",
      entityId: project.id,
      userId: user.id,
      message: `Created project: ${project.name}`,
      metadata: {
        clientId: project.clientId,
        clientName: project.client?.name,
        branchId: project.branchId,
        branchName: project.branch?.name,
        budget: project.budget ? Number(project.budget) : null,
        projectType: project.projectType,
        billingCycle: project.billingCycle,
        monthlyRetainerAmount: project.monthlyRetainerAmount
          ? Number(project.monthlyRetainerAmount)
          : null,
        projectValue: project.projectValue ? Number(project.projectValue) : null,
        currency: project.currency,
        status: project.status,
      },
    });

    return NextResponse.json(
      {
        message: "Project created successfully.",
        project,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Projects POST error:", error);

    return NextResponse.json(
      { message: "Failed to create project." },
      { status: 500 },
    );
  }
}
