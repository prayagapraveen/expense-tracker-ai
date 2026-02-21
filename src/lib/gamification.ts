import { Achievement, AchievementId, Expense, Budget, UserProfile, ACHIEVEMENTS, CATEGORIES } from "@/types";
import { format, differenceInDays, parseISO } from "date-fns";

export interface AchievementUnlock {
  achievement: Achievement;
  isNew: boolean;
}

// Check and unlock achievements based on current state
export function checkAchievements(
  expenses: Expense[],
  budgets: Budget[],
  profile: UserProfile,
  unlockedIds: AchievementId[]
): AchievementUnlock[] {
  const unlocks: AchievementUnlock[] = [];
  const now = new Date();

  // Helper to unlock achievement
  const unlock = (id: AchievementId) => {
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    if (achievement && !unlockedIds.includes(id)) {
      unlocks.push({
        achievement: { ...achievement, unlockedAt: now.toISOString() },
        isNew: true,
      });
    }
  };

  // 1. First expense
  if (expenses.length >= 1) {
    unlock("first_expense");
  }

  // 2. Streak achievements
  if (profile.streak >= 3) unlock("streak_3");
  if (profile.streak >= 7) unlock("streak_7");
  if (profile.streak >= 30) unlock("streak_30");

  // 3. Category explorer - used all categories
  const usedCategories = new Set(expenses.map((e) => e.category));
  if (usedCategories.size >= CATEGORIES.length - 1) {
    unlock("category_explorer");
  }

  // 4. Early bird - expense logged before 7 AM
  const earlyExpense = expenses.find((e) => {
    const hour = parseISO(e.createdAt).getHours();
    return hour < 7;
  });
  if (earlyExpense) unlock("early_bird");

  // 5. Night owl - expense logged after 11 PM
  const nightExpense = expenses.find((e) => {
    const hour = parseISO(e.createdAt).getHours();
    return hour >= 23;
  });
  if (nightExpense) unlock("night_owl");

  // 6. Budget creator
  if (budgets.length >= 1) {
    unlock("budget_creator");
  }

  // 7. Budget master - stayed under budget for full month
  // (This would need historical tracking, simplified here)
  if (budgets.length > 0 && profile.xp >= 500) {
    unlock("budget_master");
  }

  // 8. Saver achievements - compare months
  const thisMonth = expenses.filter((e) => {
    const date = parseISO(e.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
  const lastMonth = expenses.filter((e) => {
    const date = parseISO(e.date);
    return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
  });

  if (lastMonth.length > 0 && thisMonth.length > 0) {
    const thisTotal = thisMonth.reduce((sum, e) => sum + e.amount, 0);
    const lastTotal = lastMonth.reduce((sum, e) => sum + e.amount, 0);
    const saved = lastTotal - thisTotal;

    if (saved >= 100) unlock("saver_bronze");
    if (saved >= 500) unlock("saver_silver");
    if (saved >= 1000) unlock("saver_gold");
  }

  return unlocks;
}

// Calculate streak
export function calculateStreak(expenses: Expense[], lastActiveDate: string): number {
  if (expenses.length === 0) return 0;

  const today = format(new Date(), "yyyy-MM-dd");
  const expenseDates = new Set(expenses.map((e) => e.date));

  // Check if user was active today or yesterday
  const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
  if (!expenseDates.has(today) && !expenseDates.has(yesterday)) {
    // Streak broken
    return expenseDates.has(today) ? 1 : 0;
  }

  // Count consecutive days
  let streak = 0;
  let currentDate = new Date();

  while (true) {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    if (expenseDates.has(dateStr)) {
      streak++;
      currentDate = new Date(currentDate.getTime() - 86400000);
    } else if (dateStr === today) {
      // Today doesn't count if no expense yet, check yesterday
      currentDate = new Date(currentDate.getTime() - 86400000);
    } else {
      break;
    }
  }

  return streak;
}

// Get level-up rewards
export function getLevelRewards(level: number): string[] {
  const rewards: Record<number, string[]> = {
    2: ["New avatar unlocked: 🦊"],
    3: ["Feature unlocked: Custom tags"],
    4: ["New avatar unlocked: 🦁"],
    5: ["Feature unlocked: Advanced analytics"],
    6: ["New avatar unlocked: 🐲"],
    7: ["Feature unlocked: Export to PDF"],
    8: ["New avatar unlocked: 🦄"],
    9: ["Feature unlocked: Spending predictions"],
    10: ["Achievement: Grandmaster status!", "All avatars unlocked"],
  };

  return rewards[level] || [];
}

// Get available avatars based on level
export function getAvailableAvatars(level: number): string[] {
  const avatars = ["🧑‍💼", "👤", "😊"];
  if (level >= 2) avatars.push("🦊");
  if (level >= 4) avatars.push("🦁");
  if (level >= 6) avatars.push("🐲");
  if (level >= 8) avatars.push("🦄");
  if (level >= 10) avatars.push("👑", "🌟", "💎");
  return avatars;
}

// Generate daily challenge
export function generateDailyChallenge(expenses: Expense[]): string {
  const challenges = [
    "Log all expenses within 1 hour of making them",
    "Keep total spending under $50 today",
    "No food delivery spending today",
    "Walk instead of taking a ride today",
    "Cook at home instead of eating out",
    "Find one subscription you can cancel",
    "Pack lunch instead of buying",
    "Skip the coffee shop today",
  ];

  // Pick a semi-random challenge based on date
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return challenges[dayOfYear % challenges.length];
}

// Calculate XP for an action
export function calculateXP(action: "add_expense" | "add_budget" | "complete_challenge" | "daily_login"): number {
  const xpValues: Record<string, number> = {
    add_expense: 10,
    add_budget: 25,
    complete_challenge: 100,
    daily_login: 15,
  };
  return xpValues[action] || 0;
}
