import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

type ClientLogoRouteProps = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(request: Request, { params }: ClientLogoRouteProps) {
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

        const logoUrl = body.logoUrl ? String(body.logoUrl).trim() : null;

        const existingClient = await prisma.client.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                logoUrl: true,
            },
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
                logoUrl,
            },
            select: {
                id: true,
                name: true,
                logoUrl: true,
            },
        });

        await createActivityLog({
            action: "UPDATE",
            entity: "CLIENT",
            entityId: client.id,
            userId: user.id,
            message: logoUrl
                ? `Updated client logo: ${client.name}`
                : `Removed client logo: ${client.name}`,
            metadata: {
                previousLogoUrl: existingClient.logoUrl,
                logoUrl: client.logoUrl,
            },
        });

        return NextResponse.json({
            message: logoUrl
                ? "Client logo updated successfully."
                : "Client logo removed successfully.",
            client,
        });
    } catch (error) {
        console.error("Client logo PATCH error:", error);

        return NextResponse.json(
            { message: "Failed to update client logo." },
            { status: 500 }
        );
    }
}