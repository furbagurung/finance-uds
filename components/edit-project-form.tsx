"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BranchSelectField,
  type BranchOption,
} from "@/components/branch-select-field";
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
type ProjectType = "MONTHLY_RETAINER" | "ONE_TIME" | "ONGOING" | "INTERNAL";
type BillingCycle = "NONE" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONE_TIME";

type Project = {
  id: string;
  name: string;
  budget: unknown;
  startDate: Date | null;
  endDate: Date | null;
  status: ProjectStatus;
  projectType: ProjectType;
  billingCycle: BillingCycle;
  monthlyRetainerAmount: unknown;
  projectValue: unknown;
  currency: string | null;
  billingStartDate: Date | null;
  billingEndDate: Date | null;
  nextBillingDate: Date | null;
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

const projectTypes: ProjectType[] = [
  "MONTHLY_RETAINER",
  "ONE_TIME",
  "ONGOING",
  "INTERNAL",
];

const billingCycles: BillingCycle[] = [
  "NONE",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
  "ONE_TIME",
];

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function EditProjectForm({ project, clients }: EditProjectFormProps) {
  const router = useRouter();

  const [branches, setBranches] = useState<BranchOption[]>([]);
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
  const [projectType, setProjectType] = useState<ProjectType>(
    project.projectType || "ONE_TIME"
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    project.billingCycle || "ONE_TIME"
  );
  const [monthlyRetainerAmount, setMonthlyRetainerAmount] = useState(
    project.monthlyRetainerAmount ? String(project.monthlyRetainerAmount) : ""
  );
  const [projectValue, setProjectValue] = useState(
    project.projectValue ? String(project.projectValue) : ""
  );
  const [currency, setCurrency] = useState(project.currency || "");
  const [billingStartDate, setBillingStartDate] = useState(
    toDateInputValue(project.billingStartDate)
  );
  const [billingEndDate, setBillingEndDate] = useState(
    toDateInputValue(project.billingEndDate)
  );
  const [nextBillingDate, setNextBillingDate] = useState(
    toDateInputValue(project.nextBillingDate)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadBranches() {
      const response = await fetch("/api/branches");
      const data = await response.json();

      if (!ignore && response.ok) {
        setBranches(data.branches || []);
      }
    }

    loadBranches();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (branchTouched || branchId || clientId === "NONE") return;

    const selectedClient = clients.find((client) => client.id === clientId);

    if (selectedClient?.branchId) {
      setBranchId(selectedClient.branchId);
    }
  }, [branchId, branchTouched, clientId, clients]);

  useEffect(() => {
    if (!branchId || currency) return;

    const selectedBranch = branches.find((branch) => branch.id === branchId);

    if (selectedBranch?.currency) {
      setCurrency(selectedBranch.currency);
    }
  }, [branchId, branches, currency]);

  function handleClientChange(nextClientId: string) {
    setClientId(nextClientId);
  }

  function handleBranchChange(nextBranchId: string) {
    setBranchTouched(true);
    setBranchId(nextBranchId);

    const selectedBranch = branches.find((branch) => branch.id === nextBranchId);

    if (!currency && selectedBranch?.currency) {
      setCurrency(selectedBranch.currency);
    }
  }

  function handleProjectTypeChange(nextProjectType: ProjectType) {
    setProjectType(nextProjectType);

    if (nextProjectType === "MONTHLY_RETAINER") {
      setBillingCycle("MONTHLY");
      return;
    }

    if (nextProjectType === "ONE_TIME") {
      setBillingCycle("ONE_TIME");
    }

    setMonthlyRetainerAmount("");
    setNextBillingDate("");
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
          projectType,
          billingCycle,
          monthlyRetainerAmount: projectType === "MONTHLY_RETAINER" && monthlyRetainerAmount
            ? Number(monthlyRetainerAmount)
            : null,
          projectValue:
            projectType !== "INTERNAL" && projectValue
              ? Number(projectValue)
              : null,
          currency: currency || null,
          billingStartDate: billingStartDate || null,
          billingEndDate: billingEndDate || null,
          nextBillingDate:
            projectType === "MONTHLY_RETAINER" ? nextBillingDate || null : null,
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
              branches={branches}
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

          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                Billing Setup
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Project Type</Label>
                <Select
                  value={projectType}
                  onValueChange={(value) =>
                    handleProjectTypeChange(value as ProjectType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select
                  value={billingCycle}
                  onValueChange={(value) =>
                    setBillingCycle(value as BillingCycle)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select billing cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {billingCycles.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {projectType === "MONTHLY_RETAINER" ? (
                <div className="space-y-2">
                  <Label>Monthly Retainer Amount</Label>
                  <Input
                    type="number"
                    value={monthlyRetainerAmount}
                    onChange={(event) =>
                      setMonthlyRetainerAmount(event.target.value)
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
              ) : null}

              {projectType !== "INTERNAL" ? (
                <div className="space-y-2">
                  <Label>Project Value</Label>
                  <Input
                    type="number"
                    value={projectValue}
                    onChange={(event) => setProjectValue(event.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Currency</Label>
                <Input
                  value={currency}
                  onChange={(event) =>
                    setCurrency(event.target.value.toUpperCase())
                  }
                  placeholder="NPR"
                />
              </div>

              <div className="space-y-2">
                <Label>Billing Start Date</Label>
                <Input
                  type="date"
                  value={billingStartDate}
                  onChange={(event) => setBillingStartDate(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Billing End Date</Label>
                <Input
                  type="date"
                  value={billingEndDate}
                  onChange={(event) => setBillingEndDate(event.target.value)}
                />
              </div>

              {projectType === "MONTHLY_RETAINER" ? (
                <div className="space-y-2">
                  <Label>Next Billing Date</Label>
                  <Input
                    type="date"
                    value={nextBillingDate}
                    onChange={(event) => setNextBillingDate(event.target.value)}
                  />
                </div>
              ) : null}
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
