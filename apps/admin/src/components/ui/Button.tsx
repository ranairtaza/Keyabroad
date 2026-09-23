"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "warning" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white shadow-sm shadow-sky-600/30 focus-visible:ring-sky-500",
  secondary:
    "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus-visible:ring-slate-400",
  danger:
    "bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-sm shadow-rose-600/30 focus-visible:ring-rose-500",
  warning:
    "bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white shadow-sm shadow-amber-600/30 focus-visible:ring-amber-500",
  outline:
    "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 focus-visible:ring-sky-500",
  ghost:
    "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 focus-visible:ring-slate-400",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm font-semibold rounded-xl gap-2",
  lg: "px-5 py-2.5 text-base font-bold rounded-xl gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}

export default Button;
