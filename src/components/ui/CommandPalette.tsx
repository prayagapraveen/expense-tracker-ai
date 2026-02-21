"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search,
  Home,
  Receipt,
  Target,
  Trophy,
  Settings,
  Sun,
  Moon,
  Download,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { exportToCSV, exportToJSON } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { theme, toggleTheme, expenses, budgets, profile } = useApp();

  // Define commands
  const commands: Command[] = useMemo(() => [
    {
      id: "home",
      name: "Go to Dashboard",
      description: "View your spending overview",
      icon: <Home className="w-5 h-5" />,
      action: () => router.push("/"),
      keywords: ["home", "dashboard", "overview", "main"],
    },
    {
      id: "expenses",
      name: "View Expenses",
      description: "See all your expenses",
      icon: <Receipt className="w-5 h-5" />,
      action: () => router.push("/expenses"),
      keywords: ["expenses", "transactions", "spending", "list"],
    },
    {
      id: "budgets",
      name: "Manage Budgets",
      description: "Set and track your budgets",
      icon: <Target className="w-5 h-5" />,
      action: () => router.push("/budgets"),
      keywords: ["budgets", "limits", "goals", "targets"],
    },
    {
      id: "insights",
      name: "View Insights",
      description: "AI-powered spending insights",
      icon: <TrendingUp className="w-5 h-5" />,
      action: () => router.push("/insights"),
      keywords: ["insights", "analytics", "ai", "patterns", "analysis"],
    },
    {
      id: "achievements",
      name: "Achievements",
      description: "View your achievements and progress",
      icon: <Trophy className="w-5 h-5" />,
      action: () => router.push("/achievements"),
      keywords: ["achievements", "badges", "rewards", "progress", "xp"],
    },
    {
      id: "toggle-theme",
      name: theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode",
      description: "Change the app appearance",
      icon: theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />,
      action: () => {
        toggleTheme();
        setIsOpen(false);
      },
      keywords: ["theme", "dark", "light", "mode", "appearance"],
    },
    {
      id: "export-csv",
      name: "Export to CSV",
      description: "Download your expenses as CSV",
      icon: <Download className="w-5 h-5" />,
      action: () => {
        exportToCSV(expenses);
        setIsOpen(false);
      },
      keywords: ["export", "csv", "download", "backup"],
    },
    {
      id: "export-json",
      name: "Export Full Backup",
      description: "Download all data as JSON",
      icon: <Download className="w-5 h-5" />,
      action: () => {
        exportToJSON({ expenses, budgets, profile });
        setIsOpen(false);
      },
      keywords: ["export", "json", "backup", "download", "data"],
    },
    {
      id: "quick-add",
      name: "Quick Add Expense",
      description: "Add an expense with natural language",
      icon: <Zap className="w-5 h-5" />,
      action: () => {
        router.push("/?focus=input");
        setIsOpen(false);
      },
      keywords: ["add", "new", "expense", "quick", "create"],
    },
  ], [router, theme, toggleTheme, expenses, budgets, profile]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search) return commands;
    const lowerSearch = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(lowerSearch) ||
        cmd.description.toLowerCase().includes(lowerSearch) ||
        cmd.keywords.some((kw) => kw.includes(lowerSearch))
    );
  }, [commands, search]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open command palette with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      // Close with Escape
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }

      // Navigate with arrow keys
      if (isOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
        }
        if (e.key === "Enter" && filteredCommands[selectedIndex]) {
          e.preventDefault();
          filteredCommands[selectedIndex].action();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Reset when closing
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4 command-overlay bg-black/50"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg bg-[rgb(var(--card))] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-[rgb(var(--border))]">
              <Search className="w-5 h-5 text-[rgb(var(--muted-foreground))]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent border-none outline-none text-lg"
                autoFocus
              />
              <kbd className="px-2 py-1 rounded bg-[rgb(var(--muted))] text-xs text-[rgb(var(--muted-foreground))]">
                ESC
              </kbd>
            </div>

            {/* Commands list */}
            <div className="max-h-80 overflow-y-auto py-2">
              {filteredCommands.length === 0 ? (
                <div className="px-4 py-8 text-center text-[rgb(var(--muted-foreground))]">
                  No commands found
                </div>
              ) : (
                filteredCommands.map((command, index) => (
                  <button
                    key={command.id}
                    onClick={() => {
                      command.action();
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      selectedIndex === index
                        ? "bg-brand-50 dark:bg-brand-900/20"
                        : "hover:bg-[rgb(var(--muted))]"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        selectedIndex === index
                          ? "bg-brand-500 text-white"
                          : "bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]"
                      )}
                    >
                      {command.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{command.name}</p>
                      <p className="text-sm text-[rgb(var(--muted-foreground))] truncate">
                        {command.description}
                      </p>
                    </div>
                    {selectedIndex === index && (
                      <kbd className="px-2 py-1 rounded bg-[rgb(var(--muted))] text-xs">
                        Enter
                      </kbd>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[rgb(var(--border))] bg-[rgb(var(--muted))/0.5]">
              <div className="flex items-center justify-between text-xs text-[rgb(var(--muted-foreground))]">
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--muted))]">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--muted))]">↓</kbd>
                  <span>to navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 rounded bg-[rgb(var(--muted))]">Enter</kbd>
                  <span>to select</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
