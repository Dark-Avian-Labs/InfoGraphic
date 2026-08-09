import type { InfographicDocument } from '../types';
import { parseDocument } from './document';

/** Client-only draft of the open diagram. No server, no cookies. */
export const DOCUMENT_STORAGE_KEY = 'infographic:document:v1';

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function loadPersistedDocument(): InfographicDocument | null {
  try {
    const raw = storage()?.getItem(DOCUMENT_STORAGE_KEY);
    if (!raw) return null;
    return parseDocument(raw);
  } catch {
    return null;
  }
}

export function persistDocument(doc: InfographicDocument): void {
  try {
    storage()?.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(doc));
  } catch (error) {
    console.warn('Failed to autosave diagram to localStorage.', error);
  }
}

export function clearPersistedDocument(): void {
  try {
    storage()?.removeItem(DOCUMENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
