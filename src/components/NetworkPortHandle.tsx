import type { CanvasThemeMode } from '../hooks/useCanvasTheme';
import { wiredPortLabelOnSurface } from '../lib/canvas-colors';
import { getSurfaceTextColors } from '../lib/canvas-theme';
import { SURFACE_FILL } from '../lib/canvas-theme';
import { ensureGraphicalContrast } from '../lib/color-contrast';
import { PORT_CELL_H, PORT_CELL_W, getPortPosition } from '../lib/ports';
import type { InfographicNode, NetworkPort } from '../types';
import { NetworkPortIcon } from './NetworkPortIcon';

export const PORT_LABEL_OFFSET = 12;

/** Y offset for port label text relative to the port icon center (inward toward device body) */
export function getPortLabelLocalY(port: NetworkPort) {
  return port.side === 'bottom'
    ? -(PORT_CELL_H / 2 + PORT_LABEL_OFFSET)
    : PORT_CELL_H / 2 + PORT_LABEL_OFFSET;
}

export function getPortHandleLocalPosition(node: InfographicNode, port: NetworkPort) {
  const { x, y } = getPortPosition(node, port);
  return { localX: x - node.x, localY: y - node.y };
}

interface NetworkPortHandleProps {
  node: InfographicNode;
  port: NetworkPort;
  color: string;
  wireColor?: string;
  interactive?: boolean;
  selected?: boolean;
  pending?: boolean;
  onClick?: (portId: string) => void;
  /** When false, only the jack icon is drawn (labels rendered in a separate layer) */
  showLabel?: boolean;
}

export function NetworkPortHandle({
  node,
  port,
  color,
  wireColor,
  interactive,
  selected: _selected,
  pending,
  onClick,
  showLabel = false,
}: NetworkPortHandleProps) {
  const { localX, localY } = getPortHandleLocalPosition(node, port);
  const stroke = pending
    ? ensureGraphicalContrast(color, SURFACE_FILL)
    : wireColor
      ? ensureGraphicalContrast(wireColor, SURFACE_FILL)
      : 'var(--canvas-port-idle)';
  const fill = pending ? `${color}22` : '#ffffff';

  return (
    <g
      transform={`translate(${localX}, ${localY})`}
      style={{ cursor: interactive ? 'crosshair' : 'default' }}
      onClick={(event) => {
        if (!interactive) return;
        event.stopPropagation();
        onClick?.(port.id);
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <rect
        x={-PORT_CELL_W / 2 - 3}
        y={-PORT_CELL_H / 2 - 3}
        width={PORT_CELL_W + 6}
        height={PORT_CELL_H + 6}
        fill="transparent"
        pointerEvents={interactive ? 'all' : 'none'}
      />
      <NetworkPortIcon size={PORT_CELL_W} fill={fill} stroke={stroke} />
      {showLabel && (
        <text
          y={getPortLabelLocalY(port)}
          textAnchor="middle"
          className="canvas-port-label"
          fontSize={8}
          fontFamily="var(--font-mono)"
          pointerEvents="none"
        >
          {port.label}
        </text>
      )}
    </g>
  );
}

interface NetworkPortLabelProps {
  node: InfographicNode;
  port: NetworkPort;
  wireColor?: string;
  canvasTheme?: CanvasThemeMode;
  highlight?: boolean;
}

/** Port labels drawn inward on the device surface */
export function NetworkPortLabel({
  node,
  port,
  wireColor,
  canvasTheme = 'light',
  highlight,
}: NetworkPortLabelProps) {
  const { localX, localY } = getPortHandleLocalPosition(node, port);
  const surfaceText = getSurfaceTextColors(canvasTheme);
  // Always use surface text (readable on white cards); selection only boosts weight.
  const fill = wireColor ? wiredPortLabelOnSurface(wireColor) : surfaceText.secondary;

  return (
    <text
      x={localX}
      y={localY + getPortLabelLocalY(port)}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={fill}
      fontSize={8}
      fontWeight={highlight ? 600 : 500}
      fontFamily="var(--font-mono)"
      pointerEvents="none"
    >
      {port.label}
    </text>
  );
}
