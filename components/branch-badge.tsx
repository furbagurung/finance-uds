import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BranchBadgeBranch = {
  name?: string | null;
  code?: string | null;
  currency?: string | null;
};

type BranchBadgeProps = {
  branch?: BranchBadgeBranch | null;
  name?: string | null;
  code?: string | null;
  currency?: string | null;
  showCurrency?: boolean;
  className?: string;
};

function getBranchBadgeClassName(code: string | null | undefined) {
  const normalizedCode = code?.toUpperCase();

  if (normalizedCode === "NP") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalizedCode === "IN") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function BranchBadge({
  branch,
  name,
  code,
  currency,
  showCurrency = false,
  className,
}: BranchBadgeProps) {
  const branchName = branch?.name ?? name;
  const branchCode = branch?.code ?? code;
  const branchCurrency = branch?.currency ?? currency;

  if (!branchName && !branchCode) {
    return null;
  }

  const label =
    branchName && branchCode
      ? `${branchName} / ${branchCode}`
      : branchName || branchCode;
  const displayText =
    showCurrency && branchCurrency
      ? `${label} (${branchCurrency})`
      : label;

  return (
    <Badge
      variant="outline"
      className={cn(getBranchBadgeClassName(branchCode), className)}
    >
      {displayText}
    </Badge>
  );
}
