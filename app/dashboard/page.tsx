import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { LogoutButton } from "@/components/logout-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-orange-500">
                United Digital Service
              </p>

              <CardTitle className="mt-2 text-3xl">
                Finance Dashboard
              </CardTitle>

              <CardDescription className="mt-2">
                Welcome back, {user.name}. You are logged in as {user.role}.
              </CardDescription>
            </div>

            <LogoutButton />
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-slate-500">
            Dashboard setup will continue in the next module.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}