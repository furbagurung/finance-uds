import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  FolderKanban,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  StickyNote,
  UserRound,
  WalletCards,
} from "lucide-react";
import {
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

import { DeleteClientButton } from "@/components/delete-client-button";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type ClientDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type SocialLink = {
  label: string;
  href: string | null;
  icon: IconType;
};

function formatCurrency(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NP", {
    dateStyle: "medium",
  }).format(date);
}

function getExternalHref(href: string) {
  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  return `https://${href}`;
}

function getTypeBadgeClass(type: string) {
  if (type === "INCOME") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (type === "EXPENSE") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (type === "INVESTMENT") {
    return "border-slate-800 bg-slate-950 text-white";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
      projects: {
        orderBy: {
          createdAt: "desc",
        },
      },
      transactions: {
        orderBy: {
          date: "desc",
        },
        include: {
          project: true,
          category: true,
          attachments: true,
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const clientExpenseTransactions = client.transactions.filter(
    (transaction) =>
      transaction.type === "EXPENSE" && transaction.expenseScope === "CLIENT",
  );

  const totalClientExpenses = clientExpenseTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0,
  );

  const billableAmount = clientExpenseTransactions
    .filter((transaction) => transaction.isBillable)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const reimbursedAmount = clientExpenseTransactions
    .filter((transaction) => transaction.isReimbursed)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const recoverableAmount = billableAmount - reimbursedAmount;

  const displayName = client.companyName || client.name;
  const initials = displayName.charAt(0).toUpperCase();
  const socialLinks: SocialLink[] = [
    { label: "Website", href: client.website, icon: FaGlobe },
    { label: "Facebook", href: client.facebookUrl, icon: FaFacebookF },
    { label: "Instagram", href: client.instagramUrl, icon: FaInstagram },
    { label: "TikTok", href: client.tiktokUrl, icon: FaTiktok },
    { label: "LinkedIn", href: client.linkedinUrl, icon: FaLinkedinIn },
    { label: "YouTube", href: client.youtubeUrl, icon: FaYoutube },
  ];

  return (
    <DashboardShell user={user}>
      <div className="mx-auto w-full max-w-[1304px] space-y-6">
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="relative h-32 border-b border-slate-100 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.95),transparent_28%),linear-gradient(135deg,#f8fafc_0%,#e2e8f0_48%,#f8fafc_100%)]">
            <div className="absolute inset-x-0 bottom-0 h-px bg-white/80" />
          </div>

          <div className="px-5 pb-5">
            <div className="-mt-12 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-sm ring-1 ring-slate-100">
                  {client.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={client.logoUrl}
                      alt={`${displayName} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-slate-400">
                      {initials}
                    </span>
                  )}
                </div>

                <div className="min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                      {displayName}
                    </h1>

                    <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700 hover:bg-emerald-50">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      {client.status}
                    </Badge>

                    {client.industry ? (
                      <Badge className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                        {client.industry}
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {client.companyName ? client.name : "Client profile"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {client.email || "No email"}
                    </span>
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {client.phone || "No phone"}
                    </span>
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3">
                      <FaGlobe className="h-3.5 w-3.5 text-slate-400" />
                      {client.website || "No website"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl border-slate-200 bg-white px-3 text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-950"
                >
                  <Link href="/clients">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Clients
                  </Link>
                </Button>

                <Button
                  asChild
                  size="sm"
                  className="h-9 rounded-xl bg-slate-950 px-3 text-white shadow-sm hover:bg-slate-800"
                >
                  <Link href={`/clients/${client.id}/edit`}>Edit Client</Link>
                </Button>

                <DeleteClientButton clientId={client.id} />
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                {socialLinks.map((item) => {
                  const Icon = item.icon;

                  return item.href ? (
                    <a
                      key={item.label}
                      href={getExternalHref(item.href)}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex h-10 items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {item.label}
                      </span>
                      <ExternalLink className="h-3 w-3 text-slate-300 transition group-hover:text-slate-500" />
                    </a>
                  ) : (
                    <span
                      key={item.label}
                      className="flex h-10 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 text-xs font-semibold text-slate-300"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Client Expenses",
              value: formatCurrency(totalClientExpenses),
              icon: ReceiptText,
            },
            {
              label: "Billable",
              value: formatCurrency(billableAmount),
              icon: WalletCards,
            },
            {
              label: "Reimbursed",
              value: formatCurrency(reimbursedAmount),
              icon: CheckCircle2,
            },
            {
              label: "Recoverable",
              value: formatCurrency(recoverableAmount),
              icon: Building2,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-3 text-xl font-bold text-slate-950">
                      {item.value}
                    </p>
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-slate-400" />
                <h2 className="text-base font-semibold text-slate-950">
                  About Client
                </h2>
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {[
                  {
                    label: "Client Name",
                    value: client.name,
                    icon: UserRound,
                  },
                  {
                    label: "Company",
                    value: client.companyName || "-",
                    icon: Building2,
                  },
                  {
                    label: "Industry",
                    value: client.industry || "-",
                    icon: WalletCards,
                  },
                  {
                    label: "Created By",
                    value: client.createdBy?.name || "-",
                    helper: client.createdBy?.email || "",
                    icon: CheckCircle2,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {item.value}
                        </p>
                        {item.helper ? (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.helper}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <h2 className="text-base font-semibold text-slate-950">
                  Contact Details
                </h2>
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                <div className="flex items-start gap-3 pb-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Email
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                      {client.email || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Phone
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {client.phone || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Address
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-950">
                      {client.address || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-slate-400" />
                <h2 className="text-base font-semibold text-slate-950">
                  Internal Notes
                </h2>
              </div>

              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
                  {client.notes || "No internal notes added for this client."}
                </p>
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-4">
            <div className="flex items-center gap-2">
              <FaGlobe className="h-4 w-4 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-950">
                Digital Presence
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Social pages and owned channels for this client.
            </p>

            <div className="mt-5 space-y-2">
              {socialLinks.map((item) => {
                const Icon = item.icon;

                return item.href ? (
                  <a
                    key={item.label}
                    href={getExternalHref(item.href)}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-slate-500" />
                  </a>
                ) : (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-300"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </aside>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">Projects</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Projects linked with this client.
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Project
                  </TableHead>
                  <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Budget
                  </TableHead>
                  <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {client.projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-12 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <FolderKanban className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-950">
                        No projects added yet
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Linked projects will appear here once created.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  client.projects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="border-slate-100 hover:bg-slate-50"
                    >
                      <TableCell className="py-4 font-semibold text-slate-950">
                        {project.name}
                      </TableCell>
                      <TableCell className="py-4 text-sm text-slate-600">
                        {project.budget
                          ? formatCurrency(Number(project.budget))
                          : "-"}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          variant="secondary"
                          className="rounded-full bg-slate-100 text-slate-700"
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">
              Transactions
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Recent transactions linked with this client.
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Date
                  </TableHead>
                  <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Type
                  </TableHead>
                  <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Done For
                  </TableHead>
                  <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Project
                  </TableHead>
                  <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Amount
                  </TableHead>
                  <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Receipt
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {client.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <ReceiptText className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-950">
                        No transactions linked yet
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Client income, expenses, investments, and withdrawals
                        will appear here.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  client.transactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className="border-slate-100 hover:bg-slate-50"
                    >
                      <TableCell className="whitespace-nowrap py-4 text-sm font-medium text-slate-600">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          variant="outline"
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${getTypeBadgeClass(
                            transaction.type,
                          )}`}
                        >
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-[220px] py-4">
                        <Link
                          href={`/transactions/${transaction.id}`}
                          className="font-semibold text-slate-950 hover:text-slate-700 hover:underline"
                        >
                          {transaction.doneFor || transaction.title}
                        </Link>
                        {transaction.category ? (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {transaction.category.name}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="py-4 text-sm text-slate-600">
                        {transaction.project?.name || "-"}
                      </TableCell>
                      <TableCell className="py-4 font-semibold text-slate-950">
                        {formatCurrency(Number(transaction.amount))}
                      </TableCell>
                      <TableCell className="py-4">
                        {transaction.attachments.length > 0 ? (
                          <Badge
                            variant="secondary"
                            className="rounded-full bg-slate-100 text-slate-700"
                          >
                            {transaction.attachments.length} file
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">
                            No file
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
