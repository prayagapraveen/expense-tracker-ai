"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  FileText,
  FileJson,
  FileSpreadsheet,
  Calendar,
  Filter,
  Eye,
  Loader2,
  Check,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";
import { Expense, ExpenseCategory, CATEGORIES, getCategoryMeta } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";

type ExportFormat = "csv" | "json" | "pdf";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
}

export function ExportModal({ isOpen, onClose, expenses }: ExportModalProps) {
  // State
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<ExpenseCategory[]>([]);
  const [filename, setFilename] = useState(`expenses-${new Date().toISOString().split("T")[0]}`);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Filter expenses based on criteria
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Date filter
      if (startDate && endDate) {
        const expenseDate = parseISO(expense.date);
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        if (!isWithinInterval(expenseDate, { start, end })) {
          return false;
        }
      } else if (startDate) {
        if (expense.date < startDate) return false;
      } else if (endDate) {
        if (expense.date > endDate) return false;
      }

      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(expense.category)) {
        return false;
      }

      return true;
    });
  }, [expenses, startDate, endDate, selectedCategories]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const categories = new Set(filteredExpenses.map((e) => e.category)).size;
    return {
      count: filteredExpenses.length,
      total,
      categories,
    };
  }, [filteredExpenses]);

  // Toggle category selection
  const toggleCategory = useCallback((category: ExpenseCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }, []);

  // Select all / clear all categories
  const selectAllCategories = useCallback(() => {
    setSelectedCategories(CATEGORIES.map((c) => c.id));
  }, []);

  const clearAllCategories = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  // Generate CSV content
  const generateCSV = useCallback((data: Expense[]): string => {
    const headers = ["Date", "Category", "Amount", "Description", "Tags", "Recurring", "Mood", "Location"];
    const rows = data.map((e) => [
      e.date,
      getCategoryMeta(e.category).name,
      e.amount.toFixed(2),
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.tags.join(", ")}"`,
      e.isRecurring ? "Yes" : "No",
      e.mood || "",
      e.location || "",
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }, []);

  // Generate JSON content
  const generateJSON = useCallback((data: Expense[]): string => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalRecords: data.length,
      totalAmount: data.reduce((sum, e) => sum + e.amount, 0),
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        categories: selectedCategories.length > 0 ? selectedCategories : "all",
      },
      expenses: data.map((e) => ({
        date: e.date,
        category: e.category,
        categoryName: getCategoryMeta(e.category).name,
        amount: e.amount,
        description: e.description,
        tags: e.tags,
        isRecurring: e.isRecurring,
        recurringFrequency: e.recurringFrequency || null,
        mood: e.mood || null,
        location: e.location || null,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }, [startDate, endDate, selectedCategories]);

  // Generate PDF content (creates a printable HTML that opens in new window)
  const generatePDF = useCallback((data: Expense[]) => {
    const total = data.reduce((sum, e) => sum + e.amount, 0);
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Expense Report - ${filename}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #22c55e; margin-bottom: 8px; }
          .subtitle { color: #6b7280; margin-bottom: 24px; }
          .summary { background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px; display: flex; gap: 32px; }
          .summary-item { }
          .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .summary-value { font-size: 24px; font-weight: bold; color: #111827; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; color: #6b7280; }
          td { padding: 12px 8px; border-bottom: 1px solid #e5e7eb; }
          .amount { font-weight: 600; color: #111827; }
          .category { display: inline-flex; align-items: center; gap: 4px; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Expense Report</h1>
        <p class="subtitle">Generated on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Total Expenses</div>
            <div class="summary-value">${data.length}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Amount</div>
            <div class="summary-value">$${total.toFixed(2)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Date Range</div>
            <div class="summary-value" style="font-size: 16px;">${startDate || "Start"} to ${endDate || "Present"}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (e) => `
              <tr>
                <td>${e.date}</td>
                <td><span class="category">${getCategoryMeta(e.category).icon} ${getCategoryMeta(e.category).name}</span></td>
                <td>${e.description}</td>
                <td style="text-align: right;" class="amount">$${e.amount.toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>SpendWise Export • ${filename}</p>
        </div>

        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  }, [filename, startDate, endDate]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (filteredExpenses.length === 0) return;

    setIsExporting(true);
    setExportSuccess(false);

    // Simulate processing time for better UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      if (format === "pdf") {
        generatePDF(filteredExpenses);
      } else {
        const content = format === "csv" ? generateCSV(filteredExpenses) : generateJSON(filteredExpenses);
        const mimeType = format === "csv" ? "text/csv" : "application/json";
        const extension = format === "csv" ? "csv" : "json";

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } finally {
      setIsExporting(false);
    }
  }, [filteredExpenses, format, filename, generateCSV, generateJSON, generatePDF]);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setShowPreview(false);
    setExportSuccess(false);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const formatOptions: { id: ExportFormat; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: "csv", label: "CSV", icon: <FileSpreadsheet className="w-5 h-5" />, desc: "Spreadsheet compatible" },
    { id: "json", label: "JSON", icon: <FileJson className="w-5 h-5" />, desc: "Structured data" },
    { id: "pdf", label: "PDF", icon: <FileText className="w-5 h-5" />, desc: "Print-ready report" },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-[rgb(var(--card))] rounded-2xl shadow-2xl border border-[rgb(var(--border))] m-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border))]">
            <div>
              <h2 className="text-xl font-semibold">Export Data</h2>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">
                Configure your export settings
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Export Format</label>
              <div className="grid grid-cols-3 gap-3">
                {formatOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFormat(opt.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      format === opt.id
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                        : "border-[rgb(var(--border))] hover:border-[rgb(var(--muted-foreground))]"
                    )}
                  >
                    <div className={cn("mb-2", format === opt.id ? "text-brand-600 dark:text-brand-400" : "")}>
                      {opt.icon}
                    </div>
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-xs text-[rgb(var(--muted-foreground))]">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[rgb(var(--muted-foreground))] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[rgb(var(--muted-foreground))] mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Categories
              </label>
              <div className="relative">
                <button
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] flex items-center justify-between"
                >
                  <span className="text-sm">
                    {selectedCategories.length === 0
                      ? "All categories"
                      : `${selectedCategories.length} selected`}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", categoryDropdownOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {categoryDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 w-full mt-2 p-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-lg"
                    >
                      <div className="flex gap-2 mb-2 pb-2 border-b border-[rgb(var(--border))]">
                        <button
                          onClick={selectAllCategories}
                          className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          Select all
                        </button>
                        <button
                          onClick={clearAllCategories}
                          className="text-xs text-[rgb(var(--muted-foreground))] hover:underline"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors",
                              selectedCategories.includes(cat.id)
                                ? "bg-brand-100 dark:bg-brand-900/30"
                                : "hover:bg-[rgb(var(--muted))]"
                            )}
                          >
                            <span>{cat.icon}</span>
                            <span className="flex-1 truncate">{cat.name}</span>
                            {selectedCategories.includes(cat.id) && (
                              <Check className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Filename */}
            <div>
              <label className="block text-sm font-medium mb-3">Filename</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                  className="flex-1 px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="expense-report"
                />
                <span className="text-sm text-[rgb(var(--muted-foreground))]">.{format}</span>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-[rgb(var(--muted))]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Export Summary</span>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? "Hide preview" : "Preview data"}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold">{summary.count}</div>
                  <div className="text-xs text-[rgb(var(--muted-foreground))]">Records</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(summary.total)}</div>
                  <div className="text-xs text-[rgb(var(--muted-foreground))]">Total Amount</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{summary.categories}</div>
                  <div className="text-xs text-[rgb(var(--muted-foreground))]">Categories</div>
                </div>
              </div>

              {summary.count === 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  No expenses match your filters
                </div>
              )}
            </div>

            {/* Data Preview */}
            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border border-[rgb(var(--border))] rounded-xl overflow-hidden">
                    <div className="max-h-64 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[rgb(var(--muted))] sticky top-0">
                          <tr>
                            <th className="text-left p-3 font-medium">Date</th>
                            <th className="text-left p-3 font-medium">Category</th>
                            <th className="text-left p-3 font-medium">Description</th>
                            <th className="text-right p-3 font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredExpenses.slice(0, 10).map((expense) => (
                            <tr key={expense.id} className="border-t border-[rgb(var(--border))]">
                              <td className="p-3">{expense.date}</td>
                              <td className="p-3">
                                <span className="flex items-center gap-1">
                                  {getCategoryMeta(expense.category).icon}
                                  {getCategoryMeta(expense.category).name}
                                </span>
                              </td>
                              <td className="p-3 truncate max-w-[150px]">{expense.description}</td>
                              <td className="p-3 text-right font-medium">{formatCurrency(expense.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredExpenses.length > 10 && (
                        <div className="p-3 text-center text-sm text-[rgb(var(--muted-foreground))] bg-[rgb(var(--muted))]">
                          + {filteredExpenses.length - 10} more records
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[rgb(var(--border))]">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-[rgb(var(--muted))] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || summary.count === 0}
              className={cn(
                "flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-lg transition-all",
                exportSuccess
                  ? "bg-green-500 text-white"
                  : "bg-brand-600 hover:bg-brand-700 text-white",
                (isExporting || summary.count === 0) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : exportSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Exported!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export {summary.count} Records
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
