"use client";

import { ChangeEvent, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BranchSelectField } from "@/components/branch-select-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ClientBranchData = {
  id: string;
  name: string;
  code: string;
  country: string;
  currency: string;
  calendarSystem: string;
  fiscalYearType: string;
};

type ClientFormInitialData = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  website: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  industry: string | null;
  notes: string | null;
  branchId?: string | null;
  branch?: ClientBranchData | null;
};
type CreatedClient = {
  id: string;
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
  industry?: string | null;
  notes?: string | null;
  branchId?: string | null;
  branch?: ClientBranchData | null;
};
type ClientFormProps = {
  initialData?: ClientFormInitialData;

  /**
   * page  = normal full page form
   * modal = form used inside popup modal
   */
  mode?: "page" | "modal";

  /**
   * Runs after successful client creation/update.
   * Useful for closing modal from parent component.
   */
  onSuccess?: () => void;

  /**
   * Runs with the newly created/updated client.
   * Useful for refreshing dropdown and auto-selecting the new client.
   */
  onCreated?: (client: CreatedClient) => void;

  /**
   * Runs when cancel is clicked.
   * Useful for closing modal instead of redirecting.
   */
  onCancel?: () => void;
};
export function ClientForm({
  initialData,
  mode = "page",
  onSuccess,
  onCreated,
  onCancel,
}: ClientFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || "");
  const [companyName, setCompanyName] = useState(initialData?.companyName || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || "");
  const [website, setWebsite] = useState(initialData?.website || "");
  const [facebookUrl, setFacebookUrl] = useState(initialData?.facebookUrl || "");
  const [instagramUrl, setInstagramUrl] = useState(initialData?.instagramUrl || "");
  const [tiktokUrl, setTiktokUrl] = useState(initialData?.tiktokUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedinUrl || "");
  const [youtubeUrl, setYoutubeUrl] = useState(initialData?.youtubeUrl || "");
  const [industry, setIndustry] = useState(initialData?.industry || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [branchId, setBranchId] = useState(initialData?.branchId || "");

  const isEditing = Boolean(initialData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState("");
  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setLogoUploadError("");
    setLogoUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/client-logo", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setLogoUploadError(data.message || "Failed to upload logo.");
        return;
      }

      setLogoUrl(data.file.fileUrl);
    } catch {
      setLogoUploadError("Something went wrong while uploading logo.");
    } finally {
      setLogoUploading(false);
      event.target.value = "";
    }
  }
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        isEditing ? `/api/clients/${initialData?.id}` : "/api/clients",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            companyName,
            email,
            phone,
            address,
            logoUrl,
            website,
            facebookUrl,
            instagramUrl,
            tiktokUrl,
            linkedinUrl,
            youtubeUrl,
            industry,
            notes,
            branchId,
          }),
        });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || `Failed to ${isEditing ? "update" : "create"} client.`);
        return;
      }

     if (mode === "modal") {
  if (data.client) {
    onCreated?.(data.client);
  }

  router.refresh();
  onSuccess?.();
  return;
}
      router.push(isEditing ? `/clients/${initialData?.id}` : "/clients");
      router.refresh();
    } catch {
      setError(`Something went wrong while ${isEditing ? "updating" : "creating"} client.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-xl font-semibold text-slate-950">
          {isEditing ? "Edit Client" : "Add Client"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Update CRM details, contact information, and digital presence."
            : "Create a CRM-style client profile with contact details and digital presence."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Client Identity
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Decor Sign" />
              </div>

              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Decor Sign Pvt. Ltd." />
              </div>

              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Interior / Retail / Beauty" />
              </div>

              <div className="space-y-2">
                <Label>Branch</Label>
                <BranchSelectField
                  value={branchId}
                  onValueChange={setBranchId}
                  placeholder="Select branch"
                  showCurrency
                  allowUnassigned
                  unassignedLabel="Not assigned"
                  triggerClassName="h-10 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Client Logo</Label>

                <div className="flex items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoUrl}
                        alt="Client logo preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-slate-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Upload client logo
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      JPG, PNG, or WEBP. Max 2MB.
                    </p>

                    {logoUploadError ? (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {logoUploadError}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-xl bg-slate-950 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800">
                        {logoUploading ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Uploading
                          </>
                        ) : (
                          <>
                            <ImagePlus className="mr-2 h-3.5 w-3.5" />
                            Choose Logo
                          </>
                        )}

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={logoUploading}
                        />
                      </label>

                      {logoUrl ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setLogoUrl("")}
                          className="h-9 rounded-xl border-slate-200 px-3 text-xs text-slate-600 shadow-none hover:bg-slate-50"
                        >
                          <X className="mr-1.5 h-3.5 w-3.5" />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Contact Details
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" />
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Kathmandu, Nepal" />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Digital Presence
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website URL" />
              <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="Facebook page URL" />
              <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="Instagram URL" />
              <Input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="TikTok URL" />
              <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="LinkedIn URL" />
              <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="YouTube URL" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Service scope, client preferences, billing notes, or social media remarks..."
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (mode === "modal") {
                  onCancel?.();
                  return;
                }

                router.push("/clients");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Client" : "Save Client"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
