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

export default async function ClientWiseReportPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const clients = await prisma.client.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      transactions: {
        where: {
          type: "EXPENSE",
          expenseScope: "CLIENT",
        },
        select: {
          amount: true,
          isBillable: true,
          isReimbursed: true,
        },
      },
    },
  });

  const reportRows = clients.map((client) => {
    const totalExpenses = client.transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );

    const billableExpenses = client.transactions
      .filter((transaction) => transaction.isBillable)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const reimbursedExpenses = client.transactions
      .filter((transaction) => transaction.isReimbursed)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const recoverableAmount = billableExpenses - reimbursedExpenses;

    return {
      id: client.id,
      name: client.name,
      companyName: client.companyName,
      totalExpenses,
      billableExpenses,
      reimbursedExpenses,
      recoverableAmount,
      transactionCount: client.transactions.length,
    };
  });

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Client-wise Report
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View client expenses, billable costs, reimbursements, and recoverable
            amounts.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Expense Summary</CardTitle>
            <CardDescription>
              This report only includes transactions marked as client expenses.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Total Expenses</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead>Reimbursed</TableHead>
                  <TableHead>Recoverable</TableHead>
                  <TableHead>Transactions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {reportRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      No client-wise data available yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  reportRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium text-slate-950">
                          {row.companyName || row.name}
                        </div>
                        {row.companyName ? (
                          <div className="text-xs text-slate-500">
                            {row.name}
                          </div>
                        ) : null}
                      </TableCell>

                      <TableCell className="font-medium">
                        {formatCurrency(row.totalExpenses)}
                      </TableCell>

                      <TableCell>{formatCurrency(row.billableExpenses)}</TableCell>

                      <TableCell>
                        {formatCurrency(row.reimbursedExpenses)}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            row.recoverableAmount > 0 ? "default" : "secondary"
                          }
                        >
                          {formatCurrency(row.recoverableAmount)}
                        </Badge>
                      </TableCell>

                      <TableCell>{row.transactionCount}</TableCell>
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