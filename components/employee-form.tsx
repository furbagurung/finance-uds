"use client";

import { useRouter } from "next/navigation";

import { FormEvent, useState } from "react";
import { BranchSelectField } from "@/components/branch-select-field";
import { Button } from "@/components/ui/button";
type EmployeeBranchData = {
  id: string;
  name: string;
  code: string;
  country: string;
  currency: string;
  calendarSystem: string;
  fiscalYearType: string;
};

type EmployeeFormData = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  position: string | null;
  department: string | null;
  joiningDate: Date | string | null;
  salaryAmount: string | number | null;
  salaryType: string;
  status: string;
  notes: string | null;
  branchId?: string | null;
  branch?: EmployeeBranchData | null;
};
type EmployeeFormProps = {
  employee?: EmployeeFormData;
  mode?: "page" | "modal";
  onSuccess?: () => void;
  onCancel?: () => void;
};
const salaryTypes = ["MONTHLY", "HOURLY", "CONTRACT"];
const employeeStatuses = ["ACTIVE", "INACTIVE", "RESIGNED"];

export function EmployeeForm({
    employee,
    mode = "page",
    onSuccess,
    onCancel,
}: EmployeeFormProps) {
    const router = useRouter();

    const [fullName, setFullName] = useState(employee?.fullName || "");
    const [email, setEmail] = useState(employee?.email || "");
    const [phone, setPhone] = useState(employee?.phone || "");
    const [position, setPosition] = useState(employee?.position || "");
    const [department, setDepartment] = useState(employee?.department || "");
  const [joiningDate, setJoiningDate] = useState(
  employee?.joiningDate
    ? new Date(employee.joiningDate).toISOString().slice(0, 10)
    : ""
);
    const [salaryAmount, setSalaryAmount] = useState(
        employee?.salaryAmount ? String(employee.salaryAmount) : ""
    );
    const [salaryType, setSalaryType] = useState(employee?.salaryType || "MONTHLY");
    const [status, setStatus] = useState(employee?.status || "ACTIVE");
    const [notes, setNotes] = useState(employee?.notes || "");
    const [branchId, setBranchId] = useState(employee?.branchId || "");

    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setIsSubmitting(true);

        try {
            const response = await fetch(
                employee ? `/api/employees/${employee.id}` : "/api/employees",
                {
                    method: employee ? "PATCH" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        fullName,
                        email,
                        phone,
                        position,
                        department,
                        joiningDate,
                        salaryAmount,
                        salaryType,
                        status,
                        notes,
                        branchId,
                    }),
                });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create employee.");
            }

            router.refresh();

            if (mode === "modal") {
                onSuccess?.();
            } else {
                router.push("/employees");
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                        Full Name *
                    </label>
                    <input
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                        placeholder="e.g. Aabishkar Gurung"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                        Email *
                    </label>
                    <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        type="email"
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                        placeholder="employee@example.com"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                        Phone
                    </label>
                    <input
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                        placeholder="98XXXXXXXX"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                        Position
                    </label>
                    <input
                        value={position}
                        onChange={(event) => setPosition(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                        placeholder="e.g. Marketing Executive"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                        Department
                    </label>
                    <input
                        value={department}
                        onChange={(event) => setDepartment(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                        placeholder="e.g. Digital Marketing"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                        Joining Date
                    </label>
                    <input
                        value={joiningDate}
                        onChange={(event) => setJoiningDate(event.target.value)}
                        type="date"
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                        Salary Amount
                    </label>
                    <input
                        value={salaryAmount}
                        onChange={(event) => setSalaryAmount(event.target.value)}
                        type="number"
                        min="0"
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                        placeholder="e.g. 30000"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                        Salary Type
                    </label>
                    <select
                        value={salaryType}
                        onChange={(event) => setSalaryType(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                    >
                        {salaryTypes.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                        Branch
                    </label>
                    <BranchSelectField
                        value={branchId}
                        onValueChange={setBranchId}
                        placeholder="Select branch"
                        showCurrency
                        allowUnassigned
                        unassignedLabel="Not assigned"
                        triggerClassName="h-10 w-full"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                        Status
                    </label>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                    >
                        {employeeStatuses.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                        Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        placeholder="Optional notes about this employee"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3">
                {mode === "modal" ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                ) : null}

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? "Saving..."
                        : employee
                            ? "Update Employee"
                            : "Save Employee"}
                </Button>
            </div>
        </form>
    );
}
