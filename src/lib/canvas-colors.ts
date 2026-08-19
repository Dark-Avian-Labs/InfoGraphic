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

export function frameAccentOnCanvas(color: string, canvasTheme: CanvasThemeMode): string {
  return ensureContrastOnCanvas(color, canvasTheme);
}

export function textOnSolidAccent(accent: string): string {
  return readableTextOn(accent);
}

export function textOnTintedCanvasArea(
  accent: string,
  canvasTheme: CanvasThemeMode,
  alpha = 0.07,
): string {
  const background = blendOver(CANVAS_BACKGROUND[canvasTheme], accent, alpha);
  return readableTextOn(background, { preferred: '#64748b' });
}

export function strokeOnPanel(color: string, panelBg: string): string {
  return ensureGraphicalContrast(color, panelBg);
}

export function wiredPortLabelOnSurface(wireColor: string): string {
  return ensureTextContrast(wireColor, SURFACE_FILL);
}
