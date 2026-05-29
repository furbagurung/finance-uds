"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import { TransactionForm } from "@/components/transaction-form";
import { Button } from "@/components/ui/button";

type TransactionCreateModalProps = {
    defaultType?: string;
    triggerLabel?: string;
    triggerClassName?: string;
};

const modalTitles: Record<string, string> = {
    INCOME: "Add Income",
    EXPENSE: "Add Expense",
    INVESTMENT: "Add Investment",
    WITHDRAWAL: "Add Withdrawal",
};

export function TransactionCreateModal({
    defaultType,
    triggerLabel = "Add Transaction",
    triggerClassName,
}: TransactionCreateModalProps) {
    const [open, setOpen] = useState(false);
    const title = defaultType ? modalTitles[defaultType] : "Add Transaction";

    useEffect(() => {
        if (!open) return;

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleEscape);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleEscape);
        };
    }, [open]);

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
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
                    <button
                        type="button"
                        aria-label="Close transaction modal"
                        className="absolute inset-0 z-0 bg-slate-950/35 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    <div className="isolate relative z-10 flex max-h-[92dvh] w-full max-w-xl flex-col overflow-visible rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-semibold text-slate-950">
                                {title || "Add Transaction"}
                            </h2>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                                aria-label="Close modal"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="min-h-0 overflow-visible rounded-b-2xl bg-white">
                            <TransactionForm
                                defaultType={defaultType}
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
