import type { DeviceKind } from '../types';
import { DEFAULT_NODE_SIZE } from '../types';

export interface DeviceTemplate {
  id: string;
  label: string;
  kind: DeviceKind;
  width: number;
  height: number;
  subtitle?: string;
}

export const DEVICE_TEMPLATES: DeviceTemplate[] = [
  {
    id: 'router',
    label: 'Router',
    kind: 'router',
    width: 160,
    height: 80,
    subtitle: 'Gateway / firewall',
  },
  {
    id: 'switch',
    label: 'Switch',
    kind: 'switch',
    width: 160,
    height: 80,
    subtitle: 'L2/L3 switch',
  },
  {
    id: 'server',
    label: 'Server',
    kind: 'server',
    width: 160,
    height: 120,
    subtitle: 'Physical host',
  },
  { id: 'nas', label: 'NAS', kind: 'nas', width: 160, height: 120, subtitle: 'Network storage' },
  { id: 'vm', label: 'VM', kind: 'vm', width: 160, height: 80, subtitle: 'Virtual machine' },
  {
    id: 'cloud',
    label: 'Cloud',
    kind: 'cloud',
    width: 120,
    height: 80,
    subtitle: 'Internet / CDN',
  },
  {
    id: 'endpoint',
    label: 'Endpoint',
    kind: 'endpoint',
    width: 120,
    height: 80,
    subtitle: 'PC / laptop',
  },
  {
    id: 'device',
    label: 'Device',
    kind: 'device',
    width: 120,
    height: 80,
    subtitle: 'AP / IoT hub',
  },
];

export function templateByKind(kind: DeviceKind) {
  return DEVICE_TEMPLATES.find((t) => t.kind === kind);
}

export function defaultSizeForKind(kind: DeviceKind) {
  const template = templateByKind(kind);
  return {
    width: template?.width ?? DEFAULT_NODE_SIZE.width,
    height: template?.height ?? DEFAULT_NODE_SIZE.height,
  };
}
