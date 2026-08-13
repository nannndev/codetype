const LINE_COMMENT = /^\s*(\/\/|#(?!\!)|--)(?:\s|$)/;

function commentFlags(lines: string[]): boolean[] {
  let inBlock = false;
  return lines.map((line) => {
    const trimmed = line.trim();
    if (inBlock) {
      if (trimmed.includes("*/")) inBlock = false;
      return true;
    }
    if (trimmed.startsWith("/*")) {
      if (!trimmed.includes("*/", 2)) inBlock = true;
      return true;
    }
    return LINE_COMMENT.test(line);
  });
}

export function selectCodeDenseSnippet(source: string, maxChars = 2200): string | null {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const flags = commentFlags(lines);
  let best: { score: number; lines: string[] } | null = null;

  for (let start = 0; start < lines.length; start += 8) {
    const selected: Array<{ line: string; comment: boolean }> = [];
    let chars = 0;
    let comments = 0;
    let codeLines = 0;

    for (let index = start; index < Math.min(lines.length, start + 70); index += 1) {
      const line = lines[index].replace(/\s+$/g, "");
      if (line.length > 140) continue;
      if (selected.length > 0 && (selected.length >= 60 || chars + line.length + 1 > maxChars)) break;
      selected.push({ line, comment: flags[index] });
      chars += line.length + 1;
      if (flags[index]) comments += 1;
      else if (line.trim()) codeLines += 1;
    }

    while (selected.length && (!selected[0].line.trim() || selected[0].comment)) selected.shift();
    while (selected.length && !selected[selected.length - 1].line.trim()) selected.pop();
    const meaningful = comments + codeLines;
    const commentRatio = meaningful ? comments / meaningful : 1;
    const code = selected.map((item) => item.line).join("\n").trim();
    if (code.length < 80 || codeLines < 5 || commentRatio > 0.3) continue;

    const score = codeLines * 5 + Math.min(code.length, maxChars) / 100 - comments * 7;
    if (!best || score > best.score) best = { score, lines: selected.map((item) => item.line) };
  }

  return best?.lines.join("\n").trim() ?? null;
}
