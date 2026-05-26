"use client";

import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

type ExpenseDonutChartProps = {
    companyExpenses: number;
    clientExpenses: number;
};

const COLORS = ["#0f172a", "#f97316"];

function formatCurrency(value: number) {
    return `Rs. ${value.toLocaleString("en-IN")}`;
}

export function DashboardExpenseDonutChart({
    companyExpenses,
    clientExpenses,
}: ExpenseDonutChartProps) {
    const total = companyExpenses + clientExpenses;

    const data =
        total > 0
            ? [
                { name: "Company", value: companyExpenses },
                { name: "Client", value: clientExpenses },
            ]
            : [
                { name: "Company", value: 1 },
                { name: "Client", value: 1 },
            ];

    return (
        <div className="relative h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip
                        formatter={(value, name) =>
                            total > 0
                                ? [formatCurrency(Number(value)), name]
                                : ["No data yet", name]
                        }
                    />
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={68}
                        outerRadius={92}
                        paddingAngle={4}
                        strokeWidth={0}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={entry.name}
                                fill={total > 0 ? COLORS[index] : index === 0 ? "#e5e7eb" : "#f1f5f9"}
                            />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs font-medium text-slate-500">Total</p>
                <p className="text-xl font-bold text-slate-950">
                    {formatCurrency(total)}
                </p>
            </div>
        </div>
    );
}