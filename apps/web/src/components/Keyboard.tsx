import type { TileStatus } from '@cypher-crash/shared';

interface KeyboardProps {
  onKey: (key: string) => void;
  letterStatuses: Record<string, TileStatus>;
  disabled?: boolean;
  colorblind?: boolean;
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
];

function keyColor(status: TileStatus | undefined, colorblind: boolean): string {
  if (!status) return 'bg-gray-600 hover:bg-gray-500 active:bg-gray-400 text-white';
  const map = {
    correct: colorblind
      ? 'bg-correct-cb text-white'
      : 'bg-correct text-white',
    present: colorblind
      ? 'bg-present-cb text-white'
      : 'bg-present text-white',
    absent: 'bg-gray-800 text-gray-500',
    empty: 'bg-gray-600 hover:bg-gray-500 active:bg-gray-400 text-white',
    tbd: 'bg-gray-600 hover:bg-gray-500 active:bg-gray-400 text-white',
  };
  return map[status];
}

export function Keyboard({ onKey, letterStatuses, disabled = false, colorblind = false }: KeyboardProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-full px-1 pb-2 no-select">
      {ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1 w-full justify-center">
          {row.map((key) => {
            const isWide = key === 'ENTER' || key === '⌫';
            const status = letterStatuses[key];
            const colorClass = keyColor(status, colorblind);

            return (
              <button
                key={key}
                onClick={() => !disabled && onKey(key)}
                onTouchEnd={(e) => {
                  e.preventDefault(); // prevent double-fire on mobile
                  if (!disabled) onKey(key);
                }}
                className={`
                  ${isWide ? 'px-2 min-w-[3.2rem] sm:min-w-14' : 'flex-1 min-w-0'}
                  h-14 sm:h-14
                  rounded font-semibold text-sm sm:text-base
                  transition-colors cursor-pointer
                  tap-target
                  ${colorClass}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={disabled}
                aria-label={key === '⌫' ? 'Backspace' : key}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
