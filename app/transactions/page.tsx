import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

function formatCurrency(amount: unknown) {
    return `Rs. ${Number(amount).toLocaleString("en-IN")}`;
}

export default async function TransactionsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const transactions = await prisma.transaction.findMany({
        orderBy: {
            date: "desc",
        },
        include: {
            category: true,
            client: true,
            project: true,
            attachments: true,
            createdBy: {
                select: {
                    name: true,
                },
            },
        },
        take: 100,
    });

    return (
        <DashboardShell user={user}>
            <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-950">Transactions</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Track investments, income, expenses, withdrawals, and client costs.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/transactions/new">Add Transaction</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>
                            This follows your spreadsheet flow: date, paid by, done for,
                            amount, and receipt/invoice.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Paid By</TableHead>
                                    <TableHead>Done For</TableHead>
                                    <TableHead>Scope</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Receipt</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="py-10 text-center text-sm text-slate-500"
                                        >
                                            No transactions added yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((transaction) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell>
                                                {new Intl.DateTimeFormat("en-NP", {
                                                    dateStyle: "medium",
                                                }).format(transaction.date)}
                                            </TableCell>

                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        transaction.type === "INCOME" ||
                                                            transaction.type === "INVESTMENT"
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {transaction.type}
                                                </Badge>
                                            </TableCell>

                                            <TableCell>{transaction.paidBy || "-"}</TableCell>

                                            <TableCell>
                                                <div className="font-medium text-slate-950">
                                                    {transaction.doneFor || transaction.title}
                                                </div>
                                                {transaction.category ? (
                                                    <div className="text-xs text-slate-500">
                                                        {transaction.category.name}
                                                    </div>
                                                ) : null}
                                            </TableCell>

                                            <TableCell>{transaction.expenseScope || "-"}</TableCell>

                                            <TableCell className="font-semibold">
                                                {formatCurrency(transaction.amount)}
                                            </TableCell>

                                            <TableCell>
                                                {transaction.attachments.length > 0 ? (
                                                    <Badge variant="outline">
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