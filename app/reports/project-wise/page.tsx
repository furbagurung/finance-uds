import { redirect } from "next/navigation";
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

function formatCurrency(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

export default async function ProjectWiseReportPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      client: true,
      transactions: {
        select: {
          type: true,
          amount: true,
        },
      },
    },
  });

  const reportRows = projects.map((project) => {
    const totalIncome = project.transactions
      .filter((transaction) => transaction.type === "INCOME")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const totalExpenses = project.transactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const profitLoss = totalIncome - totalExpenses;

    return {
      id: project.id,
      name: project.name,
      clientName: project.client?.name || "-",
      budget: project.budget ? Number(project.budget) : 0,
      totalIncome,
      totalExpenses,
      profitLoss,
      transactionCount: project.transactions.length,
      status: project.status,
    };
  });

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Project-wise Report
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track project budget, income, expenses, and profitability.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Financial Summary</CardTitle>
            <CardDescription>
              This report helps you understand project-wise profit and loss.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead>Profit / Loss</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {reportRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      No project-wise data available yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  reportRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.name}
                      </TableCell>

                      <TableCell>{row.clientName}</TableCell>

                      <TableCell>{formatCurrency(row.budget)}</TableCell>

                      <TableCell>{formatCurrency(row.totalIncome)}</TableCell>

                      <TableCell>{formatCurrency(row.totalExpenses)}</TableCell>

                      <TableCell>
                        <Badge
                          variant={row.profitLoss >= 0 ? "default" : "secondary"}
                        >
                          {formatCurrency(row.profitLoss)}
                        </Badge>
                      </TableCell>

                      <TableCell>{row.transactionCount}</TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {row.status.replaceAll("_", " ")}
                        </Badge>
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