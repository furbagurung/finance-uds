import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
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

    return NextResponse.json({
      categories,
    });
  } catch (error) {
    console.error("Categories GET error:", error);

    return NextResponse.json(
      { message: "Failed to fetch categories." },
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

    const name = String(body.name || "").trim();
    const type = String(body.type || "") as TransactionType;
    const description = body.description
      ? String(body.description).trim()
      : null;

    if (!name) {
      return NextResponse.json(
        { message: "Category name is required." },
        { status: 400 }
      );
    }

    if (!Object.values(TransactionType).includes(type)) {
      return NextResponse.json(
        { message: "Invalid category type." },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        description,
        isDefault: false,
      },
    });

    await createActivityLog({
      action: "CREATE",
      entity: "CATEGORY",
      entityId: category.id,
      userId: user.id,
      message: `Created category: ${category.name}`,
      metadata: {
        type: category.type,
        description: category.description,
      },
    });

    return NextResponse.json(
      {
        message: "Category created successfully.",
        category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Categories POST error:", error);

    return NextResponse.json(
      { message: "Failed to create category." },
      { status: 500 }
    );
  }
}
