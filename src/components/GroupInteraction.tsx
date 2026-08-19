import { useRef } from 'react';

import type { InfographicGroup } from '../types';

interface GroupPointerHandlerOptions {
  group: InfographicGroup;
  interactive?: boolean;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  onSelect?: (groupId: string) => void;
  onMove?: (groupId: string, x: number, y: number) => void;
}

function useGroupPointerHandlers({
  group,
  interactive,
  svgRef,
  onSelect,
  onMove,
}: GroupPointerHandlerOptions) {
  const dragState = useRef<{ offsetX: number; offsetY: number } | null>(null);

  const clientToSvg = (clientX: number, clientY: number) => {
    if (!svgRef?.current) return null;
    const point = svgRef.current.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = svgRef.current.getScreenCTM()?.inverse();
    if (!matrix) return null;
    return point.matrixTransform(matrix);
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if (!interactive || !onMove) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect?.(group.id);

    const origin = clientToSvg(event.clientX, event.clientY);
    if (!origin) return;

    dragState.current = {
      offsetX: origin.x - group.x,
      offsetY: origin.y - group.y,
    };

    const target = event.currentTarget as Element;
    target.setPointerCapture(event.pointerId);

    const onPointerMove = (moveEvent: Event) => {
      if (!dragState.current) return;
      const pointer = moveEvent as PointerEvent;
      const pos = clientToSvg(pointer.clientX, pointer.clientY);
      if (!pos) return;
      onMove(group.id, pos.x - dragState.current.offsetX, pos.y - dragState.current.offsetY);
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

  const handleClick = (event: React.MouseEvent) => {
    if (!interactive) return;
    event.stopPropagation();
    onSelect?.(group.id);
  };

  return { handlePointerDown, handleClick };
}

interface GroupSelectLayerProps {
  group: InfographicGroup;
  interactive?: boolean;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  onSelect?: (groupId: string) => void;
  onMove?: (groupId: string, x: number, y: number) => void;
}

export function GroupSelectLayer(props: GroupSelectLayerProps) {
  const { handlePointerDown, handleClick } = useGroupPointerHandlers(props);
  const { group, interactive } = props;

  if (!interactive) return null;

  return (
    <rect
      data-export-ignore="true"
      x={group.x}
      y={group.y}
      width={group.width}
      height={group.height}
      rx={10}
      fill="transparent"
      style={{ cursor: 'grab' }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    />
  );
}

interface GroupOverlayProps {
  group: InfographicGroup;
  selected?: boolean;
  interactive?: boolean;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  onSelect?: (groupId: string) => void;
  onMove?: (groupId: string, x: number, y: number) => void;
  onResize?: (groupId: string, width: number, height: number) => void;
}

const HEADER_HEIGHT = 28;
const BORDER_HIT = 10;

export function GroupOverlay({
  group,
  selected,
  interactive,
  svgRef,
  onSelect,
  onMove,
  onResize,
}: GroupOverlayProps) {
  const { handlePointerDown, handleClick } = useGroupPointerHandlers({
    group,
    interactive,
    svgRef,
    onSelect,
    onMove,
  });

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

  const startResize = (event: React.PointerEvent) => {
    if (!interactive || !onResize) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect?.(group.id);

    const origin = clientToSvg(event.clientX, event.clientY);
    if (!origin) return;

    resizeState.current = {
      startWidth: group.width,
      startHeight: group.height,
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
        group.id,
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

  if (!interactive) return null;

  return (
    <g className="group-overlay" data-export-ignore="true">
      {selected && (
        <rect
          x={group.x}
          y={group.y}
          width={group.width}
          height={group.height}
          rx={10}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2.5}
          pointerEvents="none"
        />
      )}

      <rect
        x={group.x}
        y={group.y}
        width={group.width}
        height={HEADER_HEIGHT}
        rx={10}
        fill="transparent"
        style={{ cursor: 'grab' }}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      />

      <rect
        x={group.x}
        y={group.y}
        width={group.width}
        height={group.height}
        rx={10}
        fill="transparent"
        stroke="transparent"
        strokeWidth={BORDER_HIT}
        pointerEvents="stroke"
        style={{ cursor: 'grab' }}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      />

      {selected && onResize && (
        <g className="group-resize-handle" onPointerDown={startResize}>
          <rect
            x={group.x + group.width - 6}
            y={group.y + group.height - 6}
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
