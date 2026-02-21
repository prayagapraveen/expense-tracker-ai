"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Zap, Clock, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { parseExpenseInput, QUICK_TEMPLATES } from "@/lib/nlp-parser";
import { formatCurrency, cn } from "@/lib/utils";
import { getCategoryMeta } from "@/types";

export function SmartInput() {
  const { addExpenseFromText } = useApp();
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [preview, setPreview] = useState<ReturnType<typeof parseExpenseInput> | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse input as user types
  useEffect(() => {
    if (input.trim().length > 2) {
      const parsed = parseExpenseInput(input);
      setPreview(parsed);
    } else {
      setPreview(null);
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const result = addExpenseFromText(input);

    if (result.success) {
      setShowSuccess(true);
      setInput("");
      setPreview(null);
      setError(null);
      setTimeout(() => setShowSuccess(false), 2000);
    } else {
      setError(result.error || "Could not add expense");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleQuickTemplate = (template: string) => {
    setInput(template);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main Input */}
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "relative rounded-2xl transition-all duration-300",
            isFocused
              ? "shadow-lg shadow-brand-500/20 ring-2 ring-brand-500"
              : "shadow-md hover:shadow-lg"
          )}
        >
          <div className="flex items-center gap-3 bg-[rgb(var(--card))] rounded-2xl px-4 py-3">
            <div
              className={cn(
                "p-2 rounded-xl transition-colors",
                isFocused ? "bg-brand-500 text-white" : "bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
              )}
            >
              <Sparkles className="w-5 h-5" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder="Type naturally... 'Coffee $5 yesterday' or 'Uber 12.50 to airport'"
              className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-[rgb(var(--muted-foreground))]"
            />

            <button
              type="submit"
              disabled={!input.trim() || showSuccess}
              className={cn(
                "p-2 rounded-xl transition-all",
                input.trim()
                  ? "bg-brand-500 text-white hover:bg-brand-600"
                  : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]"
              )}
            >
              {showSuccess ? (
                <Check className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Live Preview */}
          <AnimatePresence>
            {preview && preview.amount && isFocused && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 top-full mt-2 p-4 bg-[rgb(var(--card))] rounded-xl shadow-lg border border-[rgb(var(--border))] z-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[rgb(var(--muted-foreground))]">Preview</span>
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-brand-500" />
                    <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                      {preview.confidence}% confident
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-3xl">
                    {getCategoryMeta(preview.category).icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{preview.description}</p>
                    <p className="text-sm text-[rgb(var(--muted-foreground))]">
                      {getCategoryMeta(preview.category).name} • {preview.date}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                    {formatCurrency(preview.amount)}
                  </div>
                </div>

                {preview.suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[rgb(var(--border))]">
                    <p className="text-sm text-[rgb(var(--muted-foreground))]">
                      {preview.suggestions[0]}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Templates */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {QUICK_TEMPLATES.map((template) => (
          <button
            key={template.text}
            onClick={() => handleQuickTemplate(template.text)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgb(var(--muted))] hover:bg-[rgb(var(--muted-foreground))/0.1] transition-colors text-sm"
          >
            <span>{template.icon}</span>
            <span>{template.text}</span>
          </button>
        ))}
      </div>

      {/* Keyboard shortcut hint */}
      <p className="text-center mt-4 text-sm text-[rgb(var(--muted-foreground))]">
        <kbd className="px-2 py-0.5 rounded bg-[rgb(var(--muted))] text-xs">Ctrl</kbd>
        {" + "}
        <kbd className="px-2 py-0.5 rounded bg-[rgb(var(--muted))] text-xs">K</kbd>
        {" to open command palette"}
      </p>
    </div>
  );
}
