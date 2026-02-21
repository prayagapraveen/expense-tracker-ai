"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Zap, Lock } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Navigation } from "@/components/layout/Navigation";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { AchievementCard } from "@/components/ui/AchievementCard";
import { ACHIEVEMENTS, Achievement, AchievementId } from "@/types";
import { calculateLevel, getLevelTitle, getStreakEmoji, cn } from "@/lib/utils";
import { getAvailableAvatars } from "@/lib/gamification";

export default function AchievementsPage() {
  const { profile, achievements, updateProfile } = useApp();

  const levelInfo = calculateLevel(profile.xp);
  const levelTitle = getLevelTitle(levelInfo.level);
  const availableAvatars = getAvailableAvatars(levelInfo.level);
  const unlockedIds = new Set(achievements.map((a) => a.id));

  // Merge unlocked achievements with all achievements
  const allAchievements = useMemo(() => {
    return ACHIEVEMENTS.map((baseAchievement) => {
      const unlocked = achievements.find((a) => a.id === baseAchievement.id);
      return unlocked || baseAchievement;
    });
  }, [achievements]);

  const unlockedCount = achievements.length;
  const totalXP = achievements.reduce((sum, a) => sum + a.xp, 0);

  const achievementsByRarity = {
    common: allAchievements.filter((a) => a.rarity === "common"),
    rare: allAchievements.filter((a) => a.rarity === "rare"),
    epic: allAchievements.filter((a) => a.rarity === "epic"),
    legendary: allAchievements.filter((a) => a.rarity === "legendary"),
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <Navigation />
      <CommandPalette />

      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Achievements
            </h1>
            <p className="text-[rgb(var(--muted-foreground))] mt-1">
              Track your progress and unlock rewards
            </p>
          </div>

          {/* Profile Card */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar selection */}
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-5xl">
                  {profile.avatar}
                </div>
                <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold">
                  Lvl {levelInfo.level}
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
                <p className="text-purple-200 mb-3">{levelTitle}</p>

                {/* XP Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Level Progress</span>
                    <span>{levelInfo.currentXp} / {levelInfo.nextLevelXp} XP</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${levelInfo.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{unlockedCount}</p>
                    <p className="text-xs text-purple-200">Unlocked</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{totalXP}</p>
                    <p className="text-xs text-purple-200">Total XP</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold flex items-center gap-1">
                      {profile.streak} {getStreakEmoji(profile.streak)}
                    </p>
                    <p className="text-xs text-purple-200">Day Streak</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar Selection */}
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-sm text-purple-200 mb-3">Choose your avatar:</p>
              <div className="flex flex-wrap gap-2">
                {availableAvatars.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => updateProfile({ avatar })}
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform hover:scale-110",
                      profile.avatar === avatar
                        ? "bg-white text-purple-600 ring-2 ring-white"
                        : "bg-white/20 hover:bg-white/30"
                    )}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Achievements by Rarity */}
          {(["legendary", "epic", "rare", "common"] as const).map((rarity, sectionIndex) => {
            const achievementsList = achievementsByRarity[rarity];
            if (achievementsList.length === 0) return null;

            const rarityLabels = {
              common: { label: "Common", color: "text-gray-500" },
              rare: { label: "Rare", color: "text-blue-500" },
              epic: { label: "Epic", color: "text-purple-500" },
              legendary: { label: "Legendary", color: "text-yellow-500" },
            };

            return (
              <motion.section
                key={rarity}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * sectionIndex }}
              >
                <h2 className={cn("text-lg font-semibold mb-4 flex items-center gap-2", rarityLabels[rarity].color)}>
                  {rarity === "legendary" && <Star className="w-5 h-5 fill-current" />}
                  {rarityLabels[rarity].label} Achievements
                  <span className="text-sm font-normal text-[rgb(var(--muted-foreground))]">
                    ({achievementsList.filter((a) => unlockedIds.has(a.id)).length}/{achievementsList.length})
                  </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievementsList.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * index }}
                    >
                      <AchievementCard
                        achievement={achievement}
                        isUnlocked={unlockedIds.has(achievement.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            );
          })}

          {/* How to unlock */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              How to Earn XP
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[rgb(var(--muted))] text-center">
                <p className="text-2xl font-bold text-brand-500">+10</p>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Add expense</p>
              </div>
              <div className="p-4 rounded-xl bg-[rgb(var(--muted))] text-center">
                <p className="text-2xl font-bold text-brand-500">+25</p>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Create budget</p>
              </div>
              <div className="p-4 rounded-xl bg-[rgb(var(--muted))] text-center">
                <p className="text-2xl font-bold text-brand-500">+15</p>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Daily login</p>
              </div>
              <div className="p-4 rounded-xl bg-[rgb(var(--muted))] text-center">
                <p className="text-2xl font-bold text-yellow-500">Varies</p>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Achievements</p>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
