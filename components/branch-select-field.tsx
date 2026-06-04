"use client";

import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type BranchOption = {
  id: string;
  name: string;
  code: string;
  country: string;
  currency: string;
  calendarSystem: string;
  fiscalYearType: string;
  isActive: boolean;
};

type BranchSelectFieldProps = {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showCurrency?: boolean;
  branches?: BranchOption[];
  allowUnassigned?: boolean;
  unassignedLabel?: string;
  triggerClassName?: string;
};

export function BranchSelectField({
  value,
  onValueChange,
  placeholder = "Select branch",
  disabled = false,
  showCurrency = false,
  branches,
  allowUnassigned = false,
  unassignedLabel = "Not assigned",
  triggerClassName,
}: BranchSelectFieldProps) {
  const [fetchedBranches, setFetchedBranches] = useState<BranchOption[]>([]);
  const [isLoading, setIsLoading] = useState(branches === undefined);

  useEffect(() => {
    if (branches !== undefined) {
      setFetchedBranches(branches);
      setIsLoading(false);
      return;
    }

    let ignore = false;

    async function fetchBranches() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/branches");

        if (!response.ok) {
          throw new Error("Failed to fetch branches.");
        }

        const data = (await response.json()) as { branches?: BranchOption[] };

        if (!ignore) {
          setFetchedBranches(data.branches ?? []);
        }
      } catch (error) {
        console.error("BranchSelectField fetch error:", error);

        if (!ignore) {
          setFetchedBranches([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchBranches();

    return () => {
      ignore = true;
    };
  }, [branches]);

  const branchOptions = branches ?? fetchedBranches;

  return (
    <Select
      value={value || undefined}
      onValueChange={(nextValue) =>
        onValueChange(nextValue === "__unassigned" ? "" : nextValue)
      }
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "h-9 min-w-[160px] rounded-xl border-slate-200 bg-white text-xs shadow-none focus:ring-2 focus:ring-slate-200",
          triggerClassName
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowUnassigned ? (
          <SelectItem value="__unassigned">{unassignedLabel}</SelectItem>
        ) : null}

        {isLoading ? (
          <SelectItem value="__loading" disabled>
            Loading branches...
          </SelectItem>
        ) : null}

        {!isLoading && branchOptions.length === 0 ? (
          <SelectItem value="__empty" disabled>
            No branches available
          </SelectItem>
        ) : null}

        {branchOptions.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {showCurrency
              ? `${branch.name} (${branch.currency})`
              : branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
