"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getFiscalYearOptionsForBranch,
  getIndiaFiscalYearOptions,
} from "@/lib/fiscal-year";

const CURRENT_FY_VALUE = "__current_fy";

type FiscalYearFilterProps = {
  branchFiscalYearType?: string | null;
  basePath?: string;
  options?: string[];
};

export function FiscalYearFilter({
  branchFiscalYearType,
  basePath,
  options,
}: FiscalYearFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedFiscalYear = searchParams.get("fiscalYear") || CURRENT_FY_VALUE;
  const fiscalYearOptions =
    options ??
    (branchFiscalYearType
      ? getFiscalYearOptionsForBranch({ fiscalYearType: branchFiscalYearType })
      : getIndiaFiscalYearOptions());
  const selectableFiscalYearOptions = fiscalYearOptions.filter(
    (fiscalYear) => fiscalYear !== "Current FY",
  );

  const optionSet = new Set(selectableFiscalYearOptions);
  const visibleFiscalYearOptions =
    selectedFiscalYear !== CURRENT_FY_VALUE && !optionSet.has(selectedFiscalYear)
      ? [selectedFiscalYear, ...selectableFiscalYearOptions]
      : selectableFiscalYearOptions;

  function handleFiscalYearChange(nextFiscalYear: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextFiscalYear === CURRENT_FY_VALUE) {
      params.delete("fiscalYear");
    } else {
      params.set("fiscalYear", nextFiscalYear);
    }

    const query = params.toString();
    const targetPath = basePath ?? pathname;

    router.replace(query ? `${targetPath}?${query}` : targetPath, {
      scroll: false,
    });
  }

  return (
    <Select value={selectedFiscalYear} onValueChange={handleFiscalYearChange}>
      <SelectTrigger className="h-9 min-w-[150px] flex-1 rounded-xl border-slate-200 bg-white text-xs shadow-none focus:ring-2 focus:ring-slate-200 sm:w-[160px] sm:flex-none">
        <SelectValue placeholder="Current FY" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={CURRENT_FY_VALUE}>Current FY</SelectItem>

        {visibleFiscalYearOptions.map((fiscalYear) => (
          <SelectItem key={fiscalYear} value={fiscalYear}>
            {fiscalYear}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
