"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WellnessRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  trend?: "improving" | "stable" | "declining";
}

export function WellnessRing({
  score,
  size = "md",
  showLabel = true,
  trend = "stable",
}: WellnessRingProps) {
  const sizes = {
    sm: { ring: 80, stroke: 6, text: "text-lg" },
    md: { ring: 120, stroke: 8, text: "text-3xl" },
    lg: { ring: 180, stroke: 12, text: "text-5xl" },
  };

  const { ring, stroke, text } = sizes[size];
  const radius = (ring - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getStrokeColor = () => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#eab308";
    if (score >= 40) return "#f97316";
    return "#ef4444";
  };

  const getTrendIcon = () => {
    if (trend === "improving") return "↑";
    if (trend === "declining") return "↓";
    return "→";
  };

  const getTrendColor = () => {
    if (trend === "improving") return "text-green-500";
    if (trend === "declining") return "text-red-500";
    return "text-gray-400";
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={ring} height={ring} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--muted))"
          strokeWidth={stroke}
        />
        {/* Progress circle */}
        <motion.circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>

      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn("font-bold", text, getScoreColor())}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        {showLabel && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-[rgb(var(--muted-foreground))]">Wellness</span>
            <span className={cn("text-sm", getTrendColor())}>{getTrendIcon()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
