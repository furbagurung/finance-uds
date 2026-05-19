import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
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
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage default income and expense categories for United Digital
            Service.
          </p>
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