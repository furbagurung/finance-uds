"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, RotateCcw, Search, SlidersHorizontal } from "lucide-react";

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
    <div className="border-b border-slate-100 bg-white p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex w-full overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50 p-1 xl:w-auto">
          {transactionTypes.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setType(item.value)}
              className={`h-8 shrink-0 rounded-xl px-4 text-xs font-semibold transition ${
                type === item.value
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 rounded-xl px-3 text-slate-500 hover:bg-slate-50 hover:text-slate-950"
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Reset
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={applyFilters}
            className="h-9 rounded-xl bg-slate-950 px-4 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
            Apply Filters
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search source/client..."
            className="h-10 rounded-xl border-slate-200 bg-white pl-8 text-xs shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200"
          />
        </div>

        <Select value={clientId} onValueChange={handleClientChange}>
          <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-xs shadow-none focus:ring-2 focus:ring-slate-200">
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

        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-xs shadow-none focus:ring-2 focus:ring-slate-200">
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

        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="h-10 rounded-xl border-slate-200 bg-white pl-8 text-xs shadow-none focus-visible:ring-2 focus-visible:ring-slate-200"
          />
        </div>

        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="h-10 rounded-xl border-slate-200 bg-white pl-8 text-xs shadow-none focus-visible:ring-2 focus-visible:ring-slate-200"
          />
        </div>
      </div>

      <div className="mt-4 text-xs font-medium text-slate-400">
        {hasActiveFilters
          ? "Filtered ledger view is active."
          : "Showing all latest transactions."}
      </div>
    </div>
  );
}
