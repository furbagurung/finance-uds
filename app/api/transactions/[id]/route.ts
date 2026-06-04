import { NextResponse } from "next/server";
import {
  ExpenseScope,
  PaymentMethod,
  Prisma,
  RetainerBillingStatus,
  TransactionType,
} from "@prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";
import { recalculateRetainerBilling } from "@/lib/retainer-billing";

type TransactionRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function GET(
  _request: Request,
  { params }: TransactionRouteProps
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
        client: true,
        project: true,
        retainerBilling: {
          include: {
            project: true,
            client: true,
            branch: {
              select: branchSelect,
            },
          },
        },
        branch: {
          select: branchSelect,
        },
        attachments: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { message: "Transaction not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      transaction,
    });
  } catch (error) {
    console.error("Transaction GET error:", error);

    return NextResponse.json(
      { message: "Failed to fetch transaction." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: TransactionRouteProps
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existingTransaction = await prisma.transaction.findUnique({
      where: {
        id,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { message: "Transaction not found." },
        { status: 404 }
      );
    }

    const type = String(body.type || "") as TransactionType;
    const title = String(body.title || "").trim();
    const amount = Number(body.amount || 0);
    const date = body.date ? new Date(body.date) : existingTransaction.date;

    const paymentMethod =
      (body.paymentMethod as PaymentMethod) || PaymentMethod.BANK_TRANSFER;

    const expenseScope = body.expenseScope
      ? (body.expenseScope as ExpenseScope)
      : null;

    const categoryId = body.categoryId ? String(body.categoryId) : null;
    const clientId = body.clientId ? String(body.clientId) : null;
    const projectId = body.projectId ? String(body.projectId) : null;
    const hasRetainerBillingInput = Object.prototype.hasOwnProperty.call(
      body,
      "retainerBillingId"
    );
    const requestedRetainerBillingId = hasRetainerBillingInput
      ? parseOptionalString(body.retainerBillingId)
      : existingTransaction.retainerBillingId;

    const paidBy = body.paidBy ? String(body.paidBy).trim() : null;
    const doneFor = body.doneFor ? String(body.doneFor).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;

    const isBillable = Boolean(body.isBillable);
    const isReimbursed = Boolean(body.isReimbursed);
    const hasBranchInput = Object.prototype.hasOwnProperty.call(
      body,
      "branchId"
    );
    const hasCurrencyInput = Object.prototype.hasOwnProperty.call(
      body,
      "currency"
    );
    const branchId = hasBranchInput ? parseOptionalString(body.branchId) : null;
    const requestedCurrency = hasCurrencyInput
      ? parseOptionalString(body.currency)?.toUpperCase() ?? null
      : undefined;

    if (!Object.values(TransactionType).includes(type)) {
      return NextResponse.json(
        { message: "Invalid transaction type." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { message: "Transaction title is required." },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: "Amount must be greater than 0." },
        { status: 400 }
      );
    }

    if (type === TransactionType.EXPENSE && !expenseScope) {
      return NextResponse.json(
        { message: "Expense scope is required for expenses." },
        { status: 400 }
      );
    }

    let nextRetainerBillingId: string | null = null;

    if (type === TransactionType.INCOME) {
      nextRetainerBillingId = requestedRetainerBillingId;
    } else if (requestedRetainerBillingId) {
      return NextResponse.json(
        { message: "Only income transactions can be linked to retainer billing." },
        { status: 400 }
      );
    }

    if (nextRetainerBillingId) {
      const retainerBilling = await prisma.retainerBilling.findUnique({
        where: {
          id: nextRetainerBillingId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!retainerBilling) {
        return NextResponse.json(
          { message: "Retainer billing not found." },
          { status: 404 }
        );
      }

      if (retainerBilling.status === RetainerBillingStatus.WAIVED) {
        return NextResponse.json(
          { message: "Waived retainer billings cannot receive linked payments." },
          { status: 400 }
        );
      }
    }

    let resolvedBranchId: string | null | undefined = undefined;
    let resolvedCurrency: string | null | undefined = requestedCurrency;

    if (hasBranchInput && branchId) {
      const branch = await prisma.branch.findFirst({
        where: {
          id: branchId,
          isActive: true,
        },
        select: {
          id: true,
          currency: true,
        },
      });

      if (!branch) {
        return NextResponse.json(
          { message: "Selected branch was not found or is inactive." },
          { status: 400 }
        );
      }

      resolvedBranchId = branch.id;
      resolvedCurrency = requestedCurrency ?? branch.currency;
    } else if (hasBranchInput) {
      resolvedBranchId = null;
      resolvedCurrency = requestedCurrency ?? null;
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const updatedTransaction = await tx.transaction.update({
        where: {
          id,
        },
        data: {
          type,
          title,
          amount,
          date,
          paymentMethod,
          expenseScope: type === TransactionType.EXPENSE ? expenseScope : null,
          categoryId,
          clientId,
          projectId,
          retainerBillingId:
            type === TransactionType.INCOME ? nextRetainerBillingId : null,
          paidBy,
          doneFor,
          notes,
          isBillable: type === TransactionType.EXPENSE ? isBillable : false,
          isReimbursed: type === TransactionType.EXPENSE ? isReimbursed : false,
          ...(hasBranchInput ? { branchId: resolvedBranchId } : {}),
          ...(resolvedCurrency !== undefined ? { currency: resolvedCurrency } : {}),
        },
        include: {
          category: true,
          client: true,
          project: true,
          retainerBilling: {
            include: {
              project: true,
              client: true,
              branch: {
                select: branchSelect,
              },
            },
          },
          branch: {
            select: branchSelect,
          },
          attachments: true,
        },
      });

      const retainerBillingIds = new Set(
        [existingTransaction.retainerBillingId, nextRetainerBillingId].filter(
          Boolean
        ) as string[]
      );

      for (const retainerBillingId of retainerBillingIds) {
        await recalculateRetainerBilling(tx, retainerBillingId);
      }

      return updatedTransaction;
    });

    await createActivityLog({
      action: "UPDATE",
      entity: "TRANSACTION",
      entityId: transaction.id,
      userId: user.id,
      message: `Updated transaction: ${transaction.title}`,
      metadata: {
        type: transaction.type,
        amount: Number(transaction.amount),
        date: transaction.date,
      },
    });

    return NextResponse.json({
      message: "Transaction updated successfully.",
      transaction,
    });
  } catch (error) {
    console.error("Transaction PATCH error:", error);

    return NextResponse.json(
      { message: "Failed to update transaction." },
      { status: 500 }
    );
  }
}
export async function DELETE(
  _request: Request,
  { params }: TransactionRouteProps
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existingTransaction = await prisma.transaction.findUnique({
      where: {
        id,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { message: "Transaction not found." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.delete({
        where: {
          id,
        },
      });

      if (existingTransaction.retainerBillingId) {
        await recalculateRetainerBilling(
          tx,
          existingTransaction.retainerBillingId
        );
      }
    });

    await createActivityLog({
      action: "DELETE",
      entity: "TRANSACTION",
      entityId: id,
      userId: user.id,
      message: `Deleted transaction: ${existingTransaction.title}`,
      metadata: {
        type: existingTransaction.type,
        amount: Number(existingTransaction.amount),
        date: existingTransaction.date,
      },
    });

    return NextResponse.json({
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    console.error("Transaction DELETE error:", error);

    return NextResponse.json(
      { message: "Failed to delete transaction." },
      { status: 500 }
    );
  }
}
