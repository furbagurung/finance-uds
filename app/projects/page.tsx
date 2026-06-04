import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { BranchBadge } from "@/components/branch-badge";
import { Badge } from "@/components/ui/badge";
import { ProjectCreateModal } from "@/components/project-create-modal";
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

function formatCurrency(amount: unknown) {
  if (!amount) return "-";
  return `Rs. ${Number(amount).toLocaleString("en-IN")}`;
}

function formatDate(date: Date | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-NP", {
    dateStyle: "medium",
  }).format(date);
}

export default async function ProjectsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: "desc",
    },
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
      client: {
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
        },
      },
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Projects</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track client projects, budgets, timelines, and project-wise
              transactions.
            </p>
          </div>

         {/* PROJECT QUICK ACTION
    Add Project now opens a premium modal.
    The old /projects/new page still exists as fallback.
*/}
<ProjectCreateModal
  triggerLabel="Add Project"
  triggerClassName="h-10 cursor-pointer rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition hover:bg-slate-800"
/>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project List</CardTitle>
            <CardDescription>
              These projects can be linked with income, expenses, ads spend, and
              client billing.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      No projects added yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/projects/${project.id}`}
                          className="hover:text-orange-600 hover:underline"
                        >
                          {project.name}
                        </Link>
                      </TableCell>

                      <TableCell>{project.client?.name || "-"}</TableCell>

                      <TableCell>
                        {project.branch ? (
                          <BranchBadge branch={project.branch} />
                        ) : (
                          "-"
                        )}
                      </TableCell>

                      <TableCell>{formatCurrency(project.budget)}</TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {formatDate(project.startDate)}
                        </div>
                        <div className="text-xs text-slate-500">
                          to {formatDate(project.endDate)}
                        </div>
                      </TableCell>

                      <TableCell>{project._count.transactions}</TableCell>

                      <TableCell>
                        <Badge variant="secondary">{project.status}</Badge>
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
