import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`stat-glow rounded-xl border border-card-border bg-surface p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted">{title}</span>
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {subtitle && (
            <span className="text-xs text-muted">{subtitle}</span>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-inset text-blue-400">
              {icon}
            </div>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              {trend === "up" && (
                <TrendingUp className="h-4 w-4 text-gold-500" />
              )}
              {trend === "down" && (
                <TrendingDown className="h-4 w-4 text-danger" />
              )}
              {trend === "neutral" && (
                <Minus className="h-4 w-4 text-muted" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
