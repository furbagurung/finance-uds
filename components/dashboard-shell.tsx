import Link from "next/link";
import {
  Activity,
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Tags,
  Users,
  BriefcaseBusiness,
  BarChart3,
  DatabaseBackup,
  Settings,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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
    title: "Expenses",
    href: "/expenses",
    icon: Wallet,
  },
  {
    title: "Income",
    href: "/income",
    icon: TrendingUp,
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
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
  };
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-4 py-5 lg:block">
        <div className="px-3 flex items-center gap-3">
          <img
            src="/uds.svg"
            alt="UDS Logo"
            className="h-12 w-auto flex-shrink-0"
          />
          <div className="flex flex-col">
            <p style={{ fontFamily: "Ibrand", color: "#15223e" }}>Finance</p>
            <p style={{ fontFamily: "Ibrand", color: "#15223e" }}>Tracker</p>
          </div>
        </div>

        <Separator className="my-5" />

        <nav className="space-y-1">
          {navItems
            .filter((item) => !item.adminOnly || user.role === "ADMIN")
            .map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Welcome back,
              </p>
              <h2 className="text-base font-semibold text-slate-950">
                {user.name}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary">{user.role}</Badge>
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
