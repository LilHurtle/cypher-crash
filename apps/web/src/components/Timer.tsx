import { formatTime } from '../hooks/useTimer';

interface TimerProps {
  elapsed: number;
  started: boolean;
}

export function Timer({ elapsed, started }: TimerProps) {
  if (!started) {
    return (
      <div className="font-mono text-gray-500 text-sm sm:text-base tabular-nums">
        00:00.00
      </div>
    );
  }

  return (
    <div className="font-mono text-yellow-400 text-sm sm:text-base tabular-nums font-semibold">
      ⏱ {formatTime(elapsed)}
    </div>
  );
}
