"use client";

import React from "react";

export function Card({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm backdrop-blur-md overflow-hidden transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`p-6 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-lg font-bold text-slate-900 dark:text-white tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-sm text-slate-500 dark:text-slate-400 mt-0.5 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
