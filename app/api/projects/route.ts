import { NextResponse } from "next/server";
import { ProjectStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

const projectBranchSelect = {
  id: true,
  name: true,
  code: true,
  country: true,
  currency: true,
  calendarSystem: true,
  fiscalYearType: true,
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

    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        branch: {
          select: projectBranchSelect,
        },
        client: {
          include: {
            branch: {
              select: projectBranchSelect,
            },
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    return NextResponse.json({
      projects,
    });
  } catch (error) {
    console.error("Projects GET error:", error);

    return NextResponse.json(
      { message: "Failed to fetch projects." },
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

    const body = await request.json();

    const name = String(body.name || "").trim();
    const clientId = body.clientId ? String(body.clientId) : null;
    const budget = body.budget ? Number(body.budget) : null;
    const startDate = body.startDate ? new Date(body.startDate) : null;
    const endDate = body.endDate ? new Date(body.endDate) : null;
    const branchIdValue =
      body.branchId === "" ||
      body.branchId === null ||
      body.branchId === undefined
        ? null
        : String(body.branchId).trim();
    const branchId = branchIdValue || null;
    const branchIdTouched = Boolean(body.branchIdTouched);
    const status = body.status
      ? (body.status as ProjectStatus)
      : ProjectStatus.ACTIVE;

    if (!name) {
      return NextResponse.json(
        { message: "Project name is required." },
        { status: 400 },
      );
    }

    if (body.status && !Object.values(ProjectStatus).includes(status)) {
      return NextResponse.json(
        { message: "Invalid project status." },
        { status: 400 },
      );
    }

    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: {
          id: branchId,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (!branch) {
        return NextResponse.json(
          { message: "Selected branch was not found or is inactive." },
          { status: 400 },
        );
      }
    }

    const client = clientId
      ? await prisma.client.findUnique({
          where: {
            id: clientId,
          },
          select: {
            branchId: true,
            branch: {
              select: {
                id: true,
                isActive: true,
              },
            },
          },
        })
      : null;

    const resolvedBranchId =
      branchId ||
      (!branchIdTouched && client?.branch?.isActive ? client.branchId : null);

    const project = await prisma.project.create({
      data: {
        name,
        budget,
        startDate,
        endDate,
        status,
        clientId,
        branchId: resolvedBranchId,
        createdById: user.id,
      },
      include: {
        branch: {
          select: projectBranchSelect,
        },
        client: {
          include: {
            branch: {
              select: projectBranchSelect,
            },
          },
        },
      },
    });

    await createActivityLog({
      action: "CREATE",
      entity: "PROJECT",
      entityId: project.id,
      userId: user.id,
      message: `Created project: ${project.name}`,
      metadata: {
        clientId: project.clientId,
        clientName: project.client?.name,
        branchId: project.branchId,
        branchName: project.branch?.name,
        budget: project.budget ? Number(project.budget) : null,
        status: project.status,
      },
    });

    return NextResponse.json(
      {
        message: "Project created successfully.",
        project,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Projects POST error:", error);

    return NextResponse.json(
      { message: "Failed to create project." },
      { status: 500 },
    );
  }
}
