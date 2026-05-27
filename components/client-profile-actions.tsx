"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
    ArrowLeft,
    Palette,
    Pencil,
    Settings,
    Trash2,
} from "lucide-react";

import { ClientCoverThemePicker } from "@/components/client-cover-theme-picker";
import { DeleteClientButton } from "@/components/delete-client-button";
import { Button } from "@/components/ui/button";

type ClientProfileActionsProps = {
    clientId: string;
    currentTheme?: string | null;
};

type OpenMenu = "cover" | "settings" | null;

export function ClientProfileActions({
    clientId,
    currentTheme,
}: ClientProfileActionsProps) {
    const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setOpenMenu(null);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpenMenu(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    function toggleMenu(menu: OpenMenu) {
        setOpenMenu((current) => (current === menu ? null : menu));
    }

    return (
        <div
            ref={wrapperRef}
            className="absolute right-5 top-5 hidden items-start gap-2 xl:flex"
        >
            <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-white/70 bg-white/90 px-3 text-slate-700 shadow-sm backdrop-blur hover:bg-white hover:text-slate-950"
            >
                <Link href="/clients">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Link>
            </Button>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => toggleMenu("cover")}
                    className="flex h-9 items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-950"
                >
                    <Palette className="h-4 w-4" />
                    Cover
                </button>

                {openMenu === "cover" ? (
                    <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-xl shadow-slate-900/10">
                        <ClientCoverThemePicker
                            clientId={clientId}
                            currentTheme={currentTheme}
                        />
                    </div>
                ) : null}
            </div>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => toggleMenu("settings")}
                    className="flex h-9 items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-950"
                >
                    <Settings className="h-4 w-4" />
                    Client Settings

                </button>

                {openMenu === "settings" ? (
                    <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-900/10">
                        <Link
                            href={`/clients/${clientId}/edit`}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                        >
                            <Pencil className="h-4 w-4 text-slate-400" />
                            Edit Client
                        </Link>

                        <div className="my-1 h-px bg-slate-100" />

                        {/* DELETE CLIENT ACTION
    The trash icon is controlled here so the settings dropdown stays visually consistent.
    If DeleteClientButton has its own icon internally, remove that icon from delete-client-button.tsx later.
*/}
                        <div className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                            <Trash2 className="h-4 w-4 shrink-0 text-red-500 transition group-hover:text-red-600" />

                            <div className="[&>button]:m-0 [&>button]:h-auto [&>button]:border-0 [&>button]:bg-transparent [&>button]:p-0 [&>button]:text-left [&>button]:text-sm [&>button]:font-semibold [&>button]:text-red-600 [&>button]:shadow-none [&>button]:hover:bg-transparent [&>button]:hover:text-red-700">
                                <DeleteClientButton clientId={clientId} />
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}