import { notFound, redirect } from "next/navigation";
import { RetainerBillingStatus } from "@prisma/client";
import { DashboardShell } from "@/components/dashboard-shell";
import { EditTransactionForm } from "@/components/edit-transaction-form";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type EditTransactionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditTransactionPage({
  params,
}: EditTransactionPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: {
      id,
    },
  });

  if (!transaction) {
    notFound();
  }

  const [categories, clients, projects, branches, retainerBillings] = await Promise.all([
    prisma.category.findMany({
    orderBy: [
      {
        type: "asc",
      },
      {
        name: "asc",
      },
    ],
    select: {
      id: true,
      name: true,
      type: true,
    },
    }),
    prisma.client.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      companyName: true,
    },
    }),
    prisma.project.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      projectType: true,
      currency: true,
      clientId: true,
      branchId: true,
      branch: {
        select: {
          id: true,
          currency: true,
        },
      },
    },
    }),
    prisma.branch.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        code: true,
        country: true,
        currency: true,
        calendarSystem: true,
        fiscalYearType: true,
        isActive: true,
      },
    }),
    prisma.retainerBilling.findMany({
      where: {
        OR: [
          {
            status: {
              in: [
                RetainerBillingStatus.PENDING,
                RetainerBillingStatus.PARTIALLY_PAID,
                RetainerBillingStatus.OVERDUE,
              ],
            },
          },
          ...(transaction.retainerBillingId
            ? [{ id: transaction.retainerBillingId }]
            : []),
        ],
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectType: true,
            currency: true,
            clientId: true,
            branchId: true,
            branch: {
              select: {
                id: true,
                currency: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
      },
    }),
  ]);

  const plainTransaction = {
    ...transaction,
    amount: Number(transaction.amount),
    date: transaction.date,
  };

  const plainRetainerBillings = retainerBillings.map((billing) => ({
    ...billing,
    expectedAmount: Number(billing.expectedAmount),
    receivedAmount: Number(billing.receivedAmount),
    pendingAmount: Number(billing.pendingAmount),
  }));

  return (
    <DashboardShell user={user}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Edit Transaction
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Update transaction details and financial classification.
          </p>
        </div>

        <EditTransactionForm
          transaction={plainTransaction}
          categories={categories}
          clients={clients}
          projects={projects}
          branches={branches}
          retainerBillings={plainRetainerBillings}
        />
      </div>
    </DashboardShell>
  );
}
