"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, TrendingUp, TrendingDown, Edit2, Trash2, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Navigation } from "@/components/layout/Navigation";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { CATEGORIES, getCategoryMeta, ExpenseCategory, Budget } from "@/types";
import { formatCurrency, cn, generateId } from "@/lib/utils";
import { startOfMonth, endOfMonth } from "date-fns";

export default function BudgetsPage() {
  const { expenses, budgets, addBudget, updateBudget, deleteBudget } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [newBudget, setNewBudget] = useState({
    category: "food" as ExpenseCategory,
    limit: "",
    period: "monthly" as "weekly" | "monthly",
  });

  // Calculate spending for each budget
  const budgetStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return budgets.map((budget) => {
      const categoryExpenses = expenses.filter((e) => {
        const date = new Date(e.date);
        return (
          e.category === budget.category &&
          date >= monthStart &&
          date <= monthEnd
        );
      });

      const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      const percentage = (spent / budget.limit) * 100;
      const remaining = budget.limit - spent;

      return {
        ...budget,
        spent,
        percentage: Math.min(percentage, 100),
        remaining,
        isOver: spent > budget.limit,
      };
    });
  }, [budgets, expenses]);

  // Categories without a budget
  const availableCategories = CATEGORIES.filter(
    (cat) => !budgets.find((b) => b.category === cat.id)
  );

  const handleCreate = () => {
    if (!newBudget.limit || parseFloat(newBudget.limit) <= 0) return;

    addBudget({
      category: newBudget.category,
      limit: parseFloat(newBudget.limit),
      period: newBudget.period,
    });

    setNewBudget({ category: "food", limit: "", period: "monthly" });
    setShowCreate(false);
  };

  const handleUpdate = () => {
    if (!editingBudget || parseFloat(newBudget.limit) <= 0) return;

    updateBudget(editingBudget.id, {
      limit: parseFloat(newBudget.limit),
      period: newBudget.period,
    });

    setEditingBudget(null);
    setNewBudget({ category: "food", limit: "", period: "monthly" });
  };

  const startEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setNewBudget({
      category: budget.category,
      limit: budget.limit.toString(),
      period: budget.period,
    });
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgetStats.reduce((sum, b) => sum + b.spent, 0);

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <Navigation />
      <CommandPalette />

      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Budgets</h1>
              <p className="text-[rgb(var(--muted-foreground))]">
                Set spending limits for each category
              </p>
            </div>
            {availableCategories.length > 0 && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Budget
              </button>
            )}
          </div>

          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]">
              <p className="text-sm text-[rgb(var(--muted-foreground))] mb-1">Total Budget</p>
              <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
            </div>
            <div className="p-6 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]">
              <p className="text-sm text-[rgb(var(--muted-foreground))] mb-1">Total Spent</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="p-6 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]">
              <p className="text-sm text-[rgb(var(--muted-foreground))] mb-1">Remaining</p>
              <p className={cn(
                "text-2xl font-bold",
                totalBudget - totalSpent < 0 ? "text-red-500" : "text-green-500"
              )}>
                {formatCurrency(totalBudget - totalSpent)}
              </p>
            </div>
          </div>

          {/* Budget list */}
          <div className="space-y-4">
            {budgetStats.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]">
                <Target className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--muted-foreground))]" />
                <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
                <p className="text-[rgb(var(--muted-foreground))] mb-4">
                  Create your first budget to start tracking spending limits
                </p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600"
                >
                  <Plus className="w-4 h-4" />
                  Create Budget
                </button>
              </div>
            ) : (
              <AnimatePresence>
                {budgetStats.map((budget, index) => {
                  const meta = getCategoryMeta(budget.category);
                  return (
                    <motion.div
                      key={budget.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      className="group p-6 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center text-xl",
                              `bg-gradient-to-br ${meta.gradient} text-white`
                            )}
                          >
                            {meta.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold">{meta.name}</h3>
                            <p className="text-sm text-[rgb(var(--muted-foreground))]">
                              {budget.period === "monthly" ? "Monthly" : "Weekly"} budget
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(budget)}
                            className="p-2 rounded-lg hover:bg-[rgb(var(--muted))]"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteBudget(budget.id)}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-3">
                        <div className="h-3 bg-[rgb(var(--muted))] rounded-full overflow-hidden">
                          <motion.div
                            className={cn(
                              "h-full rounded-full",
                              budget.isOver
                                ? "bg-red-500"
                                : budget.percentage > 80
                                  ? "bg-yellow-500"
                                  : "bg-brand-500"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${budget.percentage}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span>
                            Spent: <strong>{formatCurrency(budget.spent)}</strong>
                          </span>
                          <span className="text-[rgb(var(--muted-foreground))]">
                            of {formatCurrency(budget.limit)}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "font-medium",
                            budget.isOver ? "text-red-500" : "text-green-500"
                          )}
                        >
                          {budget.isOver ? (
                            <>
                              <TrendingUp className="inline w-4 h-4 mr-1" />
                              {formatCurrency(Math.abs(budget.remaining))} over
                            </>
                          ) : (
                            <>
                              <TrendingDown className="inline w-4 h-4 mr-1" />
                              {formatCurrency(budget.remaining)} left
                            </>
                          )}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      {/* Create/Edit modal */}
      <AnimatePresence>
        {(showCreate || editingBudget) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => {
              setShowCreate(false);
              setEditingBudget(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="p-6 rounded-2xl bg-[rgb(var(--card))] max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {editingBudget ? "Edit Budget" : "Create Budget"}
                </h3>
                <button
                  onClick={() => {
                    setShowCreate(false);
                    setEditingBudget(null);
                  }}
                  className="p-1 rounded-lg hover:bg-[rgb(var(--muted))]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Category */}
                {!editingBudget && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={newBudget.category}
                      onChange={(e) =>
                        setNewBudget((b) => ({
                          ...b,
                          category: e.target.value as ExpenseCategory,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--muted))] border-none outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {availableCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Limit */}
                <div>
                  <label className="block text-sm font-medium mb-2">Budget Limit</label>
                  <input
                    type="number"
                    value={newBudget.limit}
                    onChange={(e) =>
                      setNewBudget((b) => ({ ...b, limit: e.target.value }))
                    }
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--muted))] border-none outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Period */}
                <div>
                  <label className="block text-sm font-medium mb-2">Period</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setNewBudget((b) => ({ ...b, period: "monthly" }))}
                      className={cn(
                        "flex-1 py-3 rounded-xl border-2 transition-colors",
                        newBudget.period === "monthly"
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                          : "border-[rgb(var(--border))]"
                      )}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setNewBudget((b) => ({ ...b, period: "weekly" }))}
                      className={cn(
                        "flex-1 py-3 rounded-xl border-2 transition-colors",
                        newBudget.period === "weekly"
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                          : "border-[rgb(var(--border))]"
                      )}
                    >
                      Weekly
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={editingBudget ? handleUpdate : handleCreate}
                  disabled={!newBudget.limit || parseFloat(newBudget.limit) <= 0}
                  className="w-full py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {editingBudget ? "Update Budget" : "Create Budget"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
