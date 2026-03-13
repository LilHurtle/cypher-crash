import type { TileStatus } from '@cypher-crash/shared';

interface TileProps {
  letter?: string;
  status?: TileStatus;
  delay?: number;       // flip delay in ms (for staggered reveal)
  colorblind?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusColors = {
  correct:  { normal: 'bg-correct border-correct text-white',   cb: 'bg-correct-cb border-correct-cb text-white' },
  present:  { normal: 'bg-present border-present text-white',   cb: 'bg-present-cb border-present-cb text-white' },
  absent:   { normal: 'bg-absent border-absent text-white',     cb: 'bg-absent border-absent text-white' },
  empty:    { normal: 'bg-transparent border-gray-700',         cb: 'bg-transparent border-gray-700' },
  tbd:      { normal: 'bg-transparent border-gray-400',         cb: 'bg-transparent border-gray-400' },
};

const sizes = {
  sm: 'w-10 h-10 text-lg font-bold',
  md: 'w-14 h-14 text-2xl font-bold',
  lg: 'w-16 h-16 text-3xl font-bold',
};

export function Tile({ letter = '', status = 'empty', delay = 0, colorblind = false, size = 'md' }: TileProps) {
  const colorKey = colorblind ? 'cb' : 'normal';
  const colors = statusColors[status][colorKey];
  const revealed = status !== 'empty' && status !== 'tbd';

  return (
    <div
      className={`
        ${sizes[size]}
        flex items-center justify-center
        border-2 rounded
        select-none uppercase tracking-widest
        transition-colors
        ${colors}
        ${revealed ? 'animate-flip' : ''}
        ${letter && status === 'tbd' ? 'animate-pop' : ''}
      `}
      style={revealed ? { animationDelay: `${delay}ms` } : undefined}
    >
      {letter}
    </div>
  );
}
