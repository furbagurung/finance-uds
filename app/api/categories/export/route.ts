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

    const categories = await prisma.category.findMany({
      orderBy: [
        {
          type: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    const headers = ["Name", "Type", "Description", "Default", "Created At"];

    const rows = categories.map((category) => [
      category.name,
      category.type,
      category.description || "",
      category.isDefault ? "Yes" : "No",
      formatDate(category.createdAt),
    ]);

    const csv = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="uds-categories-export.csv"`,
      },
    });
  } catch (error) {
    console.error("Categories export error:", error);

    return NextResponse.json(
      { message: "Failed to export categories." },
      { status: 500 },
    );
  }
}
