"use client";

import React from "react";
import { motion } from "framer-motion";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number | string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: "pills" | "underlined";
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
  variant = "pills",
}: TabsProps) {
  if (variant === "underlined") {
    return (
      <div className={`flex border-b border-slate-200 dark:border-slate-800 space-x-6 ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 relative transition-colors cursor-pointer ${
                isActive
                  ? "text-sky-600 dark:text-sky-400"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="activeUnderlineTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 dark:bg-sky-400 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-1.5 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl gap-1 backdrop-blur-sm ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative px-4 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              isActive
                ? "text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activePillTab"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute inset-0 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-xl"
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isActive
                      ? "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300"
                      : "bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
