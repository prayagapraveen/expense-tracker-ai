# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SpendWise is an AI-powered expense tracking web application built with Next.js 14, TypeScript, and Tailwind CSS. It features natural language expense input, gamification (achievements, XP, levels), AI-generated financial insights, and wellness scoring.

**Key characteristics:**
- Client-side only (no backend, no database)
- All data persisted in localStorage
- Single-user per browser

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint checks
```

## Architecture

### Directory Structure

- `src/app/` - Next.js App Router pages (home, achievements, budgets, expenses, insights)
- `src/components/` - React components split into `layout/` and `ui/`
- `src/context/AppContext.tsx` - Global state management using React Context
- `src/lib/` - Business logic modules:
  - `nlp-parser.ts` - Natural language parsing for expense text
  - `insights-engine.ts` - AI insight generation (spending patterns, warnings)
  - `gamification.ts` - Achievement system, XP, levels, streaks
  - `storage.ts` - localStorage management
  - `utils.ts` - Currency formatting, date helpers
- `src/types/index.ts` - TypeScript interfaces for all domain objects

### State Management

All state flows through `AppContext` (accessed via `useApp()` hook):
- Expenses, budgets, achievements, challenges, user profile, wellness score
- Context wraps the entire app in `src/app/layout.tsx`
- All components requiring state use `"use client"` directive

### Data Models

Core types defined in `src/types/index.ts`:
- `Expense` - Amount, category, date, tags, recurring flag, mood, location
- `Budget` - Category budgets with weekly/monthly periods
- `Achievement` - 15+ types with rarity levels and XP rewards
- `UserProfile` - Level, XP, streak, preferences
- `WellnessScore` - Financial health metric (0-100)
- `Insight` - AI-generated warnings, tips, patterns

### localStorage Keys

All data uses `spendwise-` prefix: `expenses`, `budgets`, `achievements`, `challenges`, `profile`, `wellness`, `dismissed-insights`

## Key Patterns

### NLP Parser (`src/lib/nlp-parser.ts`)
Parses natural language expense input:
- Amounts: "$25", "25 on coffee", "spent 50"
- Dates: "yesterday", "last Monday", "3 days ago"
- Categories: Auto-detected from keywords
- Returns confidence score for parsed fields

### Gamification (`src/lib/gamification.ts`)
- XP system with 10 levels (exponential thresholds)
- Achievements: Budget keeper, saver milestones, streak badges, category explorer
- Daily challenges procedurally generated

### Insights Engine (`src/lib/insights-engine.ts`)
Generates insights from expense data:
- Spending spike detection
- Budget warning system
- Recurring expense patterns
- Weekend spending analysis
- Savings opportunities

### Wellness Score Calculation
Weighted composite (0-100):
- Budget Adherence: 30%
- Savings Rate: 25%
- Spending Consistency: 20%
- Category Balance: 15%
- Recurring Management: 10%

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** (strict mode)
- **Tailwind CSS** with custom brand color palette (green)
- **Recharts** for charts (AreaChart, PieChart)
- **date-fns** for date manipulation
- **lucide-react** for icons
- **framer-motion** for animations

## Path Aliases

Use `@/*` to import from `./src/*` (configured in tsconfig.json)
