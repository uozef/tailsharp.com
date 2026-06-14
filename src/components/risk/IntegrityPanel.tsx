export default function IntegrityPanel({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-blue-400" :
    score >= 60 ? "text-gold-500" :
    "text-danger";

  return (
    <span className={`text-sm font-bold ${color}`}>{score}</span>
  );
}
