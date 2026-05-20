"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type TransactionType = "INVESTMENT" | "INCOME" | "EXPENSE" | "WITHDRAWAL";

type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "ESEWA"
  | "KHALTI"
  | "CONNECT_IPS"
  | "CARD"
  | "OTHER";

type ExpenseScope = "COMPANY" | "CLIENT";

type Category = {
  id: string;
  name: string;
  type: TransactionType;
};

type Client = {
  id: string;
  name: string;
  companyName: string | null;
};

type Project = {
  id: string;
  name: string;
  clientId: string | null;
};

type Transaction = {
  id: string;
  type: TransactionType;
  title: string;
  amount: unknown;
  date: Date;
  paymentMethod: PaymentMethod;
  expenseScope: ExpenseScope | null;
  paidBy: string | null;
  doneFor: string | null;
  notes: string | null;
  isBillable: boolean;
  isReimbursed: boolean;
  categoryId: string | null;
  clientId: string | null;
  projectId: string | null;
};

type EditTransactionFormProps = {
  transaction: Transaction;
  categories: Category[];
  clients: Client[];
  projects: Project[];
};

const transactionTypes: TransactionType[] = [
  "INVESTMENT",
  "INCOME",
  "EXPENSE",
  "WITHDRAWAL",
];

const paymentMethods: PaymentMethod[] = [
  "CASH",
  "BANK_TRANSFER",
  "ESEWA",
  "KHALTI",
  "CONNECT_IPS",
  "CARD",
  "OTHER",
];

function toDateInputValue(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function EditTransactionForm({
  transaction,
  categories,
  clients,
  projects,
}: EditTransactionFormProps) {
  const router = useRouter();

  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [date, setDate] = useState(toDateInputValue(transaction.date));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    transaction.paymentMethod
  );
  const [expenseScope, setExpenseScope] = useState<ExpenseScope>(
    transaction.expenseScope || "COMPANY"
  );
  const [categoryId, setCategoryId] = useState(transaction.categoryId || "");
  const [clientId, setClientId] = useState(transaction.clientId || "");
  const [projectId, setProjectId] = useState(transaction.projectId || "");
  const [paidBy, setPaidBy] = useState(transaction.paidBy || "");
  const [doneFor, setDoneFor] = useState(transaction.doneFor || "");
  const [title, setTitle] = useState(transaction.title || "");
  const [isBillable, setIsBillable] = useState(transaction.isBillable);
  const [isReimbursed, setIsReimbursed] = useState(transaction.isReimbursed);
  const [notes, setNotes] = useState(transaction.notes || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => category.type === type);
  }, [categories, type]);

  const filteredProjects = useMemo(() => {
    if (!clientId) return projects;

    return projects.filter((project) => project.clientId === clientId);
  }, [projects, clientId]);

  function handleTypeChange(value: string) {
    const nextType = value as TransactionType;

    setType(nextType);
    setCategoryId("");

    if (nextType !== "EXPENSE") {
      setIsBillable(false);
      setIsReimbursed(false);
    }
  }

  function handleClientChange(value: string) {
    setClientId(value);
    setProjectId("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          title: title || doneFor,
          amount: Number(amount),
          date,
          paymentMethod,
          expenseScope: type === "EXPENSE" ? expenseScope : null,
          categoryId: categoryId || null,
          clientId: clientId || null,
          projectId: projectId || null,
          paidBy,
          doneFor,
          isBillable: type === "EXPENSE" ? isBillable : false,
          isReimbursed: type === "EXPENSE" ? isReimbursed : false,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update transaction.");
        return;
      }

      router.push(`/transactions/${transaction.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong while updating transaction.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Transaction</CardTitle>
        <CardDescription>
          Update transaction details, client, project, category, and billing
          status.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as PaymentMethod)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === "EXPENSE" ? (
            <div className="space-y-2">
              <Label>Expense Scope</Label>
              <Select
                value={expenseScope}
                onValueChange={(value) => setExpenseScope(value as ExpenseScope)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expense scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPANY">Company Expense</SelectItem>
                  <SelectItem value="CLIENT">
                    Client / Project Expense
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={handleClientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.companyName || client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Paid By / Source</Label>
              <Input
                value={paidBy}
                onChange={(event) => setPaidBy(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Done For</Label>
              <Input
                value={doneFor}
                onChange={(event) => setDoneFor(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          {type === "EXPENSE" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border p-4">
                <Checkbox
                  checked={isBillable}
                  onCheckedChange={(checked) =>
                    setIsBillable(Boolean(checked))
                  }
                />
                <span className="text-sm font-medium">Billable to client</span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border p-4">
                <Checkbox
                  checked={isReimbursed}
                  onCheckedChange={(checked) =>
                    setIsReimbursed(Boolean(checked))
                  }
                />
                <span className="text-sm font-medium">
                  Reimbursed by client
                </span>
              </label>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add extra details..."
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/transactions/${transaction.id}`)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}