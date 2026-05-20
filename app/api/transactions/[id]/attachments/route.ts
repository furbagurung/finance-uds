import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type AttachmentRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: AttachmentRouteProps
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
    const body = await request.json();

    const fileName = String(body.fileName || "").trim();
    const fileUrl = String(body.fileUrl || "").trim();
    const fileType = body.fileType ? String(body.fileType) : null;
    const fileSize = body.fileSize ? Number(body.fileSize) : null;
    const attachmentType = body.attachmentType
      ? String(body.attachmentType)
      : "RECEIPT";

    if (!fileName || !fileUrl) {
      return NextResponse.json(
        { message: "File name and file URL are required." },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: {
        id,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { message: "Transaction not found." },
        { status: 404 }
      );
    }

    const attachment = await prisma.transactionAttachment.create({
      data: {
        transactionId: id,
        fileName,
        fileUrl,
        fileType,
        fileSize,
        attachmentType,
      },
    });

    await createActivityLog({
      action: "UPLOAD",
      entity: "ATTACHMENT",
      entityId: attachment.id,
      userId: user.id,
      message: `Uploaded attachment: ${attachment.fileName}`,
      metadata: {
        transactionId: id,
        fileUrl: attachment.fileUrl,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
      },
    });

    return NextResponse.json(
      {
        message: "Attachment added successfully.",
        attachment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Transaction attachment POST error:", error);

    return NextResponse.json(
      { message: "Failed to add attachment." },
      { status: 500 }
    );
  }
}
