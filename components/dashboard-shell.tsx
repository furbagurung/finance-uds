"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  ChevronRight,
  DatabaseBackup,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ReceiptText,
  Search,
  Settings,
  Tags,
  UserCircle2,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type SidebarNavEntry = {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

type SidebarSection = {
  label: string;
  items: SidebarNavEntry[];
};

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

// SIDEBAR NAVIGATION SECTIONS
// Edit this array to add, remove, or regroup sidebar items.
const sidebarSections: SidebarSection[] = [
  {
    label: "MAIN",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "FINANCE",
    items: [
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
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "CRM",
    items: [
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
    ],
  },
  {
    label: "TEAM",
    items: [
      {
        title: "Users",
        href: "/users",
        icon: Users,
        adminOnly: true,
      },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      {
        title: "Backup",
        href: "/backup",
        icon: DatabaseBackup,
        adminOnly: true,
      },
    ],
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
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    if (!accountMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [accountMenuOpen]);


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
                className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-300 ease-in-out hover:bg-slate-50 hover:text-slate-950"
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
                "overflow-visible transition-all duration-300 ease-in-out",
                expanded ? "space-y-5" : "flex flex-col items-center gap-3",
              )}
            >
              {sidebarSections.map((section) => {
                const visibleItems = section.items.filter(
                  (item) => !item.adminOnly || user.role === "ADMIN",
                );

                if (visibleItems.length === 0) {
                  return null;
                }

                return (
                  <div
                    key={section.label}
                    className={cn(
                      "w-full",
                      expanded ? "space-y-1.5" : "flex flex-col items-center gap-2",
                    )}
                  >
                    {expanded ? (
                      <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        {section.label}
                      </p>
                    ) : null}

                    <div
                      className={cn(
                        expanded ? "space-y-1.5" : "flex flex-col items-center gap-2",
                      )}
                    >
                      {visibleItems.map((item) => {
                        const isActive =
                          pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);

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
                    </div>
                  </div>
                );
              })}
            </nav>
            {/* SIDEBAR ACCOUNT AREA
    SaaS-style clickable profile card at the bottom of the sidebar.
    Click to open account menu with settings and logout.
*/}
            <div className="relative mt-auto" ref={accountMenuRef}>
              <Separator className="mb-4 mt-5 bg-slate-100" />

              {accountMenuOpen ? (
                <div
                  className={cn(
                    "absolute bottom-4 z-50 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/12",
                    expanded ? "left-[calc(100%+0.75rem)]" : "left-16",
                  )}
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-yellow-400 shadow-sm">
                      {user.name?.charAt(0) ?? "U"}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-950">
                        {user.name}
                      </p>
                      <p className="truncate text-xs font-medium text-slate-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      href="/settings"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                    >
                      <UserCircle2 className="h-4 w-4 text-slate-400" />
                      Account Settings
                    </Link>

                    <Link
                      href="/activity"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                    >
                      <Activity className="h-4 w-4 text-slate-400" />
                      Activity Logs
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                      Workspace Settings
                    </Link>

                    <div className="my-2 h-px bg-slate-100" />

                    <div className="[&>button]:flex [&>button]:w-full [&>button]:cursor-pointer [&>button]:items-center [&>button]:justify-start [&>button]:rounded-xl [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-3 [&>button]:py-2.5 [&>button]:text-left [&>button]:text-sm [&>button]:font-semibold [&>button]:text-red-600 [&>button]:shadow-none [&>button]:transition [&>button]:hover:bg-red-50">
                      <LogoutButton />
                    </div>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setAccountMenuOpen((current) => !current)}
                className={cn(
                  "group cursor-pointer border border-slate-200 bg-white shadow-sm transition-colors duration-200 ease-in-out hover:border-slate-300 hover:bg-slate-50",
                  accountMenuOpen ? "border-slate-300 bg-slate-50" : "",
                  expanded
                    ? "w-full rounded-md p-3"
                    : "mx-auto flex h-12 w-12 items-center justify-center rounded-full p-0",
                )}
                aria-expanded={accountMenuOpen}
                aria-label="Open account menu"
              >
                <div
                  className={cn(
                    "flex items-center transition-all duration-300 ease-in-out",
                    expanded ? "gap-3" : "justify-center",
                  )}
                >
                  <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-yellow-400 shadow-sm">
                    {user.name?.charAt(0) ?? "U"}

                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  </div>

                  <div
                    className={cn(
                      "min-w-0 flex-1 overflow-hidden text-left transition-all duration-300 ease-in-out",
                      expanded ? "max-w-44 opacity-100 delay-100" : "max-w-0 opacity-0",
                    )}
                  >
                    <p className="truncate text-sm font-bold text-slate-950">
                      {user.name}
                    </p>

                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Account menu
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 group-hover:bg-slate-100 group-hover:text-slate-700",
                      accountMenuOpen ? "bg-slate-100 text-slate-700" : "",
                      expanded ? "opacity-100 delay-100" : "hidden opacity-0",
                    )}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </div>

                </div>

              </button>

            </div>
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

            <div className="col-start-3 flex shrink-0 items-center justify-end" />
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
