"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, Search, X } from "lucide-react";

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
  searchQuery: string;
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
  searchQuery,
}: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [type, setType] = useState(selectedType || "ALL");
  const [clientId, setClientId] = useState(selectedClientId || "ALL");
  const [projectId, setProjectId] = useState(selectedProjectId || "ALL");
  const [from, setFrom] = useState(fromDate);
  const [to, setTo] = useState(toDate);
  const [search, setSearch] = useState(searchQuery);

  useEffect(() => {
    setType(selectedType || "ALL");
    setClientId(selectedClientId || "ALL");
    setProjectId(selectedProjectId || "ALL");
    setFrom(fromDate);
    setTo(toDate);
    setSearch(searchQuery);
  }, [
    selectedType,
    selectedClientId,
    selectedProjectId,
    fromDate,
    toDate,
    searchQuery,
  ]);

  const filteredProjects =
    clientId === "ALL"
      ? projects
      : projects.filter((project) => project.clientId === clientId);

  const hasActiveFilters =
    type !== "ALL" ||
    clientId !== "ALL" ||
    projectId !== "ALL" ||
    from ||
    to ||
    search.trim();

  function buildFilterHref(
    updates: Partial<{
      type: string;
      clientId: string;
      projectId: string;
      startDate: string;
      endDate: string;
      q: string;
    }> = {},
  ) {
    const params = new URLSearchParams(searchParams.toString());
    const nextType = updates.type ?? type;
    const nextClientId = updates.clientId ?? clientId;
    const nextProjectId = updates.projectId ?? projectId;
    const nextStartDate = updates.startDate ?? from;
    const nextEndDate = updates.endDate ?? to;
    const nextSearch = updates.q ?? search;

    params.delete("from");
    params.delete("to");
    params.delete("search");

    if (nextType && nextType !== "ALL") params.set("type", nextType);
    else params.delete("type");

    if (nextClientId && nextClientId !== "ALL") {
      params.set("clientId", nextClientId);
    } else {
      params.delete("clientId");
    }

    if (nextProjectId && nextProjectId !== "ALL") {
      params.set("projectId", nextProjectId);
    } else {
      params.delete("projectId");
    }

    if (nextStartDate) params.set("startDate", nextStartDate);
    else params.delete("startDate");

    if (nextEndDate) params.set("endDate", nextEndDate);
    else params.delete("endDate");

    if (nextSearch.trim()) params.set("q", nextSearch.trim());
    else params.delete("q");

    const query = params.toString();

    return query ? `/transactions?${query}` : "/transactions";
  }

  function replaceFilters(
    updates: Parameters<typeof buildFilterHref>[0] = {},
  ) {
    router.replace(buildFilterHref(updates), { scroll: false });
  }

  useEffect(() => {
    const debounceId = window.setTimeout(() => {
      if (search.trim() !== searchQuery) {
        replaceFilters({ q: search });
      }
    }, 400);

    return () => window.clearTimeout(debounceId);
  }, [search, searchQuery]);

  function handleTypeChange(nextType: string) {
    setType(nextType);
    replaceFilters({ type: nextType });
  }

  function clearFilters() {
    setType("ALL");
    setClientId("ALL");
    setProjectId("ALL");
    setFrom("");
    setTo("");
    setSearch("");
    router.replace("/transactions", { scroll: false });
  }

  function handleClientChange(value: string) {
    setClientId(value);
    setProjectId("ALL");
    replaceFilters({ clientId: value, projectId: "ALL" });
  }

  function handleProjectChange(value: string) {
    setProjectId(value);
    replaceFilters({ projectId: value });
  }

  function handleFromChange(value: string) {
    setFrom(value);
    replaceFilters({ startDate: value });
  }

  function handleToChange(value: string) {
    setTo(value);
    replaceFilters({ endDate: value });
  }

  return (
    <div className="border-b border-slate-100 bg-white px-4 py-3 lg:px-5">
      <div className="flex min-w-0 flex-wrap items-center gap-2 2xl:flex-nowrap">
        <div className="flex max-w-full shrink-0 overflow-x-auto rounded-xl border border-slate-100 bg-slate-50 p-1">
          {transactionTypes.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => handleTypeChange(item.value)}
              aria-pressed={type === item.value}
              className={`h-8 shrink-0 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
                type === item.value
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-500 hover:bg-white hover:text-slate-950"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[180px] flex-1 sm:w-[240px] 2xl:flex-none 2xl:shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search source/client..."
            className="h-9 rounded-xl border-slate-200 bg-white pl-8 text-xs shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200"
          />
        </div>

        <Select value={clientId} onValueChange={handleClientChange}>
          <SelectTrigger className="h-9 min-w-[140px] flex-1 rounded-xl border-slate-200 bg-white text-xs shadow-none focus:ring-2 focus:ring-slate-200 sm:w-[150px] sm:flex-none 2xl:shrink-0">
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

        <Select value={projectId} onValueChange={handleProjectChange}>
          <SelectTrigger className="h-9 min-w-[140px] flex-1 rounded-xl border-slate-200 bg-white text-xs shadow-none focus:ring-2 focus:ring-slate-200 sm:w-[150px] sm:flex-none 2xl:shrink-0">
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

        <div className="relative min-w-[130px] flex-1 sm:w-[140px] sm:flex-none 2xl:shrink-0">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            type="date"
            value={from}
            onChange={(event) => handleFromChange(event.target.value)}
            className="h-9 rounded-xl border-slate-200 bg-white pl-7 pr-2 text-xs shadow-none focus-visible:ring-2 focus-visible:ring-slate-200"
          />
        </div>

        <div className="relative min-w-[130px] flex-1 sm:w-[140px] sm:flex-none 2xl:shrink-0">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            type="date"
            value={to}
            onChange={(event) => handleToChange(event.target.value)}
            className="h-9 rounded-xl border-slate-200 bg-white pl-7 pr-2 text-xs shadow-none focus-visible:ring-2 focus-visible:ring-slate-200"
          />
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
