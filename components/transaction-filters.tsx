"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
};

type Project = {
  id: string;
  name: string;
  clientId: string | null;
};

type TransactionFiltersProps = {
  clients: Client[];
  projects: Project[];
  selectedType: string;
  selectedClientId: string;
  selectedProjectId: string;
  fromDate: string;
  toDate: string;
};

export function TransactionFilters({
  clients,
  projects,
  selectedType,
  selectedClientId,
  selectedProjectId,
  fromDate,
  toDate,
}: TransactionFiltersProps) {
  const router = useRouter();

  const [type, setType] = useState(selectedType || "ALL");
  const [clientId, setClientId] = useState(selectedClientId || "ALL");
  const [projectId, setProjectId] = useState(selectedProjectId || "ALL");
  const [from, setFrom] = useState(fromDate);
  const [to, setTo] = useState(toDate);

  const filteredProjects =
    clientId === "ALL"
      ? projects
      : projects.filter((project) => project.clientId === clientId);

  function applyFilters() {
    const params = new URLSearchParams();

    if (type !== "ALL") params.set("type", type);
    if (clientId !== "ALL") params.set("clientId", clientId);
    if (projectId !== "ALL") params.set("projectId", projectId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const query = params.toString();

    router.push(query ? `/transactions?${query}` : "/transactions");
  }

  function clearFilters() {
    setType("ALL");
    setClientId("ALL");
    setProjectId("ALL");
    setFrom("");
    setTo("");

    router.push("/transactions");
  }

  function handleClientChange(value: string) {
    setClientId(value);
    setProjectId("ALL");
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Type</label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="INVESTMENT">Investment</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Client</label>
        <Select value={clientId} onValueChange={handleClientChange}>
          <SelectTrigger>
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.companyName || client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Project</label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger>
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Projects</SelectItem>
            {filteredProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">From</label>
        <Input
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">To</label>
        <Input
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </div>

      <div className="flex items-end gap-2">
        <Button type="button" className="w-full" onClick={applyFilters}>
          Apply
        </Button>
      </div>

      <div className="md:col-span-2 xl:col-span-6">
        <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}