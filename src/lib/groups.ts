import type { InfographicGroup, Vlan } from '../types';
import { DEVICE_GRID, snapToDeviceGrid } from './grid';

export const MIN_GROUP_WIDTH = DEVICE_GRID * 4;
export const MIN_GROUP_HEIGHT = DEVICE_GRID * 3;

export function getGroupColor(group: InfographicGroup, vlan?: Vlan) {
  return group.color ?? vlan?.color ?? '#cbd5e1';
}

export function clampGroupSize(width: number, height: number) {
  return {
    width: Math.max(MIN_GROUP_WIDTH, snapToDeviceGrid(width)),
    height: Math.max(MIN_GROUP_HEIGHT, snapToDeviceGrid(height)),
  };
}
