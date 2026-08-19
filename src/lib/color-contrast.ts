import type { CanvasThemeMode } from '../hooks/useCanvasTheme';
import { CANVAS_BACKGROUND } from './canvas-theme';

export const MIN_GRAPHICAL_CONTRAST = 3;
export const MIN_TEXT_CONTRAST = 4.5;
export const MIN_DECORATIVE_CONTRAST = 1.5;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function parseHexColor(color: string): Rgb | null {
  const normalized = color.trim().replace(/^#/, '');
  if (normalized.length === 3) {
    return {
      r: Number.parseInt(normalized[0] + normalized[0], 16),
      g: Number.parseInt(normalized[1] + normalized[1], 16),
      b: Number.parseInt(normalized[2] + normalized[2], 16),
    };
  }
  if (normalized.length === 6 || normalized.length === 8) {
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }
  return null;
}

function hexChannel(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0');
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${hexChannel(r)}${hexChannel(g)}${hexChannel(b)}`;
}

function linearizeSrgbChannel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance({ r, g, b }: Rgb): number {
  return (
    0.2126 * linearizeSrgbChannel(r) +
    0.7152 * linearizeSrgbChannel(g) +
    0.0722 * linearizeSrgbChannel(b)
  );
}

export function contrastRatio(foreground: string, background: string): number {
  const fg = parseHexColor(foreground);
  const bg = parseHexColor(background);
  if (!fg || !bg) return 1;

  const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg));
  const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l };
  }

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;
  h *= 60;
  if (h < 0) h += 360;

  return { h, s, l };
}

function hueToRgb(p: number, q: number, t: number): number {
  let value = t;
  if (value < 0) value += 1;
  if (value > 1) value -= 1;
  if (value < 1 / 6) return p + (q - p) * 6 * value;
  if (value < 1 / 2) return q;
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
  return p;
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  if (s === 0) {
    const gray = l * 255;
    return { r: gray, g: gray, b: gray };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = h / 360;

  return {
    r: hueToRgb(p, q, hk + 1 / 3) * 255,
    g: hueToRgb(p, q, hk) * 255,
    b: hueToRgb(p, q, hk - 1 / 3) * 255,
  };
}

function nudgeForContrast(
  foreground: string,
  background: string,
  minRatio: number,
  fallbackLight: string,
  fallbackDark: string,
): string {
  if (contrastRatio(foreground, background) >= minRatio) {
    return foreground;
  }

  const rgb = parseHexColor(foreground);
  const bg = parseHexColor(background);
  if (!rgb || !bg) {
    return relativeLuminance(bg ?? { r: 0, g: 0, b: 0 }) < 0.2 ? fallbackLight : fallbackDark;
  }

  const hsl = rgbToHsl(rgb);
  const lighten = relativeLuminance(bg) < 0.2;
  const step = lighten ? 0.04 : -0.04;

  for (let i = 0; i < 24; i++) {
    hsl.l = Math.max(0.05, Math.min(0.95, hsl.l + step));
    const candidate = rgbToHex(hslToRgb(hsl));
    if (contrastRatio(candidate, background) >= minRatio) {
      return candidate;
    }
  }

  return lighten ? fallbackLight : fallbackDark;
}

export function ensureContrast(
  foreground: string,
  background: string,
  minRatio = MIN_GRAPHICAL_CONTRAST,
): string {
  return nudgeForContrast(foreground, background, minRatio, '#e2e8f0', '#1e293b');
}

export function ensureGraphicalContrast(foreground: string, background: string): string {
  return ensureContrast(foreground, background, MIN_GRAPHICAL_CONTRAST);
}

export function ensureTextContrast(foreground: string, background: string): string {
  return ensureContrast(foreground, background, MIN_TEXT_CONTRAST);
}

export function ensureDecorativeContrast(foreground: string, background: string): string {
  return ensureContrast(foreground, background, MIN_DECORATIVE_CONTRAST);
}

export function ensureContrastOnCanvas(color: string, canvasTheme: CanvasThemeMode): string {
  return ensureGraphicalContrast(color, CANVAS_BACKGROUND[canvasTheme]);
}

export function blendOver(background: string, foreground: string, alpha: number): string {
  const bg = parseHexColor(background);
  const fg = parseHexColor(foreground);
  if (!bg || !fg) return background;

  const a = Math.max(0, Math.min(1, alpha));
  return rgbToHex({
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
  });
}

export function readableTextOn(
  background: string,
  options?: { preferred?: string; light?: string; dark?: string },
): string {
  const bg = parseHexColor(background);
  if (!bg) return options?.dark ?? '#0f172a';

  const light = options?.light ?? '#f8fafc';
  const dark = options?.dark ?? '#0f172a';

  if (options?.preferred) {
    return ensureTextContrast(options.preferred, background);
  }

  const useLight = relativeLuminance(bg) < 0.35;
  return ensureTextContrast(useLight ? light : dark, background);
}
