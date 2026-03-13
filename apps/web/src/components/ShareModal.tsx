import { useState } from 'react';
import { buildShareGrid } from '@cypher-crash/shared';
import type { GuessResult } from '@cypher-crash/shared';

interface ShareModalProps {
  date: string;
  guessCount: number;
  maxGuesses: number;
  solveTimeMs: number | null;
  score: number | null;
  solved: boolean;
  results: GuessResult[];
  colorblind: boolean;
  onClose: () => void;
}

export function ShareModal({
  date,
  guessCount,
  maxGuesses,
  solveTimeMs,
  score,
  solved,
  results,
  colorblind,
  onClose,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const grid = buildShareGrid(results, { colorblind });
  const timeStr = solveTimeMs !== null
    ? `${(solveTimeMs / 1000).toFixed(1)}s`
    : '—';
  const header = solved
    ? `Cipher Clash ${date} ${guessCount}/${maxGuesses}`
    : `Cipher Clash ${date} X/${maxGuesses}`;
  const footer = `Score: ${score ?? 0} | Time: ${timeStr}`;
  const shareText = `${header}\n${footer}\n\n${grid}\n\nhttps://cypher-crash.app`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older mobile browsers
      const el = document.createElement('textarea');
      el.value = shareText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ text: shareText });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-gray-900 rounded-t-2xl sm:rounded-2xl p-6 pb-8 sm:pb-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {solved ? '🎉 Nice work!' : '😔 Better luck tomorrow!'}
          </h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 justify-center text-center">
          <div>
            <div className="text-2xl font-bold text-white">{score ?? 0}</div>
            <div className="text-xs text-gray-400">Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{timeStr}</div>
            <div className="text-xs text-gray-400">Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {solved ? `${guessCount}/${maxGuesses}` : `X/${maxGuesses}`}
            </div>
            <div className="text-xs text-gray-400">Guesses</div>
          </div>
        </div>

        {/* Emoji grid preview */}
        <pre className="text-center text-lg leading-tight text-white whitespace-pre">{grid}</pre>

        {/* Share buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleCopy}
            className="w-full py-3 rounded-xl bg-yellow-500 text-gray-900 font-bold text-base active:bg-yellow-400 transition-colors tap-target"
          >
            {copied ? '✓ Copied!' : '📋 Copy Result'}
          </button>
          {typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="w-full py-3 rounded-xl bg-gray-700 text-white font-semibold text-base active:bg-gray-600 transition-colors tap-target"
            >
              📤 Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
