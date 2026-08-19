import './App.css';

import { useCallback, useEffect, useRef, useState } from 'react';

import { DevicePicker } from './components/DevicePicker';
import { IconPicker } from './components/IconPicker';
import { InfographicCanvas } from './components/InfographicCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { MaterialSymbol } from './components/ui/MaterialSymbol';
import exampleHomelab from './data/example-homelab';
import { useCanvasTheme } from './hooks/useCanvasTheme';
import { useDocumentEditor } from './hooks/useDocumentEditor';
import { DEVICE_TEMPLATES } from './lib/device-catalog';
import { parseDocument, serializeDocument } from './lib/document';
import { downloadPng, downloadSvg } from './lib/export';
import { loadPersistedDocument, persistDocument } from './lib/persist';

type SidebarTab = 'design' | 'json';

const AUTOSAVE_DEBOUNCE_MS = 50;

function App() {
  const canvasTheme = useCanvasTheme();
  const [initialDocument] = useState(() => loadPersistedDocument() ?? exampleHomelab);
  const editor = useDocumentEditor(initialDocument);
  const canvasRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef(editor.document);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('design');
  const [jsonValue, setJsonValue] = useState(() => serializeDocument(initialDocument));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [devicePickerOpen, setDevicePickerOpen] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconPickTarget, setIconPickTarget] = useState<
    { kind: 'node' } | { kind: 'deviceListEntry'; listId: string; index: number } | null
  >(null);

  useEffect(() => {
    documentRef.current = editor.document;
  }, [editor.document]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      persistDocument(editor.document);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [editor.document]);

  useEffect(() => {
    const flush = () => persistDocument(documentRef.current);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        editor.cancelConnection();
        editor.selectNode(null);
        editor.selectGroup(null);
        editor.selectConnection(null);
        editor.selectDeviceList(null);
        editor.selectLegend(false);
        return;
      }

      if (event.key !== 'Delete' && event.key !== 'Backspace') return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (editor.selectedConnectionId) {
        event.preventDefault();
        editor.deleteConnection(editor.selectedConnectionId);
      } else if (editor.selectedNodeId) {
        event.preventDefault();
        editor.deleteNode(editor.selectedNodeId);
      } else if (editor.selectedGroupId) {
        event.preventDefault();
        editor.deleteGroup(editor.selectedGroupId);
      } else if (editor.selectedDeviceListId) {
        event.preventDefault();
        editor.deleteDeviceList(editor.selectedDeviceListId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editor]);

  const applyJson = useCallback(() => {
    try {
      const doc = parseDocument(jsonValue);
      editor.loadDocument(doc);
      setJsonError(null);
      setSidebarTab('design');
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
    }
  }, [editor, jsonValue]);

  const resetExample = useCallback(() => {
    editor.loadDocument(exampleHomelab);
    setJsonValue(serializeDocument(exampleHomelab));
    setJsonError(null);
  }, [editor]);

  const exportSvg = useCallback(() => {
    const svg = canvasRef.current?.querySelector('svg');
    if (!svg) return;
    downloadSvg(svg, slugify(editor.document.title));
  }, [editor.document.title]);

  const exportPng = useCallback(async () => {
    const svg = canvasRef.current?.querySelector('svg');
    if (!svg) return;
    await downloadPng(svg, slugify(editor.document.title));
  }, [editor.document.title]);

  const addDeviceAtCenter = useCallback(
    (templateId: string) => {
      const template = DEVICE_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;

      const scroll = canvasRef.current;
      const centerX = editor.document.width / 2;
      const centerY = editor.document.height / 2;

      if (scroll) {
        const offset = 40 + editor.document.nodes.length * 12;
        editor.addDevice(template, { x: centerX + offset, y: centerY + offset });
      } else {
        editor.addDevice(template, { x: centerX, y: centerY });
      }

      setDevicePickerOpen(false);
    },
    [editor],
  );

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Local v0.2</p>
          <h1>InfoGraphic</h1>
          <p className="subtitle">Homelab &amp; network topology infographic generator</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setDevicePickerOpen(true)}
          >
            Add device
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => editor.addGroup()}>
            Add cluster
          </button>
          <button
            type="button"
            className={`btn${editor.mode === 'connect' ? ' btn-accent' : ' btn-secondary'}`}
            onClick={() => editor.setMode(editor.mode === 'connect' ? 'select' : 'connect')}
          >
            {editor.mode === 'connect' ? 'Connecting…' : 'Connect ports'}
          </button>
          <button
            type="button"
            onClick={resetExample}
            className="btn btn-secondary"
            title="Replace the current diagram with the example (also updates local autosave)"
          >
            Load example
          </button>
          <button type="button" onClick={exportSvg} className="btn btn-secondary">
            Export SVG
          </button>
          <button type="button" onClick={() => void exportPng()} className="btn btn-accent">
            Export PNG
          </button>
        </div>
      </header>

      <main className="workspace workspace--editor">
        <aside className="sidebar">
          <div className="sidebar-tabs">
            <button
              type="button"
              className={`sidebar-tab${sidebarTab === 'design' ? ' sidebar-tab--active' : ''}`}
              onClick={() => {
                setSidebarTab('design');
                setJsonError(null);
              }}
            >
              Design
            </button>
            <button
              type="button"
              className={`sidebar-tab${sidebarTab === 'json' ? ' sidebar-tab--active' : ''}`}
              onClick={() => {
                setJsonValue(serializeDocument(editor.document));
                setJsonError(null);
                setSidebarTab('json');
              }}
            >
              JSON
            </button>
          </div>

          {sidebarTab === 'design' ? (
            <PropertiesPanel
              document={editor.document}
              selectedGroupId={editor.selectedGroupId}
              selectedConnectionId={editor.selectedConnectionId}
              selectedDeviceListId={editor.selectedDeviceListId}
              selectedLegend={editor.selectedLegend}
              node={editor.selectedNode}
              mode={editor.mode}
              onUpdate={editor.updateNode}
              onUpdateGroup={editor.updateGroup}
              onUpdateConnection={editor.updateConnection}
              onUpdateDeviceList={editor.updateDeviceList}
              onUpdateDeviceListEntry={editor.updateDeviceListEntry}
              onAddDeviceListEntry={editor.addDeviceListEntry}
              onRemoveDeviceListEntry={editor.removeDeviceListEntry}
              onDeleteDeviceList={editor.deleteDeviceList}
              onUpdateVlan={editor.updateVlan}
              onAddVlan={editor.addVlan}
              onRemoveVlan={editor.removeVlan}
              onUpdateConnectionType={editor.updateConnectionType}
              onAddConnectionType={editor.addConnectionType}
              onRemoveConnectionType={editor.removeConnectionType}
              onDelete={editor.deleteNode}
              onDeleteGroup={editor.deleteGroup}
              onDeleteConnection={editor.deleteConnection}
              onResetConnectionRoute={editor.resetConnectionRoute}
              onSetPortBank={editor.setPortBank}
              onUpdatePort={editor.updatePort}
              onRemovePort={editor.removePort}
              onPickIcon={() => {
                setIconPickTarget({ kind: 'node' });
                setIconPickerOpen(true);
              }}
              onPickDeviceListIcon={(listId, index) => {
                setIconPickTarget({ kind: 'deviceListEntry', listId, index });
                setIconPickerOpen(true);
              }}
            />
          ) : (
            <div className="json-panel">
              <textarea
                className="json-editor"
                value={jsonValue}
                onChange={(event) => setJsonValue(event.target.value)}
                spellCheck={false}
              />
              {jsonError && <p className="error">{jsonError}</p>}
              <button type="button" className="btn btn-accent json-apply" onClick={applyJson}>
                Apply JSON
              </button>
            </div>
          )}
        </aside>

        <section className="preview-panel">
          <div className="panel-header">
            <h2>Canvas</h2>
            <span className="hint">
              {editor.document.nodes.length} devices · {editor.document.groups.length} clusters ·{' '}
              {editor.document.connections.length} connections
              {editor.mode === 'connect' && ' · connect mode'}
              {' · '}
              autosaved in this browser
            </span>
          </div>
          <div className="preview-scroll" ref={canvasRef}>
            <button
              type="button"
              className="canvas-theme-toggle"
              onClick={(event) => {
                event.stopPropagation();
                canvasTheme.toggleMode();
              }}
              aria-label={
                canvasTheme.mode === 'dark'
                  ? 'Switch canvas to light mode'
                  : 'Switch canvas to dark mode'
              }
              title={canvasTheme.mode === 'dark' ? 'Light canvas' : 'Dark canvas'}
            >
              <MaterialSymbol name={canvasTheme.mode === 'dark' ? 'light_mode' : 'dark_mode'} />
            </button>
            <InfographicCanvas
              document={editor.document}
              canvasTheme={canvasTheme.mode}
              interactive
              mode={editor.mode}
              selectedNodeId={editor.selectedNodeId}
              selectedGroupId={editor.selectedGroupId}
              selectedConnectionId={editor.selectedConnectionId}
              selectedDeviceListId={editor.selectedDeviceListId}
              selectedLegend={editor.selectedLegend}
              pendingPortId={editor.pendingPortId}
              onSelectNode={editor.selectNode}
              onSelectGroup={editor.selectGroup}
              onSelectConnection={editor.selectConnection}
              onSelectDeviceList={editor.selectDeviceList}
              onSelectLegend={editor.selectLegend}
              onMoveNode={editor.moveNode}
              onMoveGroup={editor.moveGroup}
              onMoveDeviceList={editor.moveDeviceList}
              onMoveLegend={editor.moveLegend}
              onResizeGroup={editor.resizeGroup}
              onResizeNode={editor.resizeNode}
              onPortClick={editor.handlePortClick}
              onLaneDrag={editor.updateConnectionLane}
              onRiserDrag={editor.updateConnectionRiser}
            />
          </div>
        </section>
      </main>

      <DevicePicker
        open={devicePickerOpen}
        onClose={() => setDevicePickerOpen(false)}
        onSelect={addDeviceAtCenter}
      />

      <IconPicker
        open={iconPickerOpen}
        value={
          iconPickTarget?.kind === 'deviceListEntry'
            ? editor.document.deviceLists?.find((list) => list.id === iconPickTarget.listId)
                ?.devices[iconPickTarget.index]?.icon
            : editor.selectedNode?.brandIcon
        }
        onClose={() => {
          setIconPickerOpen(false);
          setIconPickTarget(null);
        }}
        onSelect={(slug) => {
          if (iconPickTarget?.kind === 'deviceListEntry') {
            editor.updateDeviceListEntry(iconPickTarget.listId, iconPickTarget.index, {
              icon: slug,
            });
          } else if (editor.selectedNode) {
            editor.updateNode(editor.selectedNode.id, { brandIcon: slug });
          }
          setIconPickerOpen(false);
          setIconPickTarget(null);
        }}
      />
    </div>
  );
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'infographic'
  );
}

export default App;
