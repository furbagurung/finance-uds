"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TransactionTableAttachment = {
  id: string;
  fileUrl: string;
};

export type TransactionTableItem = {
  id: string;
  dateLabel: string;
  type: string;
  clientName: string | null;
  clientLogoUrl: string | null;
  employeeName: string | null;
  projectName: string | null;
  doneFor: string | null;
  title: string;
  categoryName: string | null;
  paymentMethod: string | null;
  amountLabel: string;
  attachments: TransactionTableAttachment[];
};

type TransactionsTableProps = {
  transactions: TransactionTableItem[];
};

function formatTransactionType(type: string) {
  return type
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPaymentMethod(method: string | null) {
  if (!method) {
    return null;
  }

  return method
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getTypePillClass(type: string) {
  if (type === "INCOME") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  }

  if (type === "EXPENSE") {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
  }

  if (type === "INVESTMENT") {
    return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100";
  }

  if (type === "WITHDRAWAL") {
    return "bg-orange-50 text-orange-700 ring-1 ring-orange-100";
  }

  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}

function getAmountClass(type: string) {
  if (type === "INCOME") {
    return "text-emerald-700";
  }

  if (type === "EXPENSE") {
    return "text-rose-700";
  }

  if (type === "INVESTMENT") {
    return "text-indigo-700";
  }

  if (type === "WITHDRAWAL") {
    return "text-orange-700";
  }

  return "text-slate-800";
}

function EntityAvatar({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-500">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full bg-white object-contain p-0.5"
          loading="lazy"
        />
      ) : (
        getInitials(name) || "?"
      )}
    </span>
  );
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const router = useRouter();

  return (
    <Table className="min-w-[1080px] table-fixed">
      <colgroup>
        <col className="w-[112px]" />
        <col className="w-[28%]" />
        <col className="w-[13%]" />
        <col className="w-[19%]" />
        <col className="w-[14%]" />
        <col className="w-[124px]" />
        <col className="w-[132px]" />
        <col className="w-[88px]" />
      </colgroup>
      <TableHeader>
        <TableRow className="border-slate-100 bg-slate-50/80 hover:bg-slate-50/80">
          <TableHead className="h-10 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            Date
          </TableHead>
          <TableHead className="h-10 px-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            Transaction
          </TableHead>
          <TableHead className="h-10 px-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            Category
          </TableHead>
          <TableHead className="h-10 px-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            Client / Employee
          </TableHead>
          <TableHead className="h-10 px-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            Project
          </TableHead>
          <TableHead className="h-10 px-3.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            Method
          </TableHead>
          <TableHead className="h-10 px-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            Amount
          </TableHead>
          <TableHead className="h-10 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            Receipt
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {transactions.map((transaction) => {
          const transactionHref = `/transactions/${transaction.id}`;
          const transactionTitle =
            transaction.doneFor || transaction.title || "Untitled Transaction";
          const formattedType = formatTransactionType(transaction.type);
          const formattedMethod = formatPaymentMethod(
            transaction.paymentMethod,
          );
          const entityName = transaction.employeeName || transaction.clientName;
          const entityImageUrl = transaction.employeeName
            ? null
            : transaction.clientLogoUrl;

          return (
            <TableRow
              key={transaction.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(transactionHref)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(transactionHref);
                }
              }}
              className="cursor-pointer border-slate-100 transition-colors hover:bg-slate-50/80 focus-visible:bg-slate-50 focus-visible:outline-none"
            >
              <TableCell className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-slate-500">
                {transaction.dateLabel}
              </TableCell>

              <TableCell className="px-3.5 py-3.5">
                <Link
                  href={transactionHref}
                  onClick={(event) => event.stopPropagation()}
                  className="block truncate text-sm font-semibold leading-5 text-slate-950 hover:text-slate-700 hover:underline"
                >
                  {transactionTitle}
                </Link>

                <span
                  className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none ${getTypePillClass(
                    transaction.type,
                  )}`}
                >
                  {formattedType}
                </span>
              </TableCell>

              <TableCell className="truncate px-3.5 py-3.5 text-sm font-medium text-slate-600">
                {transaction.categoryName || (
                  <span className="text-slate-400">-</span>
                )}
              </TableCell>

              <TableCell className="px-3.5 py-3.5">
                {entityName ? (
                  <div className="flex min-w-0 items-center gap-2.5">
                    <EntityAvatar imageUrl={entityImageUrl} name={entityName} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-5 text-slate-700">
                        {entityName}
                      </p>
                      {transaction.employeeName ? (
                        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                          Employee
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">-</span>
                )}
              </TableCell>

              <TableCell className="truncate px-3.5 py-3.5 text-sm font-medium text-slate-600">
                {transaction.projectName || (
                  <span className="text-slate-400">-</span>
                )}
              </TableCell>

              <TableCell className="whitespace-nowrap px-3.5 py-3.5 text-sm font-medium text-slate-600">
                {formattedMethod || "-"}
              </TableCell>

              <TableCell
                className={`whitespace-nowrap px-3.5 py-3.5 text-right text-sm font-bold tabular-nums ${getAmountClass(
                  transaction.type,
                )}`}
              >
                {transaction.amountLabel}
              </TableCell>

              <TableCell className="px-4 py-3.5 text-right">
                {transaction.attachments.length > 0 ? (
                  <div className="flex justify-end gap-2">
                    {transaction.attachments.slice(0, 1).map((attachment) => (
                      <Link
                        key={attachment.id}
                        href={attachment.fileUrl}
                        target="_blank"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-7 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
                      >
                        <FileText className="h-3 w-3" />
                        View
                      </Link>
                    ))}

                    {transaction.attachments.length > 1 ? (
                      <span className="inline-flex h-7 items-center rounded-full bg-slate-100 px-2.5 text-xs font-semibold text-slate-600">
                        +{transaction.attachments.length - 1}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-xs font-medium text-slate-400">
                    —
                  </span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
