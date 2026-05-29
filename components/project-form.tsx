"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  companyName?: string | null;
};

type ProjectStatus = "ACTIVE" | "COMPLETED" | "ON_HOLD" | "CANCELLED";

const projectStatuses: ProjectStatus[] = [
  "ACTIVE",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
];

type CreatedProject = {
  id: string;
  name: string;
  clientId?: string | null;
  client?: Client | null;
};

type ProjectFormProps = {
  mode?: "page" | "modal";

  /**
   * Preselects client when creating project from transaction form.
   */
  defaultClientId?: string;

  onSuccess?: () => void;

  /**
   * Runs with the newly created project.
   * Useful for refreshing dropdown and auto-selecting the new project.
   */
  onCreated?: (project: CreatedProject) => void;

  onCancel?: () => void;
};

export function ProjectForm({
  mode = "page",
  defaultClientId = "",
  onSuccess,
  onCreated,
  onCancel,
}: ProjectFormProps) {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState(defaultClientId);
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("ACTIVE");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadClients() {
      const response = await fetch("/api/clients");
      const data = await response.json();

      if (response.ok) {
        setClients(data.clients || []);
      }
    }

    loadClients();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          clientId: clientId || null,
          budget: budget ? Number(budget) : null,
          startDate: startDate || null,
          endDate: endDate || null,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create project.");
        return;
      }

      if (mode === "modal") {
        if (data.project) {
          onCreated?.(data.project);
        }

        router.refresh();
        onSuccess?.();
        return;
      }

      router.push("/projects");
      router.refresh();
    } catch {
      setError("Something went wrong while creating project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Project</CardTitle>
        <CardDescription>
          Create a project and link it with a client for billing and expense
          tracking.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Project Name</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Decor Sign Website"
            />
          </div>

          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.companyName || client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Budget</Label>
              <Input
                type="number"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="50000"
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
              onClick={() => {
                if (mode === "modal") {
                  onCancel?.();
                  return;
                }

                router.push("/projects");
              }}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Project"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}