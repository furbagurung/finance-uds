import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { CategoryCreateModal } from "@/components/category-create-modal";
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

export default async function CategoriesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
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
  });

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Categories</h1>
            <p className="mt-1 text-sm text-slate-500">
              Categories are used for accounting reports. Most users do not
              need to change them daily.
            </p>
          </div>

          {/* CATEGORY QUICK ACTION
    Add Category now opens a premium modal.
    The old /categories/new page still exists as fallback.
*/}
          <CategoryCreateModal
            triggerLabel="Add Category"
            triggerClassName="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Finance Categories</CardTitle>
            <CardDescription>
              These categories will be used when creating income and expense
              transactions.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          category.type === "INCOME" ? "default" : "secondary"
                        }
                      >
                        {category.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {category.isDefault ? (
                        <Badge variant="outline">Default</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat("en-NP", {
                        dateStyle: "medium",
                      }).format(category.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
