interface NetworkPortIconProps {
  size?: number;
  fill?: string;
  stroke?: string;
}

/** RJ45 jack silhouette inside a rounded square */
export function NetworkPortIcon({
  size = 14,
  fill = '#f1f5f9',
  stroke = '#64748b',
}: NetworkPortIconProps) {
  const w = size;
  const h = size * 0.85;
  const r = size * 0.18;

  return (
    <g>
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.2}
      />
      {/* Jack opening */}
      <rect
        x={-w * 0.28}
        y={-h * 0.12}
        width={w * 0.56}
        height={h * 0.38}
        rx={1}
        fill={stroke}
        opacity={0.25}
      />
      {/* Clip tab */}
      <path
        d={`M ${-w * 0.1} ${-h * 0.12} L 0 ${-h * 0.32} L ${w * 0.1} ${-h * 0.12} Z`}
        fill={stroke}
        opacity={0.35}
      />
      {/* Contact pins */}
      {[-0.18, -0.09, 0, 0.09, 0.18].map((ox) => (
        <rect
          key={ox}
          x={w * ox - 0.6}
          y={h * 0.08}
          width={1.2}
          height={h * 0.18}
          rx={0.3}
          fill={stroke}
          opacity={0.5}
        />
      ))}
    </g>
  );
}
