"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BranchSelectField,
  type BranchOption,
} from "@/components/branch-select-field";
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
  projectType?: string | null;
  currency?: string | null;
  clientId: string | null;
  branchId?: string | null;
  branch?: {
    id: string;
    currency: string;
  } | null;
};

type RetainerBilling = {
  id: string;
  month: number;
  year: number;
  status: string;
  expectedAmount: string | number;
  receivedAmount: string | number;
  pendingAmount: string | number;
  currency: string | null;
  projectId: string;
  clientId: string | null;
  project: Project;
  client: Client | null;
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
  retainerBillingId: string | null;
  branchId: string | null;
  currency: string | null;
};

type EditTransactionFormProps = {
  transaction: Transaction;
  categories: Category[];
  clients: Client[];
  projects: Project[];
  branches: BranchOption[];
  retainerBillings: RetainerBilling[];
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

const monthLabels = new Map(
  [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ].map((label, index) => [index + 1, label]),
);

function getCurrencyPrefix(currency?: string | null) {
  if (!currency || currency === "NPR") {
    return "Rs.";
  }

  return currency;
}

function formatRetainerMoney(amount: string | number, currency?: string | null) {
  return `${getCurrencyPrefix(currency)} ${Number(amount || 0).toLocaleString(
    "en-IN"
  )}`;
}

function formatRetainerMonth(billing: RetainerBilling) {
  const monthLabel = monthLabels.get(billing.month) || String(billing.month);

  return `${monthLabel} ${billing.year}`;
}

function toDateInputValue(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function EditTransactionForm({
  transaction,
  categories,
  clients,
  projects,
  branches,
  retainerBillings,
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
  const [retainerBillingId, setRetainerBillingId] = useState(
    transaction.retainerBillingId || ""
  );
  const [branchId, setBranchId] = useState(transaction.branchId || "");
  const [currency, setCurrency] = useState(transaction.currency || "");
  const [currencyTouched, setCurrencyTouched] = useState(false);
  const [paidBy, setPaidBy] = useState(transaction.paidBy || "");
  const [doneFor, setDoneFor] = useState(transaction.doneFor || "");
  const [title, setTitle] = useState(transaction.title || "");
  const [isBillable, setIsBillable] = useState(transaction.isBillable);
  const [isReimbursed, setIsReimbursed] = useState(transaction.isReimbursed);
  const [notes, setNotes] = useState(transaction.notes || "");
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => category.type === type);
  }, [categories, type]);

  const filteredProjects = useMemo(() => {
    if (!clientId) return projects;

    return projects.filter((project) => project.clientId === clientId);
  }, [projects, clientId]);

  const selectedProject = useMemo(() => {
    return projects.find((project) => project.id === projectId) || null;
  }, [projectId, projects]);

  const selectedBranch = useMemo(() => {
    return branches.find((branch) => branch.id === branchId) || null;
  }, [branchId, branches]);

  const shouldShowRetainerBilling =
    type === "INCOME" &&
    Boolean(selectedProject) &&
    selectedProject?.projectType === "MONTHLY_RETAINER";

  const filteredRetainerBillings = useMemo(() => {
    if (!shouldShowRetainerBilling || !projectId) {
      return [];
    }

    const openOrCurrentBillings = retainerBillings.filter(
      (billing) =>
        billing.id === retainerBillingId ||
        (billing.projectId === projectId &&
          ["PENDING", "PARTIALLY_PAID", "OVERDUE"].includes(billing.status))
    );

    return openOrCurrentBillings;
  }, [
    projectId,
    retainerBillingId,
    retainerBillings,
    shouldShowRetainerBilling,
  ]);

  const displayCurrency =
    currency || selectedProject?.currency || selectedBranch?.currency || "NPR";

  const selectedRetainerBilling = useMemo(() => {
    return (
      filteredRetainerBillings.find(
        (billing) => billing.id === retainerBillingId
      ) || null
    );
  }, [filteredRetainerBillings, retainerBillingId]);

  useEffect(() => {
    if (!shouldShowRetainerBilling) {
      setRetainerBillingId("");
      return;
    }

    if (filteredRetainerBillings.length === 1) {
      setRetainerBillingId(filteredRetainerBillings[0].id);
      return;
    }

    if (
      retainerBillingId &&
      !filteredRetainerBillings.some((billing) => billing.id === retainerBillingId)
    ) {
      setRetainerBillingId("");
    }
  }, [filteredRetainerBillings, retainerBillingId, shouldShowRetainerBilling]);

  function handleTypeChange(value: string) {
    const nextType = value as TransactionType;

    setType(nextType);
    setCategoryId("");

    if (nextType !== "EXPENSE") {
      setIsBillable(false);
      setIsReimbursed(false);
    }

    if (nextType !== "INCOME") {
      setRetainerBillingId("");
    }
  }

  function handleClientChange(value: string) {
    setClientId(value);
    setProjectId("");
    setRetainerBillingId("");
  }

  function handleProjectChange(value: string) {
    const selectedProject =
      projects.find((project) => project.id === value) || null;

    setProjectId(value);
    if (selectedProject?.projectType !== "MONTHLY_RETAINER") {
      setRetainerBillingId("");
    }

    if (!clientId && selectedProject?.clientId) {
      setClientId(selectedProject.clientId);
    }

    if (selectedProject?.branchId) {
      setBranchId(selectedProject.branchId);
    }

    if (!currencyTouched) {
      setCurrency(selectedProject?.currency || selectedProject?.branch?.currency || "");
    }
  }

  function handleBranchChange(value: string) {
    setBranchId(value);

    if (currencyTouched) return;

    const selectedBranch = branches.find((branch) => branch.id === value);
    setCurrency(selectedBranch?.currency || "");
  }

  function handleCurrencyChange(value: string) {
    setCurrencyTouched(true);
    setCurrency(value.toUpperCase());
  }

  function formatRetainerBillingLabel(billing: RetainerBilling) {
    const monthLabel = monthLabels.get(billing.month) || String(billing.month);
    const expectedAmount = Number(billing.expectedAmount || 0).toLocaleString(
      "en-IN"
    );
    const pendingAmount = Number(billing.pendingAmount || 0).toLocaleString(
      "en-IN"
    );
    const currencyPrefix = getCurrencyPrefix(billing.currency);

    return `${monthLabel} ${billing.year} - Expected ${currencyPrefix} ${expectedAmount} - Pending ${currencyPrefix} ${pendingAmount}`;
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
          retainerBillingId:
            shouldShowRetainerBilling && retainerBillingId
              ? retainerBillingId
              : null,
          branchId: branchId || null,
          branchIdTouched: true,
          currency: currency || null,
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
          Update transaction details, client, project, category, and monthly
          payment tracking.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {type === "INCOME" ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Client & Project
              </h3>
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
                  <Select value={projectId} onValueChange={handleProjectChange}>
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

              {shouldShowRetainerBilling ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2">
                  <p className="text-sm font-semibold text-emerald-900">
                    Monthly payment project
                  </p>
                  <p className="mt-1 text-xs text-emerald-800">
                    {filteredRetainerBillings.length === 1 &&
                    selectedRetainerBilling
                      ? `Open payment month: ${formatRetainerMonth(
                          selectedRetainerBilling,
                        )} - Pending ${formatRetainerMoney(
                          selectedRetainerBilling.pendingAmount,
                          selectedRetainerBilling.currency,
                        )}`
                      : null}
                    {filteredRetainerBillings.length > 1
                      ? `${filteredRetainerBillings.length} open payment months. Select one in Advanced Accounting Details.`
                      : null}
                    {filteredRetainerBillings.length === 0
                      ? "No open payment month found. You can still save this payment without linking."
                      : null}
                  </p>
                  <p className="mt-1 text-xs text-emerald-800">
                    Select the payment month only if you want this payment to
                    update monthly tracking.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Payment Details
            </h3>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-slate-200 px-2.5 text-sm font-medium text-slate-500">
                    {getCurrencyPrefix(displayCurrency)}
                  </span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    min="1"
                    className="pl-12"
                  />
                </div>
              </div>

              {type === "EXPENSE" ? (
                <div className="space-y-2">
                  <Label>Expense Category</Label>
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
              ) : null}

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

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Remarks</Label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          {type === "EXPENSE" ? (
            <>
              <div className="space-y-2">
                <Label>Expense Scope</Label>
                <Select
                  value={expenseScope}
                  onValueChange={(value) =>
                    setExpenseScope(value as ExpenseScope)
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

              <div className="space-y-3 rounded-xl border p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Optional Client/Project Link
                </h3>
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
                    <Select value={projectId} onValueChange={handleProjectChange}>
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
                  <label className="flex items-center gap-3 rounded-xl border p-4">
                    <Checkbox
                      checked={isBillable}
                      onCheckedChange={(checked) =>
                        setIsBillable(Boolean(checked))
                      }
                    />
                    <span className="text-sm font-medium">
                      Billable to client
                    </span>
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
              </div>
            </>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setShowAdvancedDetails((current) => !current)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              aria-expanded={showAdvancedDetails}
            >
              <span className="text-sm font-medium text-slate-900">
                Advanced Accounting Details
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform ${
                  showAdvancedDetails ? "rotate-180" : ""
                }`}
              />
            </button>

            {showAdvancedDetails ? (
              <div className="space-y-4 border-t border-slate-200 p-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {type !== "EXPENSE" ? (
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
                  ) : null}

                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <BranchSelectField
                      value={branchId}
                      onValueChange={handleBranchChange}
                      placeholder="Select branch"
                      showCurrency
                      branches={branches}
                      allowUnassigned
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input
                      value={currency}
                      onChange={(event) =>
                        handleCurrencyChange(event.target.value)
                      }
                      placeholder={selectedBranch?.currency || "NPR"}
                    />
                  </div>
                </div>

                {shouldShowRetainerBilling &&
                filteredRetainerBillings.length > 1 ? (
                  <div className="space-y-2">
                    <Label>Payment Month</Label>
                    <Select
                      value={retainerBillingId || "NONE"}
                      onValueChange={(value) =>
                        setRetainerBillingId(value === "NONE" ? "" : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">No monthly payment</SelectItem>
                        {filteredRetainerBillings.map((billing) => (
                          <SelectItem key={billing.id} value={billing.id}>
                            {formatRetainerBillingLabel(billing)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add extra details..."
                  />
                </div>
              </div>
            ) : null}
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
