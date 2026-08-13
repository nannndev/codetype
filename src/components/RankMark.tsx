interface RankMarkProps {
  rank: number;
  size?: "sm" | "lg";
}

export function RankMark({ rank, size = "lg" }: RankMarkProps) {
  const first = rank === 1;
  const podium = rank <= 3;

  return (
    <span
      className={`rank-mark ${first ? "rank-mark-first" : ""} ${podium ? "rank-mark-podium" : "rank-mark-list"} ${size === "sm" ? "rank-mark-sm" : "rank-mark-lg"}`}
      aria-label={`Rank ${rank}`}
    >
      <svg viewBox="0 0 64 72" aria-hidden="true">
        <path className="rank-mark-frame" d="M14 7h36l8 10v34L32 67 6 51V17L14 7Z" />
        <path className="rank-mark-code" d="m22 23-7 7 7 7M42 23l7 7-7 7M36 20l-8 20" />
        <path className="rank-mark-terminal" d="M20 49h24" />
      </svg>
      <strong>{rank}</strong>
    </span>
  );
}
