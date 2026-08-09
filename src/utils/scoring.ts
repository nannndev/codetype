import type { CharState, PerLineStats, ErrorDetail } from '../types';

export function computeCharStates(code: string, input: string): CharState[] {
  const chars: CharState[] = [];

  for (let i = 0; i < code.length; i++) {
    const char = code[i];

    if (i < input.length) {
      chars.push({
        char,
        status: input[i] === char ? 'correct' : 'incorrect',
        isCurrent: i === input.length,
      });
    } else if (i === input.length) {
      chars.push({ char, status: 'pending', isCurrent: true });
    } else {
      chars.push({ char, status: 'pending', isCurrent: false });
    }
  }

  return chars;
}

export function computeAccuracy(code: string, input: string): number {
  let correct = 0;
  for (let i = 0; i < input.length; i++) {
    if (i < code.length && input[i] === code[i]) correct++;
  }
  return input.length === 0 ? 100 : Math.round((correct / input.length) * 1000) / 10;
}

export function computeWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  const words = correctChars / 5;
  return Math.round((words / minutes) * 10) / 10;
}

export function computeRawWpm(inputLength: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  const words = inputLength / 5;
  return Math.round((words / minutes) * 10) / 10;
}

export function computeConsistency(wpmSnapshots: number[]): number {
  if (wpmSnapshots.length < 2) return 100;
  const avg = wpmSnapshots.reduce((a, b) => a + b, 0) / wpmSnapshots.length;
  if (avg === 0) return 100;
  const variance = wpmSnapshots.reduce((sum, v) => sum + (v - avg) ** 2, 0) / wpmSnapshots.length;
  const stddev = Math.sqrt(variance);
  return Math.max(0, Math.round((100 - (stddev / avg) * 100) * 10) / 10);
}

export function computePerLineStats(code: string, input: string, errorHistory: ErrorDetail[] = []): PerLineStats[] {
  const codeLines = code.split('\n');
  const inputLines = input.split('\n');
  const stats: PerLineStats[] = [];
  const lineStarts: number[] = [];
  let lineStart = 0;
  for (const line of codeLines) {
    lineStarts.push(lineStart);
    lineStart += line.length + 1;
  }

  for (let li = 0; li < codeLines.length; li++) {
    const codeLine = codeLines[li];
    const inputLine = inputLines[li] ?? '';

    let correct = 0;
    for (let i = 0; i < Math.min(codeLine.length, inputLine.length); i++) {
      if (codeLine[i] === inputLine[i]) correct++;
    }

    const charsTyped = inputLine.length;
    const start = lineStarts[li];
    const end = start + codeLine.length + (li < codeLines.length - 1 ? 1 : 0);
    const historicalErrors = errorHistory.filter((error) => error.index >= start && error.index < end).length;
    const errors = historicalErrors;
    const attempts = correct + errors;

    stats.push({
      lineIndex: li,
      charsTyped,
      errors,
      accuracy: attempts === 0 ? 100 : Math.round((correct / attempts) * 1000) / 10,
    });
  }

  return stats;
}

export function computeErrorMap(code: string, input: string): ErrorDetail[] {
  const errors: ErrorDetail[] = [];
  for (let i = 0; i < Math.min(code.length, input.length); i++) {
    if (input[i] !== code[i]) {
      errors.push({ index: i, expected: code[i], typed: input[i] });
      if (errors.length >= 50) break;
    }
  }
  for (let i = code.length; i < input.length && errors.length < 50; i++) {
    errors.push({ index: i, expected: '', typed: input[i] });
  }
  return errors;
}
