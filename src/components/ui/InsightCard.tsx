"use client";

import React from "react";
import { motion } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { Insight } from "@/types";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  insight: Insight;
  onDismiss: (id: string) => void;
}

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const typeStyles = {
    warning: "border-l-orange-500 bg-orange-50 dark:bg-orange-900/20",
    tip: "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20",
    achievement: "border-l-green-500 bg-green-50 dark:bg-green-900/20",
    pattern: "border-l-purple-500 bg-purple-50 dark:bg-purple-900/20",
    prediction: "border-l-cyan-500 bg-cyan-50 dark:bg-cyan-900/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "relative p-4 rounded-xl border-l-4",
        typeStyles[insight.type]
      )}
    >
      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(insight.id)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4 text-[rgb(var(--muted-foreground))]" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <span className="text-2xl">{insight.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold mb-1">{insight.title}</h4>
          <p className="text-sm text-[rgb(var(--muted-foreground))]">
            {insight.message}
          </p>

          {insight.actionLabel && (
            <button className="mt-2 flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">
              {insight.actionLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
