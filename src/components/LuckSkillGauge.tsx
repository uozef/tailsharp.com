interface Props {
  luckScore: number;
  verdict: string;
  components: {
    winRateVsExpected: number;
    persistenceAcrossConditions: number;
    sampleSizeStability: number;
    concentrationPenalty: number;
    streakNormality: number;
  };
}

const componentLabels: Record<string, string> = {
  winRateVsExpected: "Win Rate vs Expected",
  persistenceAcrossConditions: "Persistence",
  sampleSizeStability: "Sample Stability",
  concentrationPenalty: "Concentration",
  streakNormality: "Streak Normality",
};

export default function LuckSkillGauge({ luckScore, verdict, components }: Props) {
  const markerPct = Math.max(0, Math.min(100, luckScore));
  const verdictColor = luckScore < 35 ? "text-green-400" : luckScore < 55 ? "text-gold-400" : "text-danger";

  return (
    <div className="rounded-xl border border-card-border p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Luck vs Skill</p>

      <div className="mt-3">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-green-400">Skill</span>
          <span className="text-danger">Luck</span>
        </div>
        <div className="relative mt-1.5 h-4 w-full overflow-hidden rounded-full bg-gradient-to-r from-green-500 via-gold-400 to-red-500">
          <div
            className="absolute top-0 h-full w-1.5 -translate-x-1/2 rounded-full bg-white shadow-lg ring-2 ring-black/20"
            style={{ left: `${markerPct}%` }}
          />
        </div>
        <p className={`mt-2 text-center text-sm font-bold ${verdictColor}`}>{verdict}</p>
      </div>

      <div className="mt-4 space-y-2">
        {Object.entries(components).map(([key, value]) => {
          const inverted = 100 - value; // 0=lucky, 100=skilled → invert for display
          const barColor = inverted >= 60 ? "bg-green-400" : inverted >= 40 ? "bg-gold-400" : "bg-danger";
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-[11px] text-muted">{componentLabels[key] ?? key}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-card-border/30">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${inverted}%` }} />
              </div>
              <span className="w-8 text-right text-xs font-bold text-foreground">{Math.round(inverted)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
