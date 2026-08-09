import { useCallback, useEffect, useState } from 'react';

export type CanvasThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'infographic.canvas.theme';

function readStoredMode(): CanvasThemeMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* ignore */
  }
  return 'light';
}

export function useCanvasTheme() {
  const [mode, setMode] = useState<CanvasThemeMode>(readStoredMode);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { mode, setMode, toggleMode };
}
