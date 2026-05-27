import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createActivityLog } from "@/lib/activity-log";

type CoverThemeRouteProps = {
    params: Promise<{
        id: string;
    }>;
};

const allowedThemes = [
    "auto",
    "purple",
    "emerald",
    "ocean",
    "amber",
    "rose",
    "slate",
];

export async function PATCH(
    request: Request,
    { params }: CoverThemeRouteProps,
) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { message: "Not authenticated." },
                { status: 401 },
            );
        }

        const { id } = await params;
        const body = await request.json();

        const coverTheme = String(body.coverTheme || "auto").trim();

        if (!allowedThemes.includes(coverTheme)) {
            return NextResponse.json(
                { message: "Invalid cover theme." },
                { status: 400 },
            );
        }

        const existingClient = await prisma.client.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
            },
        });

        if (!existingClient) {
            return NextResponse.json(
                { message: "Client not found." },
                { status: 404 },
            );
        }

        const client = await prisma.client.update({
            where: { id },
            data: {
                coverTheme,
            },
        });

        await createActivityLog({
            action: "UPDATE",
            entity: "CLIENT",
            entityId: client.id,
            userId: user.id,
            message: `Updated client cover theme: ${client.name}`,
            metadata: {
                coverTheme,
            },
        });

        return NextResponse.json({
            message: "Cover theme updated successfully.",
            client,
        });
    } catch (error) {
        console.error("Client cover theme PATCH error:", error);

        return NextResponse.json(
            { message: "Failed to update cover theme." },
            { status: 500 },
        );
    }
}