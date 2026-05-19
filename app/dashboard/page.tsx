import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Finance Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track income, expenses, projects, and company financial activity.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">Rs. 0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">Rs. 0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Net Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">Rs. 0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-950">Rs. 0</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}