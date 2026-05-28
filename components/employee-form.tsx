"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

type EmployeeFormProps = {
  mode?: "page" | "modal";
  onSuccess?: () => void;
  onCancel?: () => void;
};

const salaryTypes = ["MONTHLY", "HOURLY", "CONTRACT"];
const employeeStatuses = ["ACTIVE", "INACTIVE", "RESIGNED"];

export function EmployeeForm({
  mode = "page",
  onSuccess,
  onCancel,
}: EmployeeFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryType, setSalaryType] = useState("MONTHLY");
  const [status, setStatus] = useState("ACTIVE");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
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
          {isSubmitting ? "Saving..." : "Save Employee"}
        </Button>
      </div>
    </form>
  );
}