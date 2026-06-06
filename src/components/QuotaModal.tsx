import React from 'react';

interface Props {
  show: boolean;
  onClose: () => void;
  onSettings: () => void;
}

export const QuotaModal: React.FC<Props> = ({ show, onClose, onSettings }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-xl border border-danger/20 bg-surface/95 backdrop-blur-xl shadow-[0_0_50px_#00000080] p-6 animate-in">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <h3 className="text-base font-semibold text-text text-center mb-2">
          Квота превышена
        </h3>
        <p className="text-[13px] text-text-muted text-center mb-6 leading-relaxed">
          Недостаточно места на диске. Удалите ненужные файлы или увеличьте квоту хранилища.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={onSettings}
            className="w-full h-9 rounded-md bg-accent/90 text-bg text-[13px] font-medium hover:bg-accent transition-colors"
          >
            Изменить квоту
          </button>
          <button
            onClick={onClose}
            className="w-full h-9 rounded-md border border-border text-[13px] font-medium text-text-muted hover:text-text hover:border-border-light transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
