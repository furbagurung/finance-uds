import { notFound, redirect } from "next/navigation";
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

  const categories = await prisma.category.findMany({
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
  });

  const clients = await prisma.client.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      companyName: true,
    },
  });

  const projects = await prisma.project.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      clientId: true,
    },
  });
const plainTransaction = {
  ...transaction,
  amount: Number(transaction.amount),
  date: transaction.date,
};
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
        />
      </div>
    </DashboardShell>
  );
}