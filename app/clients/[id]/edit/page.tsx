import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { EditClientForm } from "@/components/edit-client-form";
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
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Edit Client</h1>
          <p className="mt-1 text-sm text-slate-500">
            Update client profile and contact details.
          </p>
        </div>

        <EditClientForm client={client} />
      </div>
    </DashboardShell>
  );
}