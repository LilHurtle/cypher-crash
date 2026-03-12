import { useEffect, useRef, useState } from 'react';

/**
 * Returns elapsed milliseconds since `startedAt` (ISO string) or 0 if null.
 * Ticks every 100ms while game is active.
 */
export function useTimer(startedAt: string | null, finished: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startedAt || finished) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const start = new Date(startedAt).getTime();

    const tick = () => {
      setElapsed(Date.now() - start);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [startedAt, finished]);

  return elapsed;
}

export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const centisec = Math.floor((ms % 1000) / 10);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(centisec).padStart(2, '0')}`;
}
