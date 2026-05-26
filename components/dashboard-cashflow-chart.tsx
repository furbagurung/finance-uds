"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type CashflowPoint = {
    month: string;
    income: number;
    expenses: number;
};

type DashboardCashflowChartProps = {
    data: CashflowPoint[];
};

function formatCurrency(value: number) {
    return `Rs. ${value.toLocaleString("en-IN")}`;
}

export function DashboardCashflowChart({
    data,
}: DashboardCashflowChartProps) {
    return (
        <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barGap={8}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${Number(value) / 1000}k`}
                    />
                    <Tooltip
                        cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                        formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Bar dataKey="income" name="Income" fill="#16a34a" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}