import type { CanvasThemeMode } from '../hooks/useCanvasTheme';
import {
  frameAccentOnCanvas,
  textOnSolidAccent,
  textOnTintedCanvasArea,
} from '../lib/canvas-colors';
import { getGroupColor } from '../lib/groups';
import type { InfographicGroup, Vlan } from '../types';

interface GroupBoxProps {
  group: InfographicGroup;
  vlan?: Vlan;
  canvasTheme?: CanvasThemeMode;
}

export function GroupBox({ group, vlan, canvasTheme = 'light' }: GroupBoxProps) {
  const accentColor = getGroupColor(group, vlan);
  const frameColor = frameAccentOnCanvas(accentColor, canvasTheme);
  const headerText = textOnSolidAccent(accentColor);
  const subtitleText = textOnTintedCanvasArea(accentColor, canvasTheme);

  return (
    <g pointerEvents="none">
      <rect
        x={group.x}
        y={group.y}
        width={group.width}
        height={group.height}
        rx={10}
        fill={`${accentColor}12`}
        stroke={frameColor}
        strokeWidth={2}
        strokeDasharray={group.dashed ? '10 6' : undefined}
      />
      <rect x={group.x} y={group.y} width={group.width} height={28} rx={10} fill={accentColor} />
      <rect x={group.x} y={group.y + 14} width={group.width} height={14} fill={accentColor} />
      <text
        x={group.x + 12}
        y={group.y + 19}
        fill={headerText}
        fontSize={13}
        fontWeight={600}
        fontFamily="var(--font-sans)"
      >
        {truncate(group.label, 28)}
      </text>
      {group.subtitle && (
        <text
          x={group.x + 12}
          y={group.y + 44}
          fill={subtitleText}
          fontSize={11}
          fontFamily="var(--font-mono)"
        >
          {truncate(group.subtitle, 36)}
        </text>
      )}
    </g>
  );
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
