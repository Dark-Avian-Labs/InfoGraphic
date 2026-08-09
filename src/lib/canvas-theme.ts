import type { CSSProperties } from 'react';

import type { CanvasThemeMode } from '../hooks/useCanvasTheme';
import {
  contrastRatio,
  ensureDecorativeContrast,
  ensureGraphicalContrast,
  ensureTextContrast,
} from './color-contrast';

export const CANVAS_BACKGROUND: Record<CanvasThemeMode, string> = {
  light: '#f8fafc',
  dark: '#0f172a',
};

export const SURFACE_FILL = '#ffffff';

const BASE_TOKENS: Record<CanvasThemeMode, Record<string, string>> = {
  light: {
    gridDevice: '#cbd5e1',
    gridConnection: '#e2e8f0',
    title: '#0f172a',
    textMuted: '#64748b',
    textSecondary: '#334155',
    portLabel: '#475569',
    portLabelActive: '#0f172a',
    portIdle: '#94a3b8',
    legendBg: '#ffffff',
    legendBorder: '#e2e8f0',
    legendText: '#334155',
    legendHeading: '#0f172a',
    hint: '#2563eb',
    connectionLabel: '#475569',
    frame: 'rgba(15, 23, 42, 0.14)',
    surfaceText: '#0f172a',
    surfaceTextMuted: '#64748b',
    surfaceTextSecondary: '#334155',
  },
  dark: {
    gridDevice: '#334155',
    gridConnection: '#1e293b',
    title: '#f1f5f9',
    textMuted: '#94a3b8',
    textSecondary: '#cbd5e1',
    portLabel: '#94a3b8',
    portLabelActive: '#f1f5f9',
    portIdle: '#94a3b8',
    legendBg: '#1e293b',
    legendBorder: '#334155',
    legendText: '#cbd5e1',
    legendHeading: '#f1f5f9',
    hint: '#60a5fa',
    connectionLabel: '#94a3b8',
    frame: 'rgba(148, 163, 184, 0.35)',
    surfaceText: '#0f172a',
    surfaceTextMuted: '#64748b',
    surfaceTextSecondary: '#334155',
  },
};

function pickLegendBg(mode: CanvasThemeMode, bg: string): string {
  const candidates =
    mode === 'dark'
      ? [BASE_TOKENS.dark.legendBg, '#334155', '#475569', '#64748b']
      : [BASE_TOKENS.light.legendBg];

  for (const candidate of candidates) {
    if (contrastRatio(candidate, bg) >= 2) {
      return candidate;
    }
  }

  return ensureGraphicalContrast('#475569', bg);
}

export function buildCanvasTheme(mode: CanvasThemeMode): Record<string, string> {
  const bg = CANVAS_BACKGROUND[mode];
  const base = BASE_TOKENS[mode];
  const legendBg = pickLegendBg(mode, bg);

  return {
    '--canvas-bg': bg,
    '--canvas-grid-device': ensureDecorativeContrast(base.gridDevice, bg),
    '--canvas-grid-connection': ensureDecorativeContrast(base.gridConnection, bg),
    '--canvas-title': ensureTextContrast(base.title, bg),
    '--canvas-text': ensureTextContrast(base.title, bg),
    '--canvas-text-muted': ensureTextContrast(base.textMuted, bg),
    '--canvas-text-secondary': ensureTextContrast(base.textSecondary, bg),
    '--canvas-port-label': ensureTextContrast(base.portLabel, bg),
    '--canvas-port-label-active': ensureTextContrast(base.portLabelActive, bg),
    '--canvas-port-idle': ensureGraphicalContrast(base.portIdle, bg),
    '--canvas-legend-bg': legendBg,
    '--canvas-legend-border': ensureGraphicalContrast(base.legendBorder, bg),
    '--canvas-legend-text': ensureTextContrast(base.legendText, legendBg),
    '--canvas-legend-heading': ensureTextContrast(base.legendHeading, legendBg),
    '--canvas-hint': ensureGraphicalContrast(base.hint, bg),
    '--canvas-connection-label': ensureTextContrast(base.connectionLabel, bg),
    '--canvas-frame': base.frame,
    '--canvas-surface-fill': SURFACE_FILL,
    '--canvas-surface-text': ensureTextContrast(base.surfaceText, SURFACE_FILL),
    '--canvas-surface-text-muted': ensureTextContrast(base.surfaceTextMuted, SURFACE_FILL),
    '--canvas-surface-text-secondary': ensureTextContrast(base.surfaceTextSecondary, SURFACE_FILL),
    '--canvas-surface-legend-text': ensureTextContrast(base.legendText, SURFACE_FILL),
  };
}

export function canvasThemeStyle(mode: CanvasThemeMode): CSSProperties {
  return buildCanvasTheme(mode) as CSSProperties;
}

export function getCanvasThemeTokens(mode: CanvasThemeMode) {
  return buildCanvasTheme(mode);
}

export function getSurfaceTextColors(mode: CanvasThemeMode) {
  const tokens = buildCanvasTheme(mode);
  return {
    label: tokens['--canvas-surface-text'],
    muted: tokens['--canvas-surface-text-muted'],
    secondary: tokens['--canvas-surface-text-secondary'],
  };
}
