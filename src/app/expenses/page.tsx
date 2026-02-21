"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  MoreVertical,
  X,
  Calendar,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Navigation } from "@/components/layout/Navigation";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { SmartInput } from "@/components/ui/SmartInput";
import { Expense, CATEGORIES, getCategoryMeta, ExpenseCategory } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/storage";

export default function ExpensesPage() {
  const { expenses, updateExpense, deleteExpense } = useApp();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | "all">("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(lowerSearch) ||
          e.category.toLowerCase().includes(lowerSearch)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((e) => e.category === selectedCategory);
    }

    // Date range filter
    if (dateRange.start) {
      result = result.filter((e) => e.date >= dateRange.start);
    }
    if (dateRange.end) {
      result = result.filter((e) => e.date <= dateRange.end);
    }

    // Sort
    result.sort((a, b) => {
      const aValue = sortBy === "date" ? new Date(a.date).getTime() : a.amount;
      const bValue = sortBy === "date" ? new Date(b.date).getTime() : b.amount;
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

    return result;
  }, [expenses, search, selectedCategory, dateRange, sortBy, sortOrder]);

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDelete = (id: string) => {
    deleteExpense(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <Navigation />
      <CommandPalette />

      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Expenses</h1>
              <p className="text-[rgb(var(--muted-foreground))]">
                {filteredExpenses.length} expenses • {formatCurrency(totalFiltered)} total
              </p>
            </div>
            <button
              onClick={() => exportToCSV(filteredExpenses)}
              className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl hover:bg-[rgb(var(--muted))] transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Quick Add */}
          <div className="p-6 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]">
            <h3 className="text-sm font-medium text-[rgb(var(--muted-foreground))] mb-3">
              Quick Add
            </h3>
            <SmartInput />
          </div>

          {/* Filters */}
          <div className="p-4 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-foreground))]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search expenses..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[rgb(var(--muted))] border-none outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Category filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ExpenseCategory | "all")}
                className="px-4 py-2 rounded-xl bg-[rgb(var(--muted))] border-none outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>

              {/* Date range */}
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((d) => ({ ...d, start: e.target.value }))}
                className="px-4 py-2 rounded-xl bg-[rgb(var(--muted))] border-none outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[rgb(var(--muted-foreground))]">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((d) => ({ ...d, end: e.target.value }))}
                className="px-4 py-2 rounded-xl bg-[rgb(var(--muted))] border-none outline-none focus:ring-2 focus:ring-brand-500"
              />

              {/* Clear filters */}
              {(search || selectedCategory !== "all" || dateRange.start || dateRange.end) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                    setDateRange({ start: "", end: "" });
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Expense list */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredExpenses.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 text-center rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
                >
                  <p className="text-[rgb(var(--muted-foreground))]">
                    {expenses.length === 0
                      ? "No expenses yet. Add your first expense above!"
                      : "No expenses match your filters."}
                  </p>
                </motion.div>
              ) : (
                filteredExpenses.map((expense, index) => {
                  const meta = getCategoryMeta(expense.category);
                  return (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.02 }}
                      className="group p-4 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] hover:border-brand-300 dark:hover:border-brand-700 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-xl",
                            `bg-gradient-to-br ${meta.gradient} text-white`
                          )}
                        >
                          {meta.icon}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{expense.description}</p>
                          <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))]">
                            <span>{meta.name}</span>
                            <span>•</span>
                            <span>{formatDate(expense.date, "relative")}</span>
                            {expense.isRecurring && (
                              <>
                                <span>•</span>
                                <span className="text-brand-600 dark:text-brand-400">🔄 Recurring</span>
                              </>
                            )}
                          </div>
                          {expense.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              {expense.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 text-xs rounded-full bg-[rgb(var(--muted))]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Amount */}
                        <p className="text-xl font-bold">{formatCurrency(expense.amount)}</p>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingId(expense.id)}
                            className="p-2 rounded-lg hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(expense.id)}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-[rgb(var(--muted-foreground))] hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="p-6 rounded-2xl bg-[rgb(var(--card))] max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2">Delete Expense?</h3>
              <p className="text-[rgb(var(--muted-foreground))] mb-6">
                This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-xl hover:bg-[rgb(var(--muted))]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
