import type { DeviceKind } from '../types';

interface DeviceSilhouetteProps {
  kind: DeviceKind;
  width: number;
  height: number;
  color: string;
}

export function DeviceSilhouette({ kind, width, height, color }: DeviceSilhouetteProps) {
  const fill = `${color}18`;
  const stroke = color;

  switch (kind) {
    case 'router':
      return (
        <g opacity={0.9}>
          <rect
            x={width * 0.15}
            y={height * 0.28}
            width={width * 0.7}
            height={height * 0.44}
            rx={4}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <line
            x1={width * 0.35}
            y1={height * 0.28}
            x2={width * 0.3}
            y2={height * 0.1}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <line
            x1={width * 0.65}
            y1={height * 0.28}
            x2={width * 0.7}
            y2={height * 0.1}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <circle cx={width * 0.3} cy={height * 0.1} r={2} fill={stroke} />
          <circle cx={width * 0.7} cy={height * 0.1} r={2} fill={stroke} />
          {[0.25, 0.5, 0.75].map((o) => (
            <rect
              key={o}
              x={width * o - 3}
              y={height * 0.78}
              width={6}
              height={4}
              rx={1}
              fill={stroke}
              opacity={0.6}
            />
          ))}
        </g>
      );
    case 'switch':
      return (
        <g opacity={0.9}>
          <rect
            x={width * 0.08}
            y={height * 0.22}
            width={width * 0.84}
            height={height * 0.56}
            rx={3}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
          {Array.from({ length: 8 }).map((_, i) => (
            <rect
              key={i}
              x={width * (0.14 + i * 0.095)}
              y={height * 0.72}
              width={5}
              height={5}
              rx={1}
              fill={stroke}
              opacity={0.55}
            />
          ))}
          <rect
            x={width * 0.42}
            y={height * 0.32}
            width={width * 0.16}
            height={height * 0.12}
            rx={2}
            fill={stroke}
            opacity={0.2}
          />
        </g>
      );
    case 'server':
      return (
        <g opacity={0.9}>
          <rect
            x={width * 0.1}
            y={height * 0.12}
            width={width * 0.8}
            height={height * 0.76}
            rx={4}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
          {[0.22, 0.42, 0.62].map((y) => (
            <g key={y}>
              <rect
                x={width * 0.16}
                y={height * y}
                width={width * 0.68}
                height={height * 0.14}
                rx={2}
                fill={stroke}
                opacity={0.12}
                stroke={stroke}
                strokeWidth={0.8}
              />
              <circle
                cx={width * 0.2}
                cy={height * (y + 0.07)}
                r={2.5}
                fill="#22c55e"
                opacity={0.8}
              />
              {[0.35, 0.5, 0.65, 0.8].map((x) => (
                <rect
                  key={x}
                  x={width * x}
                  y={height * (y + 0.04)}
                  width={width * 0.08}
                  height={height * 0.06}
                  rx={1}
                  fill={stroke}
                  opacity={0.25}
                />
              ))}
            </g>
          ))}
        </g>
      );
    case 'nas':
      return (
        <g opacity={0.9}>
          <rect
            x={width * 0.08}
            y={height * 0.18}
            width={width * 0.84}
            height={height * 0.64}
            rx={5}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
          {[0.3, 0.46, 0.62].map((y) => (
            <rect
              key={y}
              x={width * 0.14}
              y={height * y}
              width={width * 0.72}
              height={height * 0.1}
              rx={2}
              fill={stroke}
              opacity={0.2}
            />
          ))}
          <circle cx={width * 0.18} cy={height * 0.28} r={2.5} fill="#22c55e" />
        </g>
      );
    case 'vm':
      return (
        <g opacity={0.9}>
          <rect
            x={width * 0.12}
            y={height * 0.2}
            width={width * 0.76}
            height={height * 0.6}
            rx={4}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          <path
            d={`M ${width * 0.35} ${height * 0.38} L ${width * 0.5} ${height * 0.52} L ${width * 0.65} ${height * 0.38}`}
            fill="none"
            stroke={stroke}
            strokeWidth={1.5}
            opacity={0.5}
          />
        </g>
      );
    case 'cloud':
      return (
        <g opacity={0.9}>
          <path
            d={`M ${width * 0.2} ${height * 0.62}
                Q ${width * 0.1} ${height * 0.62} ${width * 0.12} ${height * 0.48}
                Q ${width * 0.14} ${height * 0.3} ${width * 0.32} ${height * 0.32}
                Q ${width * 0.38} ${height * 0.18} ${width * 0.52} ${height * 0.24}
                Q ${width * 0.68} ${height * 0.2} ${width * 0.74} ${height * 0.36}
                Q ${width * 0.9} ${height * 0.38} ${width * 0.86} ${height * 0.56}
                Q ${width * 0.92} ${height * 0.68} ${width * 0.76} ${height * 0.66}
                L ${width * 0.2} ${height * 0.66} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
        </g>
      );
    case 'endpoint':
      return (
        <g opacity={0.9}>
          <rect
            x={width * 0.18}
            y={height * 0.22}
            width={width * 0.64}
            height={height * 0.42}
            rx={3}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <path
            d={`M ${width * 0.28} ${height * 0.64} L ${width * 0.72} ${height * 0.64} L ${width * 0.76} ${height * 0.78} L ${width * 0.24} ${height * 0.78} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <rect
            x={width * 0.42}
            y={height * 0.78}
            width={width * 0.16}
            height={height * 0.06}
            rx={1}
            fill={stroke}
            opacity={0.4}
          />
        </g>
      );
    case 'device':
      return (
        <g opacity={0.9}>
          <rect
            x={width * 0.2}
            y={height * 0.35}
            width={width * 0.6}
            height={height * 0.4}
            rx={4}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <path
            d={`M ${width * 0.5} ${height * 0.18} m -12 0 a 12 12 0 1 1 24 0`}
            fill="none"
            stroke={stroke}
            strokeWidth={1.2}
            opacity={0.5}
          />
          <path
            d={`M ${width * 0.5} ${height * 0.18} m -20 0 a 20 20 0 1 1 40 0`}
            fill="none"
            stroke={stroke}
            strokeWidth={1}
            opacity={0.3}
          />
        </g>
      );
  }
}
