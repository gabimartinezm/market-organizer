import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Widen for content that needs it, e.g. the activity stream. */
  size?: 'md' | 'lg';
}

/**
 * Every modal in the app shares this shell so the keyboard behaviour only has
 * to be right once: labelled, dismissable with Escape, and focus handed to the
 * panel on open and back to the trigger on close.
 */
export const Dialog: React.FC<DialogProps> = ({ title, description, onClose, children, size = 'md' }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-scrim flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`bg-surface w-full rounded-t-sheet sm:rounded-sheet border border-edge shadow-float max-h-[90vh] flex flex-col ${
          size === 'lg' ? 'sm:max-w-lg' : 'sm:max-w-md'
        }`}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-edge">
          <div className="min-w-0">
            <h2 id={titleId} className="sign text-h2">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-ink-2 mt-1">
                {description}
              </p>
            )}
          </div>
          <button onClick={onClose} className="btn btn-bare shrink-0" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
