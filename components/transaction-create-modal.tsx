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

export function TransactionCreateModal({
    defaultType,
    triggerLabel = "Add Transaction",
    triggerClassName,
}: TransactionCreateModalProps) {
    const [open, setOpen] = useState(false);

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
                    {/* MODAL BACKDROP
              Edit this block if you want darker/lighter overlay.
          */}
                    <button
                        type="button"
                        aria-label="Close transaction modal"
                        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
                        onClick={() => setOpen(false)}
                    />

                    {/* TRANSACTION CREATE MODAL
              This popup keeps transaction creation inside the current page.
              Form logic still lives in components/transaction-form.tsx.
          */}
                    <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
                        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                    Finance Entry
                                </p>
                                <h2 className="mt-1 text-xl font-bold text-slate-950">
                                    Add Transaction
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Record income, expense, investment, withdrawal, or client
                                    transaction without leaving this page.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                                aria-label="Close modal"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="overflow-y-auto bg-slate-50/60 px-6 py-5">
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