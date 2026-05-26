"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { cn } from "@/lib/utils";

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
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-4 py-5 lg:block">
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-bold text-yellow-400 shadow-sm">
            U
          </div>

          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-slate-950">
              United Digital
            </p>
            <p className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Finance Tracker
            </p>
          </div>
        </div>

        <Separator className="my-5" />

        <nav className="space-y-1">
          {navItems
            .filter((item) => !item.adminOnly || user.role === "ADMIN")
            .map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-slate-950 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  )}
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
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Welcome back
              </p>
              <p className="text-sm font-semibold text-slate-950">
                {user.name}
              </p>
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
