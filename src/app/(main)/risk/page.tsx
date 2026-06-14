"use client";

import { useState, useMemo } from "react";
import {
  collateralHealth,
  venueHealth,
  riskIndex,
  portfolioOverlay,
  mockMarketsLegacy as mockMarkets,
} from "@/lib/market-risk";
import type { MockMarket, RiskGrade } from "@/lib/market-risk";
import VenueHealthPanel from "@/components/risk/VenueHealthPanel";
import CollateralPanel from "@/components/risk/CollateralPanel";
import PortfolioOverlayPanel from "@/components/risk/PortfolioOverlayPanel";
import IntegrityPanel from "@/components/risk/IntegrityPanel";
import RiskGradeBadge from "@/components/risk/RiskGradeBadge";

type SortKey = keyof Pick<
  MockMarket,
  "name" | "category" | "openInterest" | "oracleGrade" | "liquidityGrade" | "integrityScore" | "copyability"
>;

const gradeOrder: Record<RiskGrade, number> = { A: 0, B: 1, C: 2, D: 3, F: 4 };

export default function RiskPage() {
  const [sortKey, setSortKey] = useState<SortKey>("integrityScore");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortedMarkets = useMemo(() => {
    const sorted = [...mockMarkets].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      // Grade columns
      if (typeof aVal === "string" && sortKey !== "name" && sortKey !== "category") {
        return (gradeOrder[aVal as RiskGrade] ?? 5) - (gradeOrder[bVal as RiskGrade] ?? 5);
      }

      if (typeof aVal === "number" && typeof bVal === "number") return aVal - bVal;
      return String(aVal).localeCompare(String(bVal));
    });

    return sortAsc ? sorted : sorted.reverse();
  }, [sortKey, sortAsc]);

  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "Market Name" },
    { key: "category", label: "Category" },
    { key: "openInterest", label: "Open Interest" },
    { key: "oracleGrade", label: "Oracle Grade" },
    { key: "liquidityGrade", label: "Liquidity Grade" },
    { key: "integrityScore", label: "Integrity Score" },
    { key: "copyability", label: "Copyability" },
  ];

  return (
    <div className="space-y-8">
      {/* Section 1: Polymarket Risk Index */}
      <VenueHealthPanel
        health={venueHealth}
        index={riskIndex}
      />

      {/* Section 2: Collateral Health */}
      <CollateralPanel data={collateralHealth} />

      {/* Section 3: Market Risk Table */}
      <div className="rounded-xl bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-foreground">Market Risk Table</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-xs font-medium uppercase tracking-wider text-muted">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="cursor-pointer select-none pb-3 pr-4 transition-colors hover:text-foreground"
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="ml-1">{sortAsc ? "\u2191" : "\u2193"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50">
              {sortedMarkets.map((market) => (
                <tr key={market.id} className="text-foreground">
                  <td className="max-w-[260px] truncate py-3 pr-4 font-medium">{market.name}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-surface-inset px-2.5 py-0.5 text-xs font-medium text-blue-400">
                      {market.category}
                    </span>
                  </td>
                  <td className="py-3 pr-4">${(market.openInterest / 1_000_000).toFixed(1)}M</td>
                  <td className="py-3 pr-4"><RiskGradeBadge grade={market.oracleGrade} /></td>
                  <td className="py-3 pr-4"><RiskGradeBadge grade={market.liquidityGrade} /></td>
                  <td className="py-3 pr-4"><IntegrityPanel score={market.integrityScore} /></td>
                  <td className="py-3"><RiskGradeBadge grade={market.copyability} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Portfolio Risk Overlay */}
      <PortfolioOverlayPanel data={portfolioOverlay} />
    </div>
  );
}
