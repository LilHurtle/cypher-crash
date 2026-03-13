import type { GuessResult, TileStatus } from '@cypher-crash/shared';
import { Tile } from './Tile';

interface BoardProps {
  wordLength: number;
  maxGuesses?: number;
  guesses: string[];
  results: GuessResult[];
  currentGuess: string;
  shake?: boolean;
  colorblind?: boolean;
}

export function Board({
  wordLength,
  maxGuesses = 6,
  guesses,
  results,
  currentGuess,
  shake = false,
  colorblind = false,
}: BoardProps) {
  // Determine tile size based on word length
  const tileSize: 'sm' | 'md' | 'lg' =
    wordLength >= 7 ? 'sm' : wordLength === 6 ? 'md' : 'lg';

  const rows = Array.from({ length: maxGuesses }, (_, rowIdx) => {
    const submittedGuess = guesses[rowIdx];
    const result = results[rowIdx];
    const isCurrent = rowIdx === guesses.length && !result;
    const isShaking = isCurrent && shake;

    const tiles = Array.from({ length: wordLength }, (_, colIdx) => {
      let letter = '';
      let status: TileStatus = 'empty';

      if (result) {
        // Submitted row
        letter = result[colIdx]?.letter ?? '';
        status = result[colIdx]?.status ?? 'absent';
      } else if (submittedGuess) {
        // Shouldn't happen normally, but fallback
        letter = submittedGuess[colIdx] ?? '';
        status = 'absent';
      } else if (isCurrent) {
        letter = currentGuess[colIdx] ?? '';
        status = letter ? 'tbd' : 'empty';
      }

      return (
        <Tile
          key={colIdx}
          letter={letter}
          status={status}
          delay={colIdx * 100}
          colorblind={colorblind}
          size={tileSize}
        />
      );
    });

    return (
      <div
        key={rowIdx}
        className={`flex gap-1.5 ${isShaking ? 'animate-shake' : ''}`}
      >
        {tiles}
      </div>
    );
  });

  return (
    <div className="flex flex-col items-center gap-1.5 no-select py-2">
      {rows}
    </div>
  );
}
