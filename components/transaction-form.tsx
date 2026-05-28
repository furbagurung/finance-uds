"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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

type Employee = {
  id: string;
  fullName: string;
  email: string;
  position?: string | null;
  salaryAmount?: string | number | null;
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

const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
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
  const [employees, setEmployees] = useState<Employee[]>([]);

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
  const currentDate = new Date();

  const [isSalaryExpense, setIsSalaryExpense] = useState(false);
  const [salaryEmployeeId, setSalaryEmployeeId] = useState("");
  const [salaryMonth, setSalaryMonth] = useState(
    String(currentDate.getMonth() + 1),
  );
  const [salaryYear, setSalaryYear] = useState(
    String(currentDate.getFullYear()),
  );
  const [salaryBasicSalary, setSalaryBasicSalary] = useState("");
  const [salaryBonus, setSalaryBonus] = useState("0");
  const [salaryDeduction, setSalaryDeduction] = useState("0");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => category.type === type);
  }, [categories, type]);

  const filteredProjects = useMemo(() => {
    if (!clientId) return projects;

    return projects.filter((project) => project.clientId === clientId);
  }, [projects, clientId]);

  const salaryNetPay = useMemo(() => {
    const basic = Number(salaryBasicSalary || 0);
    const bonus = Number(salaryBonus || 0);
    const deduction = Number(salaryDeduction || 0);

    return basic + bonus - deduction;
  }, [salaryBasicSalary, salaryBonus, salaryDeduction]);

  useEffect(() => {
    async function loadInitialData() {
      const [
        categoriesResponse,
        clientsResponse,
        projectsResponse,
        employeesResponse,
      ] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/clients"),
        fetch("/api/projects"),
        fetch("/api/employees"),
      ]);

      const categoriesData = await categoriesResponse.json();
      const clientsData = await clientsResponse.json();
      const projectsData = await projectsResponse.json();
      const employeesData = await employeesResponse.json();
      if (categoriesResponse.ok) {
        setCategories(categoriesData.categories || []);
      }

      if (clientsResponse.ok) {
        setClients(clientsData.clients || []);
      }

      if (projectsResponse.ok) {
        setProjects(projectsData.projects || []);
      }
      if (employeesResponse.ok) {
        setEmployees(employeesData.employees || []);
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
      setIsSalaryExpense(false);
      setExpenseScope("COMPANY");
    }
  }

  function handleExpenseScopeChange(value: "COMPANY" | "CLIENT") {
    setExpenseScope(value);

    if (value !== "COMPANY") {
      setIsSalaryExpense(false);
      setSalaryEmployeeId("");
      setSalaryBasicSalary("");
      setSalaryBonus("0");
      setSalaryDeduction("0");
    }
  }


  function handleClientChange(value: string) {
    setClientId(value);
    setProjectId("");
  }

  function handleSalaryEmployeeChange(value: string) {
    setSalaryEmployeeId(value);

    const selectedEmployee = employees.find((employee) => employee.id === value);

    if (selectedEmployee?.salaryAmount) {
      setSalaryBasicSalary(String(selectedEmployee.salaryAmount));
      setAmount(String(selectedEmployee.salaryAmount));
    }

    if (selectedEmployee?.fullName) {
      setDoneFor(selectedEmployee.fullName);
    }
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
          title:
            title ||
            (isSalaryExpense ? `Salary Payment - ${doneFor}` : "Untitled Transaction"),
          amount: Number(amount),
          date,
          paymentMethod,
          expenseScope: type === "EXPENSE" ? expenseScope : null,
          categoryId: categoryId || null,
          clientId: clientId || null,
          projectId: projectId || null,
          paidBy: null,
          doneFor: isSalaryExpense ? doneFor : title,
          isBillable: type === "EXPENSE" ? isBillable : false,
          isReimbursed: type === "EXPENSE" ? isReimbursed : false,
          notes,
          attachment: uploadedFile,

          isSalaryExpense,
          salaryEmployeeId: isSalaryExpense ? salaryEmployeeId : null,
          salaryMonth: isSalaryExpense ? salaryMonth : null,
          salaryYear: isSalaryExpense ? salaryYear : null,
          salaryBasicSalary: isSalaryExpense ? salaryBasicSalary : null,
          salaryBonus: isSalaryExpense ? salaryBonus : 0,
          salaryDeduction: isSalaryExpense ? salaryDeduction : 0,
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
    <form onSubmit={handleSubmit} className="flex min-h-full flex-col">
      <div className="space-y-4 px-6 py-4">
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



        {type === "EXPENSE" && expenseScope === "CLIENT" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <Checkbox
                checked={isBillable}
                onCheckedChange={(checked) => setIsBillable(Boolean(checked))}
              />
              <span>
                <span className="block text-sm font-medium text-slate-900">
                  Billable to client
                </span>
                <span className="block text-xs text-slate-500">
                  This cost should be charged to the client.
                </span>
              </span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <Checkbox
                checked={isReimbursed}
                onCheckedChange={(checked) =>
                  setIsReimbursed(Boolean(checked))
                }
              />
              <span>
                <span className="block text-sm font-medium text-slate-900">
                  Reimbursed by client
                </span>
                <span className="block text-xs text-slate-500">
                  Client has already paid this cost back.
                </span>
              </span>
            </label>
          </div>
        ) : null}
        {type === "EXPENSE" ? (
          <div className="space-y-2">
            <Label>Expense Scope</Label>
            <Select
              value={expenseScope}
              onValueChange={(value) =>
                handleExpenseScopeChange(value as "COMPANY" | "CLIENT")
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
        {type === "EXPENSE" && expenseScope === "CLIENT" ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Client / Project Details
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Use this only when the expense was done for a client or project.
              </p>
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
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Description *</Label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Office rent, Client advance, Salary payment, Software subscription"
          />
        </div>



        {type === "EXPENSE" && expenseScope === "COMPANY" ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <label className="flex items-start gap-3">
              <Checkbox
                checked={isSalaryExpense}
                onCheckedChange={(checked) => {
                  const nextChecked = Boolean(checked);
                  setIsSalaryExpense(nextChecked);

                  if (!nextChecked) {
                    setSalaryEmployeeId("");
                    setSalaryBasicSalary("");
                    setSalaryBonus("0");
                    setSalaryDeduction("0");
                  }
                }}
              />

              <span>
                <span className="block text-sm font-semibold text-slate-900">
                  Is this a salary expense?
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Use this for old salary payments. It will create a linked payroll
                  record automatically.
                </span>
              </span>
            </label>

            {isSalaryExpense ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Employee *</Label>
                  <Select
                    value={salaryEmployeeId}
                    onValueChange={handleSalaryEmployeeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.fullName}
                          {employee.position ? ` — ${employee.position}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Salary Month *</Label>
                  <Select value={salaryMonth} onValueChange={setSalaryMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Salary Year *</Label>
                  <Input
                    type="number"
                    min="2000"
                    value={salaryYear}
                    onChange={(event) => setSalaryYear(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Basic Salary *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={salaryBasicSalary}
                    onChange={(event) => {
                      setSalaryBasicSalary(event.target.value);
                      setAmount(String(Number(event.target.value || 0) + Number(salaryBonus || 0) - Number(salaryDeduction || 0)));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bonus</Label>
                  <Input
                    type="number"
                    min="0"
                    value={salaryBonus}
                    onChange={(event) => {
                      setSalaryBonus(event.target.value);
                      setAmount(String(Number(salaryBasicSalary || 0) + Number(event.target.value || 0) - Number(salaryDeduction || 0)));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Deduction</Label>
                  <Input
                    type="number"
                    min="0"
                    value={salaryDeduction}
                    onChange={(event) => {
                      setSalaryDeduction(event.target.value);
                      setAmount(String(Number(salaryBasicSalary || 0) + Number(salaryBonus || 0) - Number(event.target.value || 0)));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Net Pay</Label>
                  <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900">
                    Rs.{" "}
                    {Number.isNaN(salaryNetPay)
                      ? "0"
                      : salaryNetPay.toLocaleString("en-NP")}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70">
          <button
            type="button"
            onClick={() => setShowOptionalDetails((current) => !current)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                Optional Details
              </span>
              <span className="block text-xs text-slate-500">
                Add receipt or internal notes only if needed.
              </span>
            </span>

            <span className="text-sm text-slate-500">
              {showOptionalDetails ? "Hide" : "Show"}
            </span>
          </button>

          {showOptionalDetails ? (
            <div className="space-y-4 border-t border-slate-200 px-4 py-4">
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
                  className="min-h-20"
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
      </div>

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-3">
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

  );
}
