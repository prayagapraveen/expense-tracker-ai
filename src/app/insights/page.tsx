"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Brain, Lightbulb, AlertTriangle, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Navigation } from "@/components/layout/Navigation";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { WellnessRing } from "@/components/ui/WellnessRing";
import { InsightCard } from "@/components/ui/InsightCard";
import { cn } from "@/lib/utils";

export default function InsightsPage() {
  const { insights, dismissInsight, wellnessScore } = useApp();

  const insightsByType = {
    warning: insights.filter((i) => i.type === "warning"),
    tip: insights.filter((i) => i.type === "tip"),
    pattern: insights.filter((i) => i.type === "pattern"),
    achievement: insights.filter((i) => i.type === "achievement"),
    prediction: insights.filter((i) => i.type === "prediction"),
  };

  const wellnessCategories = wellnessScore
    ? [
        { name: "Budget Adherence", score: wellnessScore.categories.budgetAdherence, icon: "🎯" },
        { name: "Savings Rate", score: wellnessScore.categories.savingsRate, icon: "💰" },
        { name: "Spending Consistency", score: wellnessScore.categories.spendingConsistency, icon: "📊" },
        { name: "Category Balance", score: wellnessScore.categories.categoryBalance, icon: "⚖️" },
        { name: "Recurring Management", score: wellnessScore.categories.recurringManagement, icon: "🔄" },
      ]
    : [];

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <Navigation />
      <CommandPalette />

      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="w-8 h-8 text-brand-500" />
              AI Insights
            </h1>
            <p className="text-[rgb(var(--muted-foreground))] mt-1">
              Smart analysis of your spending patterns
            </p>
          </div>

          {/* Wellness Score */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              <WellnessRing
                score={wellnessScore?.overall || 50}
                size="lg"
                trend={wellnessScore?.trend}
              />

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2">Financial Wellness Score</h2>
                <p className="text-brand-100 mb-4">
                  Your overall financial health based on spending habits, budget adherence, and consistency.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {wellnessCategories.map((cat) => (
                    <div
                      key={cat.name}
                      className="p-3 rounded-xl bg-white/10 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span>{cat.icon}</span>
                        <span className="text-sm text-brand-100">{cat.name}</span>
                      </div>
                      <p className="text-xl font-bold">{cat.score}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Active Insights */}
          {insights.length > 0 ? (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-500" />
                Active Insights ({insights.length})
              </h2>

              <div className="space-y-4">
                {/* Warnings first */}
                {insightsByType.warning.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Warnings
                    </h3>
                    <AnimatePresence>
                      {insightsByType.warning.map((insight) => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          onDismiss={dismissInsight}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Tips */}
                {insightsByType.tip.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Tips
                    </h3>
                    <AnimatePresence>
                      {insightsByType.tip.map((insight) => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          onDismiss={dismissInsight}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Patterns */}
                {insightsByType.pattern.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Patterns Detected
                    </h3>
                    <AnimatePresence>
                      {insightsByType.pattern.map((insight) => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          onDismiss={dismissInsight}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Predictions */}
                {insightsByType.prediction.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-cyan-600 dark:text-cyan-400 flex items-center gap-2">
                      🔮 Predictions
                    </h3>
                    <AnimatePresence>
                      {insightsByType.prediction.map((insight) => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          onDismiss={dismissInsight}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Achievements */}
                {insightsByType.achievement.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                      🎉 Achievements
                    </h3>
                    <AnimatePresence>
                      {insightsByType.achievement.map((insight) => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          onDismiss={dismissInsight}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.section>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-12 text-center rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
            >
              <Brain className="w-16 h-16 mx-auto mb-4 text-[rgb(var(--muted-foreground))]" />
              <h3 className="text-lg font-semibold mb-2">No Insights Yet</h3>
              <p className="text-[rgb(var(--muted-foreground))] max-w-md mx-auto">
                Add more expenses and the AI will analyze your spending patterns to provide personalized insights.
              </p>
            </motion.div>
          )}

          {/* How it works */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
          >
            <h2 className="text-lg font-semibold mb-4">How AI Insights Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[rgb(var(--muted))]">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-medium mb-1">Pattern Analysis</h3>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  Detects recurring expenses, spending spikes, and category trends
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[rgb(var(--muted))]">
                <div className="text-2xl mb-2">⚠️</div>
                <h3 className="font-medium mb-1">Smart Alerts</h3>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  Warns you when approaching budget limits or unusual spending
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[rgb(var(--muted))]">
                <div className="text-2xl mb-2">🔮</div>
                <h3 className="font-medium mb-1">Predictions</h3>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  Projects monthly spending based on current patterns
                </p>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
