"use client";

import React from "react";
import { motion } from "framer-motion";

export type StatVariant = "primary" | "success" | "danger" | "warning" | "default";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: StatVariant;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  onClick?: () => void;
  className?: string;
}

const iconColorVariants: Record<StatVariant, { bg: string; text: string; ring: string }> = {
  primary: {
    bg: "bg-sky-500/10 dark:bg-sky-500/15",
    text: "text-sky-600 dark:text-sky-400",
    ring: "border-sky-500/20",
  },
  success: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "border-emerald-500/20",
  },
  danger: {
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    text: "text-rose-600 dark:text-rose-400",
    ring: "border-rose-500/20",
  },
  warning: {
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    ring: "border-amber-500/20",
  },
  default: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-300",
    ring: "border-slate-200 dark:border-slate-700",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
  trend,
  onClick,
  className = "",
}: StatCardProps) {
  const colors = iconColorVariants[variant];

  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : undefined}
      onClick={onClick}
      className={`bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm backdrop-blur-md flex flex-col justify-between relative overflow-hidden transition-all ${
        onClick ? "cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            {value}
          </h3>
        </div>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${colors.bg} ${colors.text} ${colors.ring}`}
        >
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold flex items-center gap-1 ${
                trend.isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {trend.value}
              {trend.label && <span className="font-normal text-slate-400"> {trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default StatCard;
