"use client";

import React from "react";
import { motion } from "framer-motion";
import { Achievement, ACHIEVEMENTS } from "@/types";
import { cn } from "@/lib/utils";
import { Lock, Star } from "lucide-react";

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  size?: "sm" | "md";
}

export function AchievementCard({
  achievement,
  isUnlocked,
  size = "md",
}: AchievementCardProps) {
  const rarityColors = {
    common: "border-gray-400 bg-gray-50 dark:bg-gray-900/30",
    rare: "border-blue-400 bg-blue-50 dark:bg-blue-900/30",
    epic: "border-purple-400 bg-purple-50 dark:bg-purple-900/30",
    legendary: "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30",
  };

  const sizes = {
    sm: "p-3",
    md: "p-4",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={isUnlocked ? { scale: 1.05 } : {}}
      className={cn(
        "relative rounded-xl border-2 transition-all",
        sizes[size],
        isUnlocked ? rarityColors[achievement.rarity] : "border-gray-200 dark:border-gray-700 bg-[rgb(var(--muted))] opacity-50",
        achievement.rarity === "legendary" && isUnlocked && "animate-pulse-slow"
      )}
    >
      {/* Lock overlay for locked achievements */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/10 dark:bg-white/5">
          <Lock className="w-6 h-6 text-[rgb(var(--muted-foreground))]" />
        </div>
      )}

      <div className={cn("flex items-start gap-3", !isUnlocked && "blur-sm")}>
        {/* Icon */}
        <div className="text-3xl">{achievement.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold truncate">{achievement.name}</h4>
            {achievement.rarity === "legendary" && isUnlocked && (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            )}
          </div>
          <p className="text-sm text-[rgb(var(--muted-foreground))] mt-0.5">
            {achievement.description}
          </p>

          {/* Progress bar for progressive achievements */}
          {achievement.maxProgress && (
            <div className="mt-2">
              <div className="h-1.5 bg-[rgb(var(--muted))] rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{
                    width: `${((achievement.progress || 0) / achievement.maxProgress) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                {achievement.progress || 0} / {achievement.maxProgress}
              </p>
            </div>
          )}

          {/* XP badge */}
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
              +{achievement.xp} XP
            </span>
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full capitalize",
              achievement.rarity === "common" && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
              achievement.rarity === "rare" && "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
              achievement.rarity === "epic" && "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
              achievement.rarity === "legendary" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400"
            )}>
              {achievement.rarity}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Achievement popup for new unlocks
interface AchievementPopupProps {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementPopup({ achievement, onClose }: AchievementPopupProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 command-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0.5, rotate: 10 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-[rgb(var(--card))] rounded-2xl p-8 max-w-sm text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-6xl mb-4"
        >
          {achievement.icon}
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">Achievement Unlocked!</h2>
        <h3 className="text-xl font-semibold text-brand-600 dark:text-brand-400 mb-2">
          {achievement.name}
        </h3>
        <p className="text-[rgb(var(--muted-foreground))] mb-4">
          {achievement.description}
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-100 dark:bg-brand-900/30 rounded-full text-brand-700 dark:text-brand-300 font-medium">
          <Star className="w-5 h-5" />
          +{achievement.xp} XP
        </div>

        <button
          onClick={onClose}
          className="block w-full mt-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
        >
          Awesome!
        </button>
      </motion.div>
    </motion.div>
  );
}
