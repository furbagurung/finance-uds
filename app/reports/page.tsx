import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, BriefcaseBusiness, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/current-user";

const reports = [
  {
    title: "Client-wise Report",
    description:
      "View client expenses, billable costs, reimbursements, and recoverable amounts.",
    href: "/reports/client-wise",
    icon: Users,
  },
  {
    title: "Project-wise Report",
    description:
      "Track project budget, income, expenses, and project-wise profit or loss.",
    href: "/reports/project-wise",
    icon: BriefcaseBusiness,
  },
];

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            View financial reports for clients, projects, expenses, and agency
            performance.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => {
            const Icon = report.icon;

            return (
              <Link key={report.href} href={report.href}>
                <Card className="h-full transition hover:bg-slate-50">
                  <CardHeader>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      <Icon className="h-5 w-5 text-slate-700" />
                    </div>

                    <CardTitle>{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm font-medium text-orange-600">
                      View report →
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}