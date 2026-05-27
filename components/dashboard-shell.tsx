"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  Activity,
  LayoutDashboard,
  Wallet,
  Tags,
  Users,
  BriefcaseBusiness,
  BarChart3,
  DatabaseBackup,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Search,
  Plus,
  ReceiptText,
  UserPlus,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  expanded: boolean;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("Sidebar components must be used inside SidebarContext.");
  }

  return context;
}

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: Wallet,
  },
  {
    title: "Categories",
    href: "/categories",
    icon: Tags,
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    title: "Projects",
    href: "/projects",
    icon: BriefcaseBusiness,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    title: "Activity Logs",
    href: "/activity",
    icon: Activity,
    adminOnly: true,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Backup",
    href: "/backup",
    icon: DatabaseBackup,
    adminOnly: true,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

type DashboardShellProps = {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
  };
};

type SidebarNavItemProps = {
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  title: string;
};

function SidebarNavItem({
  href,
  icon: Icon,
  isActive,
  title,
}: SidebarNavItemProps) {
  const { expanded } = useSidebar();

  return (
    <div className="group relative w-full">
      <Link
        href={href}
        title={expanded ? undefined : title}
        className={cn(
          "relative grid h-11 items-center rounded-lg text-sm font-medium transition-all duration-300 ease-in-out",
          expanded
            ? "w-full grid-cols-[2rem_1fr] gap-3 px-3.5"
            : "ml-[10px] h-11 w-11 grid-cols-[2rem_0fr] rounded-lg px-1.5",
          isActive
            ? "bg-slate-950 text-white shadow-sm shadow-slate-200"
            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md transition-all duration-200 ease-in-out",
            isActive ? "bg-white/10" : "group-hover:bg-slate-50",
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4 flex-shrink-0 transition-all duration-200 ease-in-out",
              isActive
                ? "text-white"
                : "text-slate-500 group-hover:text-slate-700",
            )}
          />
        </span>

        <span
          className={cn(
            "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out",
            expanded
              ? "max-w-40 opacity-100 delay-100"
              : "pointer-events-none max-w-0 opacity-0",
          )}
        >
          {title}
        </span>
      </Link>

      {!expanded ? (
        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 ease-in-out group-hover:translate-x-1 group-hover:opacity-100">
          {title}
        </span>
      ) : null}
    </div>
  );
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isMacShortcut = event.metaKey && event.key.toLowerCase() === "k";
      const isWindowsShortcut =
  event.ctrlKey && event.key.toLowerCase() === "k";

      if (isMacShortcut || isWindowsShortcut) {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }

      if (event.key === "Escape") {
        setCommandOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-all duration-300 ease-in-out lg:block",
          expanded ? "w-[300px]" : "w-20",
        )}
      >
        <SidebarContext.Provider value={{ expanded }}>
          <div
            className={cn(
              "flex h-full flex-col py-5 transition-all duration-300 ease-in-out",
              expanded ? "px-4" : "px-3",
            )}
          >
            <div
              className={cn(
                "flex h-20 items-center transition-all duration-300 ease-in-out",
                expanded ? "justify-between gap-3" : "justify-center",
              )}
            >
              <div
                className={cn(
                  "grid min-w-0 items-center overflow-hidden transition-all duration-300 ease-in-out",
                  expanded ? "grid-cols-[2.75rem_1fr] gap-3 opacity-100" : "w-0 opacity-0",
                )}
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-yellow-400 shadow-sm">
                  U
                </div>

                <div className="overflow-hidden whitespace-nowrap leading-tight">
                  <p className="whitespace-nowrap text-sm font-bold tracking-tight text-slate-950">
                    United Digital
                  </p>
                  <p className="whitespace-nowrap text-xs font-medium text-slate-500">
                    Finance Tracker
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-300 ease-in-out hover:bg-slate-50 hover:text-slate-950"
                aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
                title={expanded ? "Collapse sidebar" : "Expand sidebar"}
              >
                {expanded ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </button>
            </div>

            <Separator className="mb-5 mt-3 bg-slate-100" />

            <nav
              className={cn(
                "space-y-1.5 overflow-visible transition-all duration-300 ease-in-out",
                expanded ? "" : "flex flex-col items-start",
              )}
            >
              {navItems
                .filter((item) => !item.adminOnly || user.role === "ADMIN")
                .map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <SidebarNavItem
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      isActive={isActive}
                      title={item.title}
                    />
                  );
                })}
            </nav>
          </div>
        </SidebarContext.Provider>
      </aside>

      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          expanded ? "lg:pl-[300px]" : "lg:pl-20",
        )}
      >
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="grid h-16 grid-cols-[1fr_minmax(320px,560px)_1fr] items-center gap-4 px-6">
            <div className="group relative col-start-2 -ml-6 w-full justify-self-start rounded-full border border-slate-200 bg-white p-[1px] shadow-sm shadow-slate-200/50 transition-all duration-300 hover:border-transparent hover:bg-[linear-gradient(90deg,#f59e0b,#facc15,#38bdf8,#6366f1,#8b5cf6,#ec4899,#f59e0b)] hover:bg-[length:300%_300%] hover:animate-[gradientShift_3s_ease_infinite] hover:shadow-md hover:shadow-violet-100/60">
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="relative z-10 flex h-10 w-full items-center gap-3 rounded-full bg-white px-3 text-left transition-all duration-300"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 transition-colors duration-300 group-hover:bg-gradient-to-br group-hover:from-amber-100 group-hover:via-sky-50 group-hover:to-violet-100">
                  <Search className="h-4 w-4 text-slate-600" />
                </span>

                <span className="flex-1 text-sm font-medium text-slate-600">
                  Search transactions, clients, and reports
                </span>

                <span className="hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 sm:inline-flex">
                  CMD
                </span>

                <span className="hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 sm:inline-flex">
                  K
                </span>
              </button>
            </div>

            <div className="col-start-3 flex shrink-0 items-center justify-end gap-3">
              <Badge
                variant="secondary"
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
              >
                {user.role}
              </Badge>

              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-yellow-400">
                  {user.name?.charAt(0) ?? "U"}
                </div>

                <p className="max-w-32 truncate text-xs font-semibold text-slate-950">
                  {user.name}
                </p>
              </div>

              <LogoutButton />
            </div>
          </div>
        </header>

        {commandOpen ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/20 px-4 pt-24 backdrop-blur-sm">
            <div
              className="absolute inset-0"
              onClick={() => setCommandOpen(false)}
            />

            <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/30">
              <div className="flex h-12 items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-4">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search actions and pages"
                  className="h-full flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setCommandOpen(false)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  ESC
                </button>
              </div>

              <div className="max-h-[520px] overflow-y-auto p-2">
                <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Navigate
                </p>

                <div className="space-y-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-950"
                  >
                    <span className="flex items-center gap-3">
                      <LayoutDashboard className="h-4 w-4 text-slate-500" />
                      Go to Dashboard
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300" />
                  </Link>

                  <Link
                    href="/transactions"
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-950"
                  >
                    <span className="flex items-center gap-3">
                      <ReceiptText className="h-4 w-4 text-slate-500" />
                      Go to Transactions
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300" />
                  </Link>

                  <Link
                    href="/clients"
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-950"
                  >
                    <span className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-slate-500" />
                      Go to Clients
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300" />
                  </Link>

                  <Link
                    href="/reports"
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-950"
                  >
                    <span className="flex items-center gap-3">
                      <BarChart3 className="h-4 w-4 text-slate-500" />
                      Go to Reports
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300" />
                  </Link>
                </div>

                <p className="mt-4 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Actions
                </p>

                <div className="space-y-1">
                  <Link
                    href="/transactions"
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-950"
                  >
                    <span className="flex items-center gap-3">
                      <Plus className="h-4 w-4 text-slate-500" />
                      Add Transaction
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300" />
                  </Link>

                  <Link
                    href="/clients"
                    onClick={() => setCommandOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-950"
                  >
                    <span className="flex items-center gap-3">
                      <UserPlus className="h-4 w-4 text-slate-500" />
                      Add Client
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-300" />
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-medium text-slate-500">
                <span>Quick command menu</span>
                <span>Click outside to close</span>
              </div>
            </div>
          </div>
        ) : null}
        <main className="p-6">
          <div className="mx-auto w-full max-w-[1220px] space-y-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
