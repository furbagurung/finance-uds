import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA").format(date);
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

    const selectedType = searchParams.get("type") || "";
    const selectedClientId = searchParams.get("clientId") || "";
    const selectedProjectId = searchParams.get("projectId") || "";
    const fromDate = searchParams.get("from") || "";
    const toDate = searchParams.get("to") || "";

    const transactionWhere = {
      ...(selectedType ? { type: selectedType as never } : {}),
      ...(selectedClientId ? { clientId: selectedClientId } : {}),
      ...(selectedProjectId ? { projectId: selectedProjectId } : {}),
      ...(fromDate || toDate
        ? {
            date: {
              ...(fromDate ? { gte: new Date(fromDate) } : {}),
              ...(toDate ? { lte: new Date(toDate) } : {}),
            },
          }
        : {}),
    };
    const transactions = await prisma.transaction.findMany({
      where: transactionWhere,
      orderBy: {
        date: "desc",
      },
      include: {
        category: true,
        client: true,
        project: true,
        attachments: true,
      },
    });

    const headers = [
      "Date",
      "Type",
      "Amount",
      "Payment Method",
      "Paid By",
      "Done For",
      "Category",
      "Client",
      "Project",
      "Expense Scope",
      "Billable",
      "Reimbursed",
      "Notes",
      "Receipt Count",
    ];

    const rows = transactions.map((transaction) => [
      formatDate(transaction.date),
      transaction.type,
      Number(transaction.amount),
      transaction.paymentMethod,
      transaction.paidBy || "",
      transaction.doneFor || transaction.title,
      transaction.category?.name || "",
      transaction.client?.name || "",
      transaction.project?.name || "",
      transaction.expenseScope || "",
      transaction.isBillable ? "Yes" : "No",
      transaction.isReimbursed ? "Yes" : "No",
      transaction.notes || "",
      transaction.attachments.length,
    ]);

    const csv = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="uds-transactions-export.csv"`,
      },
    });
  } catch (error) {
    console.error("Transactions export error:", error);

    return NextResponse.json(
      { message: "Failed to export transactions." },
      { status: 500 },
    );
  }
}
