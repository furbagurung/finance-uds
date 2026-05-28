"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PayrollForm } from "@/components/payroll-form";
import { Button } from "@/components/ui/button";

type PayrollEmployeeOption = {
  id: string;
  fullName: string;
  email: string;
  position: string | null;
  salaryAmount: string | number | null;
};

type PayrollCreateModalProps = {
  employees: PayrollEmployeeOption[];
  triggerLabel?: string;
  triggerClassName?: string;
};

export function PayrollCreateModal({
  employees,
  triggerLabel = "Add Payroll",
  triggerClassName,
}: PayrollCreateModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        <Plus className="mr-2 h-4 w-4" />
        {triggerLabel}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />

          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-950">
                Add Payroll
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Create a salary record for an employee.
              </p>
            </div>

            <div className="px-6 py-5">
              <PayrollForm
                employees={employees}
                mode="modal"
                onSuccess={() => setOpen(false)}
                onCancel={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}