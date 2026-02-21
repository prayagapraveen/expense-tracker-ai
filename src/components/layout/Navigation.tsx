"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Receipt,
  Target,
  Trophy,
  TrendingUp,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn, calculateLevel, getStreakEmoji } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/expenses", icon: Receipt, label: "Expenses" },
  { href: "/budgets", icon: Target, label: "Budgets" },
  { href: "/insights", icon: TrendingUp, label: "Insights" },
  { href: "/achievements", icon: Trophy, label: "Achievements" },
];

export function Navigation() {
  const pathname = usePathname();
  const { profile, theme, toggleTheme } = useApp();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const levelInfo = calculateLevel(profile.xp);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-[rgb(var(--card))] border-r border-[rgb(var(--border))] p-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-3 py-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold">
            Spend<span className="text-brand-500">Wise</span>
          </span>
        </Link>

        {/* User card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">{profile.avatar}</div>
            <div>
              <p className="font-semibold">{profile.name}</p>
              <p className="text-sm text-brand-100">Level {levelInfo.level}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-brand-100">XP Progress</span>
              <span>{levelInfo.currentXp} / {levelInfo.nextLevelXp}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>{getStreakEmoji(profile.streak)}</span>
              <span>{profile.streak} day streak</span>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  isActive
                    ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
                    : "text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-all"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
          <span className="font-medium">
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </span>
        </button>

        {/* Keyboard shortcut hint */}
        <div className="mt-4 px-4 py-3 rounded-xl bg-[rgb(var(--muted))] text-center">
          <p className="text-xs text-[rgb(var(--muted-foreground))]">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--card))]">
              Ctrl+K
            </kbd>{" "}
            for commands
          </p>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[rgb(var(--card))] border-b border-[rgb(var(--border))] px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">
              Spend<span className="text-brand-500">Wise</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-sm">
              <span>{getStreakEmoji(profile.streak)}</span>
              <span className="font-medium">{profile.streak}</span>
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-[rgb(var(--muted))]"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pb-4 space-y-1"
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    isActive
                      ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
                      : "text-[rgb(var(--muted-foreground))]"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            <button
              onClick={() => {
                toggleTheme();
                setMobileOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[rgb(var(--muted-foreground))]"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
              <span className="font-medium">
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </span>
            </button>
          </motion.div>
        )}
      </nav>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[rgb(var(--card))] border-t border-[rgb(var(--border))] px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                  isActive
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-[rgb(var(--muted-foreground))]"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeMobileNav"
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-brand-500"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
