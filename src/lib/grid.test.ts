import { describe, expect, it } from 'vitest';

import { CONNECTION_GRID, DEVICE_GRID, snapLaneX, snapLaneY, snapToDeviceGrid } from './grid';

describe('grid snapping', () => {
  it('snaps device placement to the coarse grid', () => {
    expect(snapToDeviceGrid(DEVICE_GRID + 3)).toBe(DEVICE_GRID);
    expect(snapToDeviceGrid(DEVICE_GRID + DEVICE_GRID / 2 + 1)).toBe(DEVICE_GRID * 2);
  });

  it('snaps lane Y and merges onto nearby shared lanes', () => {
    const nearby = 112;
    const snapped = snapLaneY(nearby + 2, [nearby], 800);
    expect(snapped).toBe(nearby);
  });

  it('snaps riser X onto the connection grid', () => {
    const target = CONNECTION_GRID * 3;
    const snapped = snapLaneX(target + 3, [], 800);
    expect(snapped).toBe(target);
  });

  it('clamps lanes inside the canvas margin', () => {
    expect(snapLaneY(0, [], 600)).toBeGreaterThan(0);
    expect(snapLaneX(0, [], 800)).toBeGreaterThan(0);
    expect(snapLaneY(9999, [], 600)).toBeLessThan(600);
  });
});
