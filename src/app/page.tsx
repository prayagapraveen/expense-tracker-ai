"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Target,
  Sparkles,
  ArrowRight,
  Flame,
  Loader2,
  Download,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Navigation } from "@/components/layout/Navigation";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { SmartInput } from "@/components/ui/SmartInput";
import { WellnessRing } from "@/components/ui/WellnessRing";
import { HeatmapCalendar } from "@/components/ui/HeatmapCalendar";
import { InsightCard } from "@/components/ui/InsightCard";
import { AchievementPopup } from "@/components/ui/AchievementCard";
import { ExportModal } from "@/components/ui/ExportModal";
import { formatCurrency, cn, getStreakEmoji, calculateLevel } from "@/lib/utils";
import { getCategoryMeta } from "@/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

export default function HomePage() {
  const {
    expenses,
    budgets,
    profile,
    wellnessScore,
    insights,
    isLoading,
    dismissInsight,
    newAchievements,
    clearNewAchievements,
  } = useApp();

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = expenses.filter((e) => {
      const date = new Date(e.date);
      return date >= startOfMonth(now) && date <= endOfMonth(now);
    });

    const lastMonth = expenses.filter((e) => {
      const date = new Date(e.date);
      const lastMonthStart = startOfMonth(subDays(startOfMonth(now), 1));
      const lastMonthEnd = endOfMonth(lastMonthStart);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });

    const thisMonthTotal = thisMonth.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonth.reduce((sum, e) => sum + e.amount, 0);
    const change = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

    const categoryTotals: Record<string, number> = {};
    thisMonth.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        meta: getCategoryMeta(cat as any),
      }));

    return {
      thisMonthTotal,
      lastMonthTotal,
      change,
      expenseCount: thisMonth.length,
      topCategories,
    };
  }, [expenses]);

  // Daily spending data for chart
  const chartData = useMemo(() => {
    const data: { date: string; amount: number }[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(now, i), "yyyy-MM-dd");
      const dayExpenses = expenses.filter((e) => e.date === date);
      const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      data.push({
        date: format(subDays(now, i), "MMM d"),
        amount: total,
      });
    }

    return data;
  }, [expenses]);

  // Category pie chart data
  const pieData = useMemo(() => {
    return stats.topCategories.map((cat) => ({
      name: cat.meta.name,
      value: cat.amount,
      color: cat.meta.color,
    }));
  }, [stats.topCategories]);

  const levelInfo = calculateLevel(profile.xp);

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <Navigation />
      <CommandPalette />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        expenses={expenses}
      />

      {/* Achievement popup */}
      <AnimatePresence>
        {newAchievements.length > 0 && (
          <AchievementPopup
            achievement={newAchievements[0]}
            onClose={clearNewAchievements}
          />
        )}
      </AnimatePresence>

      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero section with smart input */}
          <section className="text-center py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Welcome back,{" "}
                <span className="gradient-text">{profile.name}</span>
                {" "}{profile.avatar}
              </h1>
              <p className="text-lg text-[rgb(var(--muted-foreground))] max-w-xl mx-auto">
                Add expenses naturally, track your spending, and unlock achievements
              </p>
            </motion.div>

            <SmartInput />
          </section>

          {/* Stats grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* This month spending */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-900/30">
                  <Wallet className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                {stats.change !== 0 && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-sm font-medium",
                      stats.change > 0 ? "text-red-500" : "text-green-500"
                    )}
                  >
                    {stats.change > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(stats.change).toFixed(0)}%
                  </div>
                )}
              </div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                This Month
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.thisMonthTotal)}
              </p>
            </motion.div>

            {/* Streak */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-2xl">{getStreakEmoji(profile.streak)}</span>
              </div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                Current Streak
              </p>
              <p className="text-2xl font-bold">{profile.streak} days</p>
            </motion.div>

            {/* Level */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {levelInfo.currentXp} XP
                </span>
              </div>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                Level
              </p>
              <p className="text-2xl font-bold">Level {levelInfo.level}</p>
              <div className="mt-2 h-1.5 bg-[rgb(var(--muted))] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelInfo.progress}%` }}
                />
              </div>
            </motion.div>

            {/* Wellness */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] flex items-center justify-center"
            >
              <WellnessRing
                score={wellnessScore?.overall || 50}
                size="sm"
                trend={wellnessScore?.trend}
              />
            </motion.div>
          </section>

          {/* Charts and insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Spending chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-2 p-6 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
            >
              <h3 className="text-lg font-semibold mb-4">Spending Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.length) {
                          return (
                            <div className="p-2 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg shadow-lg">
                              <p className="text-sm font-medium">
                                {formatCurrency(payload[0].value as number)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Category breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="p-6 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
            >
              <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
              {pieData.length > 0 ? (
                <>
                  <div className="h-40 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {stats.topCategories.slice(0, 4).map((cat) => (
                      <div
                        key={cat.category}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span>{cat.meta.icon}</span>
                          <span className="text-sm">{cat.meta.name}</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatCurrency(cat.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-40 flex items-center justify-center text-[rgb(var(--muted-foreground))]">
                  No expenses this month
                </div>
              )}
            </motion.div>
          </div>

          {/* AI Insights */}
          {insights.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">AI Insights</h3>
                <Link
                  href="/insights"
                  className="text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {insights.slice(0, 3).map((insight) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onDismiss={dismissInsight}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          )}

          {/* Heatmap Calendar */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="p-6 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Spending Activity</h3>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
            </div>
            <HeatmapCalendar expenses={expenses} months={3} />
          </motion.section>
        </div>
      </main>
    </div>
  );
}
