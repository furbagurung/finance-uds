"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, RotateCcw, Search } from "lucide-react";

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

const transactionTypes = [
  { label: "All", value: "ALL" },
  { label: "Income", value: "INCOME" },
  { label: "Expense", value: "EXPENSE" },
  { label: "Investment", value: "INVESTMENT" },
  { label: "Withdrawal", value: "WITHDRAWAL" },
];

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
  const [search, setSearch] = useState("");

  const filteredProjects =
    clientId === "ALL"
      ? projects
      : projects.filter((project) => project.clientId === clientId);

  const hasActiveFilters =
    type !== "ALL" || clientId !== "ALL" || projectId !== "ALL" || from || to;

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
    setSearch("");
    router.push("/transactions");
  }

  function handleClientChange(value: string) {
    setClientId(value);
    setProjectId("ALL");
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search transaction, client, source..."
            className="h-11 rounded-2xl border-slate-200 bg-slate-50/70 pl-10 text-sm shadow-none placeholder:text-slate-400 xl:w-[360px]"
          />
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          {transactionTypes.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setType(item.value)}
              className={`h-9 rounded-full px-4 text-sm font-semibold transition ${
                type === item.value
                  ? "bg-slate-950 text-white shadow-sm"
                  : "border border-slate-200 bg-slate-50/70 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-950"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 md:flex-row md:flex-wrap md:items-center">
        <div className="xl:w-[180px]">
          <Select value={clientId} onValueChange={handleClientChange}>
            <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/70 text-sm shadow-none">
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.companyName || client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="xl:w-[180px]">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/70 text-sm shadow-none">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All projects</SelectItem>
              {filteredProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="xl:w-[220px]">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/70 pl-10 text-sm shadow-none"
            />
          </div>
        </div>

        <div className="xl:w-[220px]">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="h-11 rounded-2xl border-slate-200 bg-slate-50/70 pl-10 text-sm shadow-none"
            />
          </div>
        </div>

        <div className="flex gap-2 md:ml-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="h-11 flex-1 rounded-2xl border-slate-200 px-4 text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-950 md:flex-none"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={applyFilters}
            className="h-11 flex-1 rounded-2xl bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-800 md:flex-none"
          >
            Apply
          </Button>
        </div>
      </div>

      <div className="mt-2 px-1 text-xs text-slate-500">
        {hasActiveFilters
          ? "Filtered ledger view is active."
          : "Showing all latest transactions."}
      </div>
    </div>
  );
}
