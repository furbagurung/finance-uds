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

    const clients = await prisma.client.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            projects: true,
            transactions: true,
          },
        },
      },
    });

    return NextResponse.json({
      clients,
    });
  } catch (error) {
    console.error("Clients GET error:", error);

    return NextResponse.json(
      { message: "Failed to fetch clients." },
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
    const companyName = body.companyName
      ? String(body.companyName).trim()
      : null;
    const email = body.email ? String(body.email).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;
    const address = body.address ? String(body.address).trim() : null;

    if (!name) {
      return NextResponse.json(
        { message: "Client name is required." },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name,
        companyName,
        email,
        phone,
        address,
      },
    });

    return NextResponse.json(
      {
        message: "Client created successfully.",
        client,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Clients POST error:", error);

    return NextResponse.json(
      { message: "Failed to create client." },
      { status: 500 }
    );
  }
}