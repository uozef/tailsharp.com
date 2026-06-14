import { ShieldCheck } from "lucide-react";
import type { SharpnessProfile } from "@/lib/sharpness-rating";
import {
  ratingColor,
  ratingLabel,
  clvSignificanceStars,
  dotColor,
  participantTypeLabels,
} from "@/lib/sharpness-rating";

/* ─── Circular gauge ─── */

function RatingGauge({ rating }: { rating: number }) {
  const color = ratingColor(rating);
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (rating / 100) * circumference;

  return (
    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#334155" strokeWidth="6" opacity="0.3" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 50 50)"
          className="transition-all duration-700" />
      </svg>
      <div className="z-10 flex flex-col items-center leading-none">
        <span className="text-3xl font-bold text-foreground">{Math.round(rating)}</span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
          {ratingLabel(rating)}
        </span>
      </div>
    </div>
  );
}

/* ─── Skill signal bar (steel blue) ─── */

function SkillBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 text-sm text-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-inset">
        <div className="h-full rounded-full bg-blue-400 transition-all duration-500" style={{ width: `${clamped}%` }} />
      </div>
      <span className="w-8 text-right text-sm font-bold tabular-nums text-foreground">{Math.round(clamped)}</span>
    </div>
  );
}

/* ─── Status chip ─── */

function StatusChip({ color, label, detail }: { color: string; label: string; detail: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-surface-inset px-3 py-1.5">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs text-muted">
        {label}: <span className="font-mono font-semibold text-foreground">{detail}</span>
      </span>
    </div>
  );
}

/* ─── Main ─── */

interface Props {
  profile: SharpnessProfile;
}

export default function SharpnessRatingCard({ profile }: Props) {
  const { clv, skillSignals, transience, integrityDisplay: integrity } = profile;
  const clvPositive = clv.clv >= 0;
  const stars = clvSignificanceStars(clv.pValue);

  return (
    <div className="space-y-4">
      {/* Row 1: Sharp Score + Forecasting Edge */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">
        {/* Sharp Score Card */}
        <div className="rounded-xl bg-surface p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Sharp Score</p>
          <p className="text-[11px] text-muted">
            {profile.eligible ? "Eligible for ranking" : "Not ranked"}
          </p>

          <div className="my-5 flex justify-center">
            <RatingGauge rating={profile.ratingScore} />
          </div>

          {profile.eligible && profile.rank != null ? (
            <div className="flex items-center justify-between rounded-lg bg-surface-inset px-4 py-2.5">
              <span className="text-sm text-muted">Rank</span>
              <span className="font-mono text-sm font-bold text-amber-400">
                #{profile.rank} of {profile.totalRanked}
              </span>
            </div>
          ) : (
            <div className="rounded-lg bg-surface-inset px-4 py-2.5 text-center text-sm text-muted">
              Not Ranked
            </div>
          )}
          {profile.eligible && profile.percentile != null && (
            <p className="mt-1.5 text-center text-[11px] text-muted">
              {Math.round(profile.percentile)}th percentile
            </p>
          )}
        </div>

        {/* Forecasting Edge + Skill Signals Card */}
        <div className="rounded-xl bg-surface p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Forecasting Edge</p>
            {stars && <span className="text-amber-400 text-lg">{stars}</span>}
          </div>

          <div className="mt-3 flex items-baseline gap-3">
            <span
              className="text-4xl font-bold font-mono tabular-nums tracking-tight leading-none"
              style={{ color: clvPositive ? "#facc15" : "var(--danger)" }}
            >
              {clvPositive ? "+" : ""}{clv.clv.toFixed(2)}%
            </span>
            <span className="text-sm text-muted">
              {clvPositive
                ? clv.clv >= 3 ? "beats the market by a wide margin" : "consistently gets better prices than the crowd"
                : "entries are worse than the market consensus"
              }
            </span>
          </div>

          <div className="mt-2 flex items-center gap-4 text-xs text-muted">
            <span>Based on <strong className="text-foreground">{clv.effectiveSampleSize}</strong> independent bets</span>
            <span>&middot;</span>
            <span>Confidence: <strong className="text-foreground">
              {clv.tStatistic >= 3 ? "Very High" : clv.tStatistic >= 2 ? "High" : clv.tStatistic >= 1.5 ? "Moderate" : "Low"}
            </strong></span>
          </div>

          {/* Skill Signals */}
          <div className="mt-6 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Skill Signals</p>
            <SkillBar label="Sizing Discipline" value={skillSignals.convictionEdgeCorr * 100} />
            <SkillBar label="Timing Lead" value={Math.max(0, Math.min(100, 50 - skillSignals.timingLead))} />
            <SkillBar label="Selection Quality" value={skillSignals.abstentionElasticity * 100} />
            <SkillBar label="CLV Stability" value={skillSignals.clvStabilityAcrossTheses * 100} />
          </div>
        </div>
      </div>

      {/* Row 2: Transience + Integrity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Transience Card */}
        <div className="rounded-xl bg-surface p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Transience</p>
          <div className="flex flex-wrap gap-2">
            <StatusChip
              color={dotColor(transience.tiltIndex, { green: 0.2, amber: 0.5 })}
              label="Tilt Index"
              detail={transience.tiltIndex.toFixed(2)}
            />
            <StatusChip
              color={dotColor(Math.abs(transience.streakZ), { green: 1.5, amber: 2.5 })}
              label="Streak Risk"
              detail={`z=${transience.streakZ.toFixed(1)}`}
            />
            <StatusChip
              color={dotColor(transience.thesisConcentration, { green: 0.3, amber: 0.6 })}
              label="Thesis Conc."
              detail={transience.thesisConcentration.toFixed(2)}
            />
            <StatusChip
              color={transience.edgeHalfLifeMonths != null
                ? dotColor(1 / Math.max(transience.edgeHalfLifeMonths, 0.01), { green: 0.08, amber: 0.17 })
                : "var(--muted)"}
              label="Edge Decay"
              detail={transience.edgeHalfLifeMonths != null ? `${transience.edgeHalfLifeMonths.toFixed(1)}mo half-life` : "N/A"}
            />
          </div>
        </div>

        {/* Integrity Card */}
        <div className="rounded-xl bg-surface p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Integrity</p>
          <div className="flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-inset">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(0, Math.min(100, integrity.score))}%`,
                  backgroundColor: integrity.score >= 80 ? "#22c55e" : integrity.score >= 50 ? "#facc15" : "#ef4444",
                }}
              />
            </div>
            <span className="text-2xl font-bold tabular-nums text-foreground">{Math.round(integrity.score)}</span>
          </div>
          {integrity.flags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {integrity.flags.map((flag) => (
                <span key={flag} className="rounded-md bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-400">{flag}</span>
              ))}
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-surface-inset px-3 py-2 text-xs text-green-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              No integrity concerns detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
