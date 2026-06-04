"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BranchSelectField } from "@/components/branch-select-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Client = {
  id: string;
  name: string;
  companyName: string | null;
  branchId?: string | null;
};

type ProjectStatus = "ACTIVE" | "COMPLETED" | "ON_HOLD" | "CANCELLED";

type Project = {
  id: string;
  name: string;
  budget: unknown;
  startDate: Date | null;
  endDate: Date | null;
  status: ProjectStatus;
  clientId: string | null;
  branchId: string | null;
};

type EditProjectFormProps = {
  project: Project;
  clients: Client[];
};

const projectStatuses: ProjectStatus[] = [
  "ACTIVE",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
];

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function EditProjectForm({ project, clients }: EditProjectFormProps) {
  const router = useRouter();

  const [name, setName] = useState(project.name || "");
  const [clientId, setClientId] = useState(project.clientId || "NONE");
  const [budget, setBudget] = useState(
    project.budget ? String(project.budget) : ""
  );
  const [startDate, setStartDate] = useState(
    toDateInputValue(project.startDate)
  );
  const [endDate, setEndDate] = useState(toDateInputValue(project.endDate));
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [branchId, setBranchId] = useState(project.branchId || "");
  const [branchTouched, setBranchTouched] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (branchTouched || branchId || clientId === "NONE") return;

    const selectedClient = clients.find((client) => client.id === clientId);

    if (selectedClient?.branchId) {
      setBranchId(selectedClient.branchId);
    }
  }, [branchId, branchTouched, clientId, clients]);

  function handleClientChange(nextClientId: string) {
    setClientId(nextClientId);
  }

  function handleBranchChange(nextBranchId: string) {
    setBranchTouched(true);
    setBranchId(nextBranchId);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          clientId: clientId === "NONE" ? null : clientId,
          budget: budget ? Number(budget) : null,
          startDate: startDate || null,
          endDate: endDate || null,
          branchId,
          branchIdTouched: branchTouched,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update project.");
        return;
      }

      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong while updating project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Project</CardTitle>
        <CardDescription>
          Update project details, client, budget, timeline, and status.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Project Name</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={handleClientChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">No Client</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.companyName || client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Branch</Label>
            <BranchSelectField
              value={branchId}
              onValueChange={handleBranchChange}
              placeholder="Select branch"
              showCurrency
              allowUnassigned
              unassignedLabel="Not assigned"
              triggerClassName="h-10 w-full"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Budget</Label>
              <Input
                type="number"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as ProjectStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
