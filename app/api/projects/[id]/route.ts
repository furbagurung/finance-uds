import { NextResponse } from "next/server";
import { ProjectStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

type ProjectRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: ProjectRouteProps) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        transactions: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Project GET error:", error);

    return NextResponse.json(
      { message: "Failed to fetch project." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: ProjectRouteProps) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const { id } = await params;
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
        { status: 400 }
      );
    }

    if (body.status && !Object.values(ProjectStatus).includes(status)) {
      return NextResponse.json(
        { message: "Invalid project status." },
        { status: 400 }
      );
    }

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 }
      );
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        clientId,
        budget,
        startDate,
        endDate,
        status,
      },
      include: {
        client: true,
      },
    });

    await createActivityLog({
      action: "UPDATE",
      entity: "PROJECT",
      entityId: project.id,
      userId: user.id,
      message: `Updated project: ${project.name}`,
      metadata: {
        clientId: project.clientId,
        clientName: project.client?.name,
        budget: project.budget ? Number(project.budget) : null,
        status: project.status,
      },
    });

    return NextResponse.json({
      message: "Project updated successfully.",
      project,
    });
  } catch (error) {
    console.error("Project PATCH error:", error);

    return NextResponse.json(
      { message: "Failed to update project." },
      { status: 500 }
    );
  }
}
export async function DELETE(
  _request: Request,
  { params }: ProjectRouteProps
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 }
      );
    }

    if (project._count.transactions > 0) {
      return NextResponse.json(
        {
          message:
            "This project cannot be deleted because it has linked transactions.",
        },
        { status: 400 }
      );
    }

    await prisma.project.delete({
      where: { id },
    });

    await createActivityLog({
      action: "DELETE",
      entity: "PROJECT",
      entityId: id,
      userId: user.id,
      message: `Deleted project: ${project.name}`,
      metadata: {
        status: project.status,
        budget: project.budget ? Number(project.budget) : null,
      },
    });

    return NextResponse.json({
      message: "Project deleted successfully.",
    });
  } catch (error) {
    console.error("Project DELETE error:", error);

    return NextResponse.json(
      { message: "Failed to delete project." },
      { status: 500 }
    );
  }
}