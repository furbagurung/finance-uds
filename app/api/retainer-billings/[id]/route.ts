import { NextResponse } from "next/server";
import { Prisma, RetainerBillingStatus } from "@prisma/client";

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

type RetainerBillingRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function hasField(body: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(body, key);
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

function parseOptionalString(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsedValue = String(value).trim();

  return parsedValue || null;
}

function parseStatus(value: unknown) {
  const status = parseOptionalString(value) as RetainerBillingStatus | null;

  if (!status) return null;

  return Object.values(RetainerBillingStatus).includes(status)
    ? status
    : undefined;
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

export async function GET(
  _request: Request,
  { params }: RetainerBillingRouteProps,
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 },
      );
    }

    const { id } = await params;

    const retainerBilling = await prisma.retainerBilling.findUnique({
      where: { id },
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
          include: {
            category: true,
            attachments: true,
          },
        },
      },
    });

    if (!retainerBilling) {
      return NextResponse.json(
        { message: "Retainer billing not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ retainerBilling });
  } catch (error) {
    console.error("Retainer billing GET error:", error);

    return NextResponse.json(
      { message: "Failed to fetch retainer billing." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RetainerBillingRouteProps,
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const existingBilling = await prisma.retainerBilling.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!existingBilling) {
      return NextResponse.json(
        { message: "Retainer billing not found." },
        { status: 404 },
      );
    }

    const expectedAmountInput = hasField(body, "expectedAmount")
      ? parseOptionalAmount(body.expectedAmount)
      : null;
    const receivedAmountInput = hasField(body, "receivedAmount")
      ? parseOptionalAmount(body.receivedAmount)
      : null;
    const dueDate = hasField(body, "dueDate")
      ? parseOptionalDate(body.dueDate)
      : undefined;
    const paidDate = hasField(body, "paidDate")
      ? parseOptionalDate(body.paidDate)
      : undefined;
    const statusInput = hasField(body, "status")
      ? parseStatus(body.status)
      : null;
    const notes = hasField(body, "notes")
      ? parseOptionalString(body.notes)
      : undefined;

    if (
      expectedAmountInput === undefined ||
      receivedAmountInput === undefined ||
      dueDate === undefined ||
      paidDate === undefined ||
      statusInput === undefined
    ) {
      return NextResponse.json(
        { message: "Retainer billing update values must be valid." },
        { status: 400 },
      );
    }

    const expectedAmount =
      expectedAmountInput ?? Number(existingBilling.expectedAmount);
    const receivedAmount =
      receivedAmountInput ?? Number(existingBilling.receivedAmount);
    const pendingAmount = calculatePendingAmount(expectedAmount, receivedAmount);
    const status =
      statusInput ?? calculateStatus(expectedAmount, receivedAmount);

    const retainerBilling = await prisma.retainerBilling.update({
      where: { id },
      data: {
        expectedAmount,
        receivedAmount,
        pendingAmount,
        status,
        ...(dueDate !== undefined ? { dueDate } : {}),
        ...(paidDate !== undefined ? { paidDate } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
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

    await createActivityLog({
      action: "UPDATE",
      entity: "RETAINER_BILLING",
      entityId: retainerBilling.id,
      userId: user.id,
      message: `Updated retainer billing: ${retainerBilling.project.name} ${retainerBilling.month}/${retainerBilling.year}`,
      metadata: {
        expectedAmount,
        receivedAmount,
        pendingAmount,
        status,
      },
    });

    return NextResponse.json({
      message: "Retainer billing updated successfully.",
      retainerBilling,
    });
  } catch (error) {
    console.error("Retainer billing PATCH error:", error);

    return NextResponse.json(
      { message: "Failed to update retainer billing." },
      { status: 500 },
    );
  }
}
