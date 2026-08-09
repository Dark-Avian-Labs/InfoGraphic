import { describe, expect, it } from 'vitest';

import type { InfographicDocument } from '../types';
import { routeConnection } from './connection-routing';
import { CONNECTION_GRID } from './grid';

function docWithTwoBottomPorts(): InfographicDocument {
  return {
    title: 'Test',
    width: 800,
    height: 600,
    vlans: [],
    connectionTypes: [{ id: 'ethernet', label: 'Ethernet', style: 'solid' }],
    groups: [],
    nodes: [
      {
        id: 'a',
        label: 'A',
        kind: 'switch',
        x: 40,
        y: 40,
        width: 160,
        height: 80,
        ports: [{ id: 'a-p1', label: '1', side: 'bottom', row: 0, col: 0 }],
      },
      {
        id: 'b',
        label: 'B',
        kind: 'nas',
        x: 320,
        y: 40,
        width: 160,
        height: 80,
        ports: [{ id: 'b-p1', label: 'eth0', side: 'bottom', row: 0, col: 0 }],
      },
    ],
    connections: [
      {
        id: 'c1',
        fromPortId: 'a-p1',
        toPortId: 'b-p1',
        typeId: 'ethernet',
      },
    ],
  };
}

describe('routeConnection', () => {
  it('routes same-side bottom ports on a lane below both stubs', () => {
    const doc = docWithTwoBottomPorts();
    const route = routeConnection(doc, doc.connections[0]);
    expect(route).not.toBeNull();

    const fromStubY = route!.fromRiserSegment.y1;
    const toStubY = route!.toRiserSegment.y1;
    expect(route!.laneY).toBeGreaterThanOrEqual(Math.max(fromStubY, toStubY));
    expect(route!.points.at(-1)).toMatchObject({
      x: expect.any(Number),
      y: expect.any(Number),
    });
  });

  it('honors an explicit lane Y', () => {
    const doc = docWithTwoBottomPorts();
    const lane = 400;
    doc.connections[0] = { ...doc.connections[0], lane };
    const route = routeConnection(doc, doc.connections[0]);
    expect(route?.laneY).toBe(lane);
  });

  it('applies riser offsets away from port stubs', () => {
    const doc = docWithTwoBottomPorts();
    doc.connections[0] = {
      ...doc.connections[0],
      lane: 320,
      fromRiserOffset: CONNECTION_GRID,
      toRiserOffset: -CONNECTION_GRID,
    };
    const route = routeConnection(doc, doc.connections[0]);
    expect(route).not.toBeNull();
    expect(route!.fromRiserX).toBe(route!.fromStubX + CONNECTION_GRID);
    expect(route!.toRiserX).toBe(route!.toStubX - CONNECTION_GRID);
  });
});
