"use client";

interface HeatmapDatum {
  day: number;
  hour: number;
  trades: number;
  winRate: number;
}

interface Props {
  data: HeatmapDatum[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_BLOCKS = [
  { label: "0-4", start: 0 },
  { label: "4-8", start: 4 },
  { label: "8-12", start: 8 },
  { label: "12-16", start: 12 },
  { label: "16-20", start: 16 },
  { label: "20-24", start: 20 },
];

function bucketHour(hour: number): number {
  return Math.floor(hour / 4);
}

export default function HeatmapChart({ data }: Props) {
  // Aggregate data into buckets: [day][blockIndex]
  const grid: { trades: number; winRate: number; totalWins: number }[][] =
    Array.from({ length: 7 }, () =>
      Array.from({ length: 6 }, () => ({ trades: 0, winRate: 0, totalWins: 0 })),
    );

  for (const d of data) {
    const blockIdx = bucketHour(d.hour);
    const cell = grid[d.day][blockIdx];
    const wins = d.trades * (d.winRate / 100);
    cell.totalWins += wins;
    cell.trades += d.trades;
  }

  // Compute win rates and find max trades for normalization
  let maxTrades = 1;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.trades > 0) {
        cell.winRate = (cell.totalWins / cell.trades) * 100;
      }
      if (cell.trades > maxTrades) {
        maxTrades = cell.trades;
      }
    }
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid gap-1"
        style={{
          gridTemplateColumns: `3rem repeat(6, minmax(3.5rem, 1fr))`,
          gridTemplateRows: `1.5rem repeat(7, 2.5rem)`,
        }}
      >
        {/* Top-left empty corner */}
        <div />

        {/* Column headers */}
        {TIME_BLOCKS.map((block) => (
          <div
            key={block.label}
            className="flex items-center justify-center text-xs font-medium text-muted"
          >
            {block.label}
          </div>
        ))}

        {/* Rows */}
        {DAY_LABELS.map((dayLabel, dayIdx) => (
          <>
            {/* Row label */}
            <div
              key={`label-${dayIdx}`}
              className="flex items-center text-xs font-medium text-muted pr-2"
            >
              {dayLabel}
            </div>

            {/* Cells */}
            {TIME_BLOCKS.map((_, blockIdx) => {
              const cell = grid[dayIdx][blockIdx];
              const intensity = cell.trades / maxTrades;
              const wr = Math.round(cell.winRate);

              return (
                <div
                  key={`${dayIdx}-${blockIdx}`}
                  className="flex items-center justify-center rounded-md border border-card-border text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: `rgba(var(--heatmap-cell), ${intensity * 0.7})`,
                    color:
                      intensity > 0.4
                        ? "rgba(255,255,255,0.9)"
                        : "var(--muted)",
                  }}
                  title={`${cell.trades} trades | ${wr}% win rate`}
                >
                  {cell.trades > 0 ? cell.trades : ""}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
