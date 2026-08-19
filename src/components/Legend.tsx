import { useRef } from 'react';

import type { CanvasThemeMode } from '../hooks/useCanvasTheme';
import { BrandIcon, getBrandColor } from '../lib/brand-icons';
import { frameAccentOnCanvas, strokeOnPanel, textOnSolidAccent } from '../lib/canvas-colors';
import { getCanvasThemeTokens } from '../lib/canvas-theme';
import type { ConnectionType, DeviceList, Vlan } from '../types';

interface PanelDragOptions {
  x: number;
  y: number;
  interactive?: boolean;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  onMove?: (x: number, y: number) => void;
  onSelect?: () => void;
}

function usePanelDrag({ x, y, interactive, svgRef, onMove, onSelect }: PanelDragOptions) {
  const dragState = useRef<{ offsetX: number; offsetY: number } | null>(null);

  const startDrag = (event: React.PointerEvent) => {
    if (!interactive || !onMove || !svgRef?.current) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect?.();

    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM()?.inverse();
    if (!matrix) return;
    const svgPoint = point.matrixTransform(matrix);

    dragState.current = {
      offsetX: svgPoint.x - x,
      offsetY: svgPoint.y - y,
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
      onMove(pos.x - dragState.current.offsetX, pos.y - dragState.current.offsetY);
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

  return { startDrag };
}

interface LegendProps {
  vlans: Vlan[];
  connectionTypes: ConnectionType[];
  x: number;
  y: number;
  canvasTheme?: CanvasThemeMode;
  interactive?: boolean;
  selected?: boolean;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  onMove?: (x: number, y: number) => void;
  onSelect?: () => void;
}

export function Legend({
  vlans,
  connectionTypes,
  x,
  y,
  canvasTheme = 'light',
  interactive,
  selected,
  svgRef,
  onMove,
  onSelect,
}: LegendProps) {
  const legendBg = getCanvasThemeTokens(canvasTheme)['--canvas-legend-bg'];
  const width = 240;
  const rowHeight = 22;
  const vlanRows = vlans.length;
  const connRows = connectionTypes.length;
  const height = 36 + vlanRows * rowHeight + 16 + connRows * rowHeight + 12;
  const { startDrag } = usePanelDrag({ x, y, interactive, svgRef, onMove, onSelect });

  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{ cursor: interactive && onMove ? 'grab' : undefined }}
      onPointerDown={startDrag}
    >
      <rect
        width={width}
        height={height}
        rx={10}
        className="canvas-legend-panel"
        strokeWidth={selected ? 2.5 : 1.5}
        stroke={selected ? '#2563eb' : undefined}
        filter="url(#card-shadow)"
      />
      <text
        x={14}
        y={24}
        className="canvas-legend-heading"
        fontSize={13}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        pointerEvents="none"
      >
        VLANs
      </text>

      {vlans.map((vlan, index) => (
        <g
          key={vlan.id}
          transform={`translate(14, ${36 + index * rowHeight})`}
          pointerEvents="none"
        >
          <rect width={14} height={14} rx={3} fill={vlan.color} />
          <text
            x={22}
            y={12}
            className="canvas-legend-text"
            fontSize={11}
            fontFamily="var(--font-sans)"
          >
            {vlan.name}
            {vlan.subnet ? ` · ${vlan.subnet}` : ''}
          </text>
        </g>
      ))}

      <text
        x={14}
        y={36 + vlanRows * rowHeight + 14}
        className="canvas-legend-heading"
        fontSize={13}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        pointerEvents="none"
      >
        Connections
      </text>

      {connectionTypes.map((type, index) => {
        const lineY = 36 + vlanRows * rowHeight + 28 + index * rowHeight + 6;
        return (
          <g key={type.id} transform={`translate(14, 0)`} pointerEvents="none">
            <MiniConnectionPreview type={type} y={lineY} legendBg={legendBg} />
            <text
              x={52}
              y={lineY + 4}
              className="canvas-legend-text"
              fontSize={11}
              fontFamily="var(--font-sans)"
            >
              {type.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function MiniConnectionPreview({
  type,
  y,
  legendBg,
}: {
  type: ConnectionType;
  y: number;
  legendBg: string;
}) {
  const stroke = strokeOnPanel(type.color ?? '#1e293b', legendBg);
  const x1 = 0;
  const x2 = 36;

  if (type.style === 'dashed') {
    return (
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={stroke} strokeWidth={2} strokeDasharray="6 4" />
    );
  }
  if (type.style === 'double') {
    return (
      <g>
        <line x1={x1} y1={y - 3} x2={x2} y2={y - 3} stroke={stroke} strokeWidth={2} />
        <line x1={x1} y1={y + 3} x2={x2} y2={y + 3} stroke={stroke} strokeWidth={2} />
      </g>
    );
  }
  if (type.style === 'thick') {
    return (
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={stroke} strokeWidth={5} strokeLinecap="round" />
    );
  }
  if (type.style === 'vpn') {
    return (
      <g>
        <line
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          stroke={stroke}
          strokeWidth={2.5}
          strokeDasharray="6 4"
        />
        <circle cx={18} cy={y} r={3.5} fill={stroke} />
      </g>
    );
  }
  return <line x1={x1} y1={y} x2={x2} y2={y} stroke={stroke} strokeWidth={2} />;
}

interface DeviceListPanelProps {
  list: DeviceList;
  vlan?: Vlan;
  canvasTheme?: CanvasThemeMode;
  interactive?: boolean;
  selected?: boolean;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  onMove?: (x: number, y: number) => void;
  onSelect?: () => void;
}

export function DeviceListPanel({
  list,
  vlan,
  canvasTheme = 'light',
  interactive,
  selected,
  svgRef,
  onMove,
  onSelect,
}: DeviceListPanelProps) {
  const width = list.width ?? 200;
  const rowHeight = 28;
  const headerHeight = 32;
  const height = headerHeight + list.devices.length * rowHeight + 8;
  const accentColor = vlan?.color ?? '#c084fc';
  const frameColor = frameAccentOnCanvas(accentColor, canvasTheme);
  const headerText = textOnSolidAccent(accentColor);
  const { startDrag } = usePanelDrag({
    x: list.x,
    y: list.y,
    interactive,
    svgRef,
    onMove,
    onSelect,
  });

  return (
    <g
      transform={`translate(${list.x}, ${list.y})`}
      style={{ cursor: interactive && onMove ? 'grab' : undefined }}
      onPointerDown={startDrag}
    >
      <rect
        width={width}
        height={height}
        rx={10}
        className="canvas-surface-fill"
        stroke={selected ? '#2563eb' : frameColor}
        strokeWidth={selected ? 2.5 : 2}
        filter="url(#card-shadow)"
      />
      <rect width={width} height={headerHeight} rx={10} fill={accentColor} pointerEvents="none" />
      <rect y={16} width={width} height={16} fill={accentColor} pointerEvents="none" />
      <text
        x={12}
        y={21}
        fill={headerText}
        fontSize={12}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        pointerEvents="none"
      >
        {list.title}
      </text>

      <g className="canvas-surface" pointerEvents="none">
        {list.devices.map((device, index) => {
          const color = getBrandColor(device.icon) ?? '#64748b';
          const rowY = headerHeight + 6 + index * rowHeight;

          return (
            <g key={device.name} transform={`translate(12, ${rowY})`}>
              {device.icon ? (
                <foreignObject width={18} height={18}>
                  <BrandIcon slug={device.icon} color={color} size={16} />
                </foreignObject>
              ) : (
                <circle cx={8} cy={8} r={5} fill={accentColor} opacity={0.5} />
              )}
              <text
                x={26}
                y={13}
                className="canvas-legend-text"
                fontSize={11}
                fontFamily="var(--font-sans)"
              >
                {device.name}
              </text>
            </g>
          );
        })}
      </g>
    </g>
  );
}
