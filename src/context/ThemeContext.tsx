import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const THEME_STORAGE_KEY = 'infographic.theme.mode';
const SHARED_THEME_STORAGE_KEY = 'dal.theme.mode';
const THEME_COOKIE = 'dal.theme.mode';
const THEME_COOKIE_DOMAIN =
  (import.meta.env.VITE_SHARED_THEME_COOKIE_DOMAIN as string | undefined) ?? '';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function safeReadStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseThemeCookie(): ThemeMode | null {
  const raw = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${THEME_COOKIE}=`))
    ?.split('=')
    .slice(1)
    .join('=');
  if (raw === 'light' || raw === 'dark') return raw;
  return null;
}

function resolveInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const fromCookie = parseThemeCookie();
  if (fromCookie) return fromCookie;
  const shared = safeReadStorage(SHARED_THEME_STORAGE_KEY);
  if (shared === 'light' || shared === 'dark') return shared;
  const stored = safeReadStorage(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

function writeThemeCookie(mode: ThemeMode): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const base = `${THEME_COOKIE}=${mode}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax${secure}`;
  const domain = THEME_COOKIE_DOMAIN.trim();
  if (domain) {
    document.cookie = `${base}; Domain=${domain}`;
    return;
  }
  document.cookie = base;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const hasMountedRef = useRef(false);
  const [mode, setMode] = useState<ThemeMode>(resolveInitialMode);

  useEffect(() => {
    const root = document.documentElement;
    root.style.colorScheme = mode === 'dark' ? 'dark' : 'light';
    root.classList.remove('dark');
    if (mode === 'dark') {
      root.classList.add('dark');
    }
    root.classList.remove('ui-shadow', 'ui-clear');
    if (!root.classList.contains('ui-prism')) {
      root.classList.add('ui-prism');
    }
    if (!hasMountedRef.current) {
      return;
    }
    try {
      window.localStorage.setItem(SHARED_THEME_STORAGE_KEY, mode);
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
      writeThemeCookie(mode);
    } catch (error) {
      console.warn('Failed to persist theme mode to localStorage or cookie.', error);
    }
  }, [mode]);

  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
      toggleMode: () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark')),
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
