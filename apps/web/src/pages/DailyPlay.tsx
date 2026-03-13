import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluateGuess, isSolved } from '@cypher-crash/shared';
import type { DailyMeta, GuessResult, TileStatus } from '@cypher-crash/shared';
import { useAuth } from '../context/AuthContext';
import { getDaily, startDaily, submitGuess } from '../lib/api';
import { useTimer } from '../hooks/useTimer';
import { Board } from '../components/Board';
import { Keyboard } from '../components/Keyboard';
import { Timer } from '../components/Timer';
import { ShareModal } from '../components/ShareModal';

const MAX_GUESSES = 6;

export function DailyPlay() {
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [meta, setMeta] = useState<DailyMeta | null>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [results, setResults] = useState<GuessResult[]>([]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [solved, setSolved] = useState(false);
  const [solveTimeMs, setSolveTimeMs] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [revealedWord, setRevealedWord] = useState<string | null>(null);
  const [colorblind, setColorblind] = useState(() =>
    localStorage.getItem('colorblind') === 'true',
  );
  const [showShare, setShowShare] = useState(false);
  const [toast, setToast] = useState('');
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');

  const timerElapsed = useTimer(startedAt, finished);
  const hasStarted = !!startedAt;

  const showToast = useCallback((msg: string, ms = 2000) => {
    setToast(msg);
    setTimeout(() => setToast(''), ms);
  }, []);

  // ── Load daily state ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    getDaily()
      .then((m) => {
        setMeta(m);
        setGuesses(m.guesses);
        setStartedAt(m.startedAt);
        setFinished(m.finished);
        setSolved(m.solved);
        setSolveTimeMs(m.solveTimeMs);
        setScore(m.score);

        // Re-evaluate locally so results are populated
        if (m.guesses.length > 0 && m.wordLength) {
          // We don't have the word client-side; results come from server on guess
          // For already-finished games we show results from history later
        }
      })
      .catch((e) => setPageError(e.message));
  }, [user]);

  // ── Derived letter statuses for keyboard coloring ────────────────────────
  const letterStatuses = useCallback((): Record<string, TileStatus> => {
    const map: Record<string, TileStatus> = {};
    results.forEach((row) => {
      row.forEach(({ letter, status }) => {
        const cur = map[letter];
        if (status === 'correct') map[letter] = 'correct';
        else if (status === 'present' && cur !== 'correct') map[letter] = 'present';
        else if (!cur) map[letter] = status;
      });
    });
    return map;
  }, [results]);

  // ── Physical keyboard handler ─────────────────────────────────────────────
  const handleKey = useCallback(
    async (key: string) => {
      if (finished || submitting || !meta) return;
      if (authLoading) return;

      const wordLen = meta.wordLength;

      if (key === '⌫' || key === 'Backspace') {
        setCurrentGuess((g) => g.slice(0, -1));
        return;
      }
      if (key === 'ENTER' || key === 'Enter') {
        if (currentGuess.length < wordLen) {
          showToast(`Word must be ${wordLen} letters`);
          setShake(true);
          setTimeout(() => setShake(false), 500);
          return;
        }
        await handleSubmit();
        return;
      }
      if (/^[A-Za-z]$/.test(key) && currentGuess.length < wordLen) {
        const letter = key.toUpperCase();

        // Start the timer on first keypress (idempotent)
        if (!hasStarted) {
          try {
            const resp = await startDaily();
            setStartedAt(resp.startedAt);
          } catch {
            // Non-fatal; timer just won't show
          }
        }

        setCurrentGuess((g) => g + letter);
      }
    },
    [finished, submitting, meta, currentGuess, hasStarted, authLoading, showToast],
  );

  // Physical keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      handleKey(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey]);

  // ── Submit guess ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!meta || submitting) return;
    setSubmitting(true);
    try {
      const resp = await submitGuess(currentGuess);
      const newGuesses = [...guesses, currentGuess];
      const newResults = [...results, resp.result];

      setGuesses(newGuesses);
      setResults(newResults);
      setCurrentGuess('');

      if (resp.finished) {
        setFinished(true);
        setSolved(resp.solved);
        setSolveTimeMs(resp.solveTimeMs ?? null);
        setScore(resp.score ?? null);
        if (resp.word) setRevealedWord(resp.word);
        setTimeout(() => setShowShare(true), 1800);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      showToast(msg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleColorblind = () => {
    const next = !colorblind;
    setColorblind(next);
    localStorage.setItem('colorblind', String(next));
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-6 pt-16 text-center px-4">
        <h2 className="text-2xl font-bold">Sign in to Play</h2>
        <p className="text-gray-400 max-w-xs">
          You need a Cipher Clash account to compete on the leaderboard.
        </p>
        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors tap-target"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16 text-center px-4">
        <p className="text-red-400">Failed to load puzzle: {pageError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-800 rounded-lg text-sm tap-target"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    /* Full-height flex column: header → board → keyboard pinned to bottom */
    <div className="flex flex-col items-center" style={{ minHeight: 'calc(100dvh - 56px - 56px)' }}>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between py-3 border-b border-gray-800">
        <span className="text-sm text-gray-500">{meta.date}</span>
        <Timer elapsed={timerElapsed} started={hasStarted} />
        <button
          onClick={toggleColorblind}
          className={`text-xs px-2 py-1 rounded-lg border transition-colors tap-target ${
            colorblind
              ? 'border-blue-400 text-blue-400'
              : 'border-gray-700 text-gray-500 hover:border-gray-500'
          }`}
          title="Toggle colorblind mode"
        >
          {colorblind ? '👁 CB' : '👁'}
        </button>
      </div>

      {/* ── Toast notification ───────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white text-gray-900 font-semibold text-sm px-4 py-2 rounded-xl shadow-lg animate-bounce_once">
          {toast}
        </div>
      )}

      {/* ── Game complete banner ──────────────────────────────────────────── */}
      {finished && (
        <div
          className={`mt-3 w-full rounded-xl px-4 py-3 text-center font-semibold text-sm ${
            solved
              ? 'bg-green-900/50 border border-green-700 text-green-300'
              : 'bg-red-900/50 border border-red-700 text-red-300'
          }`}
        >
          {solved
            ? `🎉 Solved in ${guesses.length} guess${guesses.length !== 1 ? 'es' : ''}! Score: ${score}`
            : `😔 The word was ${revealedWord ?? '???'}`}
          <button
            onClick={() => setShowShare(true)}
            className="ml-3 underline text-xs hover:no-underline"
          >
            Share
          </button>
        </div>
      )}

      {/* ── Board ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center w-full py-2">
        <Board
          wordLength={meta.wordLength}
          maxGuesses={MAX_GUESSES}
          guesses={guesses}
          results={results}
          currentGuess={currentGuess}
          shake={shake}
          colorblind={colorblind}
        />
      </div>

      {/* ── On-screen keyboard (sticks to bottom on mobile) ──────────────── */}
      <div className="w-full sticky bottom-0 sm:static bg-gray-950 pt-2 pb-safe">
        <Keyboard
          onKey={handleKey}
          letterStatuses={letterStatuses()}
          disabled={finished || submitting}
          colorblind={colorblind}
        />
      </div>

      {/* ── Share modal ───────────────────────────────────────────────────── */}
      {showShare && (
        <ShareModal
          date={meta.date}
          guessCount={guesses.length}
          maxGuesses={MAX_GUESSES}
          solveTimeMs={solveTimeMs}
          score={score}
          solved={solved}
          results={results}
          colorblind={colorblind}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
