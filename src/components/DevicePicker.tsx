import { DEVICE_TEMPLATES } from '../lib/device-catalog';
import { DeviceSilhouette } from './DeviceSilhouette';
import { Modal } from './Modal';

interface DevicePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
}

const kindColors: Record<string, string> = {
  router: '#0ea5e9',
  switch: '#6366f1',
  server: '#3b82f6',
  nas: '#14b8a6',
  vm: '#8b5cf6',
  cloud: '#38bdf8',
  device: '#a855f7',
  endpoint: '#22c55e',
};

export function DevicePicker({ open, onClose, onSelect }: DevicePickerProps) {
  return (
    <Modal title="Add device" open={open} onClose={onClose} width={640}>
      <p className="picker-hint">
        Choose a generic silhouette — brand icons can be added after placement.
      </p>
      <div className="device-grid">
        {DEVICE_TEMPLATES.map((template) => {
          const color = kindColors[template.kind] ?? '#64748b';
          return (
            <button
              key={template.id}
              type="button"
              className="device-grid-item"
              onClick={() => onSelect(template.id)}
            >
              <svg viewBox="0 0 140 88" className="device-grid-svg" aria-hidden>
                <rect width="140" height="88" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
                <DeviceSilhouette kind={template.kind} width={140} height={88} color={color} />
              </svg>
              <strong>{template.label}</strong>
              <span>{template.subtitle}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
