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

function formatDate(date: Date | null) {
  if (!date) return "";
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

    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        client: true,
        createdBy: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    const headers = [
      "Project Name",
      "Client",
      "Budget",
      "Start Date",
      "End Date",
      "Status",
      "Transactions Count",
      "Created By",
      "Created At",
    ];

    const rows = projects.map((project) => [
      project.name,
      project.client?.name || "",
      project.budget ? Number(project.budget) : "",
      formatDate(project.startDate),
      formatDate(project.endDate),
      project.status,
      project._count.transactions,
      project.createdBy?.name || "",
      formatDate(project.createdAt),
    ]);

    const csv = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="uds-projects-export.csv"`,
      },
    });
  } catch (error) {
    console.error("Projects export error:", error);

    return NextResponse.json(
      { message: "Failed to export projects." },
      { status: 500 },
    );
  }
}
