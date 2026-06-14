"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Shield,
  TrendingUp,
  AlertTriangle,
  Calculator,
  Info,
  CheckCircle,
} from "lucide-react";
import type { Leader } from "@/lib/mock-data";
import { calculateKellyCriterion } from "@/lib/mock-data";
import RiskBadge from "@/components/RiskBadge";

interface FollowModalProps {
  leader: Leader;
  isOpen: boolean;
  onClose: () => void;
  userBalance?: number;
}

export default function FollowModal({
  leader,
  isOpen,
  onClose,
  userBalance = 32500,
}: FollowModalProps) {
  const [amount, setAmount] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);

  const avgWin =
    leader.recentTrades
      .filter((t) => t.pnl > 0)
      .reduce((acc, t) => acc + t.pnl, 0) /
    Math.max(1, leader.recentTrades.filter((t) => t.pnl > 0).length);
  const avgLoss = Math.abs(
    leader.recentTrades
      .filter((t) => t.pnl < 0)
      .reduce((acc, t) => acc + t.pnl, 0) /
      Math.max(1, leader.recentTrades.filter((t) => t.pnl < 0).length)
  );
  const kellyFraction = calculateKellyCriterion(leader.winRate, avgWin, avgLoss);
  const riskMultiplier =
    leader.riskLevel === "Low" ? 1.0 : leader.riskLevel === "Medium" ? 0.7 : 0.4;
  const suggestedAmount = Math.round(userBalance * kellyFraction * riskMultiplier);
  const maxSafe =
    leader.riskLevel === "Low"
      ? userBalance * 0.25
      : leader.riskLevel === "Medium"
        ? userBalance * 0.15
        : userBalance * 0.08;

  useEffect(() => {
    if (isOpen) { setAmount(suggestedAmount); setConfirmed(false); setRiskAcknowledged(false); }
  }, [isOpen, suggestedAmount]);

  const handleClose = useCallback(() => { setConfirmed(false); onClose(); }, [onClose]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const isOverBudget = amount > userBalance;
  const isOverSafe = amount > maxSafe;
  const allocationPercent = userBalance > 0 ? (amount / userBalance) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-md rounded-2xl bg-surface shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-card-border px-5 py-3">
          <h2 className="text-base font-semibold text-foreground">Follow Leader</h2>
          <button onClick={handleClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface-inset">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!confirmed ? (
          <div className="px-5 py-4 space-y-3">
            {/* Leader Info + Balance row */}
            <div className="flex items-center gap-3">
              <img src={leader.avatarUrl} alt={leader.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground truncate">{leader.name}</span>
                  {leader.verified && <CheckCircle className="h-3.5 w-3.5 shrink-0 text-gold-400" />}
                  <RiskBadge level={leader.riskLevel} />
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted">
                  <span>WR: <strong className="text-foreground">{leader.winRate}%</strong></span>
                  <span>ROI: <strong className="text-gold-500">+{leader.roi}%</strong></span>
                  <span>Sharpe: <strong className="text-foreground">{leader.sharpeRatio.toFixed(2)}</strong></span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-muted">Balance</p>
                <p className="text-sm font-bold text-foreground">${userBalance.toLocaleString()}</p>
              </div>
            </div>

            {/* Kelly recommendation - compact */}
            <div className="flex items-center gap-2.5 rounded-lg border border-blue-200 bg-surface-inset px-3 py-2">
              <Calculator className="h-4 w-4 shrink-0 text-blue-400" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-foreground">Kelly Suggested: ${suggestedAmount.toLocaleString()}</span>
                <span className="ml-1.5 text-[10px] text-muted">({(kellyFraction * 100).toFixed(0)}% fraction{leader.riskLevel !== "Low" ? `, ${leader.riskLevel.toLowerCase()}-risk adj.` : ""})</span>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Allocation Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                  className={`h-10 w-full rounded-lg border pl-7 pr-3 text-base font-semibold text-foreground outline-none transition-colors ${
                    isOverBudget
                      ? "border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400"
                      : "border-card-border focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  }`}
                />
              </div>

              {/* Quick buttons + bar */}
              <div className="mt-1.5 flex items-center gap-1.5">
                {[
                  { label: "Suggested", value: suggestedAmount },
                  { label: "25%", value: Math.round(userBalance * 0.25) },
                  { label: "10%", value: Math.round(userBalance * 0.1) },
                  { label: "5%", value: Math.round(userBalance * 0.05) },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setAmount(preset.value)}
                    className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                      amount === preset.value
                        ? "bg-blue-600 text-white"
                        : "bg-surface-inset text-muted hover:text-blue-400"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <span className="ml-auto text-[10px] text-muted">{allocationPercent.toFixed(1)}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-surface-inset overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isOverBudget ? "bg-danger" : isOverSafe ? "bg-gold-400" : "bg-green-500"}`}
                  style={{ width: `${Math.min(allocationPercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Warnings - compact */}
            {isOverBudget && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-1.5 text-[11px] text-red-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Exceeds available balance.
              </div>
            )}
            {!isOverBudget && isOverSafe && (
              <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-1.5 text-[11px] text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Above safe limit for {leader.riskLevel.toLowerCase()}-risk ({Math.round((maxSafe / userBalance) * 100)}%). Consider reducing.
              </div>
            )}

            {/* Risk line */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <Info className="h-3 w-3 shrink-0" />
              Max DD: {leader.maxDrawdown}% &middot; Potential loss: ${Math.round(amount * leader.maxDrawdown / 100).toLocaleString()}
            </div>

            {/* Risk acknowledgement */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={riskAcknowledged}
                onChange={(e) => setRiskAcknowledged(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-green-600"
              />
              <span className="text-[11px] leading-snug text-muted">
                I understand copy trading involves risk and I may lose my investment.
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border border-card-border py-2.5 text-sm font-medium text-foreground hover:bg-surface-inset"
              >
                Cancel
              </button>
              <button
                onClick={() => setConfirmed(true)}
                disabled={isOverBudget || amount <= 0 || !riskAcknowledged}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Shield className="h-3.5 w-3.5" />
                Follow ${amount.toLocaleString()}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-inset">
              <CheckCircle className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-foreground">
              Following {leader.name}
            </h3>
            <p className="mt-1 text-sm text-muted">
              ${amount.toLocaleString()} allocated with Kelly-optimized sizing.
            </p>
            <div className="mt-2 flex items-center justify-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-gold-400" />
                Max/trade: ${Math.round(amount * kellyFraction).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-blue-400" />
                {leader.riskLevel} risk
              </span>
            </div>
            <button
              onClick={handleClose}
              className="mt-5 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
