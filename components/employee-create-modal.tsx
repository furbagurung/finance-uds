"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { EmployeeForm } from "@/components/employee-form";
import { Button } from "@/components/ui/button";

type EmployeeCreateModalProps = {
  triggerLabel?: string;
  triggerClassName?: string;
};

export function EmployeeCreateModal({
  triggerLabel = "Add Employee",
  triggerClassName,
}: EmployeeCreateModalProps) {
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
          <div
            className="absolute inset-0"
            onClick={() => setOpen(false)}
          />

          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-950">
                Add Employee
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add employee details for payroll and internal company records.
              </p>
            </div>

            <div className="px-6 py-5">
              <EmployeeForm
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