import Link from "next/link";
import { BranchBadge } from "@/components/branch-badge";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddTransactionAttachment } from "@/components/add-transaction-attachment";
import { DeleteAttachmentButton } from "@/components/delete-attachment-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type TransactionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatCurrency(amount: unknown, currency?: string | null) {
  const value = Number(amount);
  const currencyCode = currency || "NPR";

  try {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  } catch {
    return `${currencyCode} ${value.toLocaleString("en-IN")}`;
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NP", {
    dateStyle: "medium",
  }).format(date);
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div className="mt-2 text-sm font-medium text-slate-950">{value}</div>
    </div>
  );
}

export default async function TransactionDetailPage({
  params,
}: TransactionDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: {
      id,
    },
    include: {
      category: true,
      client: true,
      project: true,
      retainerBilling: {
        include: {
          project: true,
          client: true,
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
              country: true,
              currency: true,
              calendarSystem: true,
              fiscalYearType: true,
            },
          },
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
          code: true,
          country: true,
          currency: true,
          calendarSystem: true,
          fiscalYearType: true,
        },
      },
      attachments: true,
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!transaction) {
    notFound();
  }

  const transactionCurrency =
    transaction.currency || transaction.branch?.currency || "NPR";
  const retainerCurrency =
    transaction.retainerBilling?.currency ||
    transaction.retainerBilling?.branch?.currency ||
    transactionCurrency;

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              Transaction Detail
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View full transaction information, receipt, client, project, and
              notes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/transactions">Back to Transactions</Link>
            </Button>

            <Button asChild>
              <Link href={`/transactions/${transaction.id}/edit`}>
                Edit Transaction
              </Link>
            </Button>

            <DeleteTransactionButton transactionId={transaction.id} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{transaction.title}</CardTitle>
                <CardDescription>
                  {transaction.doneFor || "No purpose added"}
                </CardDescription>
              </div>

              <Badge variant="secondary">{transaction.type}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DetailItem
                label="Amount"
                value={formatCurrency(transaction.amount, transactionCurrency)}
              />

              <DetailItem label="Date" value={formatDate(transaction.date)} />

              <DetailItem
                label="Payment Method"
                value={transaction.paymentMethod.replaceAll("_", " ")}
              />

              <DetailItem
                label="Expense Scope"
                value={transaction.expenseScope || "-"}
              />

              <DetailItem
                label="Branch"
                value={
                  transaction.branch ? (
                    <BranchBadge branch={transaction.branch} showCurrency />
                  ) : (
                    "Not assigned"
                  )
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DetailItem
                label="Paid By / Source"
                value={transaction.paidBy || "-"}
              />

              <DetailItem
                label="Category"
                value={transaction.category?.name || "-"}
              />

              <DetailItem
                label="Client"
                value={transaction.client?.name || "-"}
              />

              <DetailItem
                label="Project"
                value={transaction.project?.name || "-"}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DetailItem
                label="Billable"
                value={transaction.isBillable ? "Yes" : "No"}
              />

              <DetailItem
                label="Reimbursed"
                value={transaction.isReimbursed ? "Yes" : "No"}
              />

              <DetailItem
                label="Created By"
                value={transaction.createdBy.name}
              />

              <DetailItem
                label="Created At"
                value={formatDate(transaction.createdAt)}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  {transaction.notes || "No notes added."}
                </p>
              </CardContent>
            </Card>

            {transaction.retainerBilling ? (
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Retainer Billing
                      </CardTitle>
                      <CardDescription>
                        Linked monthly retainer billing record.
                      </CardDescription>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/retainers/${transaction.retainerBilling.id}`}>
                        View Retainer
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <DetailItem
                    label="Project"
                    value={transaction.retainerBilling.project.name}
                  />
                  <DetailItem
                    label="Month / Year"
                    value={`${
                      months[transaction.retainerBilling.month - 1] ||
                      transaction.retainerBilling.month
                    } ${transaction.retainerBilling.year}`}
                  />
                  <DetailItem
                    label="Status"
                    value={transaction.retainerBilling.status.replaceAll(
                      "_",
                      " "
                    )}
                  />
                  <DetailItem
                    label="Expected"
                    value={formatCurrency(
                      transaction.retainerBilling.expectedAmount,
                      retainerCurrency
                    )}
                  />
                  <DetailItem
                    label="Received"
                    value={formatCurrency(
                      transaction.retainerBilling.receivedAmount,
                      retainerCurrency
                    )}
                  />
                  <DetailItem
                    label="Pending"
                    value={formatCurrency(
                      transaction.retainerBilling.pendingAmount,
                      retainerCurrency
                    )}
                  />
                  <DetailItem
                    label="Branch"
                    value={
                      transaction.retainerBilling.branch ? (
                        <BranchBadge
                          branch={transaction.retainerBilling.branch}
                          showCurrency
                        />
                      ) : (
                        "-"
                      )
                    }
                  />
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receipts / Invoices</CardTitle>
                <CardDescription>
                  Uploaded files linked with this transaction.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="mb-4">
                  <AddTransactionAttachment transactionId={transaction.id} />
                </div>
                {transaction.attachments.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No receipt or invoice attached.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transaction.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-slate-950">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {attachment.fileType || "Unknown file type"} ·{" "}
                            {attachment.fileSize
                              ? `${attachment.fileSize} bytes`
                              : "Unknown size"}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={attachment.fileUrl} target="_blank">
                              View File
                            </Link>
                          </Button>

                          <DeleteAttachmentButton
                            transactionId={transaction.id}
                            attachmentId={attachment.id}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
