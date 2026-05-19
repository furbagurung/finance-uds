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

type Category = {
  id: string;
  name: string;
  type: "INVESTMENT" | "INCOME" | "EXPENSE" | "WITHDRAWAL";
};

type UploadedFile = {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
};

const transactionTypes = ["INVESTMENT", "INCOME", "EXPENSE", "WITHDRAWAL"] as const;

const paymentMethods = [
  "CASH",
  "BANK_TRANSFER",
  "ESEWA",
  "KHALTI",
  "CONNECT_IPS",
  "CARD",
  "OTHER",
] as const;

export default function NewTransactionPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<(typeof transactionTypes)[number]>("EXPENSE");
  const [title, setTitle] = useState("");
  const [doneFor, setDoneFor] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof paymentMethods)[number]>("BANK_TRANSFER");
  const [expenseScope, setExpenseScope] = useState<"COMPANY" | "CLIENT">("COMPANY");
  const [categoryId, setCategoryId] = useState("");
  const [isBillable, setIsBillable] = useState(false);
  const [isReimbursed, setIsReimbursed] = useState(false);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => category.type === type);
  }, [categories, type]);

  useEffect(() => {
    async function loadCategories() {
      const response = await fetch("/api/categories");
      const data = await response.json();

      if (response.ok) {
        setCategories(data.categories || []);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    setCategoryId("");
    if (type !== "EXPENSE") {
      setIsBillable(false);
      setIsReimbursed(false);
    }
  }, [type]);

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

    return data.file as UploadedFile;
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
          paidBy,
          doneFor,
          notes,
          categoryId: categoryId || null,
          isBillable: type === "EXPENSE" ? isBillable : false,
          isReimbursed: type === "EXPENSE" ? isReimbursed : false,
          attachment: uploadedFile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create transaction.");
        return;
      }

      router.push("/transactions");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Add Transaction</CardTitle>
            <CardDescription>
              Add investment, income, expense, withdrawal, client cost, or company expense.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) =>
                      setPaymentMethod(value as typeof paymentMethod)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item.replace("_", " ")}
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
                      <SelectItem value="CLIENT">Client / Project Expense</SelectItem>
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
                    <span className="text-sm font-medium">Reimbursed by client</span>
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
                  onClick={() => router.push("/transactions")}
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
      </div>
    </main>
  );
}