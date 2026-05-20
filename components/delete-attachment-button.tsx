"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type DeleteAttachmentButtonProps = {
  transactionId: string;
  attachmentId: string;
};

export function DeleteAttachmentButton({
  transactionId,
  attachmentId,
}: DeleteAttachmentButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this receipt/invoice from the transaction?"
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/transactions/${transactionId}/attachments/${attachmentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || "Failed to delete attachment.");
        return;
      }

      router.refresh();
    } catch {
      alert("Something went wrong while deleting attachment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? "Deleting..." : "Delete"}
    </Button>
  );
}