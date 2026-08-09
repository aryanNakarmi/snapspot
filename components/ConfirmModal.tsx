'use client';

import { useEffect, ReactNode } from 'react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** Custom icon rendered above the title. Defaults to a log-out icon. */
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  icon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const defaultIcon = (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
  // Lock body scroll + close on Escape
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
              danger ? 'bg-red-100' : 'bg-indigo-100'
            }`}
          >
            <div className={danger ? 'text-red-500' : 'text-indigo-500'}>{icon || defaultIcon}</div>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1.5">{title}</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">{message}</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 text-white text-sm font-semibold rounded-xl active:scale-[0.98] transition-all ${
                danger
                  ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-lg hover:shadow-red-200/60'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-lg hover:shadow-indigo-200/60'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
