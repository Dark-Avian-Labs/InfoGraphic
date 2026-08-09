import { useCallback, useState } from 'react';

import { getOtherLaneValues, getOtherRiserValues } from '../lib/connection-routing';
import type { DeviceTemplate } from '../lib/device-catalog';
import { defaultSizeForKind } from '../lib/device-catalog';
import { snapLaneX, snapLaneY, snapPointToDeviceGrid, snapToDeviceGrid } from '../lib/grid';
import { clampGroupSize, MIN_GROUP_HEIGHT, MIN_GROUP_WIDTH } from '../lib/groups';
import { normalizeDocument } from '../lib/migrate';
import {
  defaultPortBanksForKind,
  defaultPortsForKind,
  findPort,
  getPortEgressVector,
  getPortPosition,
  minNodeDimensions,
  PORT_STUB,
  setPortBankOnNode,
} from '../lib/ports';
import type {
  ConnectionType,
  DeviceList,
  DeviceListEntry,
  InfographicConnection,
  InfographicDocument,
  InfographicGroup,
  InfographicNode,
  NetworkPort,
  PortBankSide,
  Vlan,
} from '../types';

export type EditorMode = 'select' | 'connect';

export function useDocumentEditor(initial: InfographicDocument) {
  const [document, setDocument] = useState(() => normalizeDocument(initial));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [selectedDeviceListId, setSelectedDeviceListId] = useState<string | null>(null);
  const [selectedLegend, setSelectedLegend] = useState(false);
  const [mode, setMode] = useState<EditorMode>('select');
  const [pendingPortId, setPendingPortId] = useState<string | null>(null);

  const patch = useCallback((updater: (doc: InfographicDocument) => InfographicDocument) => {
    setDocument((prev) => normalizeDocument(updater(prev)));
  }, []);

  const moveNode = useCallback(
    (nodeId: string, x: number, y: number) => {
      const snapped = snapPointToDeviceGrid(x, y);
      patch((doc) => ({
        ...doc,
        nodes: doc.nodes.map((node) =>
          node.id === nodeId ? { ...node, x: snapped.x, y: snapped.y } : node,
        ),
      }));
    },
    [patch],
  );

  const moveDeviceList = useCallback(
    (listId: string, x: number, y: number) => {
      const snapped = snapPointToDeviceGrid(x, y);
      setSelectedDeviceListId(listId);
      setSelectedNodeId(null);
      setSelectedGroupId(null);
      setSelectedConnectionId(null);
      setSelectedLegend(false);
      patch((doc) => ({
        ...doc,
        deviceLists: (doc.deviceLists ?? []).map((list) =>
          list.id === listId ? { ...list, x: snapped.x, y: snapped.y } : list,
        ),
      }));
    },
    [patch],
  );

  const moveLegend = useCallback(
    (x: number, y: number) => {
      const snapped = snapPointToDeviceGrid(x, y);
      setSelectedLegend(true);
      setSelectedNodeId(null);
      setSelectedGroupId(null);
      setSelectedConnectionId(null);
      setSelectedDeviceListId(null);
      patch((doc) => ({
        ...doc,
        legend: { x: snapped.x, y: snapped.y },
      }));
    },
    [patch],
  );

  const updateDeviceList = useCallback(
    (listId: string, updates: Partial<DeviceList>) => {
      patch((doc) => ({
        ...doc,
        deviceLists: (doc.deviceLists ?? []).map((list) =>
          list.id === listId ? { ...list, ...updates } : list,
        ),
      }));
    },
    [patch],
  );

  const updateDeviceListEntry = useCallback(
    (listId: string, index: number, updates: Partial<DeviceListEntry>) => {
      patch((doc) => ({
        ...doc,
        deviceLists: (doc.deviceLists ?? []).map((list) => {
          if (list.id !== listId) return list;
          return {
            ...list,
            devices: list.devices.map((device, i) =>
              i === index ? { ...device, ...updates } : device,
            ),
          };
        }),
      }));
    },
    [patch],
  );

  const addDeviceListEntry = useCallback(
    (listId: string) => {
      patch((doc) => ({
        ...doc,
        deviceLists: (doc.deviceLists ?? []).map((list) =>
          list.id === listId
            ? { ...list, devices: [...list.devices, { name: 'New device' }] }
            : list,
        ),
      }));
    },
    [patch],
  );

  const removeDeviceListEntry = useCallback(
    (listId: string, index: number) => {
      patch((doc) => ({
        ...doc,
        deviceLists: (doc.deviceLists ?? []).map((list) =>
          list.id === listId
            ? { ...list, devices: list.devices.filter((_, i) => i !== index) }
            : list,
        ),
      }));
    },
    [patch],
  );

  const deleteDeviceList = useCallback(
    (listId: string) => {
      patch((doc) => ({
        ...doc,
        deviceLists: (doc.deviceLists ?? []).filter((list) => list.id !== listId),
      }));
      setSelectedDeviceListId((id) => (id === listId ? null : id));
    },
    [patch],
  );

  const updateVlan = useCallback(
    (vlanId: string, updates: Partial<Vlan>) => {
      patch((doc) => ({
        ...doc,
        vlans: doc.vlans.map((vlan) => (vlan.id === vlanId ? { ...vlan, ...updates } : vlan)),
      }));
    },
    [patch],
  );

  const addVlan = useCallback(() => {
    patch((doc) => {
      const id = `vlan-${crypto.randomUUID().slice(0, 8)}`;
      const vlan: Vlan = {
        id,
        name: 'New VLAN',
        color: '#64748b',
      };
      return { ...doc, vlans: [...doc.vlans, vlan] };
    });
  }, [patch]);

  const removeVlan = useCallback(
    (vlanId: string) => {
      patch((doc) => ({
        ...doc,
        vlans: doc.vlans.filter((vlan) => vlan.id !== vlanId),
        nodes: doc.nodes.map((node) =>
          node.vlanId === vlanId ? { ...node, vlanId: undefined } : node,
        ),
        groups: doc.groups.map((group) =>
          group.vlanId === vlanId ? { ...group, vlanId: undefined } : group,
        ),
        deviceLists: (doc.deviceLists ?? []).map((list) =>
          list.vlanId === vlanId ? { ...list, vlanId: undefined } : list,
        ),
      }));
    },
    [patch],
  );

  const updateConnectionType = useCallback(
    (typeId: string, updates: Partial<ConnectionType>) => {
      patch((doc) => ({
        ...doc,
        connectionTypes: doc.connectionTypes.map((type) =>
          type.id === typeId ? { ...type, ...updates } : type,
        ),
      }));
    },
    [patch],
  );

  const addConnectionType = useCallback(() => {
    patch((doc) => {
      const id = `type-${crypto.randomUUID().slice(0, 8)}`;
      const type: ConnectionType = {
        id,
        label: 'New link',
        style: 'solid',
        color: '#1e293b',
      };
      return { ...doc, connectionTypes: [...doc.connectionTypes, type] };
    });
  }, [patch]);

  const removeConnectionType = useCallback(
    (typeId: string) => {
      patch((doc) => {
        if (doc.connectionTypes.length <= 1) return doc;
        const fallback = doc.connectionTypes.find((type) => type.id !== typeId)?.id ?? 'ethernet';
        return {
          ...doc,
          connectionTypes: doc.connectionTypes.filter((type) => type.id !== typeId),
          connections: doc.connections.map((connection) =>
            connection.typeId === typeId ? { ...connection, typeId: fallback } : connection,
          ),
        };
      });
    },
    [patch],
  );

  const resizeNode = useCallback(
    (nodeId: string, width: number, height: number) => {
      patch((doc) => ({
        ...doc,
        nodes: doc.nodes.map((node) => {
          if (node.id !== nodeId) return node;
          const min = minNodeDimensions(node);
          return {
            ...node,
            width: Math.max(min.width, snapToDeviceGrid(width)),
            height: Math.max(min.height, snapToDeviceGrid(height)),
          };
        }),
      }));
    },
    [patch],
  );

  const resizeGroup = useCallback(
    (groupId: string, width: number, height: number) => {
      patch((doc) => ({
        ...doc,
        groups: doc.groups.map((group) => {
          if (group.id !== groupId) return group;
          const size = clampGroupSize(width, height);
          return { ...group, ...size };
        }),
      }));
    },
    [patch],
  );

  const moveGroup = useCallback(
    (groupId: string, x: number, y: number) => {
      setSelectedGroupId(groupId);
      setSelectedNodeId(null);
      setSelectedConnectionId(null);
      setPendingPortId(null);

      patch((doc) => {
        const group = doc.groups.find((g) => g.id === groupId);
        if (!group) return doc;

        const snapped = snapPointToDeviceGrid(x, y);
        const dx = snapped.x - group.x;
        const dy = snapped.y - group.y;
        if (dx === 0 && dy === 0) return doc;

        return {
          ...doc,
          groups: doc.groups.map((g) =>
            g.id === groupId ? { ...g, x: snapped.x, y: snapped.y } : g,
          ),
          nodes: doc.nodes.map((node) =>
            node.groupId === groupId ? { ...node, x: node.x + dx, y: node.y + dy } : node,
          ),
        };
      });
    },
    [patch],
  );

  const selectGroup = useCallback((groupId: string | null) => {
    setSelectedGroupId(groupId);
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setSelectedDeviceListId(null);
    setSelectedLegend(false);
    setPendingPortId(null);
  }, []);

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId !== null) {
      setSelectedGroupId(null);
      setSelectedConnectionId(null);
      setSelectedDeviceListId(null);
      setSelectedLegend(false);
      setPendingPortId(null);
    }
  }, []);

  const selectConnection = useCallback((connectionId: string | null) => {
    setSelectedConnectionId(connectionId);
    if (connectionId) {
      setSelectedNodeId(null);
      setSelectedGroupId(null);
      setSelectedDeviceListId(null);
      setSelectedLegend(false);
    }
    setPendingPortId(null);
  }, []);

  const selectDeviceList = useCallback((listId: string | null) => {
    setSelectedDeviceListId(listId);
    if (listId) {
      setSelectedNodeId(null);
      setSelectedGroupId(null);
      setSelectedConnectionId(null);
      setSelectedLegend(false);
      setPendingPortId(null);
    }
  }, []);

  const selectLegend = useCallback((selected: boolean) => {
    setSelectedLegend(selected);
    if (selected) {
      setSelectedNodeId(null);
      setSelectedGroupId(null);
      setSelectedConnectionId(null);
      setSelectedDeviceListId(null);
      setPendingPortId(null);
    }
  }, []);

  const updateGroup = useCallback(
    (groupId: string, updates: Partial<InfographicGroup>) => {
      patch((doc) => ({
        ...doc,
        groups: doc.groups.map((group) => {
          if (group.id !== groupId) return group;
          const next = { ...group, ...updates };
          const size =
            updates.width !== undefined || updates.height !== undefined
              ? clampGroupSize(next.width, next.height)
              : { width: next.width, height: next.height };
          return {
            ...next,
            ...size,
            x: updates.x !== undefined ? snapToDeviceGrid(next.x) : next.x,
            y: updates.y !== undefined ? snapToDeviceGrid(next.y) : next.y,
          };
        }),
      }));
    },
    [patch],
  );

  const deleteGroup = useCallback(
    (groupId: string) => {
      patch((doc) => ({
        ...doc,
        groups: doc.groups.filter((g) => g.id !== groupId),
        nodes: doc.nodes.map((node) =>
          node.groupId === groupId ? { ...node, groupId: undefined } : node,
        ),
      }));
      setSelectedGroupId((id) => (id === groupId ? null : id));
    },
    [patch],
  );

  const addGroup = useCallback(() => {
    const id = `group-${crypto.randomUUID().slice(0, 8)}`;
    const group: InfographicGroup = {
      id,
      label: 'New cluster',
      x: snapToDeviceGrid(480),
      y: snapToDeviceGrid(280),
      width: MIN_GROUP_WIDTH * 2.5,
      height: MIN_GROUP_HEIGHT * 2,
    };

    patch((doc) => ({ ...doc, groups: [...doc.groups, group] }));
    setSelectedGroupId(id);
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    return id;
  }, [patch]);

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<InfographicNode>) => {
      patch((doc) => ({
        ...doc,
        nodes: doc.nodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)),
      }));
    },
    [patch],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      patch((doc) => {
        const portIds = new Set(
          doc.nodes.find((n) => n.id === nodeId)?.ports.map((p) => p.id) ?? [],
        );
        return {
          ...doc,
          nodes: doc.nodes.filter((n) => n.id !== nodeId),
          connections: doc.connections.filter(
            (c) => !portIds.has(c.fromPortId) && !portIds.has(c.toPortId),
          ),
        };
      });
      setSelectedNodeId((id) => (id === nodeId ? null : id));
    },
    [patch],
  );

  const addDevice = useCallback(
    (template: DeviceTemplate, position: { x: number; y: number }) => {
      const id = `node-${crypto.randomUUID().slice(0, 8)}`;
      const size = defaultSizeForKind(template.kind);
      const node: InfographicNode = {
        id,
        label: template.label,
        kind: template.kind,
        subtitle: template.subtitle,
        x: position.x - size.width / 2,
        y: position.y - size.height / 2,
        width: size.width,
        height: size.height,
        portBanks: defaultPortBanksForKind(template.kind),
        ports: defaultPortsForKind(id, template.kind),
      };

      patch((doc) => ({ ...doc, nodes: [...doc.nodes, node] }));
      setSelectedNodeId(id);
      return id;
    },
    [patch],
  );

  const setPortBank = useCallback(
    (nodeId: string, side: PortBankSide, rows: 1 | 2, columns: number) => {
      patch((doc) => ({
        ...doc,
        nodes: doc.nodes.map((node) =>
          node.id === nodeId ? setPortBankOnNode(node, side, rows, columns) : node,
        ),
        connections: doc.connections.filter((c) => {
          const node = doc.nodes.find((n) => n.id === nodeId);
          if (!node) return true;
          const removedIds = new Set(node.ports.filter((p) => p.side === side).map((p) => p.id));
          return !removedIds.has(c.fromPortId) && !removedIds.has(c.toPortId);
        }),
      }));
    },
    [patch],
  );

  const updatePort = useCallback(
    (nodeId: string, portId: string, updates: Partial<NetworkPort>) => {
      patch((doc) => ({
        ...doc,
        nodes: doc.nodes.map((node) => {
          if (node.id !== nodeId) return node;
          return {
            ...node,
            ports: node.ports.map((port) => (port.id === portId ? { ...port, ...updates } : port)),
          };
        }),
      }));
    },
    [patch],
  );

  const removePort = useCallback(
    (nodeId: string, portId: string) => {
      patch((doc) => ({
        ...doc,
        nodes: doc.nodes.map((node) =>
          node.id === nodeId ? { ...node, ports: node.ports.filter((p) => p.id !== portId) } : node,
        ),
        connections: doc.connections.filter(
          (c) => c.fromPortId !== portId && c.toPortId !== portId,
        ),
      }));
      setPendingPortId((id) => (id === portId ? null : id));
    },
    [patch],
  );

  const updateConnectionLane = useCallback(
    (connectionId: string, lane: number) => {
      patch((doc) => {
        const snapped = snapLaneY(lane, getOtherLaneValues(doc, connectionId), doc.height);

        return {
          ...doc,
          connections: doc.connections.map((c) =>
            c.id === connectionId ? { ...c, lane: snapped } : c,
          ),
        };
      });
    },
    [patch],
  );

  const updateConnectionRiser = useCallback(
    (connectionId: string, which: 'from' | 'to', x: number) => {
      patch((doc) => {
        const connection = doc.connections.find((c) => c.id === connectionId);
        if (!connection) return doc;

        const portId = which === 'from' ? connection.fromPortId : connection.toPortId;
        const found = findPort(doc, portId);
        if (!found) return doc;

        const pos = getPortPosition(found.node, found.port);
        const egress = getPortEgressVector(found.port);
        const stubX = pos.x + egress.dx * PORT_STUB;
        const snapped = snapLaneX(x, getOtherRiserValues(doc, connectionId), doc.width);
        const offset = snapped - stubX;
        const key = which === 'from' ? 'fromRiserOffset' : 'toRiserOffset';

        return {
          ...doc,
          connections: doc.connections.map((c) =>
            c.id === connectionId
              ? { ...c, [key]: Math.abs(offset) < 0.5 ? undefined : offset }
              : c,
          ),
        };
      });
    },
    [patch],
  );

  const resetConnectionRoute = useCallback(
    (connectionId: string) => {
      patch((doc) => ({
        ...doc,
        connections: doc.connections.map((c) =>
          c.id === connectionId
            ? {
                ...c,
                lane: undefined,
                fromRiserOffset: undefined,
                toRiserOffset: undefined,
              }
            : c,
        ),
      }));
    },
    [patch],
  );

  const updateConnection = useCallback(
    (connectionId: string, updates: Partial<InfographicConnection>) => {
      patch((doc) => ({
        ...doc,
        connections: doc.connections.map((c) => (c.id === connectionId ? { ...c, ...updates } : c)),
      }));
    },
    [patch],
  );

  const deleteConnection = useCallback(
    (connectionId: string) => {
      patch((doc) => ({
        ...doc,
        connections: doc.connections.filter((c) => c.id !== connectionId),
      }));
      setSelectedConnectionId((id) => (id === connectionId ? null : id));
    },
    [patch],
  );

  const addConnection = useCallback(
    (fromPortId: string, toPortId: string, typeId = 'ethernet') => {
      if (fromPortId === toPortId) return;

      patch((doc) => {
        const exists = doc.connections.some(
          (c) =>
            (c.fromPortId === fromPortId && c.toPortId === toPortId) ||
            (c.fromPortId === toPortId && c.toPortId === fromPortId),
        );
        if (exists) return doc;

        const connection: InfographicConnection = {
          id: `conn-${crypto.randomUUID().slice(0, 8)}`,
          fromPortId,
          toPortId,
          typeId,
        };

        return { ...doc, connections: [...doc.connections, connection] };
      });
      setPendingPortId(null);
    },
    [patch],
  );

  const handlePortClick = useCallback(
    (portId: string) => {
      if (mode !== 'connect') return;

      if (!pendingPortId) {
        setPendingPortId(portId);
        return;
      }

      if (pendingPortId === portId) {
        setPendingPortId(null);
        return;
      }

      addConnection(pendingPortId, portId);
    },
    [addConnection, mode, pendingPortId],
  );

  const loadDocument = useCallback((doc: InfographicDocument) => {
    setDocument(normalizeDocument(doc));
    setSelectedNodeId(null);
    setSelectedGroupId(null);
    setSelectedConnectionId(null);
    setSelectedDeviceListId(null);
    setSelectedLegend(false);
    setPendingPortId(null);
  }, []);

  const cancelConnection = useCallback(() => {
    setPendingPortId(null);
  }, []);

  const selectedNode = document.nodes.find((n) => n.id === selectedNodeId) ?? null;
  const selectedGroup = document.groups.find((g) => g.id === selectedGroupId) ?? null;
  const selectedConnection =
    document.connections.find((c) => c.id === selectedConnectionId) ?? null;
  const selectedDeviceList =
    document.deviceLists?.find((list) => list.id === selectedDeviceListId) ?? null;

  return {
    document,
    selectedNodeId,
    selectedNode,
    selectedGroupId,
    selectedGroup,
    selectedConnectionId,
    selectedConnection,
    selectedDeviceListId,
    selectedDeviceList,
    selectedLegend,
    mode,
    setMode,
    pendingPortId,
    moveNode,
    moveDeviceList,
    moveLegend,
    moveGroup,
    resizeNode,
    resizeGroup,
    selectNode,
    selectGroup,
    selectConnection,
    selectDeviceList,
    selectLegend,
    updateNode,
    updateGroup,
    updateDeviceList,
    updateDeviceListEntry,
    addDeviceListEntry,
    removeDeviceListEntry,
    deleteDeviceList,
    updateVlan,
    addVlan,
    removeVlan,
    updateConnectionType,
    addConnectionType,
    removeConnectionType,
    deleteNode,
    deleteGroup,
    addDevice,
    addGroup,
    setPortBank,
    updatePort,
    removePort,
    updateConnectionLane,
    updateConnectionRiser,
    resetConnectionRoute,
    updateConnection,
    deleteConnection,
    handlePortClick,
    cancelConnection,
    loadDocument,
    setDocument: loadDocument,
  };
}
