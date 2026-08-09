import type { CanvasThemeMode } from '../hooks/useCanvasTheme';
import { CANVAS_BACKGROUND } from './canvas-theme';
import { SURFACE_FILL } from './canvas-theme';
import {
  blendOver,
  ensureContrastOnCanvas,
  ensureGraphicalContrast,
  ensureTextContrast,
  readableTextOn,
} from './color-contrast';

/** Accent stroke/border visible against the canvas background. */
export function frameAccentOnCanvas(color: string, canvasTheme: CanvasThemeMode): string {
  return ensureContrastOnCanvas(color, canvasTheme);
}

/** Text on a solid accent band (VLAN header, device top strip). */
export function textOnSolidAccent(accent: string): string {
  return readableTextOn(accent);
}

/** Text on a lightly tinted cluster/device area over the canvas. */
export function textOnTintedCanvasArea(
  accent: string,
  canvasTheme: CanvasThemeMode,
  alpha = 0.07,
): string {
  const background = blendOver(CANVAS_BACKGROUND[canvasTheme], accent, alpha);
  return readableTextOn(background, { preferred: '#64748b' });
}

/** Connection preview stroke inside the legend panel. */
export function strokeOnPanel(color: string, panelBg: string): string {
  return ensureGraphicalContrast(color, panelBg);
}

/** Label color for a wired port label drawn on a white device surface. */
export function wiredPortLabelOnSurface(wireColor: string): string {
  return ensureTextContrast(wireColor, SURFACE_FILL);
}
