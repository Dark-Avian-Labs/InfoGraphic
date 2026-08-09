import type {
  DeviceKind,
  InfographicDocument,
  InfographicNode,
  NetworkPort,
  PortBank,
  PortBankSide,
} from '../types';
import { getNodeSize } from '../types';
import { DEVICE_GRID, snapToDeviceGrid } from './grid';

export const PORT_CELL_W = 18;
export const PORT_CELL_H = 14;
export const PORT_GAP = 10;
export const PORT_STUB = 14;

export const PORT_BANK_PRESETS: { label: string; rows: 1 | 2; columns: number }[] = [
  { label: '1×8', rows: 1, columns: 8 },
  { label: '1×12', rows: 1, columns: 12 },
  { label: '1×16', rows: 1, columns: 16 },
  { label: '2×8', rows: 2, columns: 8 },
  { label: '2×12', rows: 2, columns: 12 },
  { label: '2×16', rows: 2, columns: 16 },
];

export function bankDimensions(rows: number, columns: number) {
  return {
    width: columns * PORT_CELL_W + (columns - 1) * PORT_GAP,
    height: rows * PORT_CELL_H + (rows - 1) * PORT_GAP,
  };
}

export function getPortBank(node: InfographicNode, side: PortBankSide): PortBank | undefined {
  return node.portBanks?.find((b) => b.side === side);
}

export function ensurePortBank(
  node: InfographicNode,
  side: PortBankSide,
  rows: 1 | 2,
  columns: number,
) {
  const banks = [...(node.portBanks ?? [])];
  const index = banks.findIndex((b) => b.side === side);
  const bank: PortBank = { side, rows, columns };
  if (index >= 0) banks[index] = bank;
  else banks.push(bank);
  return bank;
}

export function generatePortBank(
  nodeId: string,
  side: PortBankSide,
  rows: 1 | 2,
  columns: number,
): NetworkPort[] {
  const ports: NetworkPort[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const num = row * columns + col + 1;
      ports.push({
        id: `${nodeId}-${side}-r${row}-c${col}`,
        label: String(num),
        side,
        row,
        col,
      });
    }
  }
  return ports;
}

export function setPortBankOnNode(
  node: InfographicNode,
  side: PortBankSide,
  rows: 1 | 2,
  columns: number,
): InfographicNode {
  ensurePortBank(node, side, rows, columns);
  const banks = [...(node.portBanks ?? [])];
  const index = banks.findIndex((b) => b.side === side);
  banks[index >= 0 ? index : banks.length] = { side, rows, columns };

  const newPorts = generatePortBank(node.id, side, rows, columns);
  const otherPorts = node.ports.filter((p) => p.side !== side);

  const bankW = bankDimensions(rows, columns).width;
  const minWidth = snapToDeviceGrid(bankW + DEVICE_GRID / 2);

  return {
    ...node,
    portBanks: banks,
    ports: [...otherPorts, ...newPorts],
    width: Math.max(getNodeSize(node).width, minWidth),
  };
}

/** Smallest grid-aligned size that fits port banks and basic card content */
export function minNodeDimensions(node: InfographicNode): { width: number; height: number } {
  const minHeight = DEVICE_GRID * 2;
  let minWidth = DEVICE_GRID * 3;

  const banks = node.portBanks?.length ? node.portBanks : inferBanksFromPorts(node.ports);

  for (const bank of banks) {
    const { width: bankW } = bankDimensions(bank.rows, bank.columns);
    minWidth = Math.max(minWidth, snapToDeviceGrid(bankW + DEVICE_GRID / 2));
  }

  return { width: minWidth, height: minHeight };
}

export function snapNodeDimensions(node: InfographicNode): InfographicNode {
  const min = minNodeDimensions(node);
  const size = getNodeSize(node);
  return {
    ...node,
    width: Math.max(min.width, snapToDeviceGrid(size.width)),
    height: Math.max(min.height, snapToDeviceGrid(size.height)),
  };
}

export function defaultPortsForKind(nodeId: string, kind: DeviceKind): NetworkPort[] {
  switch (kind) {
    case 'switch':
      return generatePortBank(nodeId, 'bottom', 2, 8);
    case 'router':
      return [
        ...generatePortBank(nodeId, 'top', 1, 2).map((p, i) => ({
          ...p,
          id: `${nodeId}-wan-${i}`,
          label: i === 0 ? 'WAN' : 'WAN2',
        })),
        ...generatePortBank(nodeId, 'bottom', 1, 4).map((p) => ({
          ...p,
          label: `LAN ${p.col + 1}`,
        })),
      ];
    case 'server':
      return generatePortBank(nodeId, 'bottom', 1, 2).map((p, i) => ({
        ...p,
        label: `eth${i}`,
      }));
    case 'nas':
      return generatePortBank(nodeId, 'bottom', 1, 2).map((p, i) => ({
        ...p,
        label: `eth${i}`,
      }));
    case 'vm':
      return generatePortBank(nodeId, 'bottom', 1, 1).map((p) => ({ ...p, label: 'net' }));
    case 'cloud':
      return generatePortBank(nodeId, 'bottom', 1, 1).map((p) => ({ ...p, label: 'WAN' }));
    case 'endpoint':
      return generatePortBank(nodeId, 'bottom', 1, 1).map((p) => ({ ...p, label: 'eth' }));
    case 'device':
      return generatePortBank(nodeId, 'top', 1, 1).map((p) => ({ ...p, label: 'wifi' }));
  }
}

export function defaultPortBanksForKind(kind: DeviceKind): PortBank[] {
  switch (kind) {
    case 'switch':
      return [{ side: 'bottom', rows: 2, columns: 8 }];
    case 'router':
      return [
        { side: 'top', rows: 1, columns: 2 },
        { side: 'bottom', rows: 1, columns: 4 },
      ];
    case 'server':
    case 'nas':
      return [{ side: 'bottom', rows: 1, columns: 2 }];
    case 'vm':
    case 'cloud':
    case 'endpoint':
      return [{ side: 'bottom', rows: 1, columns: 1 }];
    case 'device':
      return [{ side: 'top', rows: 1, columns: 1 }];
  }
}

export function migratePort(port: NetworkPort): NetworkPort {
  if (
    port.row !== undefined &&
    port.col !== undefined &&
    (port.side === 'top' || port.side === 'bottom')
  ) {
    return port;
  }

  const legacySide = port.side as string;
  const side: PortBankSide =
    legacySide === 'top' || legacySide === 'bottom' ? legacySide : 'bottom';

  const col = port.col ?? Math.min(15, Math.round((port.offset ?? 0.5) * 8));
  const row = port.row ?? 0;

  return {
    id: port.id,
    label: port.label,
    side,
    row,
    col,
  };
}

export function migrateNodePorts(node: InfographicNode): InfographicNode {
  const ports = node.ports.map((p) => migratePort(p));
  const portBanks = node.portBanks?.length ? node.portBanks : inferBanksFromPorts(ports);
  return { ...node, ports, portBanks };
}

function inferBanksFromPorts(ports: NetworkPort[]): PortBank[] {
  const banks: PortBank[] = [];
  for (const side of ['top', 'bottom'] as PortBankSide[]) {
    const onSide = ports.filter((p) => p.side === side);
    if (onSide.length === 0) continue;
    const maxRow = Math.max(...onSide.map((p) => p.row ?? 0));
    const maxCol = Math.max(...onSide.map((p) => p.col ?? 0));
    banks.push({ side, rows: (maxRow >= 1 ? 2 : 1) as 1 | 2, columns: maxCol + 1 });
  }
  return banks;
}

export function getPortPosition(node: InfographicNode, port: NetworkPort) {
  const { width } = getNodeSize(node);
  const bank = getPortBank(node, port.side) ?? {
    side: port.side,
    rows: 1 as const,
    columns: Math.max(
      ...node.ports.filter((p) => p.side === port.side).map((p) => (p.col ?? 0) + 1),
      1,
    ),
  };

  const rows = bank.rows;
  const cols = bank.columns;
  const { width: bankW } = bankDimensions(rows, cols);

  const col = port.col ?? 0;
  const row = port.row ?? 0;

  const startX = node.x + (width - bankW) / 2;
  const localX = startX + col * (PORT_CELL_W + PORT_GAP) + PORT_CELL_W / 2 - node.x;

  const rowOffset = row * (PORT_CELL_H + PORT_GAP) + PORT_CELL_H / 2;

  if (port.side === 'bottom') {
    const baseY = node.y + getNodeSize(node).height;
    return { x: node.x + localX, y: baseY + rowOffset + 2 };
  }

  const baseY = node.y;
  return { x: node.x + localX, y: baseY - rowOffset - 2 };
}

export function getPortEgressVector(port: NetworkPort): { dx: number; dy: number } {
  return port.side === 'bottom' ? { dx: 0, dy: 1 } : { dx: 0, dy: -1 };
}

export function findPort(doc: InfographicDocument, portId: string) {
  for (const node of doc.nodes) {
    const port = node.ports.find((p) => p.id === portId);
    if (port) return { node, port };
  }
  return null;
}

export function portMap(doc: InfographicDocument) {
  const map = new Map<string, { node: InfographicNode; port: NetworkPort }>();
  for (const node of doc.nodes) {
    for (const port of node.ports) {
      map.set(port.id, { node, port });
    }
  }
  return map;
}

export function portBankExtraHeight(node: InfographicNode): { top: number; bottom: number } {
  let top = 0;
  let bottom = 0;
  for (const bank of node.portBanks ?? []) {
    const { height } = bankDimensions(bank.rows, bank.columns);
    if (bank.side === 'top') top = Math.max(top, height + 4);
    else bottom = Math.max(bottom, height + 4);
  }
  if (!node.portBanks?.length) {
    const hasTop = node.ports.some((p) => p.side === 'top');
    const hasBottom = node.ports.some((p) => p.side === 'bottom');
    if (hasTop) top = PORT_CELL_H + 4;
    if (hasBottom) bottom = PORT_CELL_H + 4;
  }
  return { top, bottom };
}
