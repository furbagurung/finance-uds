import { NextResponse } from "next/server";
import { ProjectStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

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
    const project = await prisma.project.create({
      data: {
        name,
        budget,
        startDate,
        endDate,
        status,
        clientId,
        createdById: user.id,
      },
      include: {
        client: true,
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
