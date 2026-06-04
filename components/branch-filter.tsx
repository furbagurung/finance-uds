"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BranchOption } from "@/components/branch-select-field";

type BranchFilterProps = {
  branches?: BranchOption[];
  paramName?: string;
  basePath?: string;
};

export function BranchFilter({
  branches,
  paramName = "branchId",
  basePath,
}: BranchFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
        console.error("BranchFilter fetch error:", error);

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
  const selectedBranchId = searchParams.get(paramName) || "ALL";

  function handleBranchChange(nextBranchId: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextBranchId === "ALL") {
      params.delete(paramName);
    } else {
      params.set(paramName, nextBranchId);
    }

    const query = params.toString();
    const targetPath = basePath ?? pathname;

    router.replace(query ? `${targetPath}?${query}` : targetPath, {
      scroll: false,
    });
  }

  return (
    <Select value={selectedBranchId} onValueChange={handleBranchChange}>
      <SelectTrigger className="h-9 min-w-[150px] flex-1 rounded-xl border-slate-200 bg-white text-xs shadow-none focus:ring-2 focus:ring-slate-200 sm:w-[160px] sm:flex-none">
        <SelectValue placeholder="All Branches" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Branches</SelectItem>

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
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
