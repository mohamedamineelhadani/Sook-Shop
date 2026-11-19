import { X } from 'lucide-react';

export default function Modal({ title, onClose, children }) {
  return (
    <div className="admin-modal-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="admin-modal-head">
          <h3>{title}</h3>
          <button className="admin-icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
