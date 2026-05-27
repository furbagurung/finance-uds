"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Palette } from "lucide-react";

type ClientCoverThemePickerProps = {
    clientId: string;
    currentTheme?: string | null;
};

const coverThemes = [
    {
        value: "auto",
        label: "Auto",
        preview:
            "linear-gradient(135deg, #020617 0%, #312e81 48%, #9333ea 100%)",
    },
    {
        value: "purple",
        label: "Purple",
        preview:
            "linear-gradient(135deg, #020617 0%, #312e81 48%, #9333ea 100%)",
    },
    {
        value: "emerald",
        label: "Emerald",
        preview:
            "linear-gradient(135deg, #052e16 0%, #047857 48%, #22c55e 100%)",
    },
    {
        value: "ocean",
        label: "Ocean",
        preview:
            "linear-gradient(135deg, #082f49 0%, #2563eb 48%, #38bdf8 100%)",
    },
    {
        value: "amber",
        label: "Amber",
        preview:
            "linear-gradient(135deg, #451a03 0%, #c2410c 48%, #f59e0b 100%)",
    },
    {
        value: "rose",
        label: "Rose",
        preview:
            "linear-gradient(135deg, #4a044e 0%, #be123c 48%, #fb7185 100%)",
    },
    {
        value: "slate",
        label: "Slate",
        preview:
            "linear-gradient(135deg, #020617 0%, #334155 48%, #94a3b8 100%)",
    },
];

export function ClientCoverThemePicker({
    clientId,
    currentTheme,
}: ClientCoverThemePickerProps) {
    const router = useRouter();
    const [selectedTheme, setSelectedTheme] = useState(currentTheme || "auto");
    const [loadingTheme, setLoadingTheme] = useState<string | null>(null);
    const [error, setError] = useState("");

    async function updateTheme(theme: string) {
        setError("");
        setLoadingTheme(theme);

        try {
            const response = await fetch(`/api/clients/${clientId}/cover-theme`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    coverTheme: theme,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Failed to update cover theme.");
                return;
            }

            setSelectedTheme(theme);
            router.refresh();
        } catch {
            setError("Something went wrong while updating cover theme.");
        } finally {
            setLoadingTheme(null);
        }
    }

    return (
        <div className="space-y-2 px-1 py-2">
            <div className="flex items-center gap-2 px-2">
                <Palette className="h-4 w-4 text-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Cover Color
                </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {coverThemes.map((theme) => {
                    const isSelected = selectedTheme === theme.value;
                    const isLoading = loadingTheme === theme.value;

                    return (
                        <button
                            key={theme.value}
                            type="button"
                            onClick={() => updateTheme(theme.value)}
                            disabled={Boolean(loadingTheme)}
                            className="group flex items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <span
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-slate-100"
                                style={{ background: theme.preview }}
                            >
                                {isSelected ? (
                                    <Check className="h-3.5 w-3.5 text-white" />
                                ) : null}
                            </span>

                            <span>{isLoading ? "Saving..." : theme.label}</span>
                        </button>
                    );
                })}
            </div>

            {error ? <p className="px-2 text-xs font-medium text-red-600">{error}</p> : null}
        </div>
    );
}