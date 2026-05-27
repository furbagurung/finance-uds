import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

type ClientRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: ClientRouteProps) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: true,
        transactions: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { message: "Client not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error("Client GET error:", error);

    return NextResponse.json(
      { message: "Failed to fetch client." },
      { status: 500 }
    );
  }
}

async function updateClient(request: Request, { params }: ClientRouteProps) {
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
    const companyName = body.companyName
      ? String(body.companyName).trim()
      : null;
    const email = body.email ? String(body.email).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;
    const address = body.address ? String(body.address).trim() : null;
    const status = body.status ? String(body.status).trim() : "active";
    const logoUrl = body.logoUrl ? String(body.logoUrl).trim() : null;
    const website = body.website ? String(body.website).trim() : null;
    const facebookUrl = body.facebookUrl ? String(body.facebookUrl).trim() : null;
    const instagramUrl = body.instagramUrl ? String(body.instagramUrl).trim() : null;
    const tiktokUrl = body.tiktokUrl ? String(body.tiktokUrl).trim() : null;
    const linkedinUrl = body.linkedinUrl ? String(body.linkedinUrl).trim() : null;
    const youtubeUrl = body.youtubeUrl ? String(body.youtubeUrl).trim() : null;
    const industry = body.industry ? String(body.industry).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!name) {
      return NextResponse.json(
        { message: "Client name is required." },
        { status: 400 }
      );
    }

    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json(
        { message: "Client not found." },
        { status: 404 }
      );
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        companyName,
        email,
        phone,
        address,
        status,
        logoUrl,
        website,
        facebookUrl,
        instagramUrl,
        tiktokUrl,
        linkedinUrl,
        youtubeUrl,
        industry,
        notes,
      },
    });

    await createActivityLog({
      action: "UPDATE",
      entity: "CLIENT",
      entityId: client.id,
      userId: user.id,
      message: `Updated client: ${client.name}`,
      metadata: {
        companyName: client.companyName,
        email: client.email,
        phone: client.phone,
        status: client.status,
        website: client.website,
        industry: client.industry,
      },
    });

    return NextResponse.json({
      message: "Client updated successfully.",
      client,
    });
  } catch (error) {
    console.error("Client PATCH error:", error);

    return NextResponse.json(
      { message: "Failed to update client." },
      { status: 500 }
    );
  }
}
export async function PATCH(request: Request, props: ClientRouteProps) {
  return updateClient(request, props);
}

export async function PUT(request: Request, props: ClientRouteProps) {
  return updateClient(request, props);
}
export async function DELETE(
  _request: Request,
  { params }: ClientRouteProps
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

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true,
            transactions: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { message: "Client not found." },
        { status: 404 }
      );
    }

    if (client._count.projects > 0 || client._count.transactions > 0) {
      return NextResponse.json(
        {
          message:
            "This client cannot be deleted because it has linked projects or transactions.",
        },
        { status: 400 }
      );
    }

    await prisma.client.delete({
      where: { id },
    });

    await createActivityLog({
      action: "DELETE",
      entity: "CLIENT",
      entityId: id,
      userId: user.id,
      message: `Deleted client: ${client.name}`,
      metadata: {
        companyName: client.companyName,
      },
    });

    return NextResponse.json({
      message: "Client deleted successfully.",
    });
  } catch (error) {
    console.error("Client DELETE error:", error);

    return NextResponse.json(
      { message: "Failed to delete client." },
      { status: 500 }
    );
  }
}