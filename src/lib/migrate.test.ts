import { describe, expect, it } from 'vitest';

import type { InfographicDocument } from '../types';
import { normalizeDocument } from './migrate';

const baseDoc = {
  title: 'Migrate',
  width: 800,
  height: 600,
  vlans: [],
  connectionTypes: [{ id: 'ethernet', label: 'Ethernet', style: 'solid' as const }],
  groups: [],
  nodes: [
    {
      id: 'a',
      label: 'A',
      kind: 'device' as const,
      x: 0,
      y: 0,
      ports: [{ id: 'a-p1', label: '1', side: 'bottom' as const, row: 0, col: 0 }],
    },
    {
      id: 'b',
      label: 'B',
      kind: 'device' as const,
      x: 200,
      y: 0,
      ports: [{ id: 'b-p1', label: '1', side: 'bottom' as const, row: 0, col: 0 }],
    },
  ],
  connections: [
    {
      id: 'c1',
      fromPortId: 'a-p1',
      toPortId: 'b-p1',
      typeId: 'ethernet',
      lane: 240,
      fromRiserOffset: 28,
      toRiserOffset: -28,
    },
  ],
} satisfies InfographicDocument;

describe('normalizeDocument', () => {
  it('preserves connection lane and riser offsets', () => {
    const normalized = normalizeDocument(baseDoc);
    expect(normalized.connections[0]).toMatchObject({
      lane: 240,
      fromRiserOffset: 28,
      toRiserOffset: -28,
    });
  });

  it('fills a default legend position when missing', () => {
    const normalized = normalizeDocument({ ...baseDoc, legend: undefined });
    expect(normalized.legend).toEqual({ x: 800 - 280, y: 48 });
  });

  it('keeps an explicit legend position', () => {
    const normalized = normalizeDocument({
      ...baseDoc,
      legend: { x: 100, y: 120 },
    });
    expect(normalized.legend).toEqual({ x: 100, y: 120 });
  });

  it('migrates legacy node-level from/to connections to ports', () => {
    const normalized = normalizeDocument({
      ...baseDoc,
      connections: [{ id: 'legacy', from: 'a', to: 'b', typeId: 'ethernet' }],
    } as unknown as InfographicDocument);

    expect(normalized.connections).toHaveLength(1);
    expect(normalized.connections[0].fromPortId).toBe('a-p1');
    expect(normalized.connections[0].toPortId).toBe('b-p1');
  });

  it('keeps only canonical port fields', () => {
    const normalized = normalizeDocument({
      ...baseDoc,
      nodes: [
        {
          ...baseDoc.nodes[0],
          ports: [
            {
              id: 'a-p1',
              label: '1',
              side: 'bottom',
              row: 0,
              col: 0,
              offset: 0.5,
            },
          ],
        },
        baseDoc.nodes[1],
      ],
    } as unknown as InfographicDocument);

    expect(normalized.nodes[0].ports[0]).toEqual({
      id: 'a-p1',
      label: '1',
      side: 'bottom',
      row: 0,
      col: 0,
    });
  });
});
