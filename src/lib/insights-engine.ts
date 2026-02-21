import { Expense, Budget, Insight, WellnessScore, getCategoryMeta } from "@/types";
import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { generateId, formatCurrency } from "./utils";

// Generate AI-powered insights based on spending patterns
export function generateInsights(
  expenses: Expense[],
  budgets: Budget[],
  dismissedIds: string[]
): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");

  // Get expenses for different time periods
  const last7Days = expenses.filter(
    (e) => differenceInDays(now, new Date(e.date)) <= 7
  );
  const last30Days = expenses.filter(
    (e) => differenceInDays(now, new Date(e.date)) <= 30
  );
  const thisMonth = expenses.filter((e) => {
    const expDate = new Date(e.date);
    return (
      expDate >= startOfMonth(now) && expDate <= endOfMonth(now)
    );
  });

  // 1. Spending spike detection
  const weeklyTotal = last7Days.reduce((sum, e) => sum + e.amount, 0);
  const avgWeeklySpend = last30Days.length > 0
    ? (last30Days.reduce((sum, e) => sum + e.amount, 0) / 30) * 7
    : 0;

  if (avgWeeklySpend > 0 && weeklyTotal > avgWeeklySpend * 1.5) {
    insights.push({
      id: `spike-${today}`,
      type: "warning",
      title: "Spending Spike Detected",
      message: `You've spent ${formatCurrency(weeklyTotal)} this week, which is ${Math.round(((weeklyTotal - avgWeeklySpend) / avgWeeklySpend) * 100)}% higher than your usual weekly average.`,
      icon: "📈",
      priority: 90,
      createdAt: now.toISOString(),
      dismissed: false,
    });
  }

  // 2. Budget warnings
  for (const budget of budgets) {
    const categoryExpenses = thisMonth.filter((e) => e.category === budget.category);
    const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    const percentUsed = (spent / budget.limit) * 100;

    if (percentUsed >= 90 && percentUsed < 100) {
      insights.push({
        id: `budget-warning-${budget.category}-${today}`,
        type: "warning",
        title: `${getCategoryMeta(budget.category).name} Budget Alert`,
        message: `You've used ${Math.round(percentUsed)}% of your ${getCategoryMeta(budget.category).name} budget. Only ${formatCurrency(budget.limit - spent)} remaining!`,
        icon: "⚠️",
        priority: 85,
        createdAt: now.toISOString(),
        dismissed: false,
      });
    } else if (percentUsed >= 100) {
      insights.push({
        id: `budget-exceeded-${budget.category}-${today}`,
        type: "warning",
        title: `${getCategoryMeta(budget.category).name} Budget Exceeded!`,
        message: `You've exceeded your ${getCategoryMeta(budget.category).name} budget by ${formatCurrency(spent - budget.limit)}. Consider reducing spending in this category.`,
        icon: "🚨",
        priority: 95,
        createdAt: now.toISOString(),
        dismissed: false,
      });
    }
  }

  // 3. Pattern detection - recurring expenses
  const descriptionCounts: Record<string, { count: number; total: number }> = {};
  last30Days.forEach((e) => {
    const key = e.description.toLowerCase();
    if (!descriptionCounts[key]) {
      descriptionCounts[key] = { count: 0, total: 0 };
    }
    descriptionCounts[key].count++;
    descriptionCounts[key].total += e.amount;
  });

  Object.entries(descriptionCounts).forEach(([desc, data]) => {
    if (data.count >= 5 && !expenses.find((e) => e.description.toLowerCase() === desc && e.isRecurring)) {
      insights.push({
        id: `recurring-${desc.replace(/\s/g, "-")}`,
        type: "pattern",
        title: "Recurring Expense Detected",
        message: `"${desc}" appears ${data.count} times this month (${formatCurrency(data.total)} total). Want to mark it as recurring?`,
        icon: "🔄",
        actionLabel: "Mark as Recurring",
        priority: 60,
        createdAt: now.toISOString(),
        dismissed: false,
      });
    }
  });

  // 4. Category imbalance
  const categoryTotals: Record<string, number> = {};
  last30Days.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const totalSpent = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);
  Object.entries(categoryTotals).forEach(([category, amount]) => {
    const percentage = (amount / totalSpent) * 100;
    if (percentage > 50 && category !== "bills") {
      insights.push({
        id: `imbalance-${category}-${today}`,
        type: "tip",
        title: "Spending Imbalance",
        message: `${getCategoryMeta(category as any).name} accounts for ${Math.round(percentage)}% of your spending. Consider diversifying your budget.`,
        icon: "⚖️",
        priority: 50,
        createdAt: now.toISOString(),
        dismissed: false,
      });
    }
  });

  // 5. Savings opportunity
  const weekendExpenses = last30Days.filter((e) => {
    const day = new Date(e.date).getDay();
    return day === 0 || day === 6;
  });
  const weekendTotal = weekendExpenses.reduce((sum, e) => sum + e.amount, 0);
  const weekdayTotal = last30Days.reduce((sum, e) => sum + e.amount, 0) - weekendTotal;

  if (weekendTotal > weekdayTotal * 0.5) {
    insights.push({
      id: `weekend-spending-${today}`,
      type: "tip",
      title: "Weekend Spending Pattern",
      message: `You spend ${formatCurrency(weekendTotal)} on weekends (${Math.round((weekendTotal / (weekendTotal + weekdayTotal)) * 100)}% of total). Planning activities could help save money!`,
      icon: "📅",
      priority: 45,
      createdAt: now.toISOString(),
      dismissed: false,
    });
  }

  // 6. Positive reinforcement
  if (last7Days.length > 0) {
    const avgDailySpend = last7Days.reduce((sum, e) => sum + e.amount, 0) / 7;
    const prevWeekExpenses = expenses.filter(
      (e) => differenceInDays(now, new Date(e.date)) > 7 && differenceInDays(now, new Date(e.date)) <= 14
    );
    const prevAvgDaily = prevWeekExpenses.length > 0
      ? prevWeekExpenses.reduce((sum, e) => sum + e.amount, 0) / 7
      : 0;

    if (prevAvgDaily > 0 && avgDailySpend < prevAvgDaily * 0.8) {
      insights.push({
        id: `savings-win-${today}`,
        type: "achievement",
        title: "Great Progress! 🎉",
        message: `Your daily spending is down ${Math.round(((prevAvgDaily - avgDailySpend) / prevAvgDaily) * 100)}% compared to last week. Keep it up!`,
        icon: "🌟",
        priority: 70,
        createdAt: now.toISOString(),
        dismissed: false,
      });
    }
  }

  // 7. Prediction
  if (thisMonth.length >= 7) {
    const daysElapsed = now.getDate();
    const daysInMonth = endOfMonth(now).getDate();
    const projectedMonthlySpend = (thisMonth.reduce((sum, e) => sum + e.amount, 0) / daysElapsed) * daysInMonth;

    insights.push({
      id: `prediction-${format(now, "yyyy-MM")}`,
      type: "prediction",
      title: "Monthly Projection",
      message: `Based on current spending, you're projected to spend ${formatCurrency(projectedMonthlySpend)} this month.`,
      icon: "🔮",
      priority: 40,
      createdAt: now.toISOString(),
      dismissed: false,
    });
  }

  // Filter out dismissed insights
  return insights
    .filter((i) => !dismissedIds.includes(i.id))
    .sort((a, b) => b.priority - a.priority);
}

// Calculate financial wellness score
export function calculateWellnessScore(
  expenses: Expense[],
  budgets: Budget[]
): WellnessScore {
  const now = new Date();
  const thisMonth = expenses.filter((e) => {
    const expDate = new Date(e.date);
    return expDate >= startOfMonth(now) && expDate <= endOfMonth(now);
  });
  const lastMonth = expenses.filter((e) => {
    const expDate = new Date(e.date);
    const lastMonthStart = startOfMonth(subDays(startOfMonth(now), 1));
    const lastMonthEnd = endOfMonth(lastMonthStart);
    return expDate >= lastMonthStart && expDate <= lastMonthEnd;
  });

  // 1. Budget Adherence (0-100)
  let budgetAdherence = 100;
  if (budgets.length > 0) {
    let totalAdherence = 0;
    budgets.forEach((budget) => {
      const spent = thisMonth
        .filter((e) => e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);
      const adherence = Math.max(0, 100 - Math.max(0, ((spent - budget.limit) / budget.limit) * 100));
      totalAdherence += adherence;
    });
    budgetAdherence = totalAdherence / budgets.length;
  }

  // 2. Savings Rate (0-100) - comparing to previous month
  let savingsRate = 50; // Neutral if no comparison
  if (lastMonth.length > 0) {
    const lastMonthTotal = lastMonth.reduce((sum, e) => sum + e.amount, 0);
    const thisMonthTotal = thisMonth.reduce((sum, e) => sum + e.amount, 0);
    const percentChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    savingsRate = Math.max(0, Math.min(100, 50 - percentChange));
  }

  // 3. Spending Consistency (0-100) - lower variance is better
  let spendingConsistency = 100;
  if (thisMonth.length > 1) {
    const amounts = thisMonth.map((e) => e.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0;
    spendingConsistency = Math.max(0, 100 - coefficientOfVariation);
  }

  // 4. Category Balance (0-100)
  let categoryBalance = 100;
  const categoryTotals: Record<string, number> = {};
  thisMonth.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  const categories = Object.values(categoryTotals);
  if (categories.length > 1) {
    const total = categories.reduce((a, b) => a + b, 0);
    const idealPerCategory = total / categories.length;
    const deviation = categories.reduce(
      (sum, val) => sum + Math.abs(val - idealPerCategory),
      0
    ) / total;
    categoryBalance = Math.max(0, 100 - deviation * 100);
  }

  // 5. Recurring Management (0-100)
  const recurringExpenses = expenses.filter((e) => e.isRecurring);
  const recurringManagement = recurringExpenses.length > 0 ? 80 : 50;

  // Calculate overall score (weighted average)
  const weights = {
    budgetAdherence: 0.3,
    savingsRate: 0.25,
    spendingConsistency: 0.2,
    categoryBalance: 0.15,
    recurringManagement: 0.1,
  };

  const overall = Math.round(
    budgetAdherence * weights.budgetAdherence +
    savingsRate * weights.savingsRate +
    spendingConsistency * weights.spendingConsistency +
    categoryBalance * weights.categoryBalance +
    recurringManagement * weights.recurringManagement
  );

  // Determine trend
  let trend: WellnessScore["trend"] = "stable";
  if (savingsRate > 60) trend = "improving";
  else if (savingsRate < 40) trend = "declining";

  return {
    overall,
    categories: {
      budgetAdherence: Math.round(budgetAdherence),
      savingsRate: Math.round(savingsRate),
      spendingConsistency: Math.round(spendingConsistency),
      categoryBalance: Math.round(categoryBalance),
      recurringManagement: Math.round(recurringManagement),
    },
    trend,
    lastUpdated: now.toISOString(),
  };
}
