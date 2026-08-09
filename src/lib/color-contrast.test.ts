import { describe, expect, it } from 'vitest';

import { contrastRatio, ensureTextContrast, MIN_TEXT_CONTRAST } from './color-contrast';

describe('color contrast', () => {
  it('keeps already-readable text colors', () => {
    expect(ensureTextContrast('#0f172a', '#ffffff')).toBe('#0f172a');
  });

  it('nudges low-contrast text until it meets the text threshold', () => {
    const adjusted = ensureTextContrast('#cbd5e1', '#ffffff');
    expect(contrastRatio(adjusted, '#ffffff')).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
  });
});
