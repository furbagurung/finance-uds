import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { createActivityLog } from "@/lib/activity-log";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type UserRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: UserRouteProps) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only admin users can view user details." },
        { status: 403 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("User GET error:", error);

    return NextResponse.json(
      { message: "Failed to fetch user." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: UserRouteProps) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only admin users can update users." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const name = String(body.name || "").trim();
    const role = body.role ? (body.role as Role) : Role.STAFF;
    const isActive = Boolean(body.isActive);

    if (!name) {
      return NextResponse.json(
        { message: "Name is required." },
        { status: 400 }
      );
    }

    if (!Object.values(Role).includes(role)) {
      return NextResponse.json(
        { message: "Invalid user role." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    const adminCount = await prisma.user.count({
      where: {
        role: Role.ADMIN,
        isActive: true,
      },
    });

    if (
      existingUser.role === Role.ADMIN &&
      existingUser.isActive &&
      (role !== Role.ADMIN || !isActive) &&
      adminCount <= 1
    ) {
      return NextResponse.json(
        {
          message:
            "You cannot deactivate or demote the last active admin account.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        role,
        isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await createActivityLog({
      action: "UPDATE",
      entity: "USER",
      entityId: user.id,
      userId: currentUser.id,
      message: `Updated user: ${user.name}`,
      metadata: {
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });

    return NextResponse.json({
      message: "User updated successfully.",
      user,
    });
  } catch (error) {
    console.error("User PATCH error:", error);

    return NextResponse.json(
      { message: "Failed to update user." },
      { status: 500 }
    );
  }
}
