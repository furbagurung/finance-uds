import { redirect } from "next/navigation";
import { ActivityFilters } from "@/components/activity-filters";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-NP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type ActivityPageProps = {
  searchParams: Promise<{
    action?: string;
    entity?: string;
  }>;
};

export default async function ActivityPage({
  searchParams,
}: ActivityPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const selectedAction =
    params.action && params.action !== "ALL" ? params.action : "";

  const selectedEntity =
    params.entity && params.entity !== "ALL" ? params.entity : "";

  const activityWhere = {
    ...(selectedAction ? { action: selectedAction } : {}),
    ...(selectedEntity ? { entity: selectedEntity } : {}),
  };

  const logs = await prisma.activityLog.findMany({
    where: activityWhere,
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Activity Logs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track important finance dashboard actions such as transaction
            creation, edits, deletions, and uploads.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter logs by action type and entity.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ActivityFilters
              selectedAction={selectedAction}
              selectedEntity={selectedEntity}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Showing latest 100 logged actions.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      No activity logs yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDateTime(log.createdAt)}</TableCell>

                      <TableCell>
                        <Badge variant="secondary">{log.action}</Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">{log.entity}</Badge>
                      </TableCell>

                      <TableCell className="font-medium">
                        {log.message}
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {log.user?.name || "System"}
                          </p>
                          {log.user?.email ? (
                            <p className="text-xs text-slate-500">
                              {log.user.email}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
