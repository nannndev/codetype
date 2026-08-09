import type { ErrorDetail } from "@/types";

interface ErrorHeatmapProps {
  errorPositions: ErrorDetail[];
  totalChars: number;
}

export function ErrorHeatmap({ errorPositions, totalChars }: ErrorHeatmapProps) {
  if (totalChars === 0) return null;

  const errorSet = new Set(errorPositions.map((e) => e.attemptIndex ?? e.index));
  const charsPerRow = 40;
  const rows = Math.ceil(totalChars / charsPerRow);
  const grid: number[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < charsPerRow; c++) {
      const idx = r * charsPerRow + c;
      if (idx >= totalChars) break;
      row.push(errorSet.has(idx) ? 1 : 0);
    }
    if (row.length > 0) grid.push(row);
  }

  return (
    <div className="flex flex-wrap gap-[2px] justify-center">
      {grid.map((row, ri) => (
        <div key={ri} className="flex gap-[2px]">
          {row.map((cell, ci) => (
            <div
              key={ci}
              className="w-[6px] h-[6px] rounded-[1px]"
              style={{
                backgroundColor: cell ? 'rgb(239 68 68)' : 'rgb(100 116 139 / 0.2)',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
