"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";

type ClientLogoUploaderProps = {
    clientId: string;
    clientName: string;
    initials: string;
    logoUrl?: string | null;
    avatarBg: string;
    avatarText: string;
};

export function ClientLogoUploader({
    clientId,
    clientName,
    initials,
    logoUrl,
    avatarBg,
    avatarText,
}: ClientLogoUploaderProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [currentLogoUrl, setCurrentLogoUrl] = useState(logoUrl || "");
    const [isUploading, setIsUploading] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function updateClientLogo(nextLogoUrl: string | null) {
        const response = await fetch(`/api/clients/${clientId}/logo`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                logoUrl: nextLogoUrl,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to update client logo.");
        }

        // Instantly update the UI without waiting for server refresh.
        setCurrentLogoUrl(
            nextLogoUrl ? `${nextLogoUrl}?v=${Date.now()}` : ""
        );

        router.refresh();
    }
    async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) return;

        setErrorMessage("");
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const uploadResponse = await fetch("/api/upload/client-logo", {
                method: "POST",
                body: formData,
            });

            const uploadData = await uploadResponse.json();

            if (!uploadResponse.ok) {
                throw new Error(uploadData.message || "Failed to upload logo.");
            }
            const uploadedLogoUrl =
                uploadData.file?.fileUrl ||
                uploadData.fileUrl ||
                uploadData.url ||
                uploadData.filePath ||
                "";

            if (!uploadedLogoUrl) {
                console.error("Client logo upload response:", uploadData);
                throw new Error("Logo uploaded, but the file URL was not returned.");
            }

            await updateClientLogo(uploadedLogoUrl);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while uploading the logo."
            );
        } finally {
            setIsUploading(false);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }

    async function handleRemoveLogo() {
        setErrorMessage("");
        setIsRemoving(true);

        try {
            await updateClientLogo(null);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while removing the logo."
            );
        } finally {
            setIsRemoving(false);
        }
    }

    const isBusy = isUploading || isRemoving;

    return (
        <div className="absolute left-6 -bottom-12 z-30">
            {/* CLIENT PROFILE LOGO UPLOADER
          Edit this component if you want to change logo size, upload overlay, or remove button behavior.
      */}
            <div
                className="group relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-[5px] border-white shadow-xl shadow-slate-900/20 ring-1 ring-white/80"
                style={{
                    backgroundColor: currentLogoUrl ? undefined : avatarBg,
                    color: avatarText,
                }}
            >
                {currentLogoUrl ? (
                    <Image
                        src={currentLogoUrl}
                        alt={`${clientName} logo`}
                        fill
                        sizes="112px"
                        className="object-cover"
                        unoptimized
                    />
                ) : (
                    <span className="text-4xl font-black tracking-tight">
                        {initials}
                    </span>
                )}

                <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/45 group-hover:opacity-100 disabled:cursor-not-allowed"
                    aria-label="Upload client logo"
                    title="Upload client logo"
                >
                    {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Camera className="h-5 w-5" />
                    )}
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleLogoUpload}
                />
            </div>

            {currentLogoUrl ? (
                <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleRemoveLogo}
                    className="absolute -right-2 -bottom-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-100 bg-white text-red-600 shadow-md shadow-slate-900/10 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Remove client logo"
                    title="Remove client logo"
                >
                    {isRemoving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                    )}
                </button>
            ) : null}

            {errorMessage ? (
                <p className="mt-2 max-w-[220px] rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
                    {errorMessage}
                </p>
            ) : null}
        </div>
    );
}