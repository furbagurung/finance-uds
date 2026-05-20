import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteProjectButton } from "@/components/delete-project-button";
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

type ProjectDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatCurrency(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function formatDate(date: Date | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("en-NP", {
    dateStyle: "medium",
  }).format(date);
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
      transactions: {
        orderBy: {
          date: "desc",
        },
        include: {
          category: true,
          attachments: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const totalIncome = project.transactions
    .filter((transaction) => transaction.type === "INCOME")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const totalExpenses = project.transactions
    .filter((transaction) => transaction.type === "EXPENSE")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const profitLoss = totalIncome - totalExpenses;

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              {project.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Project details, budget, income, expenses, and profitability.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/projects">Back to Projects</Link>
            </Button>

            <Button asChild>
              <Link href={`/projects/${project.id}/edit`}>Edit Project</Link>
            </Button>

            <DeleteProjectButton projectId={project.id} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {project.budget ? formatCurrency(Number(project.budget)) : "-"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(totalIncome)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(totalExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Profit / Loss
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(profitLoss)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>
              Basic project and client information.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Client
              </p>
              <p className="mt-1 font-medium">
                {project.client ? (
                  <Link
                    href={`/clients/${project.client.id}`}
                    className="hover:text-orange-600 hover:underline"
                  >
                    {project.client.companyName || project.client.name}
                  </Link>
                ) : (
                  "-"
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Status
              </p>
              <div className="mt-1">
                <Badge variant="secondary">
                  {project.status.replaceAll("_", " ")}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Start Date
              </p>
              <p className="mt-1 font-medium">
                {formatDate(project.startDate)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                End Date
              </p>
              <p className="mt-1 font-medium">{formatDate(project.endDate)}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Created By
              </p>
              <p className="mt-1 font-medium">
                {project.createdBy?.name || "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Transactions</CardTitle>
            <CardDescription>
              All income and expenses linked with this project.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Done For</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {project.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      No transactions linked with this project.
                    </TableCell>
                  </TableRow>
                ) : (
                  project.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.date)}</TableCell>

                      <TableCell>
                        <Badge variant="outline">{transaction.type}</Badge>
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/transactions/${transaction.id}`}
                          className="font-medium hover:text-orange-600 hover:underline"
                        >
                          {transaction.doneFor || transaction.title}
                        </Link>
                      </TableCell>

                      <TableCell>{transaction.category?.name || "-"}</TableCell>

                      <TableCell className="font-medium">
                        {formatCurrency(Number(transaction.amount))}
                      </TableCell>

                      <TableCell>
                        {transaction.attachments.length > 0 ? (
                          <Badge variant="secondary">
                            {transaction.attachments.length} file
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">
                            No file
                          </span>
                        )}
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
