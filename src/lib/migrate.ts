import type { InfographicDocument, InfographicNode } from '../types';
import {
  defaultPortBanksForKind,
  defaultPortsForKind,
  migrateNodePorts,
  snapNodeDimensions,
} from './ports';

interface RawConnection {
  id: string;
  typeId: string;
  label?: string;
  color?: string;
  lane?: number;
  fromRiserOffset?: number;
  toRiserOffset?: number;
  fromPortId?: string;
  toPortId?: string;
  from?: string;
  to?: string;
}

interface RawNode extends Omit<InfographicNode, 'ports'> {
  ports?: InfographicNode['ports'];
}

interface RawDocument extends Omit<InfographicDocument, 'nodes' | 'connections'> {
  nodes: RawNode[];
  connections: RawConnection[];
}

export function normalizeDocument(doc: InfographicDocument | RawDocument): InfographicDocument {
  const nodes = doc.nodes.map((node) =>
    snapNodeDimensions(
      migrateNodePorts({
        ...node,
        ports: node.ports?.length ? node.ports : defaultPortsForKind(node.id, node.kind),
        portBanks: node.portBanks?.length ? node.portBanks : defaultPortBanksForKind(node.kind),
      }),
    ),
  );

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const connections = doc.connections
    .map((connection) => migrateConnection(connection, nodeById))
    .filter((c): c is InfographicDocument['connections'][number] => c !== null);

  return {
    title: doc.title,
    width: doc.width ?? 1600,
    height: doc.height ?? 1100,
    vlans: doc.vlans ?? [],
    connectionTypes: doc.connectionTypes ?? [],
    groups: doc.groups ?? [],
    nodes,
    connections,
    deviceLists: doc.deviceLists ?? [],
    legend: doc.legend ?? {
      x: (doc.width ?? 1600) - 280,
      y: 48,
    },
  };
}

function migrateConnection(
  connection: RawConnection,
  nodeById: Map<string, InfographicNode>,
): InfographicDocument['connections'][number] | null {
  if (connection.fromPortId && connection.toPortId) {
    return {
      id: connection.id,
      fromPortId: connection.fromPortId,
      toPortId: connection.toPortId,
      typeId: connection.typeId,
      label: connection.label,
      color: connection.color,
      lane: connection.lane,
      fromRiserOffset: connection.fromRiserOffset,
      toRiserOffset: connection.toRiserOffset,
    };
  }

  if (connection.from && connection.to) {
    const fromNode = nodeById.get(connection.from);
    const toNode = nodeById.get(connection.to);
    if (!fromNode || !toNode) return null;

    const fromPortId = pickPortForPeer(fromNode, toNode, 'out');
    const toPortId = pickPortForPeer(toNode, fromNode, 'in');

    return {
      id: connection.id,
      fromPortId,
      toPortId,
      typeId: connection.typeId,
      label: connection.label,
      color: connection.color,
    };
  }

  return null;
}

function pickPortForPeer(node: InfographicNode, peer: InfographicNode, direction: 'in' | 'out') {
  const dy = peer.y - node.y;
  const preferredSide =
    direction === 'out' ? (dy >= 0 ? 'bottom' : 'top') : dy >= 0 ? 'top' : 'bottom';

  const onSide = node.ports.filter((p) => p.side === preferredSide);
  if (onSide.length > 0) return onSide[0].id;
  return node.ports[0]?.id ?? `${node.id}-fallback`;
}
