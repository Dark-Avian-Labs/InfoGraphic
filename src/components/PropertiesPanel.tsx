import { getBrandColor, getBrandIcon } from '../lib/brand-icons';
import { DEVICE_GRID } from '../lib/grid';
import { getGroupColor } from '../lib/groups';
import { PORT_BANK_PRESETS, findPort } from '../lib/ports';
import type {
  ConnectionType,
  DeviceList,
  DeviceListEntry,
  InfographicConnection,
  InfographicDocument,
  InfographicGroup,
  InfographicNode,
  PortBankSide,
  Vlan,
} from '../types';
import { connectionTypeById } from '../types';

const CONNECTION_STYLES: ConnectionType['style'][] = ['solid', 'dashed', 'double', 'thick', 'vpn'];

interface PropertiesPanelProps {
  document: InfographicDocument;
  selectedGroupId: string | null;
  selectedConnectionId: string | null;
  selectedDeviceListId: string | null;
  selectedLegend: boolean;
  node: InfographicNode | null;
  mode: 'select' | 'connect';
  onUpdate: (nodeId: string, updates: Partial<InfographicNode>) => void;
  onUpdateGroup: (groupId: string, updates: Partial<InfographicGroup>) => void;
  onUpdateConnection: (connectionId: string, updates: Partial<InfographicConnection>) => void;
  onUpdateDeviceList: (listId: string, updates: Partial<DeviceList>) => void;
  onUpdateDeviceListEntry: (
    listId: string,
    index: number,
    updates: Partial<DeviceListEntry>,
  ) => void;
  onAddDeviceListEntry: (listId: string) => void;
  onRemoveDeviceListEntry: (listId: string, index: number) => void;
  onDeleteDeviceList: (listId: string) => void;
  onUpdateVlan: (vlanId: string, updates: Partial<Vlan>) => void;
  onAddVlan: () => void;
  onRemoveVlan: (vlanId: string) => void;
  onUpdateConnectionType: (typeId: string, updates: Partial<ConnectionType>) => void;
  onAddConnectionType: () => void;
  onRemoveConnectionType: (typeId: string) => void;
  onDelete: (nodeId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onDeleteConnection: (connectionId: string) => void;
  onResetConnectionRoute?: (connectionId: string) => void;
  onSetPortBank: (nodeId: string, side: PortBankSide, rows: 1 | 2, columns: number) => void;
  onUpdatePort: (
    nodeId: string,
    portId: string,
    updates: Partial<InfographicNode['ports'][number]>,
  ) => void;
  onRemovePort: (nodeId: string, portId: string) => void;
  onPickIcon: () => void;
  onPickDeviceListIcon: (listId: string, index: number) => void;
}

export function PropertiesPanel({
  document,
  selectedGroupId,
  selectedConnectionId,
  selectedDeviceListId,
  selectedLegend,
  node,
  mode,
  onUpdate,
  onUpdateGroup,
  onUpdateConnection,
  onUpdateDeviceList,
  onUpdateDeviceListEntry,
  onAddDeviceListEntry,
  onRemoveDeviceListEntry,
  onDeleteDeviceList,
  onUpdateVlan,
  onAddVlan,
  onRemoveVlan,
  onUpdateConnectionType,
  onAddConnectionType,
  onRemoveConnectionType,
  onDelete,
  onDeleteGroup,
  onDeleteConnection,
  onResetConnectionRoute,
  onSetPortBank,
  onUpdatePort,
  onRemovePort,
  onPickIcon,
  onPickDeviceListIcon,
}: PropertiesPanelProps) {
  const group = selectedGroupId
    ? (document.groups.find((g) => g.id === selectedGroupId) ?? null)
    : null;

  const connection = selectedConnectionId
    ? (document.connections.find((c) => c.id === selectedConnectionId) ?? null)
    : null;

  const deviceList = selectedDeviceListId
    ? (document.deviceLists?.find((list) => list.id === selectedDeviceListId) ?? null)
    : null;

  if (group) {
    const memberCount = document.nodes.filter((n) => n.groupId === group.id).length;
    const vlan = document.vlans.find((v) => v.id === group.vlanId);
    const displayColor = getGroupColor(group, vlan);

    return (
      <div className="properties-form">
        <p className="properties-kind">Cluster</p>

        <label className="field">
          <span>Label</span>
          <input
            className="field-input"
            value={group.label}
            onChange={(e) => onUpdateGroup(group.id, { label: e.target.value })}
          />
        </label>

        <label className="field">
          <span>Subtitle</span>
          <input
            className="field-input"
            value={group.subtitle ?? ''}
            onChange={(e) => onUpdateGroup(group.id, { subtitle: e.target.value || undefined })}
          />
        </label>

        <label className="field">
          <span>VLAN</span>
          <select
            className="field-input"
            value={group.vlanId ?? ''}
            onChange={(e) => onUpdateGroup(group.id, { vlanId: e.target.value || undefined })}
          >
            <option value="">None</option>
            {document.vlans.map((vlanOption) => (
              <option key={vlanOption.id} value={vlanOption.id}>
                {vlanOption.name}
              </option>
            ))}
          </select>
        </label>

        <div className="field">
          <span>Color</span>
          <div className="color-field">
            <input
              type="color"
              className="color-field-swatch"
              value={displayColor}
              onChange={(e) => onUpdateGroup(group.id, { color: e.target.value })}
            />
            <input
              className="field-input field-input--mono color-field-hex"
              value={group.color ?? ''}
              placeholder={vlan?.color ?? '#cbd5e1'}
              onChange={(e) => {
                const value = e.target.value.trim();
                onUpdateGroup(group.id, { color: value || undefined });
              }}
            />
            {group.color && (
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => onUpdateGroup(group.id, { color: undefined })}
              >
                Use VLAN
              </button>
            )}
          </div>
        </div>

        <label className="field field--checkbox">
          <input
            type="checkbox"
            checked={group.dashed ?? false}
            onChange={(e) => onUpdateGroup(group.id, { dashed: e.target.checked || undefined })}
          />
          <span>Dashed border</span>
        </label>

        <div className="field field--row">
          <label>
            <span>Width</span>
            <input
              className="field-input field-input--mono"
              type="number"
              min={DEVICE_GRID * 4}
              step={DEVICE_GRID}
              value={group.width}
              onChange={(e) => onUpdateGroup(group.id, { width: Number(e.target.value) })}
            />
          </label>
          <label>
            <span>Height</span>
            <input
              className="field-input field-input--mono"
              type="number"
              min={DEVICE_GRID * 3}
              step={DEVICE_GRID}
              value={group.height}
              onChange={(e) => onUpdateGroup(group.id, { height: Number(e.target.value) })}
            />
          </label>
        </div>

        <p className="field-note">
          {memberCount} device{memberCount === 1 ? '' : 's'} assigned · click empty space inside the
          cluster or its border to select · drag to move assigned devices.
        </p>

        <button type="button" className="btn btn-danger" onClick={() => onDeleteGroup(group.id)}>
          Delete cluster
        </button>
      </div>
    );
  }

  if (connection) {
    const type = connectionTypeById(document, connection.typeId);
    const typeDefaultColor = type?.color ?? '#1e293b';
    const displayColor = connection.color ?? typeDefaultColor;

    const describePort = (portId: string) => {
      const found = findPort(document, portId);
      if (!found) return portId;
      return `${found.node.label} · ${found.port.label}`;
    };

    return (
      <div className="properties-form">
        <p className="properties-kind">Connection</p>

        <label className="field">
          <span>Label</span>
          <input
            className="field-input"
            value={connection.label ?? ''}
            placeholder="Optional"
            onChange={(e) =>
              onUpdateConnection(connection.id, { label: e.target.value || undefined })
            }
          />
        </label>

        <label className="field">
          <span>Type</span>
          <select
            className="field-input"
            value={connection.typeId}
            onChange={(e) => onUpdateConnection(connection.id, { typeId: e.target.value })}
          >
            {document.connectionTypes.map((connType) => (
              <option key={connType.id} value={connType.id}>
                {connType.label}
              </option>
            ))}
          </select>
        </label>

        <div className="field">
          <span>Color</span>
          <div className="color-field">
            <input
              type="color"
              className="color-field-swatch"
              value={displayColor}
              onChange={(e) => onUpdateConnection(connection.id, { color: e.target.value })}
            />
            <input
              className="field-input field-input--mono color-field-hex"
              value={connection.color ?? ''}
              placeholder={typeDefaultColor}
              onChange={(e) => {
                const value = e.target.value.trim();
                onUpdateConnection(connection.id, { color: value || undefined });
              }}
            />
            {connection.color && (
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => onUpdateConnection(connection.id, { color: undefined })}
              >
                Use type
              </button>
            )}
          </div>
          <p className="field-note">Applies to the line and both connected ports.</p>
        </div>

        <div className="field">
          <span>Endpoints</span>
          <p className="field-note field-note--mono">
            {describePort(connection.fromPortId)}
            <br />↔ {describePort(connection.toPortId)}
          </p>
        </div>

        <div className="field">
          <span>Routing</span>
          <p className="field-note">
            Drag the horizontal lane up/down, or vertical risers left/right.
          </p>
          {onResetConnectionRoute &&
            (connection.lane !== undefined ||
              connection.fromRiserOffset !== undefined ||
              connection.toRiserOffset !== undefined) && (
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={() => onResetConnectionRoute(connection.id)}
              >
                Reset route
              </button>
            )}
        </div>

        <button
          type="button"
          className="btn btn-danger"
          onClick={() => onDeleteConnection(connection.id)}
        >
          Delete connection
        </button>
      </div>
    );
  }

  if (deviceList) {
    return (
      <div className="properties-form">
        <p className="properties-kind">Device list</p>

        <label className="field">
          <span>Title</span>
          <input
            className="field-input"
            value={deviceList.title}
            onChange={(e) => onUpdateDeviceList(deviceList.id, { title: e.target.value })}
          />
        </label>

        <label className="field">
          <span>VLAN</span>
          <select
            className="field-input"
            value={deviceList.vlanId ?? ''}
            onChange={(e) =>
              onUpdateDeviceList(deviceList.id, { vlanId: e.target.value || undefined })
            }
          >
            <option value="">None</option>
            {document.vlans.map((vlan) => (
              <option key={vlan.id} value={vlan.id}>
                {vlan.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Width</span>
          <input
            className="field-input field-input--mono"
            type="number"
            min={120}
            step={DEVICE_GRID}
            value={deviceList.width ?? 200}
            onChange={(e) => onUpdateDeviceList(deviceList.id, { width: Number(e.target.value) })}
          />
        </label>

        <div className="field">
          <span>Devices</span>
          <ul className="port-list port-list--labels">
            {deviceList.devices.map((device, index) => {
              const Icon = getBrandIcon(device.icon);
              const color = getBrandColor(device.icon) ?? '#64748b';
              return (
                <li
                  key={`${deviceList.id}-${index}`}
                  className="port-list-item port-list-item--label"
                >
                  <button
                    type="button"
                    className="icon-picker-trigger icon-picker-trigger--compact"
                    onClick={() => onPickDeviceListIcon(deviceList.id, index)}
                    aria-label="Pick icon"
                  >
                    {Icon ? <Icon color={color} size={16} /> : <span className="icon-fallback" />}
                  </button>
                  <input
                    className="field-input"
                    value={device.name}
                    onChange={(e) =>
                      onUpdateDeviceListEntry(deviceList.id, index, { name: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon"
                    onClick={() => onRemoveDeviceListEntry(deviceList.id, index)}
                    aria-label="Remove device"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => onAddDeviceListEntry(deviceList.id)}
          >
            Add device
          </button>
        </div>

        <button
          type="button"
          className="btn btn-danger"
          onClick={() => onDeleteDeviceList(deviceList.id)}
        >
          Delete list
        </button>
      </div>
    );
  }

  if (selectedLegend) {
    return (
      <div className="properties-form">
        <p className="properties-kind">Legend</p>
        <p className="field-note">Edits update the shared VLAN and connection-type catalogs.</p>

        <div className="field">
          <span>VLANs</span>
          <ul className="port-list">
            {document.vlans.map((vlan) => (
              <li key={vlan.id} className="legend-edit-row">
                <input
                  type="color"
                  className="color-field-swatch"
                  value={vlan.color}
                  onChange={(e) => onUpdateVlan(vlan.id, { color: e.target.value })}
                  aria-label={`${vlan.name} color`}
                />
                <input
                  className="field-input"
                  value={vlan.name}
                  onChange={(e) => onUpdateVlan(vlan.id, { name: e.target.value })}
                  aria-label="VLAN name"
                />
                <input
                  className="field-input field-input--mono"
                  value={vlan.subnet ?? ''}
                  placeholder="subnet"
                  onChange={(e) => onUpdateVlan(vlan.id, { subnet: e.target.value || undefined })}
                  aria-label="VLAN subnet"
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-icon"
                  onClick={() => onRemoveVlan(vlan.id)}
                  aria-label="Remove VLAN"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-secondary btn-xs" onClick={onAddVlan}>
            Add VLAN
          </button>
        </div>

        <div className="field">
          <span>Connection types</span>
          <ul className="port-list">
            {document.connectionTypes.map((type) => (
              <li key={type.id} className="legend-edit-row">
                <input
                  type="color"
                  className="color-field-swatch"
                  value={type.color ?? '#1e293b'}
                  onChange={(e) => onUpdateConnectionType(type.id, { color: e.target.value })}
                  aria-label={`${type.label} color`}
                />
                <input
                  className="field-input"
                  value={type.label}
                  onChange={(e) => onUpdateConnectionType(type.id, { label: e.target.value })}
                  aria-label="Connection type label"
                />
                <select
                  className="field-input"
                  value={type.style}
                  onChange={(e) =>
                    onUpdateConnectionType(type.id, {
                      style: e.target.value as ConnectionType['style'],
                    })
                  }
                  aria-label="Connection style"
                >
                  {CONNECTION_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon"
                  onClick={() => onRemoveConnectionType(type.id)}
                  disabled={document.connectionTypes.length <= 1}
                  aria-label="Remove connection type"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-secondary btn-xs" onClick={onAddConnectionType}>
            Add connection type
          </button>
        </div>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="properties-empty">
        <p>
          Select a device, cluster, connection, device list, or the legend on the canvas to edit its
          properties.
        </p>
        <p className="hint">
          {mode === 'connect'
            ? 'Connect mode: click two ports to link them.'
            : 'Select anything on the canvas to edit it here.'}
        </p>
      </div>
    );
  }

  const BrandIcon = getBrandIcon(node.brandIcon);
  const brandColor = getBrandColor(node.brandIcon) ?? '#64748b';

  return (
    <div className="properties-form">
      <label className="field">
        <span>Label</span>
        <input
          className="field-input"
          value={node.label}
          onChange={(e) => onUpdate(node.id, { label: e.target.value })}
        />
      </label>

      <label className="field">
        <span>IP / address</span>
        <input
          className="field-input field-input--mono"
          value={node.ip ?? ''}
          placeholder="10.0.0.1"
          onChange={(e) => onUpdate(node.id, { ip: e.target.value || undefined })}
        />
      </label>

      <label className="field">
        <span>Subtitle</span>
        <input
          className="field-input"
          value={node.subtitle ?? ''}
          onChange={(e) => onUpdate(node.id, { subtitle: e.target.value || undefined })}
        />
      </label>

      <label className="field">
        <span>VLAN</span>
        <select
          className="field-input"
          value={node.vlanId ?? ''}
          onChange={(e) => onUpdate(node.id, { vlanId: e.target.value || undefined })}
        >
          <option value="">None</option>
          {document.vlans.map((vlan) => (
            <option key={vlan.id} value={vlan.id}>
              {vlan.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Cluster</span>
        <select
          className="field-input"
          value={node.groupId ?? ''}
          onChange={(e) => onUpdate(node.id, { groupId: e.target.value || undefined })}
        >
          <option value="">None</option>
          {document.groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </label>

      <div className="field">
        <span>Brand icon</span>
        <button type="button" className="icon-picker-trigger" onClick={onPickIcon}>
          {BrandIcon ? (
            <BrandIcon color={brandColor} size={20} />
          ) : (
            <span className="icon-fallback" />
          )}
          <span>{node.brandIcon ?? 'Choose icon…'}</span>
        </button>
      </div>

      <div className="field">
        <span>Port banks (patch panel layout)</span>
        <p className="field-note">
          Ports sit on the top or bottom edge in a grid — e.g. 1×16 or 2×8.
        </p>

        {(['top', 'bottom'] as PortBankSide[]).map((side) => {
          const bank = node.portBanks?.find((b) => b.side === side);
          return (
            <div key={side} className="port-bank-row">
              <span className="port-bank-side">{side}</span>
              {bank ? (
                <span className="hint">
                  {bank.rows}×{bank.columns}
                </span>
              ) : (
                <span className="hint">none</span>
              )}
              <div className="port-bank-presets">
                {PORT_BANK_PRESETS.map((preset) => (
                  <button
                    key={`${side}-${preset.label}`}
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={() => onSetPortBank(node.id, side, preset.rows, preset.columns)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="field">
        <span>Port labels</span>
        <ul className="port-list port-list--labels">
          {node.ports.map((port) => (
            <li key={port.id} className="port-list-item port-list-item--label">
              <span className="port-list-meta">
                {port.side} · {port.row + 1}:{port.col + 1}
              </span>
              <input
                className="field-input field-input--mono"
                value={port.label}
                onChange={(e) => onUpdatePort(node.id, port.id, { label: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => onRemovePort(node.id, port.id)}
                disabled={node.ports.length <= 1}
                aria-label="Remove port"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button type="button" className="btn btn-danger" onClick={() => onDelete(node.id)}>
        Delete device
      </button>
    </div>
  );
}
