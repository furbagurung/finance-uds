import { NextResponse } from "next/server";
import { ExpenseScope, PaymentMethod, TransactionType } from "@prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const transactions = await prisma.transaction.findMany({
      orderBy: {
        date: "desc",
      },
      include: {
        category: true,
        client: true,
        project: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attachments: true,
      },
      take: 100,
    });

    return NextResponse.json({
      transactions,
    });
  } catch (error) {
    console.error("Transactions GET error:", error);

    return NextResponse.json(
      { message: "Failed to fetch transactions." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const type = String(body.type || "") as TransactionType;
    const title = String(body.title || "").trim();
    const amount = Number(body.amount || 0);
    const date = body.date ? new Date(body.date) : new Date();
    const paymentMethod =
      (body.paymentMethod as PaymentMethod) || PaymentMethod.BANK_TRANSFER;

    const expenseScope = body.expenseScope
      ? (body.expenseScope as ExpenseScope)
      : null;

    const paidBy = body.paidBy ? String(body.paidBy).trim() : null;
    const doneFor = body.doneFor ? String(body.doneFor).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;

    const categoryId = body.categoryId ? String(body.categoryId) : null;
    const clientId = body.clientId ? String(body.clientId) : null;
    const projectId = body.projectId ? String(body.projectId) : null;

    const isBillable = Boolean(body.isBillable);
    const isReimbursed = Boolean(body.isReimbursed);
    const attachment = body.attachment;

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

  const transaction = await prisma.transaction.create({
  data: {
    type,
    title,
    amount,
    date,
    paymentMethod,
    expenseScope,
    paidBy,
    doneFor,
    notes,
    isBillable,
    isReimbursed,
    categoryId,
    clientId,
    projectId,
    createdById: user.id,
    attachments: attachment
      ? {
          create: {
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            attachmentType: "RECEIPT",
          },
        }
      : undefined,
  },
  include: {
    category: true,
    client: true,
    project: true,
    attachments: true,
  },
});

    return NextResponse.json(
      {
        message: "Transaction created successfully.",
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Transactions POST error:", error);

    return NextResponse.json(
      { message: "Failed to create transaction." },
      { status: 500 }
    );
  }
}