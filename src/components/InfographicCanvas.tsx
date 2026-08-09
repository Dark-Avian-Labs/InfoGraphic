import { useEffect, useMemo, useRef, useState } from 'react';

import type { CanvasThemeMode } from '../hooks/useCanvasTheme';
import type { EditorMode } from '../hooks/useDocumentEditor';
import { canvasThemeStyle } from '../lib/canvas-theme';
import {
  getOtherLaneValues,
  getOtherRiserValues,
  getVisibleLaneGuides,
  getVisibleRiserGuides,
  pointsToRoundedPath,
  routeConnection,
} from '../lib/connection-routing';
import { buildPortWireColorMap, getConnectionStrokeColor } from '../lib/connections';
import { DEVICE_GRID } from '../lib/grid';
import { findPort, getPortEgressVector, getPortPosition, PORT_STUB } from '../lib/ports';
import type { InfographicDocument } from '../types';
import { connectionTypeById, vlanById } from '../types';
import { ConnectionLine } from './ConnectionLine';
import { GroupBox } from './GroupBox';
import { GroupOverlay, GroupSelectLayer } from './GroupInteraction';
import { DeviceListPanel, Legend } from './Legend';
import { NodeCard } from './NodeCard';

const PREVIEW_SNAP_PX = 22;

interface InfographicCanvasProps {
  document: InfographicDocument;
  id?: string;
  canvasTheme?: CanvasThemeMode;
  interactive?: boolean;
  mode?: EditorMode;
  selectedNodeId?: string | null;
  selectedGroupId?: string | null;
  selectedConnectionId?: string | null;
  selectedDeviceListId?: string | null;
  selectedLegend?: boolean;
  pendingPortId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
  onSelectGroup?: (groupId: string | null) => void;
  onSelectConnection?: (connectionId: string | null) => void;
  onSelectDeviceList?: (listId: string | null) => void;
  onSelectLegend?: (selected: boolean) => void;
  onMoveNode?: (nodeId: string, x: number, y: number) => void;
  onMoveGroup?: (groupId: string, x: number, y: number) => void;
  onMoveDeviceList?: (listId: string, x: number, y: number) => void;
  onMoveLegend?: (x: number, y: number) => void;
  onResizeGroup?: (groupId: string, width: number, height: number) => void;
  onResizeNode?: (nodeId: string, width: number, height: number) => void;
  onPortClick?: (portId: string) => void;
  onLaneDrag?: (connectionId: string, lane: number) => void;
  onRiserDrag?: (connectionId: string, which: 'from' | 'to', x: number) => void;
}

export function InfographicCanvas({
  document,
  id = 'infographic-canvas',
  canvasTheme = 'light',
  interactive,
  mode = 'select',
  selectedNodeId,
  selectedGroupId,
  selectedConnectionId,
  selectedDeviceListId,
  selectedLegend,
  pendingPortId,
  onSelectNode,
  onSelectGroup,
  onSelectConnection,
  onSelectDeviceList,
  onSelectLegend,
  onMoveNode,
  onMoveGroup,
  onMoveDeviceList,
  onMoveLegend,
  onResizeGroup,
  onResizeNode,
  onPortClick,
  onLaneDrag,
  onRiserDrag,
}: InfographicCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const connectMode = interactive && mode === 'connect';
  const selectMode = interactive && mode === 'select';
  const [previewPoint, setPreviewPoint] = useState<{ x: number; y: number } | null>(null);
  const [hoverPortId, setHoverPortId] = useState<string | null>(null);

  const laneGuides = useMemo(() => getVisibleLaneGuides(document), [document]);
  const riserGuides = useMemo(() => getVisibleRiserGuides(document), [document]);

  useEffect(() => {
    if (!connectMode || !pendingPortId) {
      setPreviewPoint(null);
      setHoverPortId(null);
    }
  }, [connectMode, pendingPortId]);

  const clientToSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const matrix = svg.getScreenCTM()?.inverse();
    if (!matrix) return null;
    return point.matrixTransform(matrix);
  };

  const updateConnectionPreview = (clientX: number, clientY: number) => {
    if (!connectMode || !pendingPortId) return;
    const pos = clientToSvg(clientX, clientY);
    if (!pos) return;
    setPreviewPoint(pos);
    setHoverPortId(findNearestPortId(document, pos, pendingPortId, PREVIEW_SNAP_PX));
  };

  const routedConnections = useMemo(
    () =>
      document.connections
        .map((connection) => {
          const route = routeConnection(document, connection);
          const type = connectionTypeById(document, connection.typeId);
          if (!route || !type) return null;
          const strokeColor = getConnectionStrokeColor(connection, type, canvasTheme);
          return { connection, route, type, strokeColor };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    [document, canvasTheme],
  );

  const portWireColors = useMemo(
    () => buildPortWireColorMap(document, canvasTheme),
    [document, canvasTheme],
  );

  return (
    <svg
      ref={svgRef}
      id={id}
      width={document.width}
      height={document.height}
      viewBox={`0 0 ${document.width} ${document.height}`}
      xmlns="http://www.w3.org/2000/svg"
      className={`infographic-canvas${canvasTheme === 'dark' ? ' infographic-canvas--dark' : ''}${interactive ? ' infographic-canvas--interactive' : ''}`}
      style={canvasThemeStyle(canvasTheme)}
      onDragStart={(event) => event.preventDefault()}
      onPointerMove={(event) => {
        updateConnectionPreview(event.clientX, event.clientY);
      }}
      onPointerDown={(event) => {
        if (!interactive || event.target !== event.currentTarget) return;
        onSelectNode?.(null);
        onSelectGroup?.(null);
        onSelectConnection?.(null);
        onSelectDeviceList?.(null);
        onSelectLegend?.(false);
      }}
    >
      <defs>
        <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.08" />
        </filter>
        <pattern
          id="device-grid"
          width={DEVICE_GRID}
          height={DEVICE_GRID}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${DEVICE_GRID} 0 L 0 0 0 ${DEVICE_GRID}`}
            fill="none"
            stroke="var(--canvas-grid-device)"
            strokeWidth="0.6"
          />
        </pattern>
        <clipPath id="canvas-clip">
          <rect width={document.width} height={document.height} />
        </clipPath>
      </defs>

      <rect className="canvas-bg" width="100%" height="100%" pointerEvents="none" />
      <rect
        width="100%"
        height="100%"
        fill="url(#device-grid)"
        opacity={0.55}
        pointerEvents="none"
      />

      {selectMode && selectedConnectionId && (
        <>
          <LaneGuides
            width={document.width}
            lanes={laneGuides}
            activeLane={
              document.connections.find((c) => c.id === selectedConnectionId)?.lane ??
              routeConnection(
                document,
                document.connections.find((c) => c.id === selectedConnectionId)!,
              )?.laneY
            }
          />
          <RiserGuides
            height={document.height}
            risers={riserGuides}
            activeRisers={(() => {
              const route = routeConnection(
                document,
                document.connections.find((c) => c.id === selectedConnectionId)!,
              );
              return route ? [route.fromRiserX, route.toRiserX] : [];
            })()}
          />
        </>
      )}

      <text
        x={document.width / 2}
        y={36}
        textAnchor="middle"
        className="canvas-title"
        fontSize={22}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        pointerEvents="none"
      >
        {document.title}
      </text>

      {document.groups.map((group) => (
        <GroupBox
          key={group.id}
          group={group}
          vlan={vlanById(document, group.vlanId)}
          canvasTheme={canvasTheme}
        />
      ))}

      {selectMode &&
        document.groups.map((group) => (
          <GroupSelectLayer
            key={`group-select-${group.id}`}
            group={group}
            interactive
            svgRef={svgRef}
            onSelect={(groupId) => {
              onSelectGroup?.(groupId);
            }}
            onMove={onMoveGroup}
          />
        ))}

      {/* Connection visuals — clipped to canvas bounds */}
      <g clipPath="url(#canvas-clip)">
        {routedConnections.map(({ connection, route, type, strokeColor }) => (
          <ConnectionLine
            key={connection.id}
            variant="visual"
            route={route}
            type={type}
            strokeColor={strokeColor}
            label={connection.label}
            selected={selectedConnectionId === connection.id}
          />
        ))}
        {connectMode && pendingPortId && previewPoint && (
          <ConnectionRubberBand
            document={document}
            fromPortId={pendingPortId}
            pointer={previewPoint}
            hoverPortId={hoverPortId}
          />
        )}
      </g>

      {connectMode && pendingPortId && <PendingConnectionHint document={document} />}

      {document.nodes.map((node) => (
        <NodeCard
          key={node.id}
          node={node}
          vlan={vlanById(document, node.vlanId)}
          selected={selectedNodeId === node.id}
          interactive={interactive}
          connectMode={connectMode}
          pendingPortId={pendingPortId}
          hoverPortId={hoverPortId}
          portWireColors={portWireColors}
          canvasTheme={canvasTheme}
          onSelect={onSelectNode}
          onMove={onMoveNode}
          onResize={selectMode ? onResizeNode : undefined}
          onPortClick={onPortClick}
          svgRef={svgRef}
        />
      ))}

      {/* Connection hit targets — below cluster chrome so header/border clicks select clusters */}
      {selectMode &&
        routedConnections.map(({ connection, route, type, strokeColor }) => (
          <ConnectionLine
            key={`hit-${connection.id}`}
            variant="interaction"
            route={route}
            type={type}
            strokeColor={strokeColor}
            selected={selectedConnectionId === connection.id}
            interactive
            laneSnapTargets={getOtherLaneValues(document, connection.id)}
            riserSnapTargets={getOtherRiserValues(document, connection.id)}
            canvasWidth={document.width}
            canvasHeight={document.height}
            onSelect={() => {
              onSelectConnection?.(connection.id);
              onSelectNode?.(null);
              onSelectGroup?.(null);
              onSelectDeviceList?.(null);
              onSelectLegend?.(false);
            }}
            onLaneDrag={onLaneDrag ? (lane) => onLaneDrag(connection.id, lane) : undefined}
            onRiserDrag={
              onRiserDrag ? (which, x) => onRiserDrag(connection.id, which, x) : undefined
            }
          />
        ))}

      {selectMode &&
        document.groups.map((group) => (
          <GroupOverlay
            key={`group-overlay-${group.id}`}
            group={group}
            selected={selectedGroupId === group.id}
            interactive
            svgRef={svgRef}
            onSelect={(groupId) => {
              onSelectGroup?.(groupId);
            }}
            onMove={onMoveGroup}
            onResize={onResizeGroup}
          />
        ))}

      {/* Panels above hit targets so they stay draggable */}
      {document.deviceLists?.map((list) => (
        <DeviceListPanel
          key={list.id}
          list={list}
          vlan={vlanById(document, list.vlanId)}
          canvasTheme={canvasTheme}
          interactive={selectMode}
          selected={selectedDeviceListId === list.id}
          svgRef={svgRef}
          onMove={onMoveDeviceList ? (x, y) => onMoveDeviceList(list.id, x, y) : undefined}
          onSelect={() => onSelectDeviceList?.(list.id)}
        />
      ))}

      <Legend
        vlans={document.vlans}
        connectionTypes={document.connectionTypes}
        x={document.legend?.x ?? document.width - 280}
        y={document.legend?.y ?? 48}
        canvasTheme={canvasTheme}
        interactive={selectMode}
        selected={selectedLegend}
        svgRef={svgRef}
        onMove={onMoveLegend}
        onSelect={() => onSelectLegend?.(true)}
      />

      <rect
        className="canvas-frame"
        x={0.5}
        y={0.5}
        width={document.width - 1}
        height={document.height - 1}
        rx={12}
        pointerEvents="none"
      />
    </svg>
  );
}

function findNearestPortId(
  doc: InfographicDocument,
  point: { x: number; y: number },
  excludePortId: string,
  maxDistance: number,
) {
  let bestId: string | null = null;
  let bestDist = maxDistance;

  for (const node of doc.nodes) {
    for (const port of node.ports) {
      if (port.id === excludePortId) continue;
      const pos = getPortPosition(node, port);
      const dist = Math.hypot(pos.x - point.x, pos.y - point.y);
      if (dist <= bestDist) {
        bestDist = dist;
        bestId = port.id;
      }
    }
  }

  return bestId;
}

function buildRubberBandPoints(
  doc: InfographicDocument,
  fromPortId: string,
  pointer: { x: number; y: number },
  hoverPortId: string | null,
) {
  const from = findPort(doc, fromPortId);
  if (!from) return null;

  // Snapped to a port: use the same router as finalized connections.
  if (hoverPortId) {
    const previewConnection = {
      id: '__preview__',
      fromPortId,
      toPortId: hoverPortId,
      typeId: 'ethernet',
    };
    const previewDoc = {
      ...doc,
      connections: [...doc.connections, previewConnection],
    };
    return routeConnection(previewDoc, previewConnection)?.points ?? null;
  }

  const start = getPortPosition(from.node, from.port);
  const fromEgress = getPortEgressVector(from.port);
  const startStub = {
    x: start.x + fromEgress.dx * PORT_STUB,
    y: start.y + fromEgress.dy * PORT_STUB,
  };

  // Free cursor: keep a light orthogonal follow while searching for a port.
  const laneY = pointer.y;
  return [start, startStub, { x: startStub.x, y: laneY }, { x: pointer.x, y: laneY }];
}

function ConnectionRubberBand({
  document,
  fromPortId,
  pointer,
  hoverPortId,
}: {
  document: InfographicDocument;
  fromPortId: string;
  pointer: { x: number; y: number };
  hoverPortId: string | null;
}) {
  const points = buildRubberBandPoints(document, fromPortId, pointer, hoverPortId);
  if (!points) return null;

  const pathD = pointsToRoundedPath(points);
  const snapped = Boolean(hoverPortId);

  return (
    <g className="connection-rubber-band" pointerEvents="none" data-export-ignore="true">
      <path
        d={pathD}
        fill="none"
        stroke="var(--canvas-hint)"
        strokeWidth={snapped ? 2.5 : 2}
        strokeDasharray={snapped ? undefined : '6 5'}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={snapped ? 0.95 : 0.75}
      />
      {!snapped && <circle cx={pointer.x} cy={pointer.y} r={3.5} fill="var(--canvas-hint)" />}
    </g>
  );
}

function LaneGuides({
  width,
  lanes,
  activeLane,
}: {
  width: number;
  lanes: number[];
  activeLane?: number;
}) {
  return (
    <g className="lane-guides" pointerEvents="none">
      {lanes.map((lane) => {
        const isActive = activeLane !== undefined && Math.abs(lane - activeLane) < 0.5;
        return (
          <line
            key={lane}
            x1={0}
            y1={lane}
            x2={width}
            y2={lane}
            stroke={isActive ? '#16a34a' : '#93c5fd'}
            strokeWidth={isActive ? 1.5 : 1}
            strokeDasharray={isActive ? undefined : '6 6'}
            opacity={isActive ? 0.7 : 0.45}
          />
        );
      })}
    </g>
  );
}

function RiserGuides({
  height,
  risers,
  activeRisers,
}: {
  height: number;
  risers: number[];
  activeRisers: number[];
}) {
  return (
    <g className="riser-guides" pointerEvents="none">
      {risers.map((riser) => {
        const isActive = activeRisers.some((active) => Math.abs(riser - active) < 0.5);
        return (
          <line
            key={riser}
            x1={riser}
            y1={0}
            x2={riser}
            y2={height}
            stroke={isActive ? '#16a34a' : '#93c5fd'}
            strokeWidth={isActive ? 1.5 : 1}
            strokeDasharray={isActive ? undefined : '6 6'}
            opacity={isActive ? 0.55 : 0.3}
          />
        );
      })}
    </g>
  );
}

function PendingConnectionHint({ document }: { document: InfographicDocument }) {
  return (
    <text
      data-export-ignore="true"
      x={24}
      y={document.height - 24}
      className="canvas-hint"
      fontSize={12}
      fontFamily="var(--font-sans)"
      pointerEvents="none"
    >
      Click a second port to connect · Esc to cancel
    </text>
  );
}
