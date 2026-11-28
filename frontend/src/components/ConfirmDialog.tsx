'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from './ui';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-navy/50 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div
        className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-6"
        onClick={onCancel}
      >
        <div
          className="relative w-full max-w-md rounded-t-2xl border border-line bg-white shadow-2xl sm:rounded-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                  destructive ? 'bg-red-50 text-danger' : 'bg-brand/10 text-brand'
                }`}
              >
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2
                id="confirm-dialog-title"
                className="text-base font-bold tracking-tight text-navy"
              >
                {title}
              </h2>
            </div>
            <button
              type="button"
              aria-label="Close dialog"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              onClick={onCancel}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <p
            id="confirm-dialog-message"
            className="px-5 py-5 text-sm leading-relaxed text-muted sm:px-6"
          >
            {message}
          </p>

          <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">
            <Button variant="secondary" onClick={onCancel} disabled={busy}>
              {cancelLabel}
            </Button>
            <Button
              variant={destructive ? 'danger' : 'primary'}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? 'Working…' : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
