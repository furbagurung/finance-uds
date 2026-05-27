import { notFound, redirect } from "next/navigation";
import { ClientForm } from "@/components/client-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type EditClientPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditClientPage({ params }: EditClientPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
  });

  if (!client) {
    notFound();
  }

  return (
    <DashboardShell user={user}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Client CRM
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
            Edit Client
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Update client identity, contact details, digital presence, and internal notes.
          </p>
        </div>

        <ClientForm initialData={client} />
      </div>
    </DashboardShell>
  );
}