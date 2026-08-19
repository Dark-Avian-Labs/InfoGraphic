export type PortBankSide = 'top' | 'bottom';

export type DeviceKind =
  | 'router'
  | 'switch'
  | 'server'
  | 'nas'
  | 'vm'
  | 'cloud'
  | 'device'
  | 'endpoint';

export interface Vlan {
  id: string;
  name: string;
  color: string;
  subnet?: string;
}

export interface ConnectionType {
  id: string;
  label: string;
  style: 'solid' | 'dashed' | 'double' | 'thick' | 'vpn';
  color?: string;
}

export interface ServiceBadge {
  icon: string;
  name: string;
}

export interface PortBank {
  side: PortBankSide;
  rows: 1 | 2;
  columns: number;
}

export interface NetworkPort {
  id: string;
  label: string;
  side: PortBankSide;
  row: number;
  col: number;
}

export interface InfographicNode {
  id: string;
  label: string;
  kind: DeviceKind;
  x: number;
  y: number;
  width?: number;
  height?: number;
  vlanId?: string;
  groupId?: string;
  ip?: string;
  subtitle?: string;
  specs?: string[];
  services?: ServiceBadge[];
  brandIcon?: string;
  storage?: string;
  portBanks?: PortBank[];
  ports: NetworkPort[];
}

export interface InfographicGroup {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vlanId?: string;
  color?: string;
  dashed?: boolean;
  subtitle?: string;
}

export interface InfographicConnection {
  id: string;
  fromPortId: string;
  toPortId: string;
  typeId: string;
  label?: string;
  color?: string;
  lane?: number;
  fromRiserOffset?: number;
  toRiserOffset?: number;
}

export interface DeviceListEntry {
  icon?: string;
  name: string;
}

export interface DeviceList {
  id: string;
  title: string;
  x: number;
  y: number;
  width?: number;
  vlanId?: string;
  devices: DeviceListEntry[];
}

export interface LegendPosition {
  x: number;
  y: number;
}

export interface InfographicDocument {
  title: string;
  width: number;
  height: number;
  vlans: Vlan[];
  connectionTypes: ConnectionType[];
  groups: InfographicGroup[];
  nodes: InfographicNode[];
  connections: InfographicConnection[];
  deviceLists?: DeviceList[];
  legend?: LegendPosition;
}

export const DEFAULT_NODE_SIZE = { width: 160, height: 80 } as const;

export function getNodeSize(node: InfographicNode) {
  return {
    width: node.width ?? DEFAULT_NODE_SIZE.width,
    height: node.height ?? DEFAULT_NODE_SIZE.height,
  };
}

export function vlanById(doc: InfographicDocument, id?: string) {
  if (!id) return undefined;
  return doc.vlans.find((v) => v.id === id);
}

export function connectionTypeById(doc: InfographicDocument, id: string) {
  return doc.connectionTypes.find((t) => t.id === id);
}
