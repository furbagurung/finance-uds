"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { BranchSelectField } from "@/components/branch-select-field";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "@/components/category-form";
import { ProjectForm } from "@/components/project-form";
import { ClientForm } from "@/components/client-form";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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

type BranchSummary = {
  id: string;
  name?: string | null;
  code?: string | null;
  currency?: string | null;
};

type Client = {
  id: string;
  name: string;
  companyName?: string | null;
  logoUrl?: string | null;
  branchId?: string | null;
  branch?: BranchSummary | null;
};

type Project = {
  id: string;
  name: string;
  projectType?: string | null;
  clientId?: string | null;
  client?: Client | null;
  branchId?: string | null;
  branch?: BranchSummary | null;
};

type RetainerBilling = {
  id: string;
  month: number;
  year: number;
  status: string;
  expectedAmount: string | number;
  receivedAmount: string | number;
  pendingAmount: string | number;
  currency?: string | null;
  projectId: string;
  clientId?: string | null;
  branchId?: string | null;
  project?: Project | null;
  client?: Client | null;
  branch?: BranchSummary | null;
};

type Employee = {
  id: string;
  fullName: string;
  email: string;
  position?: string | null;
  salaryAmount?: string | number | null;
  branchId?: string | null;
  branch?: BranchSummary | null;
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

const monthLabels = new Map(months.map((month) => [month.value, month.label]));

const transactionActionLabels: Record<TransactionType, string> = {
  INCOME: "Save Income",
  EXPENSE: "Save Expense",
  INVESTMENT: "Save Investment",
  WITHDRAWAL: "Save Withdrawal",
};

function getValidTransactionType(value?: string): TransactionType | null {
  return transactionTypes.includes(value as TransactionType)
    ? (value as TransactionType)
    : null;
}

function getClientDisplayName(client: Client) {
  return client.companyName || client.name;
}

function getClientInitials(client: Client) {
  const displayName = getClientDisplayName(client);
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "CL";
}

function ClientOptionContent({ client }: { client: Client }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar size="sm">
        {client.logoUrl ? (
          <AvatarImage src={client.logoUrl} alt={getClientDisplayName(client)} />
        ) : null}
        <AvatarFallback className="bg-slate-100 text-[10px] font-semibold text-slate-600">
          {getClientInitials(client)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{getClientDisplayName(client)}</span>
    </span>
  );
}

function handlePendingCreateAction() {
  // Placeholder for opening the related create modal from this dropdown.
}

function DropdownCreateAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="border-t border-slate-100 bg-white p-2">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xl font-medium text-slate-700">
          +
        </span>
        <span>{label}</span>
      </button>
    </div>
  );
}

function ClientSelectField({
  clients,
  value,
  onValueChange,
  placeholder = "Select client",
  onCreated,
}: {
  clients: Client[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  onCreated: (client: Client) => void;
}) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const selectedClient = clients.find((client) => client.id === value);

  const filteredClients = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();

    if (!searchTerm) return clients;

    return clients.filter((client) => {
      const displayName = getClientDisplayName(client).toLowerCase();
      return displayName.includes(searchTerm);
    });
  }, [clients, query]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className="min-w-0">
            {selectedClient ? (
              <ClientOptionContent client={selectedClient} />
            ) : (
              <span className="text-slate-500">{placeholder}</span>
            )}
          </span>

          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
        </button>

        {open ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[80] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10">
            <div className="border-b border-slate-100 p-2">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search client..."
                className="h-9"
                autoFocus
              />
            </div>

            <div className="max-h-56 overflow-y-auto p-1">
              {filteredClients.length === 0 ? (
                <div className="px-3 py-3 text-sm text-slate-500">
                  No clients found.
                </div>
              ) : (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      onValueChange(client.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100"
                  >
                    <ClientOptionContent client={client} />
                  </button>
                ))
              )}
            </div>

            <DropdownCreateAction
              label="Add new client"
              onClick={() => {
                setOpen(false);
                setCreateOpen(true);
              }}
            />
          </div>
        ) : null}
      </div>

      {mounted && createOpen
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
              <button
                type="button"
                aria-label="Close client create modal"
                className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
                onClick={() => setCreateOpen(false)}
              />

              <div className="relative z-10 flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="text-lg font-semibold text-slate-950">
                    Add New Client
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Create a client and use it immediately in this transaction.
                  </p>
                </div>

                <div className="min-h-0 overflow-y-auto bg-slate-50/70 p-4">
                  <ClientForm
                    mode="modal"
                    onCreated={(client) => {
                      onCreated(client);
                      onValueChange(client.id);
                    }}
                    onSuccess={() => setCreateOpen(false)}
                    onCancel={() => setCreateOpen(false)}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
type SearchableDropdownItem = {
  id: string;
  name: string;
};

function SearchableTextDropdown({
  items,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  createLabel,
  onCreate,
}: {
  items: SearchableDropdownItem[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  createLabel?: string;
  onCreate?: () => void;
}) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedItem = items.find((item) => item.id === value);

  const filteredItems = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();

    if (!searchTerm) return items;

    return items.filter((item) => item.name.toLowerCase().includes(searchTerm));
  }, [items, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => {
            const nextOpen = !current;

            if (nextOpen) {
              setQuery("");
            }

            return nextOpen;
          });
        }}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className="min-w-0 truncate">
          {selectedItem ? (
            selectedItem.name
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
        </span>

        <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[80] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10">
          <div className="border-b border-slate-100 p-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9"
              autoFocus
            />
          </div>

          <div className="max-h-56 overflow-y-auto p-1">
            {filteredItems.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-500">
                {emptyMessage}
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onValueChange(item.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100"
                >
                  <span className="truncate">{item.name}</span>
                </button>
              ))
            )}
          </div>

          {createLabel ? (
            <DropdownCreateAction
              label={createLabel}
              onClick={() => {
                setOpen(false);
                setQuery("");
                onCreate?.();
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ProjectSelectField({
  projects,
  value,
  onValueChange,
  selectedClientId,
  onCreated,
}: {
  projects: Project[];
  value: string;
  onValueChange: (value: string) => void;
  selectedClientId: string;
  onCreated: (project: Project) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <SearchableTextDropdown
        items={projects.map((project) => ({
          id: project.id,
          name: project.name,
        }))}
        value={value}
        onValueChange={onValueChange}
        placeholder="Select project"
        searchPlaceholder="Search project..."
        emptyMessage="No projects found."
        createLabel="Add new project"
        onCreate={() => setCreateOpen(true)}
      />

      {mounted && createOpen
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
              <button
                type="button"
                aria-label="Close project create modal"
                className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
                onClick={() => setCreateOpen(false)}
              />

              <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="text-lg font-semibold text-slate-950">
                    Add New Project
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Create a project and link it with the selected client.
                  </p>
                </div>

                <div className="max-h-[75dvh] overflow-y-auto bg-slate-50/70 p-4">
                  <ProjectForm
                    mode="modal"
                    defaultClientId={selectedClientId}
                    onCreated={(project) => {
                      onCreated(project);
                      onValueChange(project.id);
                    }}
                    onSuccess={() => setCreateOpen(false)}
                    onCancel={() => setCreateOpen(false)}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function RetainerBillingSelectField({
  retainerBillings,
  value,
  onValueChange,
}: {
  retainerBillings: RetainerBilling[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  const items = retainerBillings.map((billing) => {
    const monthLabel =
      monthLabels.get(String(billing.month)) || String(billing.month);
    const projectName = billing.project?.name || "Retainer billing";
    const pendingAmount = Number(billing.pendingAmount || 0).toLocaleString(
      "en-IN",
    );

    return {
      id: billing.id,
      name: `${projectName} - ${monthLabel} ${billing.year} - Pending ${billing.currency || ""} ${pendingAmount}`,
    };
  });

  return (
    <SearchableTextDropdown
      items={items}
      value={value}
      onValueChange={onValueChange}
      placeholder="Select retainer billing"
      searchPlaceholder="Search billing..."
      emptyMessage="No matching retainer billings found."
    />
  );
}
function CategorySelectField({
  categories,
  value,
  onValueChange,
  transactionType,
  onCreated,
}: {
  categories: Category[];
  value: string;
  onValueChange: (value: string) => void;
  transactionType: TransactionType;
  onCreated: (category: Category) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <SearchableTextDropdown
        items={categories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        value={value}
        onValueChange={onValueChange}
        placeholder="Select category"
        searchPlaceholder="Search category..."
        emptyMessage="No categories found."
        createLabel="Add new category"
        onCreate={() => setCreateOpen(true)}
      />

      {mounted && createOpen
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
              <button
                type="button"
                aria-label="Close category create modal"
                className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
                onClick={() => setCreateOpen(false)}
              />

              <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="text-lg font-semibold text-slate-950">
                    Add New Category
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Create a new category for this transaction type.
                  </p>
                </div>

                <div className="bg-slate-50/70 p-4">
                  <CategoryForm
                    mode="modal"
                    defaultType={transactionType}
                    onCreated={(category) => {
                      onCreated(category);
                      onValueChange(category.id);
                    }}
                    onSuccess={() => setCreateOpen(false)}
                    onCancel={() => setCreateOpen(false)}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
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
  const defaultTransactionType = getValidTransactionType(defaultType);
  const isTypeLocked = Boolean(defaultTransactionType);

  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [retainerBillings, setRetainerBillings] = useState<RetainerBilling[]>(
    [],
  );
  const [employees, setEmployees] = useState<Employee[]>([]);

  const initialType: TransactionType =
    defaultTransactionType || "EXPENSE";

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
  const [retainerBillingId, setRetainerBillingId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branchIdTouched, setBranchIdTouched] = useState(false);
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

  const filteredRetainerBillings = useMemo(() => {
    return retainerBillings.filter((billing) => {
      if (billing.status === "PAID" || billing.status === "WAIVED") {
        return false;
      }

      if (projectId && billing.projectId !== projectId) {
        return false;
      }

      if (clientId && billing.clientId !== clientId) {
        return false;
      }

      return true;
    });
  }, [clientId, projectId, retainerBillings]);

  const salaryNetPay = useMemo(() => {
    const basic = Number(salaryBasicSalary || 0);
    const bonus = Number(salaryBonus || 0);
    const deduction = Number(salaryDeduction || 0);

    return basic + bonus - deduction;
  }, [salaryBasicSalary, salaryBonus, salaryDeduction]);

  const saveLabel = transactionActionLabels[type] || "Save Transaction";

  useEffect(() => {
    if (!defaultTransactionType) return;

    setType(defaultTransactionType);
    setCategoryId("");

    if (defaultTransactionType !== "EXPENSE") {
      setIsBillable(false);
      setIsReimbursed(false);
      setIsSalaryExpense(false);
      setExpenseScope("COMPANY");
    }
  }, [defaultTransactionType]);

  useEffect(() => {
    async function loadInitialData() {
      const [
        categoriesResponse,
        clientsResponse,
        projectsResponse,
        employeesResponse,
        retainerBillingsResponse,
      ] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/clients"),
        fetch("/api/projects"),
        fetch("/api/employees"),
        fetch("/api/retainer-billings"),
      ]);

      const categoriesData = await categoriesResponse.json();
      const clientsData = await clientsResponse.json();
      const projectsData = await projectsResponse.json();
      const employeesData = await employeesResponse.json();
      const retainerBillingsData = await retainerBillingsResponse.json();

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
      if (retainerBillingsResponse.ok) {
        setRetainerBillings(retainerBillingsData.retainerBillings || []);
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

    if (nextType !== "INCOME") {
      setRetainerBillingId("");
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

  function getProjectBranchId(project: Project | null | undefined) {
    return project?.branchId || project?.branch?.id || "";
  }

  function getClientBranchId(client: Client | null | undefined) {
    return client?.branchId || client?.branch?.id || "";
  }

  function getEmployeeBranchId(employee: Employee | null | undefined) {
    return employee?.branchId || employee?.branch?.id || "";
  }

  function inferBranchFromProjectOrClient(
    nextProjectId: string,
    nextClientId: string,
  ) {
    if (branchIdTouched) return;

    const selectedProject =
      projects.find((project) => project.id === nextProjectId) || null;
    const nextClient =
      clients.find((client) => client.id === nextClientId) || null;

    setBranchId(getProjectBranchId(selectedProject) || getClientBranchId(nextClient));
  }

  function handleClientChange(value: string) {
    setClientId(value);
    setProjectId("");
    setRetainerBillingId("");
    inferBranchFromProjectOrClient("", value);
  }

  function handleProjectChange(value: string) {
    setProjectId(value);
    setRetainerBillingId("");
    inferBranchFromProjectOrClient(value, clientId);
  }

  function handleBranchChange(value: string) {
    setBranchId(value);
    setBranchIdTouched(true);
  }

  function handleSalaryEmployeeChange(value: string) {
    setSalaryEmployeeId(value);

    const selectedEmployee = employees.find((employee) => employee.id === value);

    if (!branchIdTouched) {
      setBranchId(getEmployeeBranchId(selectedEmployee));
    }

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
            (isSalaryExpense
              ? `Salary Payment - ${doneFor}`
              : "Untitled Transaction"),
          amount: Number(amount),
          date,
          paymentMethod,
          expenseScope: type === "EXPENSE" ? expenseScope : null,
          categoryId: categoryId || null,
          clientId: clientId || null,
          projectId: projectId || null,
          retainerBillingId:
            type === "INCOME" && retainerBillingId ? retainerBillingId : null,
          branchId: branchId || null,
          branchIdTouched,
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
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-col rounded-b-2xl bg-white"
    >
      <div className="space-y-3 px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-slate-200 px-2.5 text-sm font-medium text-slate-500">
                Rs.
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="2075"
                min="1"
                className="pl-12"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">
              Payment Method
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as PaymentMethod)
              }
            >
              <SelectTrigger className="w-full">
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

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-600">Branch</Label>
          <BranchSelectField
            value={branchId}
            onValueChange={handleBranchChange}
            placeholder="Select branch"
            showCurrency
            allowUnassigned
            triggerClassName="w-full"
          />
        </div>

        {type === "INCOME" ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Client Payment Details
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">
                  Client
                </Label>
                <ClientSelectField
                  clients={clients}
                  value={clientId}
                  onValueChange={handleClientChange}
                  onCreated={(client) => {
                    setClients((currentClients) => {
                      const clientExists = currentClients.some(
                        (currentClient) => currentClient.id === client.id
                      );

                      if (clientExists) {
                        return currentClients;
                      }

                      return [client, ...currentClients];
                    });

                    setClientId(client.id);
                    setProjectId("");
                    if (!branchIdTouched) {
                      setBranchId(getClientBranchId(client));
                    }
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">
                  Project
                  <span className="ml-1 font-normal text-slate-400">
                    Optional
                  </span>
                </Label>
                <ProjectSelectField
                  projects={filteredProjects}
                  value={projectId}
                  onValueChange={handleProjectChange}
                  selectedClientId={clientId}
                  onCreated={(project) => {
                    setProjects((currentProjects) => {
                      const projectExists = currentProjects.some(
                        (currentProject) => currentProject.id === project.id
                      );

                      if (projectExists) {
                        return currentProjects;
                      }

                      return [project, ...currentProjects];
                    });

                    setProjectId(project.id);
                    if (!branchIdTouched) {
                      setBranchId(
                        getProjectBranchId(project) ||
                          getClientBranchId(
                            clients.find((client) => client.id === clientId),
                          ),
                      );
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">
                Retainer Billing
                <span className="ml-1 font-normal text-slate-400">
                  Optional
                </span>
              </Label>
              <RetainerBillingSelectField
                retainerBillings={filteredRetainerBillings}
                value={retainerBillingId}
                onValueChange={setRetainerBillingId}
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-600">Category</Label>
          <CategorySelectField
            categories={filteredCategories}
            value={categoryId}
            onValueChange={setCategoryId}
            transactionType={type}
            onCreated={(category) => {
              setCategories((currentCategories) => {
                const categoryExists = currentCategories.some(
                  (currentCategory) => currentCategory.id === category.id
                );

                if (categoryExists) {
                  return currentCategories;
                }

                return [...currentCategories, category].sort((a, b) =>
                  a.name.localeCompare(b.name)
                );
              });

              setCategoryId(category.id);
            }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {!isTypeLocked ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">
                Transaction Type
              </Label>
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full">
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
          ) : null}

          <div
            className={
              isTypeLocked ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"
            }
          >
            <Label className="text-xs font-medium text-slate-600">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-600">
            Remarks *
          </Label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter remarks here..."
          />
        </div>

        {type === "EXPENSE" ? (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">
              Expense Scope
            </Label>
            <Select
              value={expenseScope}
              onValueChange={(value) =>
                handleExpenseScopeChange(value as "COMPANY" | "CLIENT")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select expense scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPANY">Company Expense</SelectItem>
                <SelectItem value="CLIENT">Client / Project Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {type === "EXPENSE" && expenseScope === "COMPANY" ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
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

              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-900">
                  Salary expense
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Creates a linked payroll record automatically.
                </span>
              </span>
            </label>

            {isSalaryExpense ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-medium text-slate-600">
                    Employee *
                  </Label>
                  <Select
                    value={salaryEmployeeId}
                    onValueChange={handleSalaryEmployeeChange}
                  >
                    <SelectTrigger className="w-full">
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

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">
                    Salary Month *
                  </Label>
                  <Select value={salaryMonth} onValueChange={setSalaryMonth}>
                    <SelectTrigger className="w-full">
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

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">
                    Salary Year *
                  </Label>
                  <Input
                    type="number"
                    min="2000"
                    value={salaryYear}
                    onChange={(event) => setSalaryYear(event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">
                    Basic Salary *
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={salaryBasicSalary}
                    onChange={(event) => {
                      setSalaryBasicSalary(event.target.value);
                      setAmount(
                        String(
                          Number(event.target.value || 0) +
                          Number(salaryBonus || 0) -
                          Number(salaryDeduction || 0),
                        ),
                      );
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">
                    Bonus
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={salaryBonus}
                    onChange={(event) => {
                      setSalaryBonus(event.target.value);
                      setAmount(
                        String(
                          Number(salaryBasicSalary || 0) +
                          Number(event.target.value || 0) -
                          Number(salaryDeduction || 0),
                        ),
                      );
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">
                    Deduction
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={salaryDeduction}
                    onChange={(event) => {
                      setSalaryDeduction(event.target.value);
                      setAmount(
                        String(
                          Number(salaryBasicSalary || 0) +
                          Number(salaryBonus || 0) -
                          Number(event.target.value || 0),
                        ),
                      );
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">
                    Net Pay
                  </Label>
                  <div className="flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-900">
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

        {type === "EXPENSE" && expenseScope === "CLIENT" ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">
                  Client
                </Label>
                <ClientSelectField
                  clients={clients}
                  value={clientId}
                  onValueChange={handleClientChange}
                  onCreated={(client) => {
                    setClients((currentClients) => {
                      const clientExists = currentClients.some(
                        (currentClient) => currentClient.id === client.id
                      );

                      if (clientExists) {
                        return currentClients;
                      }

                      return [client, ...currentClients];
                    });

                    setClientId(client.id);
                    setProjectId("");
                    if (!branchIdTouched) {
                      setBranchId(getClientBranchId(client));
                    }
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">
                  Project
                </Label>
                <ProjectSelectField
                  projects={filteredProjects}
                  value={projectId}
                  onValueChange={handleProjectChange}
                  selectedClientId={clientId}
                  onCreated={(project) => {
                    setProjects((currentProjects) => {
                      const projectExists = currentProjects.some(
                        (currentProject) => currentProject.id === project.id
                      );

                      if (projectExists) {
                        return currentProjects;
                      }

                      return [project, ...currentProjects];
                    });

                    setProjectId(project.id);
                    if (!branchIdTouched) {
                      setBranchId(
                        getProjectBranchId(project) ||
                          getClientBranchId(
                            clients.find((client) => client.id === clientId),
                          ),
                      );
                    }
                  }}
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <Checkbox
                  checked={isBillable}
                  onCheckedChange={(checked) => setIsBillable(Boolean(checked))}
                />
                <span className="text-sm font-medium text-slate-800">
                  Billable to client
                </span>
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <Checkbox
                  checked={isReimbursed}
                  onCheckedChange={(checked) =>
                    setIsReimbursed(Boolean(checked))
                  }
                />
                <span className="text-sm font-medium text-slate-800">
                  Reimbursed by client
                </span>
              </label>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setShowOptionalDetails((current) => !current)}
            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
            aria-expanded={showOptionalDetails}
          >
            <span className="text-sm font-medium text-slate-900">
              Optional Details
            </span>
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform ${showOptionalDetails ? "rotate-180" : ""
                }`}
            />
          </button>

          {showOptionalDetails ? (
            <div className="space-y-3 border-t border-slate-200 px-3 py-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">
                  Receipt / Invoice
                </Label>
                <Input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">
                  Notes
                </Label>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add extra details..."
                  className="min-h-16"
                />
              </div>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 z-20 flex justify-end gap-2 rounded-b-2xl border-t border-slate-200 bg-white px-5 py-3">
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
          {loading ? "Saving..." : saveLabel}
        </Button>
      </div>
    </form>
  );
}
