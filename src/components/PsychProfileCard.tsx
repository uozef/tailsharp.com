import {
  Heart,
  Target,
  Clock,
  Flame,
  ShieldOff,
  Zap,
  Crown,
  Shuffle,
  Scale,
  Crosshair,
} from "lucide-react";
import type { PsychologicalProfile, PsychAttribute } from "@/lib/wallet-intelligence";

const attrIconMap: Record<string, typeof Heart> = {
  emotional_resilience: Heart,
  discipline: Target,
  patience: Clock,
  conviction: Flame,
  loss_aversion: ShieldOff,
  fomo_susceptibility: Zap,
  overconfidence: Crown,
  adaptability: Shuffle,
  risk_calibration: Scale,
  focus: Crosshair,
};

const personalityColors: Record<string, string> = {
  calculated: "text-green-400 bg-green-400/15",
  disciplined: "text-green-400 bg-green-400/15",
  aggressive: "text-danger bg-danger/15",
  fearful: "text-gold-400 bg-gold-400/15",
  erratic: "text-danger bg-danger/15",
};

interface Props {
  profile: PsychologicalProfile;
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "var(--grade-a)" : score >= 40 ? "var(--grade-c)" : "var(--grade-f)";

  return (
    <svg width="44" height="44" viewBox="0 0 48 48" className="shrink-0">
      <circle cx="24" cy="24" r={radius} fill="none" stroke="var(--card-border)" strokeWidth="4" />
      <circle cx="24" cy="24" r={radius} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 24 24)" />
      <text x="24" y="24" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold" fill="var(--foreground)">{Math.round(score)}</text>
    </svg>
  );
}

function AttributeBar({ attr }: { attr: PsychAttribute }) {
  const Icon = attrIconMap[attr.name] ?? Target;
  const barColor = attr.isStrength ? "bg-green-400" : "bg-danger";
  const nameFormatted = attr.name.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div className="flex items-center gap-2" title={attr.evidence}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted" />
      <span className="w-40 shrink-0 text-xs font-medium text-foreground">{nameFormatted}</span>
      <div className="flex flex-1 items-center gap-1.5">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-card-border/30">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${attr.score}%` }} />
        </div>
        <span className="w-7 text-right text-xs font-bold text-foreground">{Math.round(attr.score)}</span>
      </div>
    </div>
  );
}

export default function PsychProfileCard({ profile }: Props) {
  const { attributes, overallScore, dominantTrait, riskPersonality } = profile;
  const personalityStyle = personalityColors[riskPersonality] ?? "text-muted bg-card-border/30";
  const dominantFormatted = dominantTrait.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Psychological Profile</h3>
          <p className="mt-0.5 text-[10px] text-muted">
            Dominant trait: <span className="font-semibold text-foreground">{dominantFormatted}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${personalityStyle}`}>{riskPersonality}</span>
          <ScoreGauge score={overallScore} />
        </div>
      </div>

      {/* Attribute bars */}
      <div className="mt-3 space-y-1.5">
        {attributes.map((attr) => (
          <AttributeBar key={attr.name} attr={attr} />
        ))}
      </div>
    </div>
  );
}
