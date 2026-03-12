import type { GuessResult, LetterResult } from './types';

/**
 * Evaluates a guess against a target word using Wordle duplicate-letter rules.
 *
 * Rules (matching official Wordle):
 * 1. First pass: mark all exact matches (correct position) green.
 * 2. Second pass: for remaining letters, mark yellow if the letter still has
 *    an unmatched occurrence in the target; otherwise gray.
 *
 * This correctly handles duplicates: e.g. guessing "SPEED" for "ABIDE"
 * marks the first E gray and the second E yellow (only one E in target).
 */
export function evaluateGuess(guess: string, target: string): GuessResult {
  const g = guess.toUpperCase().split('');
  const t = target.toUpperCase().split('');

  if (g.length !== t.length) {
    throw new Error(`Guess length ${g.length} does not match target length ${t.length}`);
  }

  const result: LetterResult[] = g.map((letter) => ({ letter, status: 'absent' as const }));

  // Remaining target letters (not yet consumed by a green match)
  const targetPool: (string | null)[] = [...t];

  // Pass 1: exact matches
  for (let i = 0; i < g.length; i++) {
    if (g[i] === t[i]) {
      result[i] = { letter: g[i], status: 'correct' };
      targetPool[i] = null; // consume
    }
  }

  // Pass 2: present / absent
  for (let i = 0; i < g.length; i++) {
    if (result[i].status === 'correct') continue;

    const poolIndex = targetPool.indexOf(g[i]);
    if (poolIndex !== -1) {
      result[i] = { letter: g[i], status: 'present' };
      targetPool[poolIndex] = null; // consume
    }
    // else stays 'absent'
  }

  return result;
}

/**
 * Returns true if all tiles are correct (puzzle solved).
 */
export function isSolved(result: GuessResult): boolean {
  return result.every((r) => r.status === 'correct');
}

/**
 * Builds the shareable emoji grid string.
 * Supports both normal and colorblind modes.
 */
export function buildShareGrid(
  results: GuessResult[],
  options: { colorblind?: boolean } = {},
): string {
  const { colorblind = false } = options;

  const tileChar = (status: LetterResult['status']): string => {
    if (colorblind) {
      return status === 'correct' ? '🟧' : status === 'present' ? '🟦' : '⬜';
    }
    return status === 'correct' ? '🟩' : status === 'present' ? '🟨' : '⬜';
  };

  return results.map((row) => row.map((t) => tileChar(t.status)).join('')).join('\n');
}
