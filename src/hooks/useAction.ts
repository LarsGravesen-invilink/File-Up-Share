import { useState, useCallback } from 'react';

export function useAction(cooldown = 2000) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const run = useCallback(async (fn: () => Promise<void> | void) => {
    if (busy || done) return;
    setBusy(true);
    try {
      await fn();
      setDone(true);
      setTimeout(() => setDone(false), cooldown);
    } catch {}
    setBusy(false);
  }, [busy, done, cooldown]);

  const cls = done ? 'btn-done' : busy ? 'opacity-70 pointer-events-none' : '';
  const label = (normal: string, doneText = '✓') => done ? doneText : busy ? '...' : normal;

  return { run, busy, done, cls, label };
}
