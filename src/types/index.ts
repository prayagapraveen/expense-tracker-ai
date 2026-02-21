// Core expense types
export type ExpenseCategory =
  | "food"
  | "transport"
  | "entertainment"
  | "shopping"
  | "bills"
  | "health"
  | "education"
  | "travel"
  | "subscriptions"
  | "other";

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  createdAt: string;
  tags: string[];
  isRecurring: boolean;
  recurringFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  mood?: "happy" | "neutral" | "regret";
  location?: string;
}

// Budget types
export interface Budget {
  id: string;
  category: ExpenseCategory;
  limit: number;
  period: "weekly" | "monthly";
  createdAt: string;
}

// Achievement types
export type AchievementId =
  | "first_expense"
  | "streak_3"
  | "streak_7"
  | "streak_30"
  | "budget_master"
  | "saver_bronze"
  | "saver_silver"
  | "saver_gold"
  | "category_explorer"
  | "early_bird"
  | "night_owl"
  | "weekend_warrior"
  | "export_pro"
  | "insight_seeker"
  | "budget_creator";

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  xp: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

// Challenge types
export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  category?: ExpenseCategory;
  type: "spend_less" | "save_more" | "no_spend";
  completed: boolean;
  reward: number; // XP reward
}

// Insight types
export interface Insight {
  id: string;
  type: "warning" | "tip" | "achievement" | "pattern" | "prediction";
  title: string;
  message: string;
  icon: string;
  actionLabel?: string;
  actionUrl?: string;
  priority: number;
  createdAt: string;
  dismissed: boolean;
}

// User profile types
export interface UserProfile {
  name: string;
  avatar: string;
  level: number;
  xp: number;
  streak: number;
  lastActiveDate: string;
  totalSaved: number;
  joinedAt: string;
  preferences: {
    currency: string;
    theme: "light" | "dark" | "system";
    notifications: boolean;
    soundEffects: boolean;
  };
}

// Financial wellness types
export interface WellnessScore {
  overall: number; // 0-100
  categories: {
    budgetAdherence: number;
    savingsRate: number;
    spendingConsistency: number;
    categoryBalance: number;
    recurringManagement: number;
  };
  trend: "improving" | "stable" | "declining";
  lastUpdated: string;
}

// Category metadata
export interface CategoryMeta {
  id: ExpenseCategory;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  keywords: string[];
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "food",
    name: "Food & Dining",
    icon: "🍔",
    color: "#f97316",
    gradient: "from-orange-400 to-red-500",
    keywords: ["lunch", "dinner", "breakfast", "coffee", "restaurant", "cafe", "meal", "pizza", "sushi", "groceries", "food", "eat", "starbucks", "mcdonalds"],
  },
  {
    id: "transport",
    name: "Transport",
    icon: "🚗",
    color: "#3b82f6",
    gradient: "from-blue-400 to-cyan-500",
    keywords: ["uber", "lyft", "taxi", "gas", "fuel", "parking", "metro", "bus", "train", "flight", "car", "ride", "transport"],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "🎬",
    color: "#8b5cf6",
    gradient: "from-purple-400 to-pink-500",
    keywords: ["movie", "netflix", "spotify", "game", "concert", "show", "fun", "party", "bar", "club", "entertainment"],
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "🛍️",
    color: "#ec4899",
    gradient: "from-pink-400 to-rose-500",
    keywords: ["amazon", "clothes", "shoes", "electronics", "gadget", "purchase", "buy", "shop", "store", "mall"],
  },
  {
    id: "bills",
    name: "Bills & Utilities",
    icon: "📄",
    color: "#ef4444",
    gradient: "from-red-400 to-orange-500",
    keywords: ["rent", "electricity", "water", "internet", "phone", "bill", "utility", "insurance", "mortgage"],
  },
  {
    id: "health",
    name: "Health & Fitness",
    icon: "💪",
    color: "#10b981",
    gradient: "from-green-400 to-emerald-500",
    keywords: ["gym", "doctor", "medicine", "pharmacy", "health", "fitness", "workout", "yoga", "hospital"],
  },
  {
    id: "education",
    name: "Education",
    icon: "📚",
    color: "#6366f1",
    gradient: "from-indigo-400 to-purple-500",
    keywords: ["book", "course", "udemy", "school", "college", "tuition", "learn", "education", "class"],
  },
  {
    id: "travel",
    name: "Travel",
    icon: "✈️",
    color: "#14b8a6",
    gradient: "from-teal-400 to-cyan-500",
    keywords: ["hotel", "airbnb", "vacation", "trip", "flight", "travel", "holiday", "resort", "booking"],
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    icon: "🔄",
    color: "#f59e0b",
    gradient: "from-amber-400 to-yellow-500",
    keywords: ["subscription", "monthly", "yearly", "membership", "premium", "pro", "plus"],
  },
  {
    id: "other",
    name: "Other",
    icon: "📦",
    color: "#6b7280",
    gradient: "from-gray-400 to-slate-500",
    keywords: [],
  },
];

export const getCategoryMeta = (id: ExpenseCategory): CategoryMeta => {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
};

// Default achievements list
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_expense",
    name: "First Step",
    description: "Log your first expense",
    icon: "🎯",
    xp: 50,
    rarity: "common",
  },
  {
    id: "streak_3",
    name: "Getting Consistent",
    description: "Maintain a 3-day logging streak",
    icon: "🔥",
    xp: 100,
    rarity: "common",
    maxProgress: 3,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day logging streak",
    icon: "⚡",
    xp: 250,
    rarity: "rare",
    maxProgress: 7,
  },
  {
    id: "streak_30",
    name: "Monthly Master",
    description: "Maintain a 30-day logging streak",
    icon: "👑",
    xp: 1000,
    rarity: "legendary",
    maxProgress: 30,
  },
  {
    id: "budget_master",
    name: "Budget Master",
    description: "Stay under budget for a full month",
    icon: "🏆",
    xp: 500,
    rarity: "epic",
  },
  {
    id: "saver_bronze",
    name: "Saver (Bronze)",
    description: "Save $100 compared to last month",
    icon: "🥉",
    xp: 150,
    rarity: "common",
  },
  {
    id: "saver_silver",
    name: "Saver (Silver)",
    description: "Save $500 compared to last month",
    icon: "🥈",
    xp: 300,
    rarity: "rare",
  },
  {
    id: "saver_gold",
    name: "Saver (Gold)",
    description: "Save $1000 compared to last month",
    icon: "🥇",
    xp: 500,
    rarity: "epic",
  },
  {
    id: "category_explorer",
    name: "Category Explorer",
    description: "Log expenses in all categories",
    icon: "🗺️",
    xp: 200,
    rarity: "rare",
    maxProgress: 10,
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Log an expense before 7 AM",
    icon: "🌅",
    xp: 75,
    rarity: "common",
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Log an expense after 11 PM",
    icon: "🦉",
    xp: 75,
    rarity: "common",
  },
  {
    id: "weekend_warrior",
    name: "Weekend Warrior",
    description: "Log expenses on 4 consecutive weekends",
    icon: "🎉",
    xp: 200,
    rarity: "rare",
    maxProgress: 4,
  },
  {
    id: "export_pro",
    name: "Export Pro",
    description: "Export your data for the first time",
    icon: "📊",
    xp: 50,
    rarity: "common",
  },
  {
    id: "insight_seeker",
    name: "Insight Seeker",
    description: "View your AI insights 10 times",
    icon: "🔮",
    xp: 150,
    rarity: "rare",
    maxProgress: 10,
  },
  {
    id: "budget_creator",
    name: "Budget Creator",
    description: "Create your first budget",
    icon: "📝",
    xp: 100,
    rarity: "common",
  },
];
