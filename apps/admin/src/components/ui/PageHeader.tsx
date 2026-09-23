"use client";

import React from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  description?: string;
  category?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  category,
  icon,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800 ${className}`}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            {icon}
          </div>
        )}
        <div>
          {category && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              {category}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 sm:self-auto self-start">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
