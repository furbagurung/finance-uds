import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteClientButton } from "@/components/delete-client-button";
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

type ClientDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatCurrency(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NP", {
    dateStyle: "medium",
  }).format(date);
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
      projects: {
        orderBy: {
          createdAt: "desc",
        },
      },
      transactions: {
        orderBy: {
          date: "desc",
        },
        include: {
          project: true,
          category: true,
          attachments: true,
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const clientExpenseTransactions = client.transactions.filter(
    (transaction) =>
      transaction.type === "EXPENSE" && transaction.expenseScope === "CLIENT",
  );

  const totalClientExpenses = clientExpenseTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0,
  );

  const billableAmount = clientExpenseTransactions
    .filter((transaction) => transaction.isBillable)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const reimbursedAmount = clientExpenseTransactions
    .filter((transaction) => transaction.isReimbursed)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const recoverableAmount = billableAmount - reimbursedAmount;

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              {client.companyName || client.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Client details, projects, transactions, and recoverable expenses.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/clients">Back to Clients</Link>
            </Button>

            <Button asChild>
              <Link href={`/clients/${client.id}/edit`}>Edit Client</Link>
            </Button>

            <DeleteClientButton clientId={client.id} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Client Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(totalClientExpenses)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Billable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(billableAmount)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Reimbursed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(reimbursedAmount)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">
                Recoverable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(recoverableAmount)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>
              Basic contact and profile details.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Client Name
              </p>
              <p className="mt-1 font-medium">{client.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Company
              </p>
              <p className="mt-1 font-medium">{client.companyName || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Email
              </p>
              <p className="mt-1 font-medium">{client.email || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Phone
              </p>
              <p className="mt-1 font-medium">{client.phone || "-"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-medium uppercase text-slate-500">
                Address
              </p>
              <p className="mt-1 font-medium">{client.address || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Created By
              </p>
              <p className="mt-1 font-medium">
                {client.createdBy?.name || "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Projects linked with this client.</CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {client.projects.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      No projects added for this client.
                    </TableCell>
                  </TableRow>
                ) : (
                  client.projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        {project.name}
                      </TableCell>
                      <TableCell>
                        {project.budget
                          ? formatCurrency(Number(project.budget))
                          : "-"}
                      </TableCell>
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

        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Recent transactions linked with this client.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Done For</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {client.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      No transactions linked with this client.
                    </TableCell>
                  </TableRow>
                ) : (
                  client.transactions.map((transaction) => (
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
                      <TableCell>{transaction.project?.name || "-"}</TableCell>
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
