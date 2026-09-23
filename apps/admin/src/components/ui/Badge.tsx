"use client";

import React from "react";

export type BadgeVariant = "default" | "success" | "danger" | "warning" | "info" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
  danger: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
  info: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30",
  outline: "bg-transparent text-slate-600 border-slate-300 dark:text-slate-400 dark:border-slate-700",
};

const dotStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-500",
  success: "bg-emerald-500",
  danger: "bg-rose-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  outline: "bg-slate-400",
};

export function Badge({
  variant = "default",
  size = "md",
  dot = false,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border transition-colors ${sizeClasses} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
}

export default Badge;
