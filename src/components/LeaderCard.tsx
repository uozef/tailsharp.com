"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Users } from "lucide-react";
import type { Leader } from "@/lib/mock-data";
import RiskBadge from "@/components/RiskBadge";
import FollowModal from "@/components/FollowModal";
import TrustScoreBadge from "@/components/TrustScoreBadge";
import TraderTypeBadge from "@/components/TraderTypeBadge";
import SharpnessRatingBadge from "@/components/SharpnessRatingBadge";
import { computeLeaderGrades, detectRedFlags } from "@/lib/leader-grades";
import { computeTraderClassification } from "@/lib/trader-classification";

interface LeaderCardProps {
  leader: Leader;
}

export default function LeaderCard({ leader }: LeaderCardProps) {
  const [showFollowModal, setShowFollowModal] = useState(false);
  const grades = computeLeaderGrades(leader);
  const flags = detectRedFlags(leader);
  const criticalCount = flags.filter(f => f.severity === "critical").length;
  const classification = computeTraderClassification(leader);

  return (
    <>
      <Link href={`/leader/${leader.id}`} className="block">
        <div className="group relative rounded-xl border border-card-border bg-surface p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
          {criticalCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
              {criticalCount}
            </span>
          )}
          {/* Top: Avatar, Name, Verified */}
          <div className="flex items-center gap-3">
            <img src={leader.avatarUrl} alt={leader.name} className="h-11 w-11 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-foreground">
                  {leader.name}
                </span>
                {leader.verified && (
                  <CheckCircle className="h-4 w-4 shrink-0 text-gold-400" />
                )}
              </div>
              <span className="text-xs text-muted">@{leader.username}</span>
            </div>
          </div>

          {/* Category, Risk & Type */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-surface-inset px-2 py-0.5 text-xs font-medium text-blue-400">
              {leader.category}
            </span>
            <RiskBadge level={leader.riskLevel} />
            <SharpnessRatingBadge
              rating={leader.sharpnessProfile.rating.rating}
              rank={leader.sharpnessProfile.rating.rank}
              eligible={leader.sharpnessProfile.typing.isEligibleForRanking}
              participantType={leader.sharpnessProfile.typing.primaryType}
            />
          </div>

          {/* Stats Row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted">ROI</span>
              <span
                className={`text-sm font-bold ${
                  leader.roi >= 0 ? "text-gold-500" : "text-danger"
                }`}
              >
                {leader.roi >= 0 ? "+" : ""}
                {leader.roi}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted">Win Rate</span>
              <span className="text-sm font-bold text-foreground">
                {leader.winRate}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted">Sharpe</span>
              <span className="text-sm font-bold text-foreground">
                {leader.sharpeRatio.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Bottom: Followers & Follow Button */}
          <div className="mt-4 flex items-center justify-between border-t border-green-50 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Users className="h-3.5 w-3.5" />
              <span>{leader.followers.toLocaleString()} followers</span>
              <TrustScoreBadge grades={grades} size="sm" />
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowFollowModal(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
            >
              Follow
            </button>
          </div>
        </div>
      </Link>

      <FollowModal
        leader={leader}
        isOpen={showFollowModal}
        onClose={() => setShowFollowModal(false)}
      />
    </>
  );
}
