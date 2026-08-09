import { useRef } from 'react';

import type { RoutedConnection, RouteSegment } from '../lib/connection-routing';
import { pointsToRoundedPath } from '../lib/connection-routing';
import { LANE_SNAP_THRESHOLD, snapLaneX, snapLaneY } from '../lib/grid';
import type { ConnectionType } from '../types';

const HIT_STROKE_WIDTH = 20;
const LANE_HIT_WIDTH = 24;
const RISER_HIT_WIDTH = 24;
const DRAG_THRESHOLD_PX = 4;

export type ConnectionDragAxis = 'lane' | 'fromRiser' | 'toRiser';

interface ConnectionLineProps {
  route: RoutedConnection;
  type: ConnectionType;
  strokeColor?: string;
  label?: string;
  variant?: 'visual' | 'interaction';
  selected?: boolean;
  interactive?: boolean;
  laneSnapTargets?: number[];
  riserSnapTargets?: number[];
  canvasWidth?: number;
  canvasHeight?: number;
  onSelect?: () => void;
  onLaneDrag?: (lane: number) => void;
  onRiserDrag?: (which: 'from' | 'to', x: number) => void;
}

function svgPointFromClient(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const matrix = svg.getScreenCTM()?.inverse();
  if (!matrix) return null;
  return pt.matrixTransform(matrix);
}

function segmentLength(segment: RouteSegment) {
  return Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1);
}

function distanceToSegment(px: number, py: number, segment: RouteSegment) {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.0001) return Math.hypot(px - segment.x1, py - segment.y1);
  let t = ((px - segment.x1) * dx + (py - segment.y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (segment.x1 + t * dx), py - (segment.y1 + t * dy));
}

function nearestDragAxis(route: RoutedConnection, x: number, y: number): ConnectionDragAxis {
  const candidates: { axis: ConnectionDragAxis; distance: number; length: number }[] = [
    {
      axis: 'lane' as const,
      distance: distanceToSegment(x, y, route.laneSegment),
      length: segmentLength(route.laneSegment),
    },
    {
      axis: 'fromRiser' as const,
      distance: distanceToSegment(x, y, route.fromRiserSegment),
      length: segmentLength(route.fromRiserSegment),
    },
    {
      axis: 'toRiser' as const,
      distance: distanceToSegment(x, y, route.toRiserSegment),
      length: segmentLength(route.toRiserSegment),
    },
  ].filter((c) => c.length > 1);

  candidates.sort((a, b) => a.distance - b.distance || b.length - a.length);
  return candidates[0]?.axis ?? 'lane';
}

export function ConnectionLine({
  route,
  type,
  strokeColor,
  label,
  variant = 'visual',
  selected,
  interactive,
  laneSnapTargets = [],
  riserSnapTargets = [],
  canvasWidth,
  canvasHeight,
  onSelect,
  onLaneDrag,
  onRiserDrag,
}: ConnectionLineProps) {
  const stroke = strokeColor ?? type.color ?? '#1e293b';
  const pathD = pointsToRoundedPath(route.points);
  const { laneSegment, fromRiserSegment, toRiserSegment } = route;
  const laneMidX = (laneSegment.x1 + laneSegment.x2) / 2;
  const laneMidY = (laneSegment.y1 + laneSegment.y2) / 2;
  const fromMidY = (fromRiserSegment.y1 + fromRiserSegment.y2) / 2;
  const toMidY = (toRiserSegment.y1 + toRiserSegment.y2) / 2;
  const dragState = useRef({ dragging: false, pointerId: -1, axis: 'lane' as ConnectionDragAxis });

  const strokeDasharray =
    type.style === 'dashed' ? '8 6' : type.style === 'vpn' ? '10 6' : undefined;
  const strokeWidth = type.style === 'thick' ? 3 : type.style === 'vpn' ? 2.5 : 2;
  const canDragRoute = Boolean(onLaneDrag || onRiserDrag);

  const bindRouteDrag = (axis: ConnectionDragAxis) => (event: React.PointerEvent) => {
    if (!interactive || !canDragRoute) return;

    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget as Element;
    const svg = target.closest('svg') as SVGSVGElement | null;
    if (!svg) return;

    const startX = event.clientX;
    const startY = event.clientY;
    dragState.current = { dragging: false, pointerId: event.pointerId, axis };
    target.setPointerCapture(event.pointerId);

    const onMove = (moveEvent: Event) => {
      const pointer = moveEvent as PointerEvent;
      if (pointer.pointerId !== dragState.current.pointerId) return;

      const deltaX = Math.abs(pointer.clientX - startX);
      const deltaY = Math.abs(pointer.clientY - startY);

      if (!dragState.current.dragging) {
        if (Math.max(deltaX, deltaY) < DRAG_THRESHOLD_PX) return;
        dragState.current.dragging = true;
        onSelect?.();
      }

      const pos = svgPointFromClient(svg, pointer.clientX, pointer.clientY);
      if (!pos) return;

      const activeAxis = dragState.current.axis;
      if (activeAxis === 'lane' && onLaneDrag) {
        onLaneDrag(snapLaneY(pos.y, laneSnapTargets, canvasHeight));
      } else if (activeAxis === 'fromRiser' && onRiserDrag) {
        onRiserDrag('from', snapLaneX(pos.x, riserSnapTargets, canvasWidth));
      } else if (activeAxis === 'toRiser' && onRiserDrag) {
        onRiserDrag('to', snapLaneX(pos.x, riserSnapTargets, canvasWidth));
      }
    };

    const onUp = (upEvent: Event) => {
      const pointer = upEvent as PointerEvent;
      if (pointer.pointerId !== dragState.current.pointerId) return;

      target.releasePointerCapture(pointer.pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);

      if (!dragState.current.dragging) {
        onSelect?.();
      }
      dragState.current = { dragging: false, pointerId: -1, axis: 'lane' };
    };

    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  };

  const bindPathDrag = (event: React.PointerEvent) => {
    if (!interactive || !canDragRoute) return;
    const svg = (event.currentTarget as Element).closest('svg') as SVGSVGElement | null;
    if (!svg) return;
    const pos = svgPointFromClient(svg, event.clientX, event.clientY);
    const axis = pos ? nearestDragAxis(route, pos.x, pos.y) : 'lane';
    bindRouteDrag(axis)(event);
  };

  if (variant === 'interaction') {
    if (!interactive) return null;

    const nearbyLane = laneSnapTargets.find(
      (lane) => Math.abs(lane - route.laneY) <= LANE_SNAP_THRESHOLD,
    );
    const nearbyFromRiser = riserSnapTargets.find(
      (riser) => Math.abs(riser - route.fromRiserX) <= LANE_SNAP_THRESHOLD,
    );
    const nearbyToRiser = riserSnapTargets.find(
      (riser) => Math.abs(riser - route.toRiserX) <= LANE_SNAP_THRESHOLD,
    );
    const pathCursor = canDragRoute ? 'move' : 'pointer';

    return (
      <g
        className={`connection-interaction${selected ? ' connection--selected' : ''}`}
        data-export-ignore="true"
      >
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth={HIT_STROKE_WIDTH}
          pointerEvents="stroke"
          style={{ cursor: pathCursor }}
          onPointerDown={bindPathDrag}
        />

        {onLaneDrag && (
          <line
            x1={laneSegment.x1}
            y1={laneSegment.y1}
            x2={laneSegment.x2}
            y2={laneSegment.y2}
            stroke="transparent"
            strokeWidth={LANE_HIT_WIDTH}
            strokeLinecap="round"
            pointerEvents="stroke"
            style={{ cursor: 'ns-resize' }}
            onPointerDown={bindRouteDrag('lane')}
          />
        )}

        {onRiserDrag && segmentLength(fromRiserSegment) > 1 && (
          <line
            x1={fromRiserSegment.x1}
            y1={fromRiserSegment.y1}
            x2={fromRiserSegment.x2}
            y2={fromRiserSegment.y2}
            stroke="transparent"
            strokeWidth={RISER_HIT_WIDTH}
            strokeLinecap="round"
            pointerEvents="stroke"
            style={{ cursor: 'ew-resize' }}
            onPointerDown={bindRouteDrag('fromRiser')}
          />
        )}

        {onRiserDrag && segmentLength(toRiserSegment) > 1 && (
          <line
            x1={toRiserSegment.x1}
            y1={toRiserSegment.y1}
            x2={toRiserSegment.x2}
            y2={toRiserSegment.y2}
            stroke="transparent"
            strokeWidth={RISER_HIT_WIDTH}
            strokeLinecap="round"
            pointerEvents="stroke"
            style={{ cursor: 'ew-resize' }}
            onPointerDown={bindRouteDrag('toRiser')}
          />
        )}

        {selected && canDragRoute && (
          <g pointerEvents="none">
            <line
              x1={laneSegment.x1}
              y1={laneSegment.y1}
              x2={laneSegment.x2}
              y2={laneSegment.y2}
              stroke={nearbyLane !== undefined ? '#16a34a' : '#2563eb'}
              strokeWidth={6}
              opacity={0.25}
              strokeLinecap="round"
            />
            <line
              x1={fromRiserSegment.x1}
              y1={fromRiserSegment.y1}
              x2={fromRiserSegment.x2}
              y2={fromRiserSegment.y2}
              stroke={nearbyFromRiser !== undefined ? '#16a34a' : '#2563eb'}
              strokeWidth={6}
              opacity={0.2}
              strokeLinecap="round"
            />
            <line
              x1={toRiserSegment.x1}
              y1={toRiserSegment.y1}
              x2={toRiserSegment.x2}
              y2={toRiserSegment.y2}
              stroke={nearbyToRiser !== undefined ? '#16a34a' : '#2563eb'}
              strokeWidth={6}
              opacity={0.2}
              strokeLinecap="round"
            />
            <circle
              cx={laneMidX}
              cy={laneMidY}
              r={7}
              fill={nearbyLane !== undefined ? '#16a34a' : '#2563eb'}
              stroke="#fff"
              strokeWidth={2}
            />
            <circle
              cx={route.fromRiserX}
              cy={fromMidY}
              r={5}
              fill={nearbyFromRiser !== undefined ? '#16a34a' : '#2563eb'}
              stroke="#fff"
              strokeWidth={1.5}
            />
            <circle
              cx={route.toRiserX}
              cy={toMidY}
              r={5}
              fill={nearbyToRiser !== undefined ? '#16a34a' : '#2563eb'}
              stroke="#fff"
              strokeWidth={1.5}
            />
            {nearbyLane !== undefined && (
              <text
                x={laneMidX}
                y={laneMidY - 14}
                textAnchor="middle"
                fill="#16a34a"
                fontSize={9}
                fontFamily="var(--font-mono)"
              >
                snapped
              </text>
            )}
          </g>
        )}
      </g>
    );
  }

  return (
    <g className={selected ? 'connection--selected' : undefined} pointerEvents="none">
      {type.style === 'thick' && (
        <path
          d={pathD}
          fill="none"
          stroke={stroke}
          strokeWidth={8}
          opacity={0.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {type.style === 'double' ? (
        <>
          <path
            d={pathD}
            fill="none"
            stroke={stroke}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={pathD}
            fill="none"
            stroke="var(--canvas-bg)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <path
          d={pathD}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {type.style === 'vpn' && <circle cx={laneMidX} cy={laneMidY} r={4} fill={stroke} />}

      {label && (
        <text
          x={route.labelPoint.x}
          y={route.labelPoint.y - 8}
          textAnchor="middle"
          className="canvas-connection-label"
          fontSize={10}
          fontFamily="var(--font-mono)"
        >
          {label}
        </text>
      )}
    </g>
  );
}
