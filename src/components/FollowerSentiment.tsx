interface Props {
  sentimentScore: number;
  breakdown: { positive: number; neutral: number; negative: number };
}

export default function FollowerSentiment({
  sentimentScore,
  breakdown,
}: Props) {
  const total = breakdown.positive + breakdown.neutral + breakdown.negative;
  const pctPositive = total > 0 ? (breakdown.positive / total) * 100 : 0;
  const pctNeutral = total > 0 ? (breakdown.neutral / total) * 100 : 0;
  const pctNegative = total > 0 ? (breakdown.negative / total) * 100 : 0;

  return (
    <div className="rounded-xl border border-card-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Follower Sentiment
        </p>
        <span className="text-lg font-bold text-foreground">
          {sentimentScore.toFixed(1)}
        </span>
      </div>

      {/* Stacked bar */}
      <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full">
        {pctPositive > 0 && (
          <div
            className="bg-green-500 transition-all duration-500"
            style={{ width: `${pctPositive}%` }}
          />
        )}
        {pctNeutral > 0 && (
          <div
            className="bg-gray-300 transition-all duration-500"
            style={{ width: `${pctNeutral}%` }}
          />
        )}
        {pctNegative > 0 && (
          <div
            className="bg-red-400 transition-all duration-500"
            style={{ width: `${pctNegative}%` }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          Positive {breakdown.positive}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
          Neutral {breakdown.neutral}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
          Negative {breakdown.negative}
        </span>
      </div>
    </div>
  );
}
