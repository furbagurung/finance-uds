import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

const clientBranchSelect = {
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

    const clients = await prisma.client.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        branch: {
          select: clientBranchSelect,
        },
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
    const companyName = body.companyName
      ? String(body.companyName).trim()
      : null;
    const email = body.email ? String(body.email).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;
    const address = body.address ? String(body.address).trim() : null;
    const logoUrl = body.logoUrl ? String(body.logoUrl).trim() : null;
    const website = body.website ? String(body.website).trim() : null;
    const facebookUrl = body.facebookUrl ? String(body.facebookUrl).trim() : null;
    const instagramUrl = body.instagramUrl ? String(body.instagramUrl).trim() : null;
    const tiktokUrl = body.tiktokUrl ? String(body.tiktokUrl).trim() : null;
    const linkedinUrl = body.linkedinUrl ? String(body.linkedinUrl).trim() : null;
    const youtubeUrl = body.youtubeUrl ? String(body.youtubeUrl).trim() : null;
    const industry = body.industry ? String(body.industry).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;
    const branchIdValue =
      body.branchId === "" ||
      body.branchId === null ||
      body.branchId === undefined
        ? null
        : String(body.branchId).trim();
    const branchId = branchIdValue || null;

    if (!name) {
      return NextResponse.json(
        { message: "Client name is required." },
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

    const client = await prisma.client.create({
      data: {
        name,
        companyName,
        email,
        phone,
        address,
        logoUrl,
        website,
        facebookUrl,
        instagramUrl,
        tiktokUrl,
        linkedinUrl,
        youtubeUrl,
        industry,
        notes,
        branchId,
        createdById: user.id,
      },
      include: {
        branch: {
          select: clientBranchSelect,
        },
      },
    });

    await createActivityLog({
      action: "CREATE",
      entity: "CLIENT",
      entityId: client.id,
      userId: user.id,
      message: `Created client: ${client.name}`,
      metadata: {
        companyName: client.companyName,
        email: client.email,
        phone: client.phone,
        website: client.website,
        industry: client.industry,
        branchId: client.branchId,
        branchName: client.branch?.name,
      },
    });

    return NextResponse.json(
      {
        message: "Client created successfully.",
        client,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Clients POST error:", error);

    return NextResponse.json(
      { message: "Failed to create client." },
      { status: 500 },
    );
  }
}
