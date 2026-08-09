import type { InfographicConnection, InfographicDocument } from '../types';
import {
  collectLaneYValues,
  collectRiserXValues,
  clampLaneX,
  clampLaneY,
  CONNECTION_GRID,
  CORNER_RADIUS,
  snapToConnectionGrid,
} from './grid';
import { findPort, getPortEgressVector, getPortPosition, PORT_STUB } from './ports';

export interface RouteSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface RoutedConnection {
  points: { x: number; y: number }[];
  laneSegment: RouteSegment;
  fromRiserSegment: RouteSegment;
  toRiserSegment: RouteSegment;
  laneAxis: 'horizontal' | 'vertical';
  labelPoint: { x: number; y: number };
  laneY: number;
  fromRiserX: number;
  toRiserX: number;
  fromStubX: number;
  toStubX: number;
}

export function routeConnection(
  doc: InfographicDocument,
  connection: InfographicConnection,
): RoutedConnection | null {
  const from = findPort(doc, connection.fromPortId);
  const to = findPort(doc, connection.toPortId);
  if (!from || !to) return null;

  const start = getPortPosition(from.node, from.port);
  const end = getPortPosition(to.node, to.port);
  const fromEgress = getPortEgressVector(from.port);
  const toEgress = getPortEgressVector(to.port);

  const startStub = {
    x: start.x + fromEgress.dx * PORT_STUB,
    y: start.y + fromEgress.dy * PORT_STUB,
  };
  const endStub = {
    x: end.x + toEgress.dx * PORT_STUB,
    y: end.y + toEgress.dy * PORT_STUB,
  };

  const defaultLane = computeDefaultLane(startStub, endStub, from.port.side, to.port.side);
  const stackedLane = defaultLane + laneStackOffset(doc, connection);
  const laneY = connection.lane !== undefined ? connection.lane : snapToConnectionGrid(stackedLane);

  const sameOrientation = from.port.side === to.port.side;

  let resolvedLaneY = laneY;
  if (sameOrientation && from.port.side === 'bottom') {
    resolvedLaneY = Math.max(laneY, startStub.y, endStub.y);
  } else if (sameOrientation && from.port.side === 'top') {
    resolvedLaneY = Math.min(laneY, startStub.y, endStub.y);
  }

  resolvedLaneY = clampLaneY(resolvedLaneY, doc.height);

  const fromRiserX = clampLaneX(startStub.x + (connection.fromRiserOffset ?? 0), doc.width);
  const toRiserX = clampLaneX(endStub.x + (connection.toRiserOffset ?? 0), doc.width);

  const points: { x: number; y: number }[] = [start, startStub];
  if (Math.abs(fromRiserX - startStub.x) > 0.5) {
    points.push({ x: fromRiserX, y: startStub.y });
  }
  points.push({ x: fromRiserX, y: resolvedLaneY }, { x: toRiserX, y: resolvedLaneY });
  if (Math.abs(toRiserX - endStub.x) > 0.5) {
    points.push({ x: toRiserX, y: endStub.y });
  }
  points.push(endStub, end);

  return {
    points,
    laneSegment: { x1: fromRiserX, y1: resolvedLaneY, x2: toRiserX, y2: resolvedLaneY },
    fromRiserSegment: {
      x1: fromRiserX,
      y1: startStub.y,
      x2: fromRiserX,
      y2: resolvedLaneY,
    },
    toRiserSegment: {
      x1: toRiserX,
      y1: endStub.y,
      x2: toRiserX,
      y2: resolvedLaneY,
    },
    laneAxis: 'horizontal',
    labelPoint: { x: (fromRiserX + toRiserX) / 2, y: resolvedLaneY },
    laneY: resolvedLaneY,
    fromRiserX,
    toRiserX,
    fromStubX: startStub.x,
    toStubX: endStub.x,
  };
}

export function getOtherLaneValues(doc: InfographicDocument, excludeConnectionId: string) {
  const lanes: number[] = [];
  for (const conn of doc.connections) {
    if (conn.id === excludeConnectionId) continue;
    const y = conn.lane ?? routeConnection(doc, conn)?.laneY;
    if (y !== undefined) lanes.push(y);
  }
  return collectLaneYValues(lanes);
}

export function getOtherRiserValues(doc: InfographicDocument, excludeConnectionId: string) {
  const risers: number[] = [];
  for (const conn of doc.connections) {
    if (conn.id === excludeConnectionId) continue;
    const route = routeConnection(doc, conn);
    if (!route) continue;
    risers.push(route.fromRiserX, route.toRiserX);
  }
  return collectRiserXValues(risers);
}

export function getVisibleLaneGuides(doc: InfographicDocument) {
  const lanes = doc.connections
    .map((c) => routeConnection(doc, c)?.laneY)
    .filter((y): y is number => y !== undefined);

  return collectLaneYValues(lanes);
}

export function getVisibleRiserGuides(doc: InfographicDocument) {
  const risers: number[] = [];
  for (const conn of doc.connections) {
    const route = routeConnection(doc, conn);
    if (!route) continue;
    risers.push(route.fromRiserX, route.toRiserX);
  }
  return collectRiserXValues(risers);
}

function computeDefaultLane(
  fromStub: { x: number; y: number },
  toStub: { x: number; y: number },
  fromSide: string,
  toSide: string,
) {
  if (fromSide === 'bottom' && toSide === 'top') {
    return snapToConnectionGrid((fromStub.y + toStub.y) / 2);
  }
  if (fromSide === 'top' && toSide === 'bottom') {
    return snapToConnectionGrid((fromStub.y + toStub.y) / 2);
  }
  if (fromSide === 'bottom' && toSide === 'bottom') {
    return snapToConnectionGrid(Math.max(fromStub.y, toStub.y) + CONNECTION_GRID);
  }
  return snapToConnectionGrid(Math.min(fromStub.y, toStub.y) - CONNECTION_GRID);
}

function laneStackOffset(doc: InfographicDocument, connection: InfographicConnection) {
  if (connection.lane !== undefined) return 0;

  const siblings = doc.connections
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => {
      if (c.lane !== undefined) return false;
      const a = findPort(doc, c.fromPortId);
      const b = findPort(doc, c.toPortId);
      const selfA = findPort(doc, connection.fromPortId);
      const selfB = findPort(doc, connection.toPortId);
      if (!a || !b || !selfA || !selfB) return false;
      const samePair =
        (c.fromPortId === connection.fromPortId && c.toPortId === connection.toPortId) ||
        (c.fromPortId === connection.toPortId && c.toPortId === connection.fromPortId);
      if (samePair) return true;
      const ax = getPortPosition(selfA.node, selfA.port).x;
      const bx = getPortPosition(selfB.node, selfB.port).x;
      const cx = getPortPosition(a.node, a.port).x;
      const dx = getPortPosition(b.node, b.port).x;
      const minX = Math.min(ax, bx);
      const maxX = Math.max(ax, bx);
      const cMin = Math.min(cx, dx);
      const cMax = Math.max(cx, dx);
      return cMax >= minX - 40 && cMin <= maxX + 40;
    })
    .sort((a, b) => a.i - b.i);

  const rank = siblings.findIndex((s) => s.c.id === connection.id);
  const center = (siblings.length - 1) / 2;
  return (rank - center) * CONNECTION_GRID;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function norm(v: { x: number; y: number }) {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

export function pointsToRoundedPath(
  points: { x: number; y: number }[],
  radius = CORNER_RADIUS,
): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  const parts: string[] = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];

    const v1 = norm({ x: p1.x - p0.x, y: p1.y - p0.y });
    const v2 = norm({ x: p2.x - p1.x, y: p2.y - p1.y });

    const len1 = dist(p0, p1);
    const len2 = dist(p1, p2);
    const r = Math.min(radius, len1 / 2 - 0.5, len2 / 2 - 0.5);
    if (r <= 0) {
      parts.push(`L ${p1.x} ${p1.y}`);
      continue;
    }

    const before = { x: p1.x - v1.x * r, y: p1.y - v1.y * r };
    const after = { x: p1.x + v2.x * r, y: p1.y + v2.y * r };

    parts.push(`L ${before.x} ${before.y}`);
    parts.push(`Q ${p1.x} ${p1.y} ${after.x} ${after.y}`);
  }

  const last = points[points.length - 1];
  parts.push(`L ${last.x} ${last.y}`);
  return parts.join(' ');
}

/** @deprecated use pointsToRoundedPath */
export function pointsToPath(points: { x: number; y: number }[]) {
  return pointsToRoundedPath(points);
}

export { CORNER_RADIUS };
