import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, compact = false): string {
  if (compact && amount >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string, style: "full" | "short" | "relative" = "short"): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (style === "relative") {
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
  }

  if (style === "full") {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getMonthName(monthIndex: number): string {
  return new Date(2024, monthIndex).toLocaleString("en-US", { month: "long" });
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function calculateLevel(xp: number): { level: number; currentXp: number; nextLevelXp: number; progress: number } {
  // XP required for each level: 100, 250, 500, 1000, 2000, etc.
  const levelThresholds = [0, 100, 350, 850, 1850, 3850, 7850, 15850, 31850, 63850];

  let level = 1;
  for (let i = 1; i < levelThresholds.length; i++) {
    if (xp >= levelThresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  const currentLevelXp = levelThresholds[level - 1] || 0;
  const nextLevelXp = levelThresholds[level] || levelThresholds[level - 1] * 2;
  const xpInCurrentLevel = xp - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  const progress = (xpInCurrentLevel / xpNeededForLevel) * 100;

  return {
    level,
    currentXp: xpInCurrentLevel,
    nextLevelXp: xpNeededForLevel,
    progress: Math.min(progress, 100),
  };
}

export function getLevelTitle(level: number): string {
  const titles = [
    "Beginner",
    "Apprentice",
    "Tracker",
    "Analyst",
    "Strategist",
    "Expert",
    "Master",
    "Guru",
    "Legend",
    "Grandmaster",
  ];
  return titles[Math.min(level - 1, titles.length - 1)];
}

export function getStreakEmoji(streak: number): string {
  if (streak >= 30) return "👑";
  if (streak >= 14) return "🔥";
  if (streak >= 7) return "⚡";
  if (streak >= 3) return "✨";
  return "💫";
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
