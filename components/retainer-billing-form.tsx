"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";

type ProjectOption = {
  id: string;
  name: string;
  projectType: string;
  monthlyRetainerAmount?: string | number | null;
  currency?: string | null;
  clientId?: string | null;
  client?: {
    name?: string | null;
    companyName?: string | null;
  } | null;
  branchId?: string | null;
  branch?: {
    name?: string | null;
    currency?: string | null;
  } | null;
};

type RetainerBillingFormProps = {
  mode?: "page" | "modal";
  onSuccess?: () => void;
  onCancel?: () => void;
};

const monthOptions = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function formatMoney(amount: number, currency?: string | null) {
  const currencyCode = currency || "NPR";

  try {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toLocaleString("en-IN")}`;
  }
}

function getCurrentYearOptions() {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 5 }, (_, index) => String(currentYear - 2 + index));
}

export function RetainerBillingForm({
  mode = "page",
  onSuccess,
  onCancel,
}: RetainerBillingFormProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [expectedAmount, setExpectedAmount] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadProjects() {
      const response = await fetch("/api/projects");
      const data = await response.json();

      if (!ignore && response.ok) {
        setProjects(data.projects || []);
      }
    }

    loadProjects();

    return () => {
      ignore = true;
    };
  }, []);

  const monthlyRetainerProjects = useMemo(
    () =>
      projects.filter((project) => project.projectType === "MONTHLY_RETAINER"),
    [projects],
  );
  const selectedProject =
    monthlyRetainerProjects.find((project) => project.id === projectId) || null;
  const pendingAmount = Math.max(
    Number(expectedAmount || 0) - Number(receivedAmount || 0),
    0,
  );
  const selectedCurrency =
    selectedProject?.currency || selectedProject?.branch?.currency || "NPR";

  function handleProjectChange(nextProjectId: string) {
    setProjectId(nextProjectId);

    const project =
      monthlyRetainerProjects.find((item) => item.id === nextProjectId) || null;

    if (project?.monthlyRetainerAmount) {
      setExpectedAmount(String(project.monthlyRetainerAmount));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/retainer-billings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          month: Number(month),
          year: Number(year),
          expectedAmount: expectedAmount ? Number(expectedAmount) : null,
          receivedAmount: receivedAmount ? Number(receivedAmount) : 0,
          dueDate: dueDate || null,
          notes: notes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create retainer billing.");
        return;
      }

      if (mode === "modal") {
        router.refresh();
        onSuccess?.();
        return;
      }

      router.push("/retainers");
      router.refresh();
    } catch {
      setError("Something went wrong while creating retainer billing.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Retainer Billing</CardTitle>
        <CardDescription>
          Add a monthly billing record for a retainer project.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={handleProjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select monthly retainer project" />
              </SelectTrigger>
              <SelectContent>
                {monthlyRetainerProjects.length === 0 ? (
                  <SelectItem value="__empty" disabled>
                    No monthly retainer projects found
                  </SelectItem>
                ) : null}
                {monthlyRetainerProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProject ? (
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm md:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Client
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {selectedProject.client?.companyName ||
                    selectedProject.client?.name ||
                    "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Branch
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {selectedProject.branch?.name || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Currency
                </p>
                <p className="mt-1 font-medium text-slate-900">
                  {selectedCurrency}
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {getCurrentYearOptions().map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Expected Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={expectedAmount}
                onChange={(event) => setExpectedAmount(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Received Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={receivedAmount}
                onChange={(event) => setReceivedAmount(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Pending Amount</Label>
              <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900">
                {formatMoney(pendingAmount, selectedCurrency)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-20"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
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

                router.push("/retainers");
              }}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Billing"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
