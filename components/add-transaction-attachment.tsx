"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AddTransactionAttachmentProps = {
  transactionId: string;
};

export function AddTransactionAttachment({
  transactionId,
}: AddTransactionAttachmentProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) {
      alert("Please select a receipt or invoice file first.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/uploads/receipts", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        alert(uploadData.message || "File upload failed.");
        return;
      }

      const attachResponse = await fetch(
        `/api/transactions/${transactionId}/attachments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(uploadData.file),
        }
      );

      const attachData = await attachResponse.json();

      if (!attachResponse.ok) {
        alert(attachData.message || "Failed to attach file.");
        return;
      }

      setFile(null);
      router.refresh();
    } catch {
      alert("Something went wrong while uploading attachment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
      <Input
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp"
        onChange={(event) => setFile(event.target.files?.[0] || null)}
      />

      <Button type="button" onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload File"}
      </Button>
    </div>
  );
}