import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ClientCreateModal } from "@/components/client-create-modal";
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

export default async function ClientsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const clients = await prisma.client.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          projects: true,
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
            <h1 className="text-3xl font-bold text-slate-950">Clients</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage clients for billing, projects, and client-wise expenses.
            </p>
          </div>

          {/* CLIENT QUICK ACTION
    Add Client now opens a premium modal.
    The old /clients/new page still exists as fallback.
*/}
          <ClientCreateModal
            triggerLabel="Add Client"
            triggerClassName="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client List</CardTitle>
            <CardDescription>
              These clients can later be linked with projects and transactions.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      No clients added yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/clients/${client.id}`}
                          className="hover:text-orange-600 hover:underline"
                        >
                          {client.name}
                        </Link>
                      </TableCell>

                      <TableCell>{client.companyName || "-"}</TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <p>{client.email || "-"}</p>
                          <p className="text-xs text-slate-500">
                            {client.phone || ""}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>{client._count.projects}</TableCell>

                      <TableCell>{client._count.transactions}</TableCell>

                      <TableCell>
                        <Badge variant="secondary">{client.status}</Badge>
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
