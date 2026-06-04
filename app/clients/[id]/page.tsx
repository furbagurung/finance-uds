import Link from "next/link";
import { ClientProfileActions } from "@/components/client-profile-actions";
import { notFound, redirect } from "next/navigation";
import { ClientCoverThemePicker } from "@/components/client-cover-theme-picker";
import { ClientLogoUploader } from "@/components/client-logo-uploader";
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

import { BranchBadge } from "@/components/branch-badge";
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
// CLIENT PROFILE THEME
// Auto-generates a premium cover gradient and fallback logo color based on client name.
// If coverTheme is manually selected, it overrides auto mode.
function getProfileTheme(name: string, coverTheme = "auto") {
  const themes = {
    purple: {
      cover:
        "radial-gradient(circle at 18% 20%, rgba(255,255,255,0.25), transparent 28%), radial-gradient(circle at 80% 20%, rgba(236,72,153,0.35), transparent 30%), linear-gradient(135deg, #020617 0%, #312e81 42%, #9333ea 100%)",
      avatarBg: "#f3e8ff",
      avatarText: "#7e22ce",
    },
    emerald: {
      cover:
        "radial-gradient(circle at 18% 20%, rgba(255,255,255,0.25), transparent 28%), radial-gradient(circle at 80% 20%, rgba(34,197,94,0.32), transparent 30%), linear-gradient(135deg, #052e16 0%, #047857 45%, #22c55e 100%)",
      avatarBg: "#dcfce7",
      avatarText: "#047857",
    },
    ocean: {
      cover:
        "radial-gradient(circle at 18% 20%, rgba(255,255,255,0.25), transparent 28%), radial-gradient(circle at 80% 20%, rgba(56,189,248,0.34), transparent 30%), linear-gradient(135deg, #082f49 0%, #2563eb 45%, #38bdf8 100%)",
      avatarBg: "#dbeafe",
      avatarText: "#1d4ed8",
    },
    amber: {
      cover:
        "radial-gradient(circle at 18% 20%, rgba(255,255,255,0.25), transparent 28%), radial-gradient(circle at 80% 20%, rgba(245,158,11,0.34), transparent 30%), linear-gradient(135deg, #451a03 0%, #c2410c 45%, #f59e0b 100%)",
      avatarBg: "#ffedd5",
      avatarText: "#c2410c",
    },
    rose: {
      cover:
        "radial-gradient(circle at 18% 20%, rgba(255,255,255,0.25), transparent 28%), radial-gradient(circle at 80% 20%, rgba(244,63,94,0.34), transparent 30%), linear-gradient(135deg, #4a044e 0%, #be123c 45%, #fb7185 100%)",
      avatarBg: "#ffe4e6",
      avatarText: "#be123c",
    },
    slate: {
      cover:
        "radial-gradient(circle at 18% 20%, rgba(255,255,255,0.25), transparent 28%), radial-gradient(circle at 80% 20%, rgba(148,163,184,0.3), transparent 30%), linear-gradient(135deg, #020617 0%, #334155 45%, #94a3b8 100%)",
      avatarBg: "#e2e8f0",
      avatarText: "#334155",
    },
  };

  if (coverTheme !== "auto" && coverTheme in themes) {
    return themes[coverTheme as keyof typeof themes];
  }

  const autoThemes = Object.values(themes);
  const seed = name
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return autoThemes[seed % autoThemes.length];
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

  const profileTheme = getProfileTheme(displayName, client.coverTheme || "auto");

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
          {/* CLIENT PROFILE COVER
    Edit this block to change the Facebook-style cover/banner height, gradient, and texture.
*/}
          <div
            className="relative h-36 overflow-visible border-b border-slate-100"
            style={{ background: profileTheme.cover }}
          >
            {/* Subtle noise/grid overlay for premium SaaS texture */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.55)_1px,transparent_0)] [background-size:18px_18px]" />
            {/* CLIENT PROFILE LOGO UPLOAD
    Logo can now be uploaded, changed, or removed directly from the profile page.
    Main upload logic lives in components/client-logo-uploader.tsx.
*/}
            <ClientLogoUploader
              clientId={client.id}
              clientName={displayName}
              initials={initials}
              logoUrl={client.logoUrl}
              avatarBg={profileTheme.avatarBg}
              avatarText={profileTheme.avatarText}
            />
            {/* CLIENT PROFILE ACTIONS
    Back stays visible. Edit/Delete are inside the client settings dropdown.
*/}
            {/* CLIENT PROFILE ACTIONS
    Back is navigation. Cover edits and client settings are separated for cleaner UX.
*/}
            <ClientProfileActions
              clientId={client.id}
              currentTheme={client.coverTheme}
            />
          </div>

          {/* CLIENT PROFILE BODY
    Top padding gives space for the half-overlapped profile logo.
*/}
          <div className="px-5 pb-5 pt-14">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              {/* CLIENT PROFILE IDENTITY
    Edit this block to change logo, client name, status badge, and contact chips.
*/}
              <div className="min-w-0">


                <div className="min-w-0 pt-2">
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

                    {client.branch ? (
                      <BranchBadge branch={client.branch} showCurrency />
                    ) : (
                      <Badge className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                        Not assigned
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {client.companyName ? client.name : "Client profile"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
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

              <div className="flex flex-wrap gap-2 xl:hidden">
                <Button asChild variant="outline" size="sm">
                  <Link href="/clients">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Link>
                </Button>

                <Button asChild size="sm">
                  <Link href={`/clients/${client.id}/edit`}>Edit Client</Link>
                </Button>

                <DeleteClientButton clientId={client.id} />
              </div>
            </div>

            {/* CLIENT PROFILE NAVIGATION
    Edit this block to change the Facebook/LinkedIn-style profile tabs.
*/}
            {/* CLIENT PROFILE TABS
    Edit this block to change Overview, Projects, Transactions, Notes, and Social Pages tabs.
*/}
            <div className="mt-5 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-4">
              {[
                "Overview",
                `Projects ${client.projects.length}`,
                `Transactions ${client.transactions.length}`,
                "Notes",
                "Social Pages",
              ].map((item, index) => (
                <span
                  key={item}
                  className={
                    index === 0
                      ? "inline-flex h-9 items-center rounded-lg bg-slate-950 px-4 text-xs font-semibold text-white shadow-sm"
                      : "inline-flex h-9 items-center rounded-lg px-4 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                  }
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CLIENT FINANCE SUMMARY CARDS
    Edit this section to change the four finance summary cards.
*/}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Client Expenses",
              value: formatCurrency(totalClientExpenses),
              helper: "Total client-scoped expenses recorded",
              icon: ReceiptText,
            },
            {
              label: "Billable",
              value: formatCurrency(billableAmount),
              helper: "Recoverable amount marked for billing",
              icon: WalletCards,
            },
            {
              label: "Reimbursed",
              value: formatCurrency(reimbursedAmount),
              helper: "Amount already recovered",
              icon: CheckCircle2,
            },
            {
              label: "Recoverable",
              value: formatCurrency(recoverableAmount),
              helper: "Pending reimbursement balance",
              icon: Building2,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-slate-200 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {item.label}
                    </p>

                    <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                      {item.value}
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {item.helper}
                    </p>
                  </div>

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-500 transition group-hover:bg-white">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* CLIENT CRM OVERVIEW SECTION
    Edit this section to change About, Contact, Notes, and Digital Presence cards.
*/}
        <section className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {/* ABOUT CLIENT CARD */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-500">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">
                      About Client
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Core business profile and ownership details.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
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
                    label: "Branch",
                    value: client.branch ? (
                      <BranchBadge branch={client.branch} showCurrency />
                    ) : (
                      "Not assigned"
                    ),
                    icon: Building2,
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
                      className="flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-500">
                        <Icon className="h-4 w-4" />
                      </span>

                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-slate-950">
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

            {/* CONTACT DETAILS CARD */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-500">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">
                      Contact Details
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Primary communication details for this client.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-0 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
                <div className="flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Email
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-slate-950">
                      {client.email || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-500">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Phone
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-slate-950">
                      {client.phone || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 px-5 py-4 transition hover:bg-slate-50">
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-500">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Address
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-950">
                      {client.address || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* INTERNAL NOTES CARD */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-500">
                    <StickyNote className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">
                      Internal Notes
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Private notes for service scope, billing, and client preferences.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {client.notes ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
                      {client.notes}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-400">
                      <StickyNote className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        No internal notes yet
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Add private context, billing preferences, or service
                        notes when they become available.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DIGITAL PRESENCE SIDEBAR */}
          <aside className="h-fit overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:col-span-4">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-500">
                  <FaGlobe className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-950">
                    Digital Presence
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Social pages and owned channels.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2 p-5 sm:grid-cols-2 lg:grid-cols-1">
              {socialLinks.map((item) => {
                const Icon = item.icon;

                return item.href ? (
                  <a
                    key={item.label}
                    href={getExternalHref(item.href)}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-500">
                        <Icon className="h-4 w-4" />
                      </span>
                      {item.label}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-slate-500" />
                  </a>
                ) : (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-300"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      {item.label}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                      Missing
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-500">
                <FolderKanban className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Projects
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Projects linked with this client.
                </p>
              </div>
            </div>

            <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
              {client.projects.length} total
            </span>
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
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400">
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
                      <TableCell className="min-w-[240px] py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500">
                            <FolderKanban className="h-4 w-4" />
                          </span>
                          <span className="font-semibold text-slate-950">
                            {project.name}
                          </span>
                        </div>
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
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-500">
                <ReceiptText className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Transactions
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Recent transactions linked with this client.
                </p>
              </div>
            </div>

            <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
              {client.transactions.length} total
            </span>
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
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400">
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
                          <div className="flex flex-wrap gap-2">
                            {transaction.attachments
                              .slice(0, 2)
                              .map((attachment) => (
                                <Link
                                  key={attachment.id}
                                  href={attachment.fileUrl}
                                  target="_blank"
                                  className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                                >
                                  View file
                                </Link>
                              ))}

                            {transaction.attachments.length > 2 ? (
                              <span className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-600">
                                +{transaction.attachments.length - 2}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-slate-400">
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
