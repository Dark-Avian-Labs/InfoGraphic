import type { CanvasThemeMode } from '../hooks/useCanvasTheme';
import type { ConnectionType, InfographicConnection, InfographicDocument } from '../types';
import { connectionTypeById } from '../types';
import { ensureContrastOnCanvas } from './color-contrast';

export function getConnectionStrokeColor(
  connection: InfographicConnection,
  type: ConnectionType,
  canvasTheme: CanvasThemeMode = 'light',
): string {
  const raw = connection.color ?? type.color ?? '#1e293b';
  return ensureContrastOnCanvas(raw, canvasTheme);
}

export function buildPortWireColorMap(
  doc: InfographicDocument,
  canvasTheme: CanvasThemeMode = 'light',
): Map<string, string> {
  const map = new Map<string, string>();

  for (const connection of doc.connections) {
    const type = connectionTypeById(doc, connection.typeId);
    if (!type) continue;

    const color = getConnectionStrokeColor(connection, type, canvasTheme);
    map.set(connection.fromPortId, color);
    map.set(connection.toPortId, color);
  }

  return map;
}
