import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CreateActivityLogInput = {
  action: "CREATE" | "UPDATE" | "DELETE" | "UPLOAD" | "LOGIN" | "LOGOUT";
  entity: "TRANSACTION" | "CLIENT" | "PROJECT" | "CATEGORY" | "USER" | "ATTACHMENT" | "AUTH";
  entityId?: string | null;
  message: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

function toJsonValue(value: unknown): Prisma.InputJsonValue | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();

  if (
    typeof value === "string" ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item) ?? null);
  }

  if (typeof value === "object") {
    const entries: [string, Prisma.InputJsonValue | null][] = [];

    for (const [key, nestedValue] of Object.entries(value)) {
      const jsonValue = toJsonValue(nestedValue);

      if (jsonValue !== undefined) {
        entries.push([key, jsonValue]);
      }
    }

    return Object.fromEntries(entries) as Prisma.InputJsonObject;
  }

  return String(value);
}

export async function createActivityLog({
  action,
  entity,
  entityId = null,
  message,
  userId = null,
  metadata,
}: CreateActivityLogInput) {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        entity,
        entityId,
        message,
        userId,
        metadata: metadata
          ? (toJsonValue(metadata) as Prisma.InputJsonValue)
          : undefined,
      },
    });
  } catch (error) {
    console.error("Activity log error:", error);
  }
}
