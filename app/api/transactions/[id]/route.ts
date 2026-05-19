import { NextResponse } from "next/server";
import {
  ExpenseScope,
  PaymentMethod,
  TransactionType,
} from "@prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type TransactionRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

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

    const paidBy = body.paidBy ? String(body.paidBy).trim() : null;
    const doneFor = body.doneFor ? String(body.doneFor).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;

    const isBillable = Boolean(body.isBillable);
    const isReimbursed = Boolean(body.isReimbursed);

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

    const transaction = await prisma.transaction.update({
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
        paidBy,
        doneFor,
        notes,
        isBillable: type === TransactionType.EXPENSE ? isBillable : false,
        isReimbursed: type === TransactionType.EXPENSE ? isReimbursed : false,
      },
      include: {
        category: true,
        client: true,
        project: true,
        attachments: true,
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