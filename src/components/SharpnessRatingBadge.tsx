import { ratingColor, participantTypeLabels } from "@/lib/sharpness-rating";
import type { ParticipantType } from "@/lib/sharpness-rating";

interface Props {
  rating: number;
  rank: number | null;
  eligible: boolean;
  participantType?: ParticipantType;
}

export default function SharpnessRatingBadge({
  rating,
  rank,
  eligible,
  participantType = "square",
}: Props) {
  if (!eligible) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-inset px-2 py-0.5 text-[11px] font-medium text-muted">
        {participantTypeLabels[participantType]}
      </span>
    );
  }

  const color = ratingColor(rating);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
        color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      SR: {Math.round(rating)}
      {rank != null && (
        <span className="opacity-70">#{rank}</span>
      )}
    </span>
  );
}
