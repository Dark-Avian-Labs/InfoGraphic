import type { InfographicDocument } from '../types';
import { normalizeDocument } from './migrate';

export function parseDocument(json: string): InfographicDocument {
  const parsed = JSON.parse(json) as InfographicDocument;

  if (!parsed.title || !parsed.nodes || !parsed.connections) {
    throw new Error('Document must include title, nodes, and connections.');
  }

  return normalizeDocument(parsed);
}

export function serializeDocument(doc: InfographicDocument): string {
  return JSON.stringify(doc, null, 2);
}
