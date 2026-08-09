import { afterEach, describe, expect, it, vi } from 'vitest';

import type { InfographicDocument } from '../types';
import { clearPersistedDocument, DOCUMENT_STORAGE_KEY, loadPersistedDocument, persistDocument } from './persist';

const sample: InfographicDocument = {
  title: 'Persisted',
  width: 400,
  height: 300,
  vlans: [],
  connectionTypes: [{ id: 'ethernet', label: 'Ethernet', style: 'solid' }],
  groups: [],
  nodes: [
    {
      id: 'n1',
      label: 'Node',
      kind: 'device',
      x: 0,
      y: 0,
      ports: [{ id: 'n1-p1', label: '1', side: 'bottom', row: 0, col: 0 }],
    },
  ],
  connections: [],
};

describe('persist', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips a document through localStorage', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });

    persistDocument(sample);
    expect(store.has(DOCUMENT_STORAGE_KEY)).toBe(true);

    const loaded = loadPersistedDocument();
    expect(loaded?.title).toBe('Persisted');
    expect(loaded?.nodes).toHaveLength(1);

    clearPersistedDocument();
    expect(loadPersistedDocument()).toBeNull();
  });

  it('returns null for corrupt stored JSON', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => '{not-json',
      setItem: () => undefined,
      removeItem: () => undefined,
    });
    expect(loadPersistedDocument()).toBeNull();
  });
});
