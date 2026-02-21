"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths } from "date-fns";
import { Expense } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";

interface HeatmapCalendarProps {
  expenses: Expense[];
  months?: number;
}

export function HeatmapCalendar({ expenses, months = 3 }: HeatmapCalendarProps) {
  const now = new Date();

  // Calculate daily totals for the past N months
  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach((expense) => {
      const date = expense.date;
      totals[date] = (totals[date] || 0) + expense.amount;
    });
    return totals;
  }, [expenses]);

  // Find max daily spend for color scaling
  const maxDaily = useMemo(() => {
    const values = Object.values(dailyTotals);
    return values.length > 0 ? Math.max(...values) : 100;
  }, [dailyTotals]);

  // Get heat level (0-5)
  const getHeatLevel = (amount: number): number => {
    if (amount === 0) return 0;
    const ratio = amount / maxDaily;
    if (ratio <= 0.2) return 1;
    if (ratio <= 0.4) return 2;
    if (ratio <= 0.6) return 3;
    if (ratio <= 0.8) return 4;
    return 5;
  };

  // Generate calendar data
  const calendarData = useMemo(() => {
    const data: { month: string; days: { date: string; amount: number; dayOfWeek: number }[] }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const days = eachDayOfInterval({ start, end }).map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return {
          date: dateStr,
          amount: dailyTotals[dateStr] || 0,
          dayOfWeek: getDay(date),
        };
      });

      data.push({
        month: format(monthDate, "MMM"),
        days,
      });
    }

    return data;
  }, [months, dailyTotals]);

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="space-y-4">
      {/* Day labels */}
      <div className="flex gap-1 pl-12">
        {dayLabels.map((day, i) => (
          <div key={i} className="w-4 text-center text-xs text-[rgb(var(--muted-foreground))]">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex gap-6">
        {calendarData.map((monthData, monthIndex) => (
          <div key={monthData.month} className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[rgb(var(--muted-foreground))] mb-1">
              {monthData.month}
            </span>
            <div className="grid grid-cols-7 gap-1">
              {/* Add empty cells for days before the month starts */}
              {monthData.days[0] && Array(monthData.days[0].dayOfWeek).fill(null).map((_, i) => (
                <div key={`empty-${i}`} className="w-4 h-4" />
              ))}

              {/* Render days */}
              {monthData.days.map((day, dayIndex) => {
                const heatLevel = getHeatLevel(day.amount);
                return (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (monthIndex * 31 + dayIndex) * 0.005 }}
                    className={cn(
                      "w-4 h-4 rounded-sm cursor-pointer transition-transform hover:scale-125",
                      `heat-${heatLevel}`
                    )}
                    title={`${format(new Date(day.date), "MMM d")}: ${formatCurrency(day.amount)}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-[rgb(var(--muted-foreground))]">
        <span>Less</span>
        {[0, 1, 2, 3, 4, 5].map((level) => (
          <div key={level} className={cn("w-3 h-3 rounded-sm", `heat-${level}`)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
