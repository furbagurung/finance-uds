"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RetainerBillingFiltersProps = {
  selectedStatus?: string;
  selectedMonth?: string;
  selectedYear?: string;
};

const months = [
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

const retainerBillingStatuses = [
  "PENDING",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "WAIVED",
];

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getYearOptions() {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 5 }, (_, index) => String(currentYear - 2 + index));
}

function FilterSelect({
  paramName,
  value,
  label,
  options,
}: {
  paramName: string;
  value?: string;
  label: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(nextValue: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextValue === "ALL") {
      params.delete(paramName);
    } else {
      params.set(paramName, nextValue);
    }

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <Select value={value || "ALL"} onValueChange={handleChange}>
      <SelectTrigger className="h-9 min-w-[150px] flex-1 rounded-xl border-slate-200 bg-white text-xs shadow-none focus:ring-2 focus:ring-slate-200 sm:w-[160px] sm:flex-none">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{label}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RetainerBillingFilters({
  selectedStatus,
  selectedMonth,
  selectedYear,
}: RetainerBillingFiltersProps) {
  return (
    <>
      <FilterSelect
        paramName="status"
        value={selectedStatus}
        label="All Statuses"
        options={retainerBillingStatuses.map((status) => ({
          value: status,
          label: formatStatus(status),
        }))}
      />
      <FilterSelect
        paramName="month"
        value={selectedMonth}
        label="All Months"
        options={months}
      />
      <FilterSelect
        paramName="year"
        value={selectedYear}
        label="All Years"
        options={getYearOptions().map((year) => ({
          value: year,
          label: year,
        }))}
      />
    </>
  );
}
