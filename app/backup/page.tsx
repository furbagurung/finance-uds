import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/current-user";

const exports = [
  {
    title: "Transactions",
    description:
      "Export all transaction records including income, expenses, withdrawals, clients, projects, and receipts count.",
    href: "/api/transactions/export",
  },
  {
    title: "Clients",
    description:
      "Export client contact details, project count, transaction count, and creator information.",
    href: "/api/clients/export",
  },
  {
    title: "Projects",
    description:
      "Export project budgets, status, client linkage, timeline, and transaction count.",
    href: "/api/projects/export",
  },
  {
    title: "Categories",
    description:
      "Export default and custom finance categories used in transactions.",
    href: "/api/categories/export",
  },
];

export default async function BackupPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Backup & Export
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Download important finance data as CSV files for backup or
            reporting.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {exports.map((item) => (
            <Card key={item.href}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <Button asChild>
                  <Link href={item.href} target="_blank">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
