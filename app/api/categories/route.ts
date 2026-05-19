import { NextResponse } from "next/server";
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