import { NextResponse } from "next/server";
import { createActivityLog } from "@/lib/activity-log";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type DeleteAttachmentRouteProps = {
  params: Promise<{
    id: string;
    attachmentId: string;
  }>;
};

export async function DELETE(
  _request: Request,
  { params }: DeleteAttachmentRouteProps
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const { id, attachmentId } = await params;

    const attachment = await prisma.transactionAttachment.findFirst({
      where: {
        id: attachmentId,
        transactionId: id,
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { message: "Attachment not found." },
        { status: 404 }
      );
    }

    await prisma.transactionAttachment.delete({
      where: {
        id: attachment.id,
      },
    });

    await createActivityLog({
      action: "DELETE",
      entity: "ATTACHMENT",
      entityId: attachment.id,
      userId: user.id,
      message: `Deleted attachment: ${attachment.fileName}`,
      metadata: {
        transactionId: id,
        fileUrl: attachment.fileUrl,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
      },
    });

    return NextResponse.json({
      message: "Attachment deleted successfully.",
    });
  } catch (error) {
    console.error("Attachment DELETE error:", error);

    return NextResponse.json(
      { message: "Failed to delete attachment." },
      { status: 500 }
    );
  }
}
