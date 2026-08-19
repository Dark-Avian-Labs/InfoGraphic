import { useEffect, useMemo, useState } from 'react';

import { BrandIcon } from '../lib/brand-icons';
import { HOMELAB_ICON_SLUGS, loadIconCatalog, type IconCatalogEntry } from '../lib/icon-catalog';
import { Modal } from './Modal';

interface IconPickerProps {
  open: boolean;
  value?: string;
  onClose: () => void;
  onSelect: (slug: string | undefined) => void;
}

export function IconPicker({ open, value, onClose, onSelect }: IconPickerProps) {
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<IconCatalogEntry[] | null>(null);

  useEffect(() => {
    if (!open) return;
    void loadIconCatalog().then((entries) => {
      setCatalog(entries);
    });
  }, [open]);

  const loading = open && catalog === null;

  const filtered = useMemo(() => {
    if (!catalog) return [];
    const q = query.trim().toLowerCase();
    if (!q) {
      const homelab = catalog.filter((entry) => HOMELAB_ICON_SLUGS.includes(entry.slug));
      return homelab.length > 0 ? homelab : catalog.slice(0, 48);
    }
    return catalog
      .filter((entry) => entry.title.toLowerCase().includes(q) || entry.slug.includes(q))
      .slice(0, 80);
  }, [catalog, query]);

  return (
    <Modal title="Brand icon" open={open} onClose={onClose} width={560}>
      <input
        className="field-input"
        placeholder="Search brands… (Docker, Proxmox, Cisco)"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoFocus
      />

      {value && (
        <div className="picker-actions">
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => onSelect(undefined)}
          >
            Remove icon
          </button>
        </div>
      )}

      {loading ? (
        <p className="picker-hint">Loading icon catalog…</p>
      ) : (
        <div className="icon-grid">
          {filtered.map((entry) => {
            const selected = value === entry.slug;
            return (
              <button
                key={entry.slug}
                type="button"
                className={`icon-grid-item${selected ? ' icon-grid-item--selected' : ''}`}
                onClick={() => onSelect(entry.slug)}
                title={entry.title}
              >
                <BrandIcon slug={entry.slug} color={entry.hex} size={22}>
                  <span className="icon-fallback" />
                </BrandIcon>
                <span>{entry.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
