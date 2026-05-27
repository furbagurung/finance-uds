"use client";

import { useEffect, useMemo, useState } from "react";
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

type Category = {
  id: string;
  name: string;
  type: TransactionType;
};
type Client = {
  id: string;
  name: string;
  companyName?: string | null;
};

type Project = {
  id: string;
  name: string;
  clientId?: string | null;
  client?: Client | null;
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

type TransactionFormProps = {
  defaultType?: string;

  /**
   * page  = normal full page form
   * modal = form used inside popup modal
   */
  mode?: "page" | "modal";

  /**
   * Runs after successful transaction creation.
   * Useful for closing modal from parent component.
   */
  onSuccess?: () => void;

  /**
   * Runs when cancel is clicked.
   * Useful for closing modal instead of redirecting.
   */
  onCancel?: () => void;
};

export function TransactionForm({
  defaultType,
  mode = "page",
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const initialType: TransactionType =
    defaultType === "INVESTMENT" ||
      defaultType === "INCOME" ||
      defaultType === "EXPENSE" ||
      defaultType === "WITHDRAWAL"
      ? defaultType
      : "EXPENSE";

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("BANK_TRANSFER");
  const [expenseScope, setExpenseScope] = useState<"COMPANY" | "CLIENT">(
    "COMPANY",
  );
  const [categoryId, setCategoryId] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [doneFor, setDoneFor] = useState("");
  const [title, setTitle] = useState("");
  const [isBillable, setIsBillable] = useState(false);
  const [isReimbursed, setIsReimbursed] = useState(false);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => category.type === type);
  }, [categories, type]);

  const filteredProjects = useMemo(() => {
    if (!clientId) return projects;

    return projects.filter((project) => project.clientId === clientId);
  }, [projects, clientId]);

  useEffect(() => {
    async function loadInitialData() {
      const [categoriesResponse, clientsResponse, projectsResponse] =
        await Promise.all([
          fetch("/api/categories"),
          fetch("/api/clients"),
          fetch("/api/projects"),
        ]);

      const categoriesData = await categoriesResponse.json();
      const clientsData = await clientsResponse.json();
      const projectsData = await projectsResponse.json();

      if (categoriesResponse.ok) {
        setCategories(categoriesData.categories || []);
      }

      if (clientsResponse.ok) {
        setClients(clientsData.clients || []);
      }

      if (projectsResponse.ok) {
        setProjects(projectsData.projects || []);
      }
    }

    loadInitialData();
  }, []);


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
  async function uploadReceipt() {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/uploads/receipts", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Receipt upload failed.");
    }

    return data.file;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const uploadedFile = await uploadReceipt();

      const response = await fetch("/api/transactions", {
        method: "POST",
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
          attachment: uploadedFile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create transaction.");
        return;
      }
      if (mode === "modal") {
        router.refresh();
        onSuccess?.();
        return;
      }

      router.push("/transactions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Transaction</CardTitle>
        <CardDescription>
          Add investment, income, company expense, client expense, or
          withdrawal.
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
                placeholder="2075"
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
                onValueChange={(value) =>
                  setExpenseScope(value as "COMPANY" | "CLIENT")
                }
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
                placeholder="Aman Account / Vedika Nabil / Furba Cash"
              />
            </div>

            <div className="space-y-2">
              <Label>Done For</Label>
              <Input
                value={doneFor}
                onChange={(event) => setDoneFor(event.target.value)}
                placeholder="Figma Payment for January"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional. If empty, Done For will be used."
            />
          </div>

          {type === "EXPENSE" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border p-4">
                <Checkbox
                  checked={isBillable}
                  onCheckedChange={(checked) => setIsBillable(Boolean(checked))}
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
            <Label>Receipt / Invoice</Label>
            <Input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </div>

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
              onClick={() => {
                if (mode === "modal") {
                  onCancel?.();
                  return;
                }

                router.push("/transactions");
              }}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Transaction"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
