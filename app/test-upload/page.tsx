"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UploadedFile = {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
};

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setMessage("Please select a receipt or invoice file.");
      return;
    }

    setLoading(true);
    setMessage("");
    setUploadedFile(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/uploads/receipts", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Upload failed.");
        return;
      }

      setUploadedFile(data.file);
      setMessage(data.message || "File uploaded successfully.");
    } catch {
      setMessage("Something went wrong while uploading.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Receipt / Invoice Upload Test</CardTitle>
          <CardDescription>
            Upload a PDF, JPG, PNG, or WEBP file to test the receipt upload API.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpload} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt or invoice</Label>
              <Input
                id="receipt"
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  setFile(event.target.files?.[0] || null);
                }}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Uploading..." : "Upload File"}
            </Button>

            {message ? (
              <p className="text-sm text-slate-700">{message}</p>
            ) : null}

            {uploadedFile ? (
              <div className="rounded-xl border bg-slate-50 p-4 text-sm">
                <p>
                  <strong>File Name:</strong> {uploadedFile.fileName}
                </p>
                <p>
                  <strong>File Type:</strong> {uploadedFile.fileType}
                </p>
                <p>
                  <strong>File Size:</strong> {uploadedFile.fileSize} bytes
                </p>
                <a
                  href={uploadedFile.fileUrl}
                  target="_blank"
                  className="mt-3 inline-block font-medium text-orange-600 hover:underline"
                >
                  View uploaded file
                </a>
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}