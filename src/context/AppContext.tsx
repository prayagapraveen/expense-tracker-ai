"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Expense,
  Budget,
  Achievement,
  AchievementId,
  UserProfile,
  WellnessScore,
  Insight,
  ExpenseCategory,
  ACHIEVEMENTS,
} from "@/types";
import {
  getExpenses,
  saveExpenses,
  getBudgets,
  saveBudgets,
  getUnlockedAchievements,
  saveAchievements,
  getProfile,
  saveProfile,
  getWellnessScore,
  saveWellnessScore,
  getDismissedInsights,
  dismissInsight as storeDismissedInsight,
} from "@/lib/storage";
import { generateId, formatDateForInput, calculateLevel } from "@/lib/utils";
import { parseExpenseInput } from "@/lib/nlp-parser";
import { generateInsights, calculateWellnessScore } from "@/lib/insights-engine";
import { checkAchievements, calculateStreak, calculateXP } from "@/lib/gamification";

interface AppContextType {
  // State
  expenses: Expense[];
  budgets: Budget[];
  profile: UserProfile;
  achievements: Achievement[];
  wellnessScore: WellnessScore | null;
  insights: Insight[];
  isLoading: boolean;
  theme: "light" | "dark";

  // Expense actions
  addExpenseFromText: (text: string) => { success: boolean; expense?: Expense; error?: string };
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Budget actions
  addBudget: (budget: Omit<Budget, "id" | "createdAt">) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // Profile actions
  updateProfile: (updates: Partial<UserProfile>) => void;
  addXP: (amount: number) => void;

  // Insight actions
  dismissInsight: (id: string) => void;

  // Theme
  toggleTheme: () => void;

  // Notifications
  newAchievements: Achievement[];
  clearNewAchievements: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [wellnessScore, setWellnessScore] = useState<WellnessScore | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  const isInitialized = useRef(false);

  // Initialize from storage
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const storedExpenses = getExpenses();
    const storedBudgets = getBudgets();
    const storedAchievements = getUnlockedAchievements();
    const storedProfile = getProfile();
    const storedWellness = getWellnessScore();

    setExpenses(storedExpenses);
    setBudgets(storedBudgets);
    setAchievements(storedAchievements);
    setProfile(storedProfile);
    setWellnessScore(storedWellness);

    // Initialize theme
    const savedTheme = storedProfile.preferences.theme;
    if (savedTheme === "dark" || (savedTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }

    // Update streak
    const newStreak = calculateStreak(storedExpenses, storedProfile.lastActiveDate);
    if (newStreak !== storedProfile.streak) {
      const updatedProfile = { ...storedProfile, streak: newStreak };
      setProfile(updatedProfile);
      saveProfile(updatedProfile);
    }

    // Generate insights
    const dismissedIds = getDismissedInsights();
    const newInsights = generateInsights(storedExpenses, storedBudgets, dismissedIds);
    setInsights(newInsights);

    setIsLoading(false);
  }, []);

  // Save expenses to storage
  useEffect(() => {
    if (!isLoading) {
      saveExpenses(expenses);

      // Recalculate wellness score
      const newWellness = calculateWellnessScore(expenses, budgets);
      setWellnessScore(newWellness);
      saveWellnessScore(newWellness);

      // Regenerate insights
      const dismissedIds = getDismissedInsights();
      const newInsights = generateInsights(expenses, budgets, dismissedIds);
      setInsights(newInsights);
    }
  }, [expenses, budgets, isLoading]);

  // Check achievements
  useEffect(() => {
    if (!isLoading && expenses.length > 0) {
      const unlockedIds = achievements.map((a) => a.id as AchievementId);
      const newUnlocks = checkAchievements(expenses, budgets, profile, unlockedIds);

      if (newUnlocks.length > 0) {
        const unlocked = newUnlocks.map((u) => u.achievement);
        setAchievements((prev) => [...prev, ...unlocked]);
        saveAchievements([...achievements, ...unlocked]);
        setNewAchievements(unlocked);

        // Add XP for each achievement
        const totalXP = unlocked.reduce((sum, a) => sum + a.xp, 0);
        addXP(totalXP);

        // Celebration!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  }, [expenses, budgets, profile, isLoading]);

  const addExpenseFromText = useCallback((text: string) => {
    const parsed = parseExpenseInput(text);

    if (parsed.amount === null || parsed.amount <= 0) {
      return { success: false, error: "Could not parse amount from input" };
    }

    const expense: Expense = {
      id: generateId(),
      amount: parsed.amount,
      category: parsed.category,
      description: parsed.description,
      date: parsed.date,
      createdAt: new Date().toISOString(),
      tags: [],
      isRecurring: false,
    };

    setExpenses((prev) => [expense, ...prev]);

    // Update profile
    const today = formatDateForInput(new Date());
    const newStreak = profile.lastActiveDate === formatDateForInput(new Date(Date.now() - 86400000))
      ? profile.streak + 1
      : profile.lastActiveDate === today
        ? profile.streak
        : 1;

    const updatedProfile = {
      ...profile,
      lastActiveDate: today,
      streak: newStreak,
      xp: profile.xp + calculateXP("add_expense"),
    };
    setProfile(updatedProfile);
    saveProfile(updatedProfile);

    return { success: true, expense };
  }, [profile]);

  const addExpense = useCallback((expenseData: Omit<Expense, "id" | "createdAt">) => {
    const expense: Expense = {
      ...expenseData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    setExpenses((prev) => [expense, ...prev]);

    // Update profile
    const today = formatDateForInput(new Date());
    const updatedProfile = {
      ...profile,
      lastActiveDate: today,
      xp: profile.xp + calculateXP("add_expense"),
    };
    setProfile(updatedProfile);
    saveProfile(updatedProfile);
  }, [profile]);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addBudget = useCallback((budgetData: Omit<Budget, "id" | "createdAt">) => {
    const budget: Budget = {
      ...budgetData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    setBudgets((prev) => [...prev, budget]);
    saveBudgets([...budgets, budget]);

    // Add XP
    addXP(calculateXP("add_budget"));
  }, [budgets]);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    const updated = budgets.map((b) => (b.id === id ? { ...b, ...updates } : b));
    setBudgets(updated);
    saveBudgets(updated);
  }, [budgets]);

  const deleteBudget = useCallback((id: string) => {
    const updated = budgets.filter((b) => b.id !== id);
    setBudgets(updated);
    saveBudgets(updated);
  }, [budgets]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    saveProfile(updated);
  }, [profile]);

  const addXP = useCallback((amount: number) => {
    const newXP = profile.xp + amount;
    const { level: newLevel } = calculateLevel(newXP);
    const { level: oldLevel } = calculateLevel(profile.xp);

    const updated = {
      ...profile,
      xp: newXP,
      level: newLevel,
    };
    setProfile(updated);
    saveProfile(updated);

    // Level up celebration
    if (newLevel > oldLevel) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#22c55e", "#16a34a", "#4ade80"],
      });
    }
  }, [profile]);

  const dismissInsightHandler = useCallback((id: string) => {
    storeDismissedInsight(id);
    setInsights((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
    updateProfile({ preferences: { ...profile.preferences, theme: newTheme } });
  }, [theme, profile.preferences, updateProfile]);

  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        expenses,
        budgets,
        profile,
        achievements,
        wellnessScore,
        insights,
        isLoading,
        theme,
        addExpenseFromText,
        addExpense,
        updateExpense,
        deleteExpense,
        addBudget,
        updateBudget,
        deleteBudget,
        updateProfile,
        addXP,
        dismissInsight: dismissInsightHandler,
        toggleTheme,
        newAchievements,
        clearNewAchievements,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
