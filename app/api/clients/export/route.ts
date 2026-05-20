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

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 },
      );
    }

    const clients = await prisma.client.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            projects: true,
            transactions: true,
          },
        },
      },
    });

    const headers = [
      "Client Name",
      "Company Name",
      "Email",
      "Phone",
      "Address",
      "Status",
      "Projects Count",
      "Transactions Count",
      "Created By",
      "Created At",
    ];

    const rows = clients.map((client) => [
      client.name,
      client.companyName || "",
      client.email || "",
      client.phone || "",
      client.address || "",
      client.status,
      client._count.projects,
      client._count.transactions,
      client.createdBy?.name || "",
      formatDate(client.createdAt),
    ]);

    const csv = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="uds-clients-export.csv"`,
      },
    });
  } catch (error) {
    console.error("Clients export error:", error);

    return NextResponse.json(
      { message: "Failed to export clients." },
      { status: 500 },
    );
  }
}
