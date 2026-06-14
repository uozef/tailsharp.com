import {
  Crown,
  User,
  Dice5,
  ArrowLeftRight,
  GitBranch,
  Timer,
  Zap,
  ShieldAlert,
  Scale,
} from "lucide-react";
import type { WalletClassification } from "@/lib/wallet-intelligence";

const typeConfig: Record<
  WalletClassification["primaryType"],
  { icon: typeof Crown; color: string }
> = {
  sharp: { icon: Crown, color: "text-gold-400" },
  square: { icon: User, color: "text-blue-400" },
  lucky_monkey: { icon: Dice5, color: "text-orange-400" },
  market_maker: { icon: ArrowLeftRight, color: "text-purple-400" },
  arbitrageur: { icon: GitBranch, color: "text-indigo-400" },
  late_sweeper: { icon: Timer, color: "text-muted" },
  informed_flow: { icon: Zap, color: "text-blue-400" },
  manipulator: { icon: ShieldAlert, color: "text-danger" },
  hedger: { icon: Scale, color: "text-muted" },
};

interface Props {
  classification: WalletClassification;
}

export default function WalletTypeBadge({ classification }: Props) {
  const { primaryType, confidence, isFollowable, label } = classification;
  const cfg = typeConfig[primaryType];
  const Icon = cfg.icon;

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 rounded-md border border-card-border bg-surface px-2.5 py-1 text-sm font-semibold ${cfg.color}`}>
        <Icon className="h-4 w-4" />
        {label}
        <span className="text-xs text-muted">{Math.round(confidence)}%</span>
      </span>
      {!isFollowable && (
        <span className="rounded-md bg-danger/20 px-2 py-0.5 text-[10px] font-bold text-danger">
          Not Followable
        </span>
      )}
    </div>
  );
}
