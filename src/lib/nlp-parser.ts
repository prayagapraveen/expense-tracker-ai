import { ExpenseCategory, CATEGORIES, Expense } from "@/types";
import { format, subDays, parse, isValid } from "date-fns";

interface ParsedExpense {
  amount: number | null;
  category: ExpenseCategory;
  description: string;
  date: string;
  confidence: number;
  suggestions: string[];
}

// Smart natural language parser for expenses
export function parseExpenseInput(input: string): ParsedExpense {
  const normalizedInput = input.toLowerCase().trim();
  let confidence = 0;
  const suggestions: string[] = [];

  // Extract amount
  const amount = extractAmount(normalizedInput);
  if (amount !== null) {
    confidence += 40;
  } else {
    suggestions.push("Try adding an amount like '$25' or '25 dollars'");
  }

  // Extract date
  const date = extractDate(normalizedInput);
  if (date !== format(new Date(), "yyyy-MM-dd")) {
    confidence += 15; // Bonus for specific date
  }
  confidence += 15;

  // Extract category
  const { category, categoryConfidence } = extractCategory(normalizedInput);
  confidence += categoryConfidence;

  // Extract description
  const description = extractDescription(input, amount, date);
  if (description.length > 3) {
    confidence += 15;
  }

  // Cap confidence at 100
  confidence = Math.min(confidence, 100);

  return {
    amount,
    category,
    description,
    date,
    confidence,
    suggestions,
  };
}

function extractAmount(input: string): number | null {
  // Match various amount formats
  const patterns = [
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/,           // $25, $25.50, $1,000
    /(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:dollars?|bucks?|usd)/i, // 25 dollars
    /(?:spent|paid|cost|was|for)\s*\$?\s*(\d+(?:\.\d{1,2})?)/i,  // spent $25
    /(\d+(?:\.\d{1,2})?)\s*(?:on|for|at)/i,          // 25 on coffee
    /(?:^|\s)(\d+(?:\.\d{1,2})?)(?:\s|$)/,           // Just a number
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      const amountStr = match[1].replace(/,/g, "");
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0 && amount < 100000) {
        return amount;
      }
    }
  }

  return null;
}

function extractDate(input: string): string {
  const today = new Date();

  // Relative date patterns
  const relativePatterns: { pattern: RegExp; dayOffset: number }[] = [
    { pattern: /\byesterday\b/i, dayOffset: -1 },
    { pattern: /\btoday\b/i, dayOffset: 0 },
    { pattern: /\bjust now\b/i, dayOffset: 0 },
    { pattern: /\bthis morning\b/i, dayOffset: 0 },
    { pattern: /\blast night\b/i, dayOffset: -1 },
    { pattern: /\b(\d+)\s*days?\s*ago\b/i, dayOffset: -1 }, // "3 days ago"
  ];

  for (const { pattern, dayOffset } of relativePatterns) {
    const match = input.match(pattern);
    if (match) {
      if (match[1]) {
        // Handle "X days ago"
        return format(subDays(today, parseInt(match[1])), "yyyy-MM-dd");
      }
      return format(subDays(today, Math.abs(dayOffset)), "yyyy-MM-dd");
    }
  }

  // Day of week patterns
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const lastPattern = /\blast\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i;
  const lastMatch = input.match(lastPattern);
  if (lastMatch) {
    const targetDay = dayNames.indexOf(lastMatch[1].toLowerCase());
    const currentDay = today.getDay();
    let daysBack = currentDay - targetDay;
    if (daysBack <= 0) daysBack += 7;
    return format(subDays(today, daysBack), "yyyy-MM-dd");
  }

  // Explicit date patterns
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/,  // MM/DD or MM/DD/YYYY
    /(\d{1,2})-(\d{1,2})(?:-(\d{2,4}))?/,    // MM-DD or MM-DD-YYYY
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:,?\s*(\d{4}))?/i, // Jan 15, 2024
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s*(\d{4}))?/i,   // 15 Jan 2024
  ];

  const months: { [key: string]: number } = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  for (const pattern of datePatterns) {
    const match = input.match(pattern);
    if (match) {
      try {
        let year = today.getFullYear();
        let month: number;
        let day: number;

        if (match[1] && months[match[1].toLowerCase().slice(0, 3)] !== undefined) {
          // "Jan 15" format
          month = months[match[1].toLowerCase().slice(0, 3)];
          day = parseInt(match[2]);
          if (match[3]) year = parseInt(match[3]);
        } else if (match[2] && months[match[2].toLowerCase().slice(0, 3)] !== undefined) {
          // "15 Jan" format
          day = parseInt(match[1]);
          month = months[match[2].toLowerCase().slice(0, 3)];
          if (match[3]) year = parseInt(match[3]);
        } else {
          // Numeric format
          month = parseInt(match[1]) - 1;
          day = parseInt(match[2]);
          if (match[3]) {
            year = parseInt(match[3]);
            if (year < 100) year += 2000;
          }
        }

        const parsedDate = new Date(year, month, day);
        if (isValid(parsedDate)) {
          return format(parsedDate, "yyyy-MM-dd");
        }
      } catch {
        // Continue to next pattern
      }
    }
  }

  // Default to today
  return format(today, "yyyy-MM-dd");
}

function extractCategory(input: string): { category: ExpenseCategory; categoryConfidence: number } {
  let bestMatch: ExpenseCategory = "other";
  let bestScore = 0;

  for (const cat of CATEGORIES) {
    for (const keyword of cat.keywords) {
      if (input.includes(keyword)) {
        const score = keyword.length; // Longer matches are more confident
        if (score > bestScore) {
          bestScore = score;
          bestMatch = cat.id;
        }
      }
    }
  }

  // Category confidence based on match quality
  const categoryConfidence = bestScore > 0 ? Math.min(bestScore * 3, 30) : 5;

  return { category: bestMatch, categoryConfidence };
}

function extractDescription(input: string, amount: number | null, date: string): string {
  let description = input;

  // Remove amount patterns
  description = description.replace(/\$\s*\d+(?:,\d{3})*(?:\.\d{1,2})?/g, "");
  description = description.replace(/\d+(?:,\d{3})*(?:\.\d{1,2})?\s*(?:dollars?|bucks?|usd)/gi, "");

  // Remove date patterns
  description = description.replace(/\b(?:yesterday|today|just now|this morning|last night)\b/gi, "");
  description = description.replace(/\b\d+\s*days?\s*ago\b/gi, "");
  description = description.replace(/\blast\s+(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, "");
  description = description.replace(/\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?/g, "");

  // Remove common filler words
  description = description.replace(/\b(?:spent|paid|bought|got|for|on|at|the|a|an)\b/gi, " ");

  // Clean up
  description = description.replace(/\s+/g, " ").trim();

  // Capitalize first letter
  if (description.length > 0) {
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  return description || "Expense";
}

// Generate smart suggestions based on input
export function generateSuggestions(partialInput: string): string[] {
  const suggestions: string[] = [];
  const input = partialInput.toLowerCase();

  // Suggest completing amount
  if (!input.match(/\$?\d/)) {
    suggestions.push(`${partialInput} $`);
  }

  // Suggest dates
  if (!input.includes("yesterday") && !input.includes("today")) {
    suggestions.push(`${partialInput} yesterday`);
  }

  // Suggest categories based on partial match
  for (const cat of CATEGORIES) {
    for (const keyword of cat.keywords.slice(0, 2)) {
      if (keyword.startsWith(input.split(" ").pop() || "")) {
        suggestions.push(`${partialInput}${keyword.slice(input.split(" ").pop()?.length || 0)}`);
      }
    }
  }

  return suggestions.slice(0, 5);
}

// Quick expense templates
export const QUICK_TEMPLATES = [
  { text: "Coffee $5", icon: "☕" },
  { text: "Lunch $15", icon: "🍱" },
  { text: "Uber $12", icon: "🚗" },
  { text: "Groceries $50", icon: "🛒" },
  { text: "Gas $40", icon: "⛽" },
  { text: "Netflix $15", icon: "📺" },
];
