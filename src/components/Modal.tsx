import { useId, type ReactNode } from 'react';

import { MaterialSymbol } from './ui/MaterialSymbol';
import { Modal as BaseModal } from './ui/Modal';

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export function Modal({ title, open, onClose, children, width = 520 }: ModalProps) {
  const titleId = useId();

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      className="glass-modal-surface modal--popover-host"
      ariaLabelledBy={titleId}
    >
      <div className="modal--popover-host-scroll" style={{ maxWidth: width, width: '100%' }}>
        <header className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-toggle-btn" onClick={onClose} aria-label="Close">
            <MaterialSymbol name="close" />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </BaseModal>
  );
}
