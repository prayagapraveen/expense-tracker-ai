import { Expense, Budget, Achievement, Challenge, UserProfile, WellnessScore, ACHIEVEMENTS } from "@/types";
import { formatDateForInput } from "./utils";

const STORAGE_KEYS = {
  EXPENSES: "spendwise-expenses",
  BUDGETS: "spendwise-budgets",
  ACHIEVEMENTS: "spendwise-achievements",
  CHALLENGES: "spendwise-challenges",
  PROFILE: "spendwise-profile",
  WELLNESS: "spendwise-wellness",
  DISMISSED_INSIGHTS: "spendwise-dismissed-insights",
};

// Expenses
export function getExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}

// Budgets
export function getBudgets(): Budget[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveBudgets(budgets: Budget[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
}

// Achievements
export function getUnlockedAchievements(): Achievement[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveAchievements(achievements: Achievement[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
}

// Challenges
export function getChallenges(): Challenge[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveChallenges(challenges: Challenge[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
}

// User Profile
export function getProfile(): UserProfile {
  if (typeof window === "undefined") return createDefaultProfile();
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return stored ? JSON.parse(stored) : createDefaultProfile();
  } catch {
    return createDefaultProfile();
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

function createDefaultProfile(): UserProfile {
  return {
    name: "Explorer",
    avatar: "🧑‍💼",
    level: 1,
    xp: 0,
    streak: 0,
    lastActiveDate: formatDateForInput(new Date()),
    totalSaved: 0,
    joinedAt: new Date().toISOString(),
    preferences: {
      currency: "USD",
      theme: "system",
      notifications: true,
      soundEffects: true,
    },
  };
}

// Wellness Score
export function getWellnessScore(): WellnessScore | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WELLNESS);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveWellnessScore(score: WellnessScore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.WELLNESS, JSON.stringify(score));
}

// Dismissed Insights
export function getDismissedInsights(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DISMISSED_INSIGHTS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function dismissInsight(insightId: string): void {
  if (typeof window === "undefined") return;
  const dismissed = getDismissedInsights();
  if (!dismissed.includes(insightId)) {
    dismissed.push(insightId);
    localStorage.setItem(STORAGE_KEYS.DISMISSED_INSIGHTS, JSON.stringify(dismissed));
  }
}

// Export functions
export function exportToCSV(expenses: Expense[]): void {
  const headers = ["Date", "Category", "Description", "Amount", "Tags", "Recurring", "Mood"];
  const rows = expenses.map((e) => [
    e.date,
    e.category,
    `"${e.description.replace(/"/g, '""')}"`,
    e.amount.toFixed(2),
    e.tags.join("; "),
    e.isRecurring ? "Yes" : "No",
    e.mood || "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadFile(csv, `spendwise-export-${formatDateForInput(new Date())}.csv`, "text/csv");
}

export function exportToJSON(data: { expenses: Expense[]; budgets: Budget[]; profile: UserProfile }): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `spendwise-backup-${formatDateForInput(new Date())}.json`, "application/json");
}

function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Import function
export function importFromJSON(jsonString: string): { expenses: Expense[]; budgets: Budget[] } | null {
  try {
    const data = JSON.parse(jsonString);
    if (data.expenses && Array.isArray(data.expenses)) {
      return {
        expenses: data.expenses,
        budgets: data.budgets || [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Clear all data
export function clearAllData(): void {
  if (typeof window === "undefined") return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}
