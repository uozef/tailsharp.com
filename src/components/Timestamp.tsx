import { Clock } from "lucide-react";

interface TimestampProps {
  date?: string;
}

export default function Timestamp({ date }: TimestampProps) {
  if (!date) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        Live
      </span>
    );
  }

  const now = new Date("2025-06-11T15:00:00Z");
  const updated = new Date(date);
  const diffMs = now.getTime() - updated.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  let label: string;
  if (diffMin < 1) {
    label = "Updated just now";
  } else if (diffMin < 60) {
    label = `Updated ${diffMin} min ago`;
  } else if (diffHours < 24 && updated.getDate() === now.getDate()) {
    label = `Updated today at ${updated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
  } else {
    label = `Updated ${updated.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
}
