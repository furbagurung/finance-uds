"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type PayrollEmployeeOption = {
  id: string;
  fullName: string;
  email: string;
  position: string | null;
  salaryAmount: string | number | null;
};

type PayrollFormProps = {
  employees: PayrollEmployeeOption[];
  mode?: "page" | "modal";
  onSuccess?: () => void;
  onCancel?: () => void;
};

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

const paymentMethods = [
  "CASH",
  "BANK_TRANSFER",
  "CHEQUE",
  "ONLINE",
  "OTHER",
];

const payrollStatuses = ["DRAFT", "PAID", "CANCELLED"];

export function PayrollForm({
  employees,
  mode = "page",
  onSuccess,
  onCancel,
}: PayrollFormProps) {
  const router = useRouter();
  const currentDate = new Date();

  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState(String(currentDate.getMonth() + 1));
  const [year, setYear] = useState(String(currentDate.getFullYear()));
  const [basicSalary, setBasicSalary] = useState("");
  const [bonus, setBonus] = useState("0");
  const [deduction, setDeduction] = useState("0");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [status, setStatus] = useState("DRAFT");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const netPay = useMemo(() => {
    const salary = Number(basicSalary || 0);
    const bonusAmount = Number(bonus || 0);
    const deductionAmount = Number(deduction || 0);

    return salary + bonusAmount - deductionAmount;
  }, [basicSalary, bonus, deduction]);

  function handleEmployeeChange(value: string) {
    setEmployeeId(value);

    const selectedEmployee = employees.find((item) => item.id === value);

    if (selectedEmployee?.salaryAmount) {
      setBasicSalary(String(selectedEmployee.salaryAmount));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          month,
          year,
          basicSalary,
          bonus,
          deduction,
          paymentDate,
          paymentMethod,
          status,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create payroll record.");
      }

      router.refresh();

      if (mode === "modal") {
        onSuccess?.();
      } else {
        router.push("/payroll");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700">
            Employee *
          </label>
          <select
            value={employeeId}
            onChange={(event) => handleEmployeeChange(event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName}
                {employee.position ? ` — ${employee.position}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Month *
          </label>
          <select
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
          >
            {months.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Year *
          </label>
          <input
            value={year}
            onChange={(event) => setYear(event.target.value)}
            type="number"
            min="2000"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Basic Salary *
          </label>
          <input
            value={basicSalary}
            onChange={(event) => setBasicSalary(event.target.value)}
            type="number"
            min="0"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
            placeholder="e.g. 30000"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Bonus</label>
          <input
            value={bonus}
            onChange={(event) => setBonus(event.target.value)}
            type="number"
            min="0"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Deduction
          </label>
          <input
            value={deduction}
            onChange={(event) => setDeduction(event.target.value)}
            type="number"
            min="0"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Net Pay</label>
          <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900">
            Rs. {Number.isNaN(netPay) ? 0 : netPay.toLocaleString("en-NP")}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Payment Date
          </label>
          <input
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
            type="date"
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
          >
            {paymentMethods.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
          >
            {payrollStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700">Notes</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            placeholder="Optional notes about this payroll record"
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
          {isSubmitting ? "Saving..." : "Save Payroll"}
        </Button>
      </div>
    </form>
  );
}