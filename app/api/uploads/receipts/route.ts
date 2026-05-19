import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/current-user";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "File is required." },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Only JPG, PNG, WEBP, and PDF files are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "File size must be less than 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "receipts");
    await mkdir(uploadDir, { recursive: true });

    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const fileName = `${Date.now()}-${originalName}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      message: "File uploaded successfully.",
      file: {
        fileName,
        fileUrl: `/uploads/receipts/${fileName}`,
        fileType: file.type,
        fileSize: file.size,
      },
    });
  } catch (error) {
    console.error("Receipt upload error:", error);

    return NextResponse.json(
      { message: "Failed to upload file." },
      { status: 500 }
    );
  }
}