import { CalendarSystem, FiscalYearType } from "@prisma/client";
import { NextResponse } from "next/server";

import { createActivityLog } from "@/lib/activity-log";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const branchSelect = {
  id: true,
  name: true,
  code: true,
  country: true,
  currency: true,
  calendarSystem: true,
  fiscalYearType: true,
  isActive: true,
};

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 },
      );
    }

    const branches = await prisma.branch.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ name: "asc" }, { code: "asc" }],
      select: branchSelect,
    });

    return NextResponse.json({ branches });
  } catch (error) {
    console.error("Branches GET error:", error);

    return NextResponse.json(
      { message: "Failed to fetch branches." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 },
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only admin users can create branches." },
        { status: 403 },
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const code = String(body.code || "").trim().toUpperCase();
    const country = String(body.country || "").trim();
    const currency = String(body.currency || "").trim().toUpperCase();
    const calendarSystem = body.calendarSystem as CalendarSystem | undefined;
    const fiscalYearType = body.fiscalYearType as FiscalYearType | undefined;

    if (!name || !code || !country || !currency) {
      return NextResponse.json(
        {
          message: "Name, code, country, and currency are required.",
        },
        { status: 400 },
      );
    }

    if (
      !calendarSystem ||
      !Object.values(CalendarSystem).includes(calendarSystem)
    ) {
      return NextResponse.json(
        { message: "Invalid calendar system." },
        { status: 400 },
      );
    }

    if (
      !fiscalYearType ||
      !Object.values(FiscalYearType).includes(fiscalYearType)
    ) {
      return NextResponse.json(
        { message: "Invalid fiscal year type." },
        { status: 400 },
      );
    }

    const existingBranch = await prisma.branch.findUnique({
      where: {
        code,
      },
      select: {
        id: true,
      },
    });

    if (existingBranch) {
      return NextResponse.json(
        { message: "A branch with this code already exists." },
        { status: 400 },
      );
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        code,
        country,
        currency,
        calendarSystem,
        fiscalYearType,
        isActive: true,
      },
      select: branchSelect,
    });

    await createActivityLog({
      action: "CREATE",
      entity: "BRANCH",
      entityId: branch.id,
      userId: user.id,
      message: `Created branch: ${branch.name}`,
      metadata: {
        code: branch.code,
        country: branch.country,
        currency: branch.currency,
        calendarSystem: branch.calendarSystem,
        fiscalYearType: branch.fiscalYearType,
      },
    });

    return NextResponse.json(
      {
        message: "Branch created successfully.",
        branch,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Branches POST error:", error);

    return NextResponse.json(
      { message: "Failed to create branch." },
      { status: 500 },
    );
  }
}
