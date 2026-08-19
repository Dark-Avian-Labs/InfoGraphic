import { useRef } from 'react';

import type { CanvasThemeMode } from '../hooks/useCanvasTheme';
import { BrandIcon, getBrandColor } from '../lib/brand-icons';
import { frameAccentOnCanvas } from '../lib/canvas-colors';
import { getSurfaceTextColors } from '../lib/canvas-theme';
import type { InfographicNode, Vlan } from '../types';
import { getNodeSize } from '../types';
import { DeviceSilhouette } from './DeviceSilhouette';
import { NetworkPortHandle, NetworkPortLabel } from './NetworkPortHandle';

interface NodeCardProps {
  node: InfographicNode;
  vlan?: Vlan;
  selected?: boolean;
  interactive?: boolean;
  connectMode?: boolean;
  pendingPortId?: string | null;
  hoverPortId?: string | null;
  portWireColors?: Map<string, string>;
  canvasTheme?: CanvasThemeMode;
  onSelect?: (nodeId: string) => void;
  onMove?: (nodeId: string, x: number, y: number) => void;
  onResize?: (nodeId: string, width: number, height: number) => void;
  onPortClick?: (portId: string) => void;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

const kindAccent: Record<InfographicNode['kind'], string> = {
  router: '#0ea5e9',
  switch: '#6366f1',
  server: '#3b82f6',
  nas: '#14b8a6',
  vm: '#8b5cf6',
  cloud: '#38bdf8',
  device: '#a855f7',
  endpoint: '#22c55e',
};

const TEXT_INSET_X = 12;
const CONTENT_TOP = 28;

export function NodeCard({
  node,
  vlan,
  selected,
  interactive,
  connectMode,
  pendingPortId,
  hoverPortId,
  portWireColors,
  canvasTheme = 'light',
  onSelect,
  onMove,
  onResize,
  onPortClick,
  svgRef,
}: NodeCardProps) {
  const { width, height } = getNodeSize(node);
  const accentColor = vlan?.color ?? kindAccent[node.kind];
  const frameColor = frameAccentOnCanvas(accentColor, canvasTheme);
  const surfaceText = getSurfaceTextColors(canvasTheme);
  const brandColor = getBrandColor(node.brandIcon) ?? accentColor;
  const dragState = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const resizeState = useRef<{
    startWidth: number;
    startHeight: number;
    originX: number;
    originY: number;
  } | null>(null);

  const clientToSvg = (clientX: number, clientY: number) => {
    if (!svgRef?.current) return null;
    const point = svgRef.current.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = svgRef.current.getScreenCTM()?.inverse();
    if (!matrix) return null;
    return point.matrixTransform(matrix);
  };

  const startDrag = (event: React.PointerEvent) => {
    if (!interactive || connectMode || !onMove || !svgRef?.current) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect?.(node.id);

    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM()?.inverse();
    if (!matrix) return;
    const svgPoint = point.matrixTransform(matrix);

    dragState.current = {
      offsetX: svgPoint.x - node.x,
      offsetY: svgPoint.y - node.y,
    };

    const target = event.currentTarget as Element;
    target.setPointerCapture(event.pointerId);

    const onPointerMove = (moveEvent: Event) => {
      if (!dragState.current || !svgRef.current) return;
      const pointer = moveEvent as PointerEvent;
      const pt = svgRef.current.createSVGPoint();
      pt.x = pointer.clientX;
      pt.y = pointer.clientY;
      const inv = svgRef.current.getScreenCTM()?.inverse();
      if (!inv) return;
      const pos = pt.matrixTransform(inv);
      onMove(node.id, pos.x - dragState.current.offsetX, pos.y - dragState.current.offsetY);
    };

    const onPointerUp = () => {
      dragState.current = null;
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
      target.removeEventListener('pointercancel', onPointerUp);
    };

    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
    target.addEventListener('pointercancel', onPointerUp);
  };

  const startResize = (event: React.PointerEvent) => {
    if (!interactive || connectMode || !onResize) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect?.(node.id);

    const origin = clientToSvg(event.clientX, event.clientY);
    if (!origin) return;

    resizeState.current = {
      startWidth: width,
      startHeight: height,
      originX: origin.x,
      originY: origin.y,
    };

    const target = event.currentTarget as Element;
    target.setPointerCapture(event.pointerId);

    const onPointerMove = (moveEvent: Event) => {
      if (!resizeState.current) return;
      const pointer = moveEvent as PointerEvent;
      const pos = clientToSvg(pointer.clientX, pointer.clientY);
      if (!pos) return;
      const deltaX = pos.x - resizeState.current.originX;
      const deltaY = pos.y - resizeState.current.originY;
      onResize(
        node.id,
        resizeState.current.startWidth + deltaX,
        resizeState.current.startHeight + deltaY,
      );
    };

    const onPointerUp = () => {
      resizeState.current = null;
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
      target.removeEventListener('pointercancel', onPointerUp);
    };

    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
    target.addEventListener('pointercancel', onPointerUp);
  };

  const showResizeHandle = interactive && selected && !connectMode && onResize;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      style={{ cursor: interactive && !connectMode ? 'grab' : 'default' }}
      onPointerDown={startDrag}
      onClick={(event) => {
        if (!interactive) return;
        event.stopPropagation();
        onSelect?.(node.id);
      }}
    >
      <rect
        width={width}
        height={height}
        rx={8}
        className="canvas-surface-fill"
        stroke={selected ? '#2563eb' : frameColor}
        strokeWidth={selected ? 2.5 : 2}
        filter="url(#card-shadow)"
      />
      <rect width={width} height={4} rx={8} fill={accentColor} />
      <rect y={2} width={width} height={2} fill={accentColor} />

      <DeviceSilhouette kind={node.kind} width={width} height={height} color={accentColor} />

      <rect
        x={width - 56}
        y={CONTENT_TOP - 2}
        width={48}
        height={height - CONTENT_TOP - 6}
        className="canvas-surface-fill"
        opacity={0.82}
        rx={4}
      />

      {node.brandIcon && (
        <foreignObject x={width - 46} y={CONTENT_TOP} width={24} height={24}>
          <BrandIcon slug={node.brandIcon} color={brandColor} size={22} />
        </foreignObject>
      )}

      <g pointerEvents="none">
        <text
          x={TEXT_INSET_X}
          y={CONTENT_TOP + 8}
          fill={surfaceText.label}
          fontSize={13}
          fontWeight={600}
          fontFamily="var(--font-sans)"
        >
          {truncate(node.label, 18)}
        </text>

        {node.subtitle && (
          <text
            x={TEXT_INSET_X}
            y={CONTENT_TOP + 24}
            fill={surfaceText.muted}
            fontSize={10}
            fontFamily="var(--font-sans)"
          >
            {truncate(node.subtitle, 22)}
          </text>
        )}

        {node.ip && (
          <text
            x={TEXT_INSET_X}
            y={node.subtitle ? CONTENT_TOP + 40 : CONTENT_TOP + 28}
            fill={surfaceText.secondary}
            fontSize={10}
            fontFamily="var(--font-mono)"
          >
            {node.ip}
          </text>
        )}
      </g>

      {node.storage && (
        <text
          x={width - 12}
          y={height - 12}
          textAnchor="end"
          fill={accentColor}
          fontSize={16}
          fontWeight={700}
          fontFamily="var(--font-mono)"
          pointerEvents="none"
        >
          {node.storage}
        </text>
      )}

      {node.ports.map((port) => (
        <NetworkPortHandle
          key={port.id}
          node={node}
          port={port}
          color={accentColor}
          wireColor={portWireColors?.get(port.id)}
          interactive={interactive}
          pending={pendingPortId === port.id || hoverPortId === port.id}
          selected={selected}
          onClick={onPortClick}
        />
      ))}

      <g className="node-port-labels" pointerEvents="none">
        {node.ports.map((port) => (
          <NetworkPortLabel
            key={`label-${port.id}`}
            node={node}
            port={port}
            wireColor={portWireColors?.get(port.id)}
            canvasTheme={canvasTheme}
            highlight={
              connectMode ||
              pendingPortId === port.id ||
              hoverPortId === port.id ||
              (selected && interactive)
            }
          />
        ))}
      </g>

      {showResizeHandle && (
        <g className="node-resize-handle" onPointerDown={startResize}>
          <rect
            x={width - 6}
            y={height - 6}
            width={12}
            height={12}
            fill="#2563eb"
            stroke="#ffffff"
            strokeWidth={1.5}
            rx={2}
            style={{ cursor: 'nwse-resize' }}
          />
        </g>
      )}
    </g>
  );
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
