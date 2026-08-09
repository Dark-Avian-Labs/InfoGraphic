import { PORT_CELL_W, PORT_GAP } from './ports';

/** Coarse grid for device placement */
export const DEVICE_GRID = 40;

/** Fine grid aligned to port pitch (cell + gap) */
export const CONNECTION_GRID = PORT_CELL_W + PORT_GAP;

export const CORNER_RADIUS = 8;
export const LANE_SNAP_THRESHOLD = 6;

/** Keep routed connection lanes inside the canvas with room for labels and dragging */
export const CANVAS_ROUTE_MARGIN = 48;

export function clampLaneY(y: number, canvasHeight: number) {
  const min = CANVAS_ROUTE_MARGIN;
  const max = canvasHeight - CANVAS_ROUTE_MARGIN;
  return Math.max(min, Math.min(max, y));
}

export function clampLaneX(x: number, canvasWidth: number) {
  const min = CANVAS_ROUTE_MARGIN;
  const max = canvasWidth - CANVAS_ROUTE_MARGIN;
  return Math.max(min, Math.min(max, x));
}

export function snapToDeviceGrid(value: number) {
  return Math.round(value / DEVICE_GRID) * DEVICE_GRID;
}

export function snapToConnectionGrid(value: number) {
  return Math.round(value / CONNECTION_GRID) * CONNECTION_GRID;
}

export function snapPointToDeviceGrid(x: number, y: number) {
  return {
    x: snapToDeviceGrid(x),
    y: snapToDeviceGrid(y),
  };
}

/** Snap lane Y to connection grid, then merge with nearby shared lanes */
export function snapLaneY(y: number, otherLanes: number[], canvasHeight?: number) {
  let snapped = snapToConnectionGrid(y);

  for (const lane of otherLanes) {
    if (Math.abs(snapped - lane) <= LANE_SNAP_THRESHOLD) {
      snapped = lane;
      break;
    }
  }

  if (canvasHeight !== undefined) {
    snapped = clampLaneY(snapped, canvasHeight);
  }

  return snapped;
}

/** Snap riser X to connection grid, then merge with nearby shared risers */
export function snapLaneX(x: number, otherRisers: number[], canvasWidth?: number) {
  let snapped = snapToConnectionGrid(x);

  for (const riser of otherRisers) {
    if (Math.abs(snapped - riser) <= LANE_SNAP_THRESHOLD) {
      snapped = riser;
      break;
    }
  }

  if (canvasWidth !== undefined) {
    snapped = clampLaneX(snapped, canvasWidth);
  }

  return snapped;
}

export function collectLaneYValues(lanes: number[], exclude?: number): number[] {
  const unique = new Set<number>();
  for (const lane of lanes) {
    if (exclude !== undefined && Math.abs(lane - exclude) < 0.01) continue;
    unique.add(lane);
  }
  return [...unique].sort((a, b) => a - b);
}

export function collectRiserXValues(risers: number[], exclude?: number): number[] {
  const unique = new Set<number>();
  for (const riser of risers) {
    if (exclude !== undefined && Math.abs(riser - exclude) < 0.01) continue;
    unique.add(riser);
  }
  return [...unique].sort((a, b) => a - b);
}
